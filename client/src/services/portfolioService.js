/**
 * Portfolio Service
 * 
 * Handles fetching portfolio data from S3 via Lambda API.
 * Replaces the static portfolioData.js with dynamic data fetching.
 */

// API Configuration - Update these with your actual values
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || '';

/**
 * Fetch the complete projects manifest from S3
 * @returns {Promise<Object>} Projects manifest with categories and project list
 */
export async function fetchProjectsManifest() {
    try {
        // Try API first, fallback to direct S3
        if (API_BASE_URL) {
            const response = await fetch(`${API_BASE_URL}/projects`);
            if (!response.ok) throw new Error('API request failed');
            return await response.json();
        }

        // Direct S3 fallback
        const response = await fetch(`${S3_BASE_URL}/projects.json`);
        if (!response.ok) throw new Error('Failed to fetch projects manifest');
        return await response.json();
    } catch (error) {
        console.error('Error fetching projects manifest:', error);
        throw error;
    }
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
                const response = await fetch(`${API_BASE_URL}/projects/${category}/${projectId}`);

                // Handle throttling (503) with retry
                if (response.status === 503 && attempt < retries) {
                    const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                    console.log(`Throttled on ${category}/${projectId}, retrying in ${backoffMs}ms...`);
                    await delay(backoffMs);
                    continue;
                }

                if (!response.ok) throw new Error(`API request failed: ${response.status}`);
                const metadata = await response.json();
                return transformMetadataUrls(metadata);
            }

            // Direct S3 fallback
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

export default {
    fetchProjectsManifest,
    fetchProjectMetadata,
    fetchPortfolioData,
    createProject,
    updateProject,
    deleteProject,
    getUploadUrls,
    uploadFile
};
