/**
 * Portfolio Service
 * 
 * Handles fetching portfolio data from S3 via Lambda API.
 * Replaces the static portfolioData.js with dynamic data fetching.
 */

// API Configuration - Update these with your actual values
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || '';

function buildQueryString(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        query.append(key, String(value));
    });
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
}

/**
 * Fetch the complete projects manifest from S3
 * @returns {Promise<Object>} Projects manifest with categories and project list
 */
export async function fetchProjectsManifest() {
    // Try API first
    if (API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/projects`);
            if (response.ok) return await response.json();
        } catch (err) {
            console.warn('API unavailable for projects, falling back to S3:', err.message);
        }
    }

    // S3 fallback
    const response = await fetch(`${S3_BASE_URL}/projects.json`);
    if (!response.ok) throw new Error('Failed to fetch projects manifest');
    return await response.json();
}

/**
 * Prefix a relative path with the S3 base URL
 * @param {string} path - Relative path like "projects/cat/id/media/1.webp"
 * @returns {string} Full URL
 */
function prefixS3Url(path) {
    if (!path) return path;
    // If already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    // Ensure no double slashes
    const base = S3_BASE_URL.replace(/\/$/, '');
    const relativePath = path.replace(/^\//, '');
    return `${base}/${relativePath}`;
}

/**
 * Transform metadata to have full S3 URLs for all media paths
 * @param {Object} metadata - Raw project metadata
 * @returns {Object} Metadata with full S3 URLs
 */
function transformMetadataUrls(metadata) {
    if (!metadata) return metadata;

    const transformed = { ...metadata };

    // Transform cover URL
    if (transformed.cover) {
        transformed.cover = prefixS3Url(transformed.cover);
    }

    // Transform media array
    if (transformed.media && Array.isArray(transformed.media)) {
        transformed.media = transformed.media.map(item => ({
            ...item,
            src: prefixS3Url(item.src)
        }));
    }

    return transformed;
}

/**
 * Delay helper for retry logic
 * @param {number} ms - Milliseconds to delay
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch project metadata for a specific project with retry logic
 * @param {string} category - Category ID (architectural, interior, fit)
 * @param {string} projectId - Project ID
 * @param {number} retries - Number of retry attempts (default: 3)
 * @returns {Promise<Object>} Project metadata
 */
export async function fetchProjectMetadata(category, projectId, retries = 3) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            // Try API first
            if (API_BASE_URL) {
                try {
                    const response = await fetch(`${API_BASE_URL}/projects/${category}/${projectId}`);

                    // Handle throttling (503) with retry
                    if (response.status === 503 && attempt < retries) {
                        const backoffMs = Math.pow(2, attempt) * 1000;
                        console.log(`Throttled on ${category}/${projectId}, retrying in ${backoffMs}ms...`);
                        await delay(backoffMs);
                        continue;
                    }

                    if (response.ok) {
                        const metadata = await response.json();
                        return transformMetadataUrls(metadata);
                    }
                } catch (err) {
                    console.warn(`API unavailable for ${category}/${projectId}, falling back to S3:`, err.message);
                }
            }

            // S3 fallback
            const response = await fetch(`${S3_BASE_URL}/projects/${category}/${projectId}/metadata.json`);
            if (!response.ok) throw new Error('Failed to fetch project metadata');
            const metadata = await response.json();
            return transformMetadataUrls(metadata);
        } catch (error) {
            if (attempt === retries) {
                console.error(`Error fetching project metadata after ${retries + 1} attempts:`, error);
                throw error;
            }
            const backoffMs = Math.pow(2, attempt) * 1000;
            console.log(`Error on ${category}/${projectId}, retrying in ${backoffMs}ms...`);
            await delay(backoffMs);
        }
    }
}

/**
 * Transform manifest data to match the old portfolioData.js format
 * for backward compatibility with existing components
 * @param {Object} manifest - Projects manifest from S3
 * @returns {Object} Data in portfolioData.js format
 */
export async function fetchPortfolioData() {
    const manifest = await fetchProjectsManifest();

    // Initialize structure matching old format
    const portfolioData = {};

    // Default category definitions
    const defaultCategories = {
        'architectural': { title: 'Architectural', description: 'Architectural design projects' },
        'interior': { title: 'Interior', description: 'Interior design projects' },
        'fit': { title: 'Fit Out', description: 'Fit out projects' }
    };

    // Create category entries from manifest OR use defaults
    const categories = manifest.categories && Object.keys(manifest.categories).length > 0
        ? manifest.categories
        : defaultCategories;

    for (const [categoryId, categoryInfo] of Object.entries(categories)) {
        portfolioData[categoryId] = {
            title: categoryInfo.title,
            description: categoryInfo.description,
            projects: []
        };
    }

    // Fetch metadata in batches to avoid Lambda throttling
    const BATCH_SIZE = 3;
    const projects = [];

    for (let i = 0; i < manifest.projects.length; i += BATCH_SIZE) {
        const batch = manifest.projects.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (projectRef) => {
            try {
                const metadata = await fetchProjectMetadata(projectRef.category, projectRef.id);
                return { ...metadata, category: projectRef.category };
            } catch (error) {
                console.error(`Failed to load project ${projectRef.id}:`, error);
                return null;
            }
        });

        const batchResults = await Promise.all(batchPromises);
        projects.push(...batchResults);
    }

    // Add projects to their categories
    for (const project of projects) {
        if (project) {
            // Auto-create category if it doesn't exist
            if (!portfolioData[project.category]) {
                portfolioData[project.category] = {
                    title: project.category.charAt(0).toUpperCase() + project.category.slice(1),
                    description: '',
                    projects: []
                };
            }
            portfolioData[project.category].projects.push({
                id: project.id,
                title: project.title,
                area: project.area || '',
                description: project.description || '',
                video: prefixS3Url(project.cover),
                details: (project.media || []).map(item => ({
                    type: item.type,
                    src: prefixS3Url(item.src)
                }))
            });
        }
    }

    return portfolioData;
}

/**
 * Resolve media URL - handles both absolute and relative paths
 * @param {string} path - Media path
 * @returns {string} Full URL
 */
function resolveMediaUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    // Prepend S3 base URL for relative paths
    const base = S3_BASE_URL.replace(/\/$/, '');
    const relativePath = path.replace(/^\//, '');
    return `${base}/${relativePath}`;
}

// Admin API Functions

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @param {string} adminPassword - Admin password
 * @returns {Promise<Object>} Created project with upload URLs
 */
export async function createProject(projectData, adminPassword) {
    const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': adminPassword
        },
        body: JSON.stringify(projectData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create project');
    }

    return response.json();
}

/**
 * Update project metadata
 * @param {string} category - Category ID
 * @param {string} projectId - Project ID
 * @param {Object} updates - Updated fields
 * @param {string} adminPassword - Admin password
 * @returns {Promise<Object>} Updated project
 */
export async function updateProject(category, projectId, updates, adminPassword) {
    const response = await fetch(`${API_BASE_URL}/projects/${category}/${projectId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': adminPassword
        },
        body: JSON.stringify(updates)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update project');
    }

    return response.json();
}

