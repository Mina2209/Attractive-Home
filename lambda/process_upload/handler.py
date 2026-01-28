"""
AWS Lambda Function: Process Media Uploads

Triggered by S3 PUT events on the uploads/ prefix.
Converts:
- Images (jpg, jpeg, png, bmp, gif) -> WebP
- Videos (mp4, mov, avi) -> HLS (240p, 480p)

After processing, moves files to projects/{category}/{id}/ folder.

Requires Lambda Layer with:
- Pillow (PIL)
- FFmpeg binary

Environment Variables:
- BUCKET_NAME: S3 bucket name
- OUTPUT_PREFIX: Output folder prefix (default: "projects")
"""

import json
import os
import boto3
import subprocess
import tempfile
from datetime import datetime
from urllib.parse import unquote_plus
from botocore.exceptions import ClientError

# Initialize S3 client with explicit region
# Force regional endpoint
s3 = boto3.client('s3', region_name='me-central-1')

# Supported formats
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.gif'}
VIDEO_EXTENSIONS = {'.mp4', '.mov', '.avi', '.mkv'}

# HLS renditions for Lambda (limited to 240p and 480p due to timeout constraints)
HLS_RENDITIONS = {
    "480": {"width": 854, "height": 480, "bandwidth": 1500000},
    "240": {"width": 426, "height": 240, "bandwidth": 500000},
}

def is_image(filename):
    """Check if file is an image"""
    _, ext = os.path.splitext(filename.lower())
    return ext in IMAGE_EXTENSIONS

def is_video(filename):
    """Check if file is a video"""
    _, ext = os.path.splitext(filename.lower())
    return ext in VIDEO_EXTENSIONS

def convert_image_to_webp(input_path, output_path):
    """Convert image to WebP format using Pillow"""
    try:
        from PIL import Image
        with Image.open(input_path) as img:
            # Convert to RGB if necessary (for PNG with transparency)
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            img.save(output_path, 'WEBP', quality=85)
        return True
    except Exception as e:
        print(f"Error converting image: {e}")
        return False

def generate_hls(input_path, output_dir):
    """
    Generate HLS streams for video.
    Returns path to master.m3u8
    """
    os.makedirs(output_dir, exist_ok=True)
    
    master_playlist_lines = ["#EXTM3U", "#EXT-X-VERSION:3"]
    
    for res, params in HLS_RENDITIONS.items():
        width = params["width"]
        height = params["height"]
        bandwidth = params["bandwidth"]
        
        variant_dir = os.path.join(output_dir, res)
        os.makedirs(variant_dir, exist_ok=True)
        
        playlist_path = os.path.join(variant_dir, "playlist.m3u8")
        
        # FFmpeg command for HLS conversion
        command = [
            "/opt/bin/ffmpeg",  # FFmpeg from Lambda layer
            "-y",
            "-i", input_path,
            "-vf", f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2",
            "-c:v", "libx264",
            "-crf", "23",
            "-preset", "veryfast",
            "-c:a", "aac",
            "-b:a", "128k",
            "-ac", "2",
            "-f", "hls",
            "-hls_time", "4",
            "-hls_playlist_type", "vod",
            "-hls_segment_filename", os.path.join(variant_dir, "segment%03d.ts"),
            playlist_path
        ]
        
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=600)
            if result.returncode != 0:
                print(f"FFmpeg error for {res}: {result.stderr}")
                continue
            print(f"Generated HLS {res}p stream")
        except subprocess.TimeoutExpired:
            print(f"FFmpeg timeout for {res}p - video may be too long")
            continue
        except Exception as e:
            print(f"Error generating HLS {res}: {e}")
            continue
        
        master_playlist_lines.append(
            f'#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION={width}x{height}'
        )
        master_playlist_lines.append(f"{res}/playlist.m3u8")
    
    # Write master playlist ONLY if we successfully generated at least one rendition
    # Check if we have any stream info lines
    if len(master_playlist_lines) <= 2:
        print("Error: No HLS renditions were generated successfully")
        return None
        
    master_path = os.path.join(output_dir, "master.m3u8")
    with open(master_path, "w") as f:
        f.write("\n".join(master_playlist_lines))
    
    return master_path

def upload_directory_to_s3(local_dir, bucket, s3_prefix):
    """Upload all files from a local directory to S3"""
    uploaded_files = []
    for root, dirs, files in os.walk(local_dir):
        for file in files:
            local_path = os.path.join(root, file)
            relative_path = os.path.relpath(local_path, local_dir)
            s3_key = f"{s3_prefix}/{relative_path}".replace("\\", "/")
            
            # Set content type
            content_type = 'application/octet-stream'
            if file.endswith('.m3u8'):
                content_type = 'application/x-mpegURL'
            elif file.endswith('.ts'):
                content_type = 'video/MP2T'
            elif file.endswith('.webp'):
                content_type = 'image/webp'
            
            s3.upload_file(
                local_path, 
                bucket, 
                s3_key,
                ExtraArgs={'ContentType': content_type}
            )
            uploaded_files.append(s3_key)
    
    return uploaded_files

