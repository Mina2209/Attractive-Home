/**
 * Migration Script: portfolioData.js → S3 Structure
 * 
 * This script reads your old portfolioData.js and generates:
 * 1. projects.json (manifest)
 * 2. metadata.json files for each project
 * 
 * It references your EXISTING S3 media paths without re-uploading.
 * 
 * Usage:
 *   node migrate_to_s3.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the old data
import portfolioData from './client/src/data/portfolioData.js';

// Category mapping
const categoryMap = {
    'architectural': 'architectural',
    'interior': 'interior',
    'fit': 'fit'
};

// Generate a URL-safe ID from title
function generateId(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Convert old project structure to new metadata format
function convertProject(project, category) {
    const projectId = project.id || generateId(project.title);

    return {
        id: projectId,
        title: project.title,
        category: category,
        area: project.area || '',
        description: project.description || '',
        cover: project.video || '', // Cover video/image path (already on S3)
        media: project.details.map(item => ({
            type: item.type,
            src: item.src // Keep existing S3 path
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

// Main migration function
async function migrate() {
    console.log('🚀 Starting migration...\n');

    const outputDir = path.join(__dirname, 'migration_output');

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const manifest = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        categories: {
            architectural: {
                title: 'Architectural',
                description: portfolioData.architectural?.description || 'Architectural design projects'
            },
            interior: {
                title: 'Interior',
                description: portfolioData.interior?.description || 'Interior design projects'
            },
            fit: {
                title: 'Fit Out',
                description: portfolioData.fit?.description || 'Fit out projects'
            }
        },
        projects: []
    };

    // Process each category
    for (const [categoryKey, categoryData] of Object.entries(portfolioData)) {
        const category = categoryMap[categoryKey] || categoryKey;

        console.log(`📁 Processing category: ${category}`);

        if (!categoryData.projects) {
            console.log(`  ⚠️  No projects found in ${category}, skipping`);
            continue;
        }

        for (const project of categoryData.projects) {
            const metadata = convertProject(project, category);
            const projectId = metadata.id;

            console.log(`  ✓ ${metadata.title} (${projectId})`);

            // Add to manifest
            manifest.projects.push({
                id: projectId,
                category: category,
                path: `projects/${category}/${projectId}/`
            });

            // Create project directory structure
            const projectDir = path.join(outputDir, 'projects', category, projectId);
            fs.mkdirSync(projectDir, { recursive: true });

            // Write metadata.json
            fs.writeFileSync(
                path.join(projectDir, 'metadata.json'),
                JSON.stringify(metadata, null, 2)
            );
        }
    }

    // Write projects.json
    fs.writeFileSync(
        path.join(outputDir, 'projects.json'),
        JSON.stringify(manifest, null, 2)
    );

    console.log('\n✅ Migration complete!');
    console.log(`\n📦 Output location: ${outputDir}`);
    console.log('\n📋 Next steps:');
    console.log('1. Review the generated files in migration_output/');
    console.log('2. Upload projects.json to S3 bucket root');
    console.log('3. Upload the projects/ folder to S3 (preserves structure)');
    console.log('\n💡 Your existing media files stay in their current S3 locations!');
    console.log('   The metadata.json files just reference them.\n');

    // Print summary
    console.log('📊 Summary:');
    console.log(`   Total projects: ${manifest.projects.length}`);
    console.log(`   Categories: ${Object.keys(manifest.categories).join(', ')}`);
}

// Run migration
migrate().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