/**
 * Delete a project with retry logic
 * @param {string} category - Category ID
 * @param {string} projectId - Project ID
 * @param {string} adminPassword - Admin password
 * @param {number} retries - Number of retry attempts (default: 3)
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteProject(category, projectId, adminPassword, retries = 3) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(`${API_BASE_URL}/projects/${category}/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'X-Admin-Password': adminPassword
                }
            });

            // Retry on 500 errors (S3 consistency issues)
            if (response.status === 500 && attempt < retries) {
                const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                console.log(`Delete failed for ${category}/${projectId}, retrying in ${backoffMs}ms...`);
                await delay(backoffMs);
                continue;
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete project');
            }

            return response.json();
        } catch (error) {
            if (attempt === retries) {
                throw error;
            }
            const backoffMs = Math.pow(2, attempt) * 1000;
            console.log(`Delete error for ${category}/${projectId}, retrying in ${backoffMs}ms...`);
            await delay(backoffMs);
        }
    }
}

/**
 * Get presigned URLs for file uploads
 * @param {string} category - Category ID
 * @param {string} projectId - Project ID
 * @param {Array} files - Array of {filename, type, contentType}
 * @param {string} adminPassword - Admin password
 * @returns {Promise<Array>} Array of upload URLs
 */
export async function getUploadUrls(category, projectId, files, adminPassword) {
    const response = await fetch(`${API_BASE_URL}/projects/${category}/${projectId}/upload-urls`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': adminPassword
        },
        body: JSON.stringify({ files })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get upload URLs');
    }

    return response.json();
}

