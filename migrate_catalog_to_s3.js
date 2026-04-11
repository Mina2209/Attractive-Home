/**
 * Migration Script: crawled products JSON -> S3-ready catalog artifact
 *
 * Usage:
 *   node migrate_catalog_to_s3.js <input-json-path> [output-dir]
 *
 * Example:
 *   node migrate_catalog_to_s3.js "d:/path/to/catalog.json" "./migration_output"
 */

const fs = require('fs');
const path = require('path');

function normalizeList(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    return String(value)
        .split('|')
        .map((item) => item.trim())
        .filter(Boolean);
}

function buildFacets(products) {
    const collections = new Map();
    const materials = new Map();
    const sellingTypes = new Map();
    const productCategories = new Map();
    const colors = new Map();
    const usages = new Map();
    const sizes = new Map();
    const availability = { available: 0, unavailable: 0 };

    for (const product of products) {
        for (const collection of normalizeList(product.collections)) {
            collections.set(collection, (collections.get(collection) || 0) + 1);
        }

        if (product.material) {
            materials.set(product.material, (materials.get(product.material) || 0) + 1);
        }

        if (product.selling_type) {
            sellingTypes.set(product.selling_type, (sellingTypes.get(product.selling_type) || 0) + 1);
        }

        if (product.filter_product_category) {
            productCategories.set(product.filter_product_category, (productCategories.get(product.filter_product_category) || 0) + 1);
        }

        if (product.filter_color) {
            colors.set(product.filter_color, (colors.get(product.filter_color) || 0) + 1);
        }

        for (const usage of normalizeList(product.filter_usage)) {
            usages.set(usage, (usages.get(usage) || 0) + 1);
        }

        if (product.filter_size) {
            sizes.set(product.filter_size, (sizes.get(product.filter_size) || 0) + 1);
        }

        if (product.available === false) {
            availability.unavailable += 1;
        } else {
            availability.available += 1;
        }
    }

    const toArray = (map) =>
        Array.from(map.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([value, count]) => ({ value, count }));

    return {
        collections: toArray(collections),
        materials: toArray(materials),
        sellingTypes: toArray(sellingTypes),
        productCategories: toArray(productCategories),
        colors: toArray(colors),
        usages: toArray(usages),
        sizes: toArray(sizes),
        availability: [
            { value: 'available', count: availability.available },
            { value: 'unavailable', count: availability.unavailable },
        ],
    };
}

function normalizeGalleryImages(galleryImages = []) {
    if (!Array.isArray(galleryImages)) return [];
    return galleryImages
        .map((item) => {
            if (typeof item === 'string') {
                return { url: item.trim(), original_url: '', alt: '' };
            }
            if (item && typeof item === 'object') {
                // Prefer local_path over the external Shopify CDN url
                const localPath = String(item.local_path || '').trim();
                const originalUrl = String(item.url || '').trim();
                const url = localPath || originalUrl;
                if (!url) return null;
                return {
                    url,
                    original_url: localPath && originalUrl ? originalUrl : '',
                    alt: String(item.alt || '').trim(),
                };
            }
            return null;
        })
        .filter(Boolean);
}

function normalizeProduct(product) {
    const galleryImages = normalizeGalleryImages(product.gallery_images);

    // Use local paths for body_images and usage_image
    const bodyImages = Array.isArray(product.body_images_local)
        ? product.body_images_local.map((item) => String(item).trim()).filter(Boolean)
        : Array.isArray(product.body_images)
            ? product.body_images.map((item) => String(item).trim()).filter(Boolean)
            : [];

    const usageImageUrl = String(
        product.usage_image_local || product.usage_image_url || ''
    ).trim();

    // Keep the original CDN URL for the usage image as fallback
    // Only store if it's an actual external URL, not a duplicate local path
    const rawOriginal = String(product.usage_image_url || '').trim();
    const usageImageOriginal = rawOriginal.startsWith('http') ? rawOriginal : '';

    return {
        product_id: product.product_id,
        title: String(product.title || '').trim(),
        handle: String(product.handle || '').trim(),
        product_url: String(product.product_url || '').trim(),
        vendor: String(product.vendor || '').trim(),
        product_type: String(product.product_type || '').trim(),
        tags: normalizeList(product.tags),
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString(),
        product_number: String(product.product_number || '').trim(),
        size_per_piece: String(product.size_per_piece || '').trim(),
        sheet_size: String(product.sheet_size || '').trim(),
        material: String(product.material || '').trim(),
        packing: String(product.packing || '').trim(),
        selling_type: String(product.selling_type || '').trim(),
        weight: String(product.weight || '').trim(),
        shape: String(product.shape || '').trim(),
        usage_image_url: usageImageUrl,
        usage_image_original: usageImageOriginal,
        description_paragraphs: Array.isArray(product.description_paragraphs)
            ? product.description_paragraphs
            : [],
        body_images: bodyImages,
        price: String(product.price || '').trim(),
        compare_at_price: product.compare_at_price ?? null,
        sku: product.sku ?? null,
        price_currency: String(product.price_currency || '').trim(),
        available: product.available !== false,
        gallery_images: galleryImages,
        collections: normalizeList(product.collections),
        // New filter fields from crawled data
        filter_product_category: String(product.filter_product_category || '').trim(),
        filter_color: String(product.filter_color || '').trim(),
        filter_usage: normalizeList(product.filter_usage),
        filter_material: String(product.filter_material || '').trim(),
        filter_size: String(product.filter_size || '').trim(),
        primary_image: String(
            product.primary_image ||
                galleryImages[0]?.url ||
                ''
        ).trim(),
    };
}

function main() {
    const inputPath = process.argv[2];
    const outputDir = process.argv[3] || path.join(process.cwd(), 'migration_output');

    if (!inputPath) {
        console.error('Missing input file path.');
        console.error('Usage: node migrate_catalog_to_s3.js <input-json-path> [output-dir]');
        process.exit(1);
    }

    const rawContent = fs.readFileSync(inputPath, 'utf-8');
    const rawProducts = JSON.parse(rawContent);
    if (!Array.isArray(rawProducts)) {
        throw new Error('Input JSON must be an array of products.');
    }

    const products = rawProducts
        .filter((product) => product && typeof product === 'object' && product.title)
        .map(normalizeProduct);

    const deduped = [];
    const seen = new Set();
    for (const product of products) {
        const key = `${product.product_id}::${product.handle}`;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(product);
    }

    const catalog = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        products: deduped,
        facets: buildFacets(deduped),
    };

    const catalogDir = path.join(outputDir, 'catalog');
    fs.mkdirSync(catalogDir, { recursive: true });
    const outputPath = path.join(catalogDir, 'products.json');
    fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2));

    console.log('Catalog migration complete.');
    console.log(`Input products: ${rawProducts.length}`);
    console.log(`Exported products: ${deduped.length}`);
    console.log(`Output: ${outputPath}`);
}

main();