def handler(event, context):
    """
    Lambda handler for S3 upload events
    
    Expected S3 key format:
    uploads/{category}/{project-id}/original/{filename}
    """
    print(f"Event: {json.dumps(event)}")
    
    bucket = os.environ.get('BUCKET_NAME')
    if not bucket:
        # Get bucket from event
        bucket = event['Records'][0]['s3']['bucket']['name']
    
    results = []
    
    for record in event.get('Records', []):
        s3_key = unquote_plus(record['s3']['object']['key'])
        print(f"Processing: {s3_key}")
        
        # Parse the key to extract category, project ID, and filename
        # Expected: uploads/{category}/{project-id}/original/{filename}
        parts = s3_key.split('/')
        if len(parts) < 5 or parts[0] != 'uploads':
            print(f"Skipping invalid key format: {s3_key}")
            continue
        
        category = parts[1]
        project_id = parts[2]
        filename = parts[-1]
        
        # Create temp directories
        with tempfile.TemporaryDirectory() as tmpdir:
            input_path = os.path.join(tmpdir, filename)
            output_dir = os.path.join(tmpdir, 'output')
            os.makedirs(output_dir, exist_ok=True)
            
            # Download file from S3
            s3.download_file(bucket, s3_key, input_path)
            print(f"Downloaded: {s3_key}")
            
            # Determine output S3 prefix
            # Check if this is a cover file based on input path
            is_cover_file = '/cover/' in s3_key
            if is_cover_file:
                output_prefix = f"projects/{category}/{project_id}/media/cover"
            else:
                output_prefix = f"projects/{category}/{project_id}/media"
            
            if is_image(filename):
                # Convert to WebP
                base_name = os.path.splitext(filename)[0]
                webp_path = os.path.join(output_dir, f"{base_name}.webp")
                
                if convert_image_to_webp(input_path, webp_path):
                    s3_output_key = f"{output_prefix}/{base_name}.webp"
                    s3.upload_file(
                        webp_path, 
                        bucket, 
                        s3_output_key,
                        ExtraArgs={'ContentType': 'image/webp'}
                    )
                    results.append({
                        'type': 'image',
                        'original': s3_key,
                        'converted': s3_output_key
                    })
                    print(f"Uploaded WebP: {s3_output_key}")
            
            elif is_video(filename):
                # Convert to HLS
                base_name = os.path.splitext(filename)[0]
                hls_output_dir = os.path.join(output_dir, base_name)
                
                master_path = generate_hls(input_path, hls_output_dir)
                if master_path and os.path.exists(master_path):
                    # Upload all HLS files
                    uploaded = upload_directory_to_s3(
                        hls_output_dir, 
                        bucket, 
                        f"{output_prefix}/{base_name}"
                    )
                    results.append({
                        'type': 'video',
                        'original': s3_key,
                        'converted': uploaded
                    })
                    print(f"Uploaded HLS: {len(uploaded)} files")
                else:
                    print(f"Failed to generate HLS for {filename}")
            
            else:
                # Copy as-is for other file types
                s3_output_key = f"{output_prefix}/{filename}"
                s3.copy_object(
                    Bucket=bucket,
                    CopySource={'Bucket': bucket, 'Key': s3_key},
                    Key=s3_output_key
                )
                results.append({
                    'type': 'other',
                    'original': s3_key,
                    'converted': s3_output_key
                })
        
        # After processing, update metadata.json
        # Only if we successfully processed something
        if results:
            try:
                metadata_key = f"projects/{category}/{project_id}/metadata.json"
                try:
                    response = s3.get_object(Bucket=bucket, Key=metadata_key)
                    metadata = json.loads(response['Body'].read().decode('utf-8'))
                    
                    # Update media list
                    updated = False
                    
                    # Check if this was a cover video upload
                    cover_result = next((r for r in results if 'cover' in r['original']), None)
                    if cover_result:
                        if cover_result['type'] == 'video':
                            # path/to/master.m3u8
                            metadata['cover'] = f"{cover_result['converted'][0]}" 
                            updated = True
                        elif cover_result['type'] == 'other':
                             metadata['cover'] = cover_result['converted']
                             updated = True
                    
                    # Add new media items
                    for res in results:
                        if 'cover' in res['original']: continue
                        
                        media_item = {'type': res['type'], 'src': ''}
                        
                        if res['type'] == 'video':
                            # Use first file (master.m3u8) as src
                            media_item['src'] = res['converted'][0] if isinstance(res['converted'], list) else res['converted']
                        else:
                            media_item['src'] = res['converted']
                            
                        # Avoid duplicates
                        if not any(m['src'] == media_item['src'] for m in metadata.get('media', [])):
                            metadata['media'].append(media_item)
                            updated = True
                    
                    # Upload to S3
                    if updated:
                        metadata['updatedAt'] = datetime.utcnow().isoformat() + "Z"
                        s3.put_object(
                            Bucket=bucket,
                            Key=metadata_key,
                            Body=json.dumps(metadata, indent=2),
                            ContentType='application/json'
                        )
                        print(f"SUCCESS: Updated metadata at: s3://{bucket}/{metadata_key}")
                        print(f"Current media count: {len(metadata.get('media', []))}")
                    
                except ClientError as e:
                    print(f"ERROR: Could not load/update metadata at {metadata_key}: {e}")
            except Exception as e:
                print(f"ERROR: General metadata update failure: {e}")
        else:
            print("WARNING: No results to update in metadata")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Processing complete',
            'results': results
        })
    }