/**
 * Upload a file using presigned URL
 * @param {string} uploadUrl - Presigned S3 URL
 * @param {File} file - File to upload
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<void>}
 */
export async function uploadFile(uploadUrl, file, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Upload failed: ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        xhr.open('PUT', uploadUrl);
        // Don't set Content-Type - it causes CORS preflight issues
        // S3 will auto-detect from file extension
        xhr.send(file);
    });
}

/**
 * Resolve a catalog image URL. Currently images are external (Shopify CDN).
 * When images are migrated to S3, relative paths will be prefixed with S3_BASE_URL.
 * @param {string} url - Image URL (absolute or relative)
 * @returns {string} Resolved URL
 */
export function resolveCatalogImageUrl(url) {
    if (!url) return '';
    // Already absolute — return as-is (covers Shopify CDN and any other external URLs)
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // Relative path → prefix with S3 base (for when images move to S3)
    const base = S3_BASE_URL.replace(/\/$/, '');
    const rel = url.replace(/^\//, '');
    return `${base}/${rel}`;
}

/**
 * Apply client-side filtering, sorting, and pagination to a products array.
 * Mirrors the Lambda API's list_catalog_products() behaviour.
 */
function filterSortPaginate(allProducts, filters = {}, facets = {}) {
    let products = [...allProducts];
    const filtersApplied = {};

    // Search
    const search = (filters.search || '').toLowerCase().trim();
    if (search) {
        products = products.filter((p) =>
            (p.title || '').toLowerCase().includes(search) ||
            (p.material || '').toLowerCase().includes(search) ||
            (p.vendor || '').toLowerCase().includes(search)
        );
        filtersApplied.search = filters.search;
    }

    // Collection
    if (filters.collection) {
        products = products.filter((p) => (p.collections || []).some((c) => c === filters.collection));
        filtersApplied.collection = filters.collection;
    }

    // Product category
    if (filters.product_category) {
        products = products.filter((p) => p.filter_product_category === filters.product_category);
        filtersApplied.product_category = filters.product_category;
    }

    // Material
    if (filters.material) {
        products = products.filter((p) => p.material === filters.material);
        filtersApplied.material = filters.material;
    }

    // Selling type
    if (filters.selling_type) {
        products = products.filter((p) => p.selling_type === filters.selling_type);
        filtersApplied.selling_type = filters.selling_type;
    }

    // Availability
    if (filters.availability === 'available') {
        products = products.filter((p) => p.available !== false);
        filtersApplied.availability = 'available';
    } else if (filters.availability === 'unavailable') {
        products = products.filter((p) => p.available === false);
        filtersApplied.availability = 'unavailable';
    }

    // Price range
    const minPrice = parseFloat(filters.min_price);
    const maxPrice = parseFloat(filters.max_price);
    if (!isNaN(minPrice)) {
        products = products.filter((p) => parseFloat(p.price) >= minPrice);
        filtersApplied.min_price = minPrice;
    }
    if (!isNaN(maxPrice)) {
        products = products.filter((p) => parseFloat(p.price) <= maxPrice);
        filtersApplied.max_price = maxPrice;
    }

    // Sorting
    const sort = filters.sort || 'title_asc';
    products.sort((a, b) => {
        switch (sort) {
            case 'price_asc': return parseFloat(a.price || 0) - parseFloat(b.price || 0);
            case 'price_desc': return parseFloat(b.price || 0) - parseFloat(a.price || 0);
            case 'title_desc': return (b.title || '').localeCompare(a.title || '');
            case 'newest': return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            case 'oldest': return new Date(a.created_at || 0) - new Date(b.created_at || 0);
            case 'title_asc':
            default: return (a.title || '').localeCompare(b.title || '');
        }
    });

    // Pagination
    const page = Math.max(1, parseInt(filters.page) || 1);
    const pageSize = Math.max(1, parseInt(filters.page_size) || 24);
    const totalItems = products.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const start = (page - 1) * pageSize;
    const paged = products.slice(start, start + pageSize);

    return {
        products: paged,
        pagination: { page, pageSize, totalItems, totalPages },
        facets: facets,
        filtersApplied,
    };
}

/**
 * Fetch catalog data from S3 (or local public/) with caching.
 * Used as fallback when API is unavailable.
 */
let _catalogCache = null;
let _catalogCacheTime = 0;
const CATALOG_CACHE_MS = 5 * 60 * 1000; // 5 minutes

async function fetchCatalogFromS3() {
    const now = Date.now();
    if (_catalogCache && (now - _catalogCacheTime) < CATALOG_CACHE_MS) {
        return _catalogCache;
    }

    // Try S3 first, then local public/ fallback (for dev without S3)
    const urls = [
        S3_BASE_URL ? `${S3_BASE_URL}/catalog/products.json` : null,
        '/catalog/products.json',
    ].filter(Boolean);

    let lastError;
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                _catalogCache = data;
                _catalogCacheTime = now;
                return data;
            }
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError || new Error('Failed to fetch catalog data');
}

