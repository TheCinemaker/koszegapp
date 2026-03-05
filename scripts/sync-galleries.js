import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DATA_FILE = path.join(__dirname, '../public/data/attractions.json');
const IMAGES_DIR = path.join(__dirname, '../public/images/attractions');

async function syncGalleries() {
    console.log('--- Attraction Gallery Sync Start ---');

    try {
        // 1. Read attractions JSON
        const rawData = fs.readFileSync(DATA_FILE, 'utf8');
        let attractions = JSON.parse(rawData);

        // 2. Scan images directory
        const folders = fs.readdirSync(IMAGES_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory());

        let changedCount = 0;

        // 3. Update each attraction
        attractions = attractions.map(attr => {
            const folder = folders.find(f => f.name === attr.id);
            if (!folder) return attr;

            const folderPath = path.join(IMAGES_DIR, folder.name);
            const files = fs.readdirSync(folderPath)
                .filter(file => /\.(jpg|jpeg|png|webp|avif)$/i.test(file))
                .map(file => `/images/attractions/${folder.name}/${file}`);

            if (files.length > 0) {
                // Keep the original image as first if not already in gallery
                const newGallery = [...new Set([attr.image, ...files].filter(Boolean))];

                // Compare (simple stringify check)
                if (JSON.stringify(attr.gallery) !== JSON.stringify(newGallery)) {
                    changedCount++;
                    return { ...attr, gallery: newGallery };
                }
            }
            return attr;
        });

        // 4. Save back
        if (changedCount > 0) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(attractions, null, 2));
            console.log(`Success! Updated ${changedCount} attractions.`);
        } else {
            console.log('No changes detected.');
        }

    } catch (error) {
        console.error('Error during sync:', error);
    }

    console.log('--- Sync Finished ---');
}

syncGalleries();
