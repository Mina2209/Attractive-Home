# Migration Guide: Old Portfolio Data → S3 Structure

This guide explains how to migrate your existing portfolio data to the new S3-backed CMS without re-uploading media files.

## What This Does

The migration script (`migrate_to_s3.js`) will:
- ✅ Read your old `portfolioData.js`
- ✅ Generate `projects.json` (manifest file)
- ✅ Create `metadata.json` files for each project
- ✅ **Reference your existing S3 media paths** (no re-upload!)

## Prerequisites

Your media files should already be on S3 in the old structure:
```
/Architecture/Baghoum/1.webp
/Architecture/Baghoum/Cover/master.m3u8
/Interior/El-Tayeb/Cover/master.m3u8
etc.
```

## Step 1: Run the Migration Script

```bash
node migrate_to_s3.js
```

This creates a `migration_output/` folder with:
```
migration_output/
├── projects.json                    ← Upload to S3 root
└── projects/
    ├── architectural/
    │   ├── project-1/
    │   │   └── metadata.json        ← Upload to S3
    │   ├── mr-ahmed-baghoums-villa/
    │   │   └── metadata.json
    │   └── ...
    ├── interior/
    │   └── ...
    └── fit/
        └── ...
```

## Step 2: Upload to S3

### Option A: Using AWS Console
1. Go to your S3 bucket: `attractivehomeawstestbucket`
2. Upload `projects.json` to the **root** of your bucket
3. Upload the entire `projects/` folder (maintains structure)

### Option B: Using AWS CLI
```bash
# Upload projects.json to root
aws s3 cp migration_output/projects.json s3://attractivehomeawstestbucket/

# Upload all metadata files
aws s3 cp migration_output/projects/ s3://attractivehomeawstestbucket/projects/ --recursive
```

## Step 3: Verify

After uploading:
1. Check that `projects.json` exists at: `https://attractivehomeawstestbucket.s3.me-central-1.amazonaws.com/projects.json`
2. Check a sample metadata file: `https://attractivehomeawstestbucket.s3.me-central-1.amazonaws.com/projects/architectural/project-1/metadata.json`
3. Visit your website - old projects should now appear!

## Important Notes

### ✅ Your existing media stays in place
The metadata files reference existing S3 paths like:
```json
{
  "cover": "/Architecture/Baghoum/Cover/master.m3u8",
  "media": [
    { "type": "image", "src": "/Architecture/Baghoum/1.webp" }
  ]
}
```

### ⚠️ Path consistency
Make sure the paths in `portfolioData.js` match your actual S3 file locations. The script uses the paths exactly as they appear in `portfolioData.js`.

### 🔄 Updating after migration
After migration, use the Dashboard to create/edit projects. The old `portfolioData.js` becomes a fallback only.

## Troubleshooting

**Q: Some projects aren't showing up**
- Check that `projects.json` was uploaded to the S3 bucket root
- Verify metadata.json files exist in the correct paths

**Q: Images/videos not loading**
- Verify media files still exist at the old S3 paths
- Check S3 bucket permissions (public read access)
- Verify CORS settings on your S3 bucket

**Q: Want to move media to new structure?**
You can use S3's copy command to reorganize files:
```bash
# Example: Copy old media to new project structure
aws s3 cp s3://bucket/Architecture/Baghoum/ \
          s3://bucket/projects/architectural/project-1/media/ \
          --recursive
```

Then update the metadata.json paths accordingly.