/**
 * Fetch paginated catalog products with filter support.
 * @param {Object} filters - Catalog filters and pagination values
 * @returns {Promise<Object>} Catalog response with products and metadata
 */
export async function fetchCatalogProducts(filters = {}) {
    // Try API first
    if (API_BASE_URL) {
        try {
            const queryString = buildQueryString(filters);
            const response = await fetch(`${API_BASE_URL}/catalog${queryString}`);
            if (response.ok) return await response.json();
        } catch (err) {
            console.warn('API unavailable for catalog, falling back to S3:', err.message);
        }
    }

    // S3 / local fallback with client-side filtering
    const data = await fetchCatalogFromS3();
    return filterSortPaginate(data.products || [], filters, data.facets || {});
}

/**
 * Fetch a single catalog product.
 * @param {string} productIdOrHandle - Product id or handle
 * @returns {Promise<Object>} Product detail payload
 */
export async function fetchCatalogProductDetail(productIdOrHandle) {
    if (!productIdOrHandle) {
        throw new Error('Product id or handle is required');
    }

    // Try API first
    if (API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/catalog/${encodeURIComponent(productIdOrHandle)}`);
            if (response.ok) return await response.json();
        } catch (err) {
            console.warn('API unavailable for product detail, falling back to S3:', err.message);
        }
    }

    // S3 / local fallback
    const data = await fetchCatalogFromS3();
    const products = data.products || [];
    const found = products.find(
        (p) => String(p.product_id) === productIdOrHandle || p.handle === productIdOrHandle
    );
    if (!found) {
        throw new Error('Product not found');
    }

    // Build related products from same collection(s)
    const collections = found.collections || [];
    const relatedProducts = collections.length > 0
        ? products
            .filter((p) =>
                p.handle !== found.handle &&
                (p.collections || []).some((c) => collections.includes(c))
            )
            .slice(0, 4)
        : [];

    return { product: found, relatedProducts };
}

/**
 * Create a new catalog product (admin only).
 */
export async function createCatalogProduct(productData, adminPassword) {
    const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': adminPassword,
        },
        body: JSON.stringify(productData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create product');
    }

    return response.json();
}

/**
 * Update an existing catalog product (admin only).
 */
export async function updateCatalogProduct(productIdOrHandle, updates, adminPassword) {
    const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(productIdOrHandle)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': adminPassword,
        },
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
    }

    return response.json();
}

/**
 * Delete a catalog product (admin only).
 */
export async function deleteCatalogProduct(productIdOrHandle, adminPassword) {
    const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(productIdOrHandle)}`, {
        method: 'DELETE',
        headers: {
            'X-Admin-Password': adminPassword,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product');
    }

    return response.json();
}

/**
 * Get upload URLs for product media (admin only).
 */
export async function getProductUploadUrls(productIdOrHandle, files, adminPassword) {
    const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(productIdOrHandle)}/upload-urls`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': adminPassword,
        },
        body: JSON.stringify({ files }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get product upload URLs');
    }

    return response.json();
}

export default {
    fetchProjectsManifest,
    fetchProjectMetadata,
    fetchPortfolioData,
    createProject,
    updateProject,
    deleteProject,
    getUploadUrls,
    uploadFile,
    fetchCatalogProducts,
    fetchCatalogProductDetail,
    createCatalogProduct,
    updateCatalogProduct,
    deleteCatalogProduct,
    getProductUploadUrls,
    resolveCatalogImageUrl,
};
