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
CATALOG_KEY = 'catalog/products.json'

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

def default_catalog_data():
    return {
        "version": "1.0",
        "lastUpdated": datetime.utcnow().isoformat() + "Z",
        "products": [],
        "facets": {
            "collections": [],
            "materials": [],
            "sellingTypes": [],
            "availability": []
        }
    }

def get_catalog_data():
    """Fetch catalog JSON from S3."""
    try:
        response = s3.get_object(Bucket=BUCKET_NAME, Key=CATALOG_KEY)
        catalog = json.loads(response['Body'].read().decode('utf-8'))
        if 'products' not in catalog:
            catalog['products'] = []
        if 'facets' not in catalog:
            catalog['facets'] = build_catalog_facets(catalog['products'])
        return catalog
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            return default_catalog_data()
        raise

def save_catalog_data(catalog):
    """Persist catalog JSON to S3."""
    catalog['lastUpdated'] = datetime.utcnow().isoformat() + "Z"
    catalog['facets'] = build_catalog_facets(catalog.get('products', []))
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=CATALOG_KEY,
        Body=json.dumps(catalog, indent=2),
        ContentType='application/json'
    )

def normalize_to_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str):
        chunks = [v.strip() for v in value.split('|')]
        return [v for v in chunks if v]
    return []

def normalize_product_payload(payload, existing_product=None):
    """Normalize create/update product payload fields."""
    existing = existing_product or {}
    product = dict(existing)

    for key in [
        'title', 'handle', 'product_url', 'vendor', 'product_type', 'product_number',
        'size_per_piece', 'sheet_size', 'material', 'packing', 'selling_type',
        'weight', 'shape', 'usage_image_url', 'primary_image', 'price', 'compare_at_price',
        'sku', 'price_currency'
    ]:
        if key in payload:
            value = payload.get(key)
            product[key] = '' if value is None else str(value).strip()

    if 'available' in payload:
        product['available'] = bool(payload.get('available'))
    elif 'available' not in product:
        product['available'] = True

    if 'collections' in payload:
        product['collections'] = normalize_to_list(payload.get('collections'))
    elif 'collections' not in product:
        product['collections'] = []

    if 'tags' in payload:
        product['tags'] = normalize_to_list(payload.get('tags'))
    elif 'tags' not in product:
        product['tags'] = []

    if 'gallery_images' in payload:
        gallery = payload.get('gallery_images') or []
        if isinstance(gallery, list):
            normalized_gallery = []
            for item in gallery:
                if isinstance(item, dict):
                    url = str(item.get('url', '')).strip()
                    if url:
                        normalized_gallery.append({'url': url, 'alt': item.get('alt', '')})
                elif isinstance(item, str) and item.strip():
                    normalized_gallery.append({'url': item.strip(), 'alt': ''})
            product['gallery_images'] = normalized_gallery
    elif 'gallery_images' not in product:
        product['gallery_images'] = []

    if 'body_images' in payload:
        body_images = payload.get('body_images') or []
        if isinstance(body_images, list):
            product['body_images'] = [str(v).strip() for v in body_images if str(v).strip()]
    elif 'body_images' not in product:
        product['body_images'] = []

    if 'description_paragraphs' in payload:
        paragraphs = payload.get('description_paragraphs') or []
        product['description_paragraphs'] = paragraphs if isinstance(paragraphs, list) else []
    elif 'description_paragraphs' not in product:
        product['description_paragraphs'] = []

    if 'product_id' in payload and payload.get('product_id') not in (None, ''):
        product['product_id'] = payload.get('product_id')

    if not product.get('product_id'):
        product['product_id'] = int(datetime.utcnow().timestamp() * 1000)

    if not product.get('handle'):
        title = product.get('title', '')
        handle = ''.join(c if c.isalnum() or c.isspace() or c == '-' else '' for c in title.lower())
        handle = '-'.join(handle.split()).strip('-')
        product['handle'] = handle or f"product-{product['product_id']}"

    if 'created_at' in payload and payload.get('created_at'):
        product['created_at'] = str(payload.get('created_at')).strip()
    elif 'created_at' not in product:
        product['created_at'] = datetime.utcnow().isoformat() + 'Z'
    product['updated_at'] = datetime.utcnow().isoformat() + 'Z'

    if not product.get('primary_image'):
        gallery_images = product.get('gallery_images', [])
        if gallery_images:
            product['primary_image'] = gallery_images[0].get('url', '')
        elif product.get('usage_image_url'):
            product['primary_image'] = product.get('usage_image_url', '')
        else:
            product['primary_image'] = ''

    return product

