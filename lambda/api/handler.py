"""
AWS Lambda Function: Projects API

Provides REST API endpoints for project management:
- GET /projects - List all projects
- GET /projects/{category}/{id} - Get project details
- POST /projects - Create new project (admin)
- PUT /projects/{category}/{id} - Update project metadata (admin)
- DELETE /projects/{category}/{id} - Delete project (admin)

Environment Variables:
- BUCKET_NAME: S3 bucket name
- ADMIN_PASSWORD: Admin password for protected operations
"""

import json
import os
import boto3
from botocore.config import Config
from datetime import datetime
from botocore.exceptions import ClientError

# Initialize S3 client with explicit region and configuration
# Force regional endpoint to avoid IllegalLocationConstraintException
s3_config = Config(
    region_name='me-central-1',
    signature_version='s3v4',
    s3={'addressing_style': 'virtual'}
)
s3 = boto3.client('s3', config=s3_config)

BUCKET_NAME = os.environ.get('BUCKET_NAME', '')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

def get_projects_manifest():
    """Fetch projects.json from S3"""
    try:
        response = s3.get_object(Bucket=BUCKET_NAME, Key='projects.json')
        manifest = json.loads(response['Body'].read().decode('utf-8'))
        
        # Ensure categories exist with defaults if empty
        if not manifest.get('categories'):
            manifest['categories'] = {
                "architectural": {"title": "Architectural", "description": "Architectural design projects"},
                "interior": {"title": "Interior", "description": "Interior design projects"},
                "fit": {"title": "Fit Out", "description": "Fit out projects"}
            }
        return manifest
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            # Return empty manifest if not exists
            return {
                "version": "1.0",
                "lastUpdated": datetime.utcnow().isoformat() + "Z",
                "categories": {
                    "architectural": {"title": "Architectural", "description": "Architectural design projects"},
                    "interior": {"title": "Interior", "description": "Interior design projects"},
                    "fit": {"title": "Fit Out", "description": "Fit out projects"}
                },
                "projects": []
            }
        raise

def save_projects_manifest(manifest):
    """Save projects.json to S3"""
    manifest['lastUpdated'] = datetime.utcnow().isoformat() + "Z"
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key='projects.json',
        Body=json.dumps(manifest, indent=2),
        ContentType='application/json'
    )

def get_project_metadata(category, project_id):
    """Fetch project metadata from S3"""
    key = f"projects/{category}/{project_id}/metadata.json"
    try:
        response = s3.get_object(Bucket=BUCKET_NAME, Key=key)
        return json.loads(response['Body'].read().decode('utf-8'))
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            return None
        raise

def save_project_metadata(category, project_id, metadata):
    """Save project metadata to S3"""
    key = f"projects/{category}/{project_id}/metadata.json"
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=key,
        Body=json.dumps(metadata, indent=2),
        ContentType='application/json'
    )

def delete_s3_folder(prefix):
    """Delete all objects with given prefix"""
    paginator = s3.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=BUCKET_NAME, Prefix=prefix):
        for obj in page.get('Contents', []):
            s3.delete_object(Bucket=BUCKET_NAME, Key=obj['Key'])

def generate_upload_urls(category, project_id, files):
    """Generate presigned URLs for file uploads"""
    urls = []
    for file_info in files:
        filename = file_info.get('filename', '')
        if not filename:
            continue
            
        file_type = file_info.get('type', 'other')  # 'cover', 'media', 'other'
        
        if file_type == 'cover':
            key = f"uploads/{category}/{project_id}/cover/{filename}"
        else:
            key = f"uploads/{category}/{project_id}/original/{filename}"
        
        try:
            # Generate presigned URL without ContentType to avoid CORS issues
            # S3 will infer content type from file extension
            url = s3.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': BUCKET_NAME,
                    'Key': key
                },
                ExpiresIn=3600  # 1 hour
            )
            urls.append({
                'filename': filename,
                'uploadUrl': url,
                's3Key': key,
                'contentType': file_info.get('contentType', 'application/octet-stream')
            })
        except Exception as e:
            print(f"Error generating presigned URL for {filename}: {e}")
            # Continue with other files
            continue
    
    return urls

def verify_admin(event):
    """Verify admin password from request headers"""
    headers = event.get('headers', {})
    # Check both lowercase and mixed case headers (API Gateway normalizes)
    auth = headers.get('x-admin-password') or headers.get('X-Admin-Password', '')
    return auth == ADMIN_PASSWORD