def build_catalog_facets(products):
    collections = {}
    materials = {}
    selling_types = {}
    availability = {'available': 0, 'unavailable': 0}

    for product in products:
        for name in normalize_to_list(product.get('collections', [])):
            collections[name] = collections.get(name, 0) + 1

        material = str(product.get('material', '')).strip()
        if material:
            materials[material] = materials.get(material, 0) + 1

        selling_type = str(product.get('selling_type', '')).strip()
        if selling_type:
            selling_types[selling_type] = selling_types.get(selling_type, 0) + 1

        if product.get('available', True):
            availability['available'] += 1
        else:
            availability['unavailable'] += 1

    return {
        'collections': [{'value': k, 'count': v} for k, v in sorted(collections.items(), key=lambda item: item[0].lower())],
        'materials': [{'value': k, 'count': v} for k, v in sorted(materials.items(), key=lambda item: item[0].lower())],
        'sellingTypes': [{'value': k, 'count': v} for k, v in sorted(selling_types.items(), key=lambda item: item[0].lower())],
        'availability': [
            {'value': 'available', 'count': availability['available']},
            {'value': 'unavailable', 'count': availability['unavailable']}
        ]
    }

def find_product_index(products, product_id_or_handle):
    target = str(product_id_or_handle)
    for idx, product in enumerate(products):
        if str(product.get('product_id')) == target or str(product.get('handle')) == target:
            return idx
    return -1

def generate_product_upload_urls(product_id_or_handle, files):
    urls = []
    for file_info in files:
        filename = file_info.get('filename', '')
        if not filename:
            continue

        file_type = file_info.get('type', 'media')
        folder = 'cover' if file_type == 'cover' else 'original'
        key = f"uploads/products/{product_id_or_handle}/{folder}/{filename}"

        try:
            url = s3.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': BUCKET_NAME,
                    'Key': key
                },
                ExpiresIn=3600
            )
            urls.append({
                'filename': filename,
                'uploadUrl': url,
                's3Key': key,
                'contentType': file_info.get('contentType', 'application/octet-stream')
            })
        except Exception as e:
            print(f"Error generating product upload URL for {filename}: {e}")
            continue

    return urls

def list_catalog_products(catalog, query_params):
    products = list(catalog.get('products', []))

    search = (query_params.get('search') or '').strip().lower()
    collection = (query_params.get('collection') or '').strip().lower()
    material = (query_params.get('material') or '').strip().lower()
    selling_type = (query_params.get('selling_type') or '').strip().lower()
    availability = (query_params.get('availability') or '').strip().lower()
    min_price_raw = (query_params.get('min_price') or '').strip()
    max_price_raw = (query_params.get('max_price') or '').strip()
    sort = (query_params.get('sort') or 'title_asc').strip().lower()

    def parse_price(value):
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    min_price = parse_price(min_price_raw) if min_price_raw else None
    max_price = parse_price(max_price_raw) if max_price_raw else None

    if search:
        products = [
            p for p in products
            if search in str(p.get('title', '')).lower()
            or search in str(p.get('handle', '')).lower()
            or search in str(p.get('product_number', '')).lower()
        ]

    if collection:
        products = [
            p for p in products
            if any(collection == str(c).strip().lower() for c in normalize_to_list(p.get('collections', [])))
        ]

    if material:
        products = [p for p in products if material == str(p.get('material', '')).strip().lower()]

    if selling_type:
        products = [p for p in products if selling_type == str(p.get('selling_type', '')).strip().lower()]

    if availability in ('available', 'unavailable'):
        wants_available = availability == 'available'
        products = [p for p in products if bool(p.get('available', True)) == wants_available]

    if min_price is not None:
        products = [p for p in products if (parse_price(p.get('price')) or 0.0) >= min_price]
    if max_price is not None:
        products = [p for p in products if (parse_price(p.get('price')) or 0.0) <= max_price]

    if sort == 'title_desc':
        products.sort(key=lambda p: str(p.get('title', '')).lower(), reverse=True)
    elif sort == 'newest':
        products.sort(key=lambda p: str(p.get('created_at', '')), reverse=True)
    elif sort == 'oldest':
        products.sort(key=lambda p: str(p.get('created_at', '')))
    elif sort == 'price_desc':
        products.sort(key=lambda p: parse_price(p.get('price')) or 0.0, reverse=True)
    elif sort == 'price_asc':
        products.sort(key=lambda p: parse_price(p.get('price')) or 0.0)
    else:
        products.sort(key=lambda p: str(p.get('title', '')).lower())

    page = query_params.get('page', '1')
    page_size = query_params.get('page_size', '24')
    try:
        page = max(1, int(page))
    except (TypeError, ValueError):
        page = 1
    try:
        page_size = max(1, min(100, int(page_size)))
    except (TypeError, ValueError):
        page_size = 24

    total_items = len(products)
    total_pages = max(1, (total_items + page_size - 1) // page_size)
    if page > total_pages:
        page = total_pages

    start = (page - 1) * page_size
    end = start + page_size

    return {
        'products': products[start:end],
        'pagination': {
            'page': page,
            'pageSize': page_size,
            'totalItems': total_items,
            'totalPages': total_pages
        },
        'filtersApplied': {
            'search': search,
            'collection': collection,
            'material': material,
            'selling_type': selling_type,
            'availability': availability,
            'min_price': min_price,
            'max_price': max_price,
            'sort': sort,
        },
        'facets': catalog.get('facets', build_catalog_facets(catalog.get('products', [])))
    }

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

def parse_product_path(path):
    parts = [p for p in path.strip('/').split('/') if p]
    params = {}

    # /products/{id}
    # /products/{id}/upload-urls
    # /catalog/{id}
    if len(parts) >= 2 and parts[0] == 'products':
        params['product'] = parts[1]
    if len(parts) >= 2 and parts[0] == 'catalog':
        params['catalog_product'] = parts[1]

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

    product_params = parse_product_path(path)
    
    query_params = event.get('queryStringParameters', {}) or {}
    
    # Handle CORS preflight
    if http_method == 'OPTIONS':
        return cors_response(200, '')
    
    try:
        # Route: GET /projects
        if http_method == 'GET' and path == '/projects':
            manifest = get_projects_manifest()
            return cors_response(200, manifest)

        # Route: GET /catalog
        if http_method == 'GET' and path == '/catalog':
            catalog = get_catalog_data()
            payload = list_catalog_products(catalog, query_params)
            return cors_response(200, payload)

        # Route: GET /catalog/{id-or-handle}
        if http_method == 'GET' and product_params.get('catalog_product'):
            catalog = get_catalog_data()
            identifier = product_params.get('catalog_product')
            products = catalog.get('products', [])
            idx = find_product_index(products, identifier)
            if idx < 0:
                return cors_response(404, {'error': 'Product not found'})

            product = products[idx]
            related = [
                p for p in products
                if p.get('handle') != product.get('handle')
                and (
                    set(normalize_to_list(p.get('collections', []))) & set(normalize_to_list(product.get('collections', [])))
                    or str(p.get('material', '')).strip().lower() == str(product.get('material', '')).strip().lower()
                )
            ][:8]

            return cors_response(200, {'product': product, 'relatedProducts': related})
        
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

        # Route: POST /products (Create new product)
        if http_method == 'POST' and path == '/products':
            if not verify_admin(event):
                return cors_response(401, {'error': 'Unauthorized'})

            body = json.loads(event.get('body', '{}'))
            if not str(body.get('title', '')).strip():
                return cors_response(400, {'error': 'Missing required field: title'})

            catalog = get_catalog_data()
            products = catalog.get('products', [])

            new_product = normalize_product_payload(body)
            duplicate = next(
                (
                    p for p in products
                    if str(p.get('product_id')) == str(new_product.get('product_id'))
                    or str(p.get('handle')) == str(new_product.get('handle'))
                ),
                None
            )
            if duplicate:
                return cors_response(409, {'error': 'Product with same id or handle already exists'})

            products.append(new_product)
            catalog['products'] = products
            save_catalog_data(catalog)

            upload_urls = []
            if body.get('files'):
                upload_urls = generate_product_upload_urls(new_product.get('handle'), body.get('files'))

            return cors_response(201, {
                'message': 'Product created successfully',
                'product': new_product,
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

        # Route: PUT /products/{id-or-handle}
        if http_method == 'PUT' and product_params.get('product'):
            if not verify_admin(event):
                return cors_response(401, {'error': 'Unauthorized'})

            identifier = product_params.get('product')
            body = json.loads(event.get('body', '{}'))

            catalog = get_catalog_data()
            products = catalog.get('products', [])
            idx = find_product_index(products, identifier)
            if idx < 0:
                return cors_response(404, {'error': 'Product not found'})

            current = products[idx]
            updated = normalize_product_payload(body, current)
            products[idx] = updated
            catalog['products'] = products
            save_catalog_data(catalog)

            upload_urls = []
            if body.get('files'):
                upload_urls = generate_product_upload_urls(updated.get('handle'), body.get('files'))

            return cors_response(200, {
                'message': 'Product updated',
                'product': updated,
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

        # Route: DELETE /products/{id-or-handle}
        if http_method == 'DELETE' and product_params.get('product'):
            if not verify_admin(event):
                return cors_response(401, {'error': 'Unauthorized'})

            identifier = product_params.get('product')
            catalog = get_catalog_data()
            products = catalog.get('products', [])
            idx = find_product_index(products, identifier)
            if idx < 0:
                return cors_response(404, {'error': 'Product not found'})

            product = products[idx]
            product_handle = product.get('handle') or str(product.get('product_id'))

            del products[idx]
            catalog['products'] = products
            save_catalog_data(catalog)

            # Best-effort cleanup for uploaded product media
            delete_s3_folder(f"uploads/products/{product_handle}/")

            return cors_response(200, {'message': 'Product deleted'})
        
        # Route: POST /projects/{category}/{id}/upload-urls (Get upload URLs)
        if http_method == 'POST' and path.endswith('/upload-urls'):
            if path.startswith('/products/'):
                if not verify_admin(event):
                    return cors_response(401, {'error': 'Unauthorized'})

                identifier = product_params.get('product')
                if not identifier:
                    return cors_response(400, {'error': 'Missing product id or handle'})

                body = json.loads(event.get('body', '{}'))
                files = body.get('files', [])
                upload_urls = generate_product_upload_urls(identifier, files)
                return cors_response(200, {'uploadUrls': upload_urls})

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