def cors_response(status_code, body, headers=None):
    """Generate CORS-enabled response"""
    response_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Admin-Password',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }
    if headers:
        response_headers.update(headers)
    
    return {
        'statusCode': status_code,
        'headers': response_headers,
        'body': json.dumps(body) if isinstance(body, (dict, list)) else body
    }

def parse_path_params(path):
    """
    Parse category and id from path like /projects/{category}/{id}
    API Gateway proxy routes don't populate pathParameters automatically
    """
    parts = [p for p in path.strip('/').split('/') if p]
    params = {}
    
    # Expected patterns:
    # /projects -> []
    # /projects/{category}/{id} -> ['projects', 'category', 'id']
    # /projects/{category}/{id}/upload-urls -> ['projects', 'category', 'id', 'upload-urls']
    
    if len(parts) >= 3 and parts[0] == 'projects':
        params['category'] = parts[1]
        params['id'] = parts[2]
    
    return params

def handler(event, context):
    """
    Lambda handler for API Gateway events
    """
    print(f"Event: {json.dumps(event)}")
    
    http_method = event.get('httpMethod', event.get('requestContext', {}).get('http', {}).get('method', ''))
    path = event.get('path', event.get('rawPath', ''))
    
    # Parse path parameters manually since proxy routes don't populate them
    path_params = event.get('pathParameters', {}) or {}
    if not path_params.get('category') and not path_params.get('id'):
        path_params = parse_path_params(path)
    
    query_params = event.get('queryStringParameters', {}) or {}
    
    # Handle CORS preflight
    if http_method == 'OPTIONS':
        return cors_response(200, '')
    
    try:
        # Route: GET /projects
        if http_method == 'GET' and path == '/projects':
            manifest = get_projects_manifest()
            return cors_response(200, manifest)
        
        # Route: GET /projects/{category}/{id}
        if http_method == 'GET' and 'category' in path_params and 'id' in path_params:
            try:
                category = path_params['category']
                project_id = path_params['id']
                print(f"DEBUG: About to call get_project_metadata({category}, {project_id})")
                metadata = get_project_metadata(category, project_id)
                print(f"DEBUG: metadata result = {metadata}")
                
                if metadata is None:
                    print(f"DEBUG: Metadata is None, returning 404")
                    return cors_response(404, {'error': 'Project not found'})
            except Exception as e:
                print(f"ERROR in GET metadata route: {str(e)}")
                import traceback
                traceback.print_exc()
                return cors_response(500, {'error': str(e)})
            
            return cors_response(200, metadata)
        
        # Route: POST /projects (Create new project)
        if http_method == 'POST' and path == '/projects':
            if not verify_admin(event):
                return cors_response(401, {'error': 'Unauthorized'})
            
            body = json.loads(event.get('body', '{}'))
            
            # Validate required fields
            required = ['title', 'category']
            missing = [f for f in required if not body.get(f)]
            if missing:
                return cors_response(400, {'error': f'Missing required fields: {", ".join(missing)}'})
            
            # Validate category
            valid_categories = ['architectural', 'interior', 'fit']
            if body['category'] not in valid_categories:
                return cors_response(400, {'error': f'Invalid category. Must be one of: {", ".join(valid_categories)}'})
            
            # Generate project ID from title (sanitize)
            project_id = body.get('id')
            if not project_id:
                # Auto-generate from title
                project_id = body['title'].lower().strip()
                # Remove special characters, keep alphanumeric and spaces
                project_id = ''.join(c if c.isalnum() or c.isspace() else '' for c in project_id)
                # Replace spaces with hyphens
                project_id = '-'.join(project_id.split())
                # Remove consecutive hyphens
                while '--' in project_id:
                    project_id = project_id.replace('--', '-')
                project_id = project_id.strip('-')
            
            if not project_id:
                return cors_response(400, {'error': 'Could not generate valid project ID from title'})
            
            category = body['category']
            
            # Check for duplicates
            manifest = get_projects_manifest()
            existing_project = next(
                (p for p in manifest['projects'] if p['id'] == project_id and p['category'] == category),
                None
            )
            
            if existing_project:
                return cors_response(409, {
                    'error': f'Project with ID "{project_id}" already exists in category "{category}"',
                    'suggestion': 'Please use a different title or provide a unique ID'
                })
            
            # Create project metadata
            metadata = {
                'id': project_id,
                'title': body['title'].strip(),
                'category': category,
                'area': body.get('area', '').strip(),
                'description': body.get('description', '').strip(),
                'createdAt': datetime.utcnow().isoformat() + 'Z',
                'cover': '',
                'media': []
            }
            
            # Save metadata
            try:
                save_project_metadata(category, project_id, metadata)
            except Exception as e:
                print(f"Error saving metadata: {e}")
                return cors_response(500, {'error': f'Failed to save project metadata: {str(e)}'})
            
            # Update manifest
            try:
                manifest['projects'].append({
                    'id': project_id,
                    'category': category,
                    'path': f"projects/{category}/{project_id}/"
                })
                save_projects_manifest(manifest)
            except Exception as e:
                print(f"Error updating manifest: {e}")
                # Try to rollback metadata creation
                try:
                    s3.delete_object(
                        Bucket=BUCKET_NAME,
                        Key=f"projects/{category}/{project_id}/metadata.json"
                    )
                except:
                    pass
                return cors_response(500, {'error': f'Failed to update projects manifest: {str(e)}'})
            
            # Generate upload URLs if files provided
            upload_urls = []
            if 'files' in body and body['files']:
                try:
                    upload_urls = generate_upload_urls(category, project_id, body['files'])
                except Exception as e:
                    print(f"Error generating upload URLs: {e}")
                    # Don't fail the request, just return empty URLs
                    upload_urls = []
            
            print(f"Created project: {category}/{project_id}")
            return cors_response(201, {
                'message': 'Project created successfully',
                'project': metadata,
                'uploadUrls': upload_urls
            })
        
        # Route: PUT /projects/{category}/{id} (Update project)
        if http_method == 'PUT' and 'category' in path_params and 'id' in path_params:
            if not verify_admin(event):
                return cors_response(401, {'error': 'Unauthorized'})
            
            category = path_params['category']
            project_id = path_params['id']
            
            # Get existing metadata
            metadata = get_project_metadata(category, project_id)
            if metadata is None:
                return cors_response(404, {'error': 'Project not found'})
            
            # Update with new data
            body = json.loads(event.get('body', '{}'))
            for key in ['title', 'area', 'description', 'cover', 'media']:
                if key in body:
                    metadata[key] = body[key]
            
            metadata['updatedAt'] = datetime.utcnow().isoformat() + 'Z'
            
            # Save updated metadata
            save_project_metadata(category, project_id, metadata)
            
            # Generate upload URLs if needed
            upload_urls = []
            if 'files' in body:
                upload_urls = generate_upload_urls(category, project_id, body['files'])
            
            return cors_response(200, {
                'message': 'Project updated',
                'project': metadata,
                'uploadUrls': upload_urls
            })
        
        # Route: DELETE /projects/{category}/{id}
        if http_method == 'DELETE' and 'category' in path_params and 'id' in path_params:
            if not verify_admin(event):
                return cors_response(401, {'error': 'Unauthorized'})
            
            category = path_params['category']
            project_id = path_params['id']
            
            try:
                # Delete project folder
                prefix = f"projects/{category}/{project_id}/"
                print(f"DEBUG: Deleting S3 folder with prefix: {prefix}")
                delete_s3_folder(prefix)
                
                # Also delete uploads folder if exists
                uploads_prefix = f"uploads/{category}/{project_id}/"
                print(f"DEBUG: Deleting uploads folder with prefix: {uploads_prefix}")
                delete_s3_folder(uploads_prefix)
                
                # Update manifest
                print("DEBUG: Updating manifest...")
                manifest = get_projects_manifest()
                manifest['projects'] = [
                    p for p in manifest['projects'] 
                    if not (p['category'] == category and p['id'] == project_id)
                ]
                save_projects_manifest(manifest)
                print("DEBUG: Delete completed successfully")
                
                return cors_response(200, {'message': 'Project deleted'})
            except Exception as e:
                print(f"ERROR deleting project: {str(e)}")
                import traceback
                traceback.print_exc()
                return cors_response(500, {'error': f'Failed to delete project: {str(e)}'})
        
        # Route: POST /projects/{category}/{id}/upload-urls (Get upload URLs)
        if http_method == 'POST' and path.endswith('/upload-urls'):
            if not verify_admin(event):
                return cors_response(401, {'error': 'Unauthorized'})
            
            category = path_params.get('category', '')
            project_id = path_params.get('id', '')
            
            body = json.loads(event.get('body', '{}'))
            files = body.get('files', [])
            
            upload_urls = generate_upload_urls(category, project_id, files)
            return cors_response(200, {'uploadUrls': upload_urls})
        
        return cors_response(404, {'error': 'Not found'})
    
    except Exception as e:
        print(f"Error: {e}")
        return cors_response(500, {'error': str(e)})
