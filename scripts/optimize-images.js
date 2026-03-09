import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const IMAGES_DIR = './public/images/attractions';
const MAX_WIDTH = 1920;

async function optimizeFolder(folderPath) {
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
        if (/\.(jpg|jpeg|png)$/i.test(file)) {
            const inputPath = path.join(folderPath, file);
            const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

            if (fs.existsSync(outputPath)) {
                const stats = fs.statSync(inputPath);
                const outStats = fs.statSync(outputPath);
                if (outStats.mtime > stats.mtime) {
                    console.log(`  Skipping ${file} - already optimized.`);
                    continue;
                }
            }

            try {
                const stats = fs.statSync(inputPath);
                console.log(`Processing ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);

                // Increase memory limit for huge raw images (e.g., 1 Gigapixel)
                Jimp.limitInputPixels(1000 * 1000 * 1000); // Set to 1 Gigapixel (width * height)

                const image = await Jimp.read(inputPath);

                // Jimp v1 uses { w: number, h: number }
                if (image.width > MAX_WIDTH) {
                    console.log(`  Resizing from ${image.width} to ${MAX_WIDTH}...`);
                    image.resize({ w: MAX_WIDTH });
                }

                await image.write(outputPath);

                const newStats = fs.statSync(outputPath);
                console.log(`  Optimized: ${path.basename(outputPath)} (${(newStats.size / 1024 / 1024).toFixed(2)} MB)`);
            } catch (err) {
                console.error(`  Error processing ${file}:`, err);
            }
        }
    }
}

async function main() {
    console.log('--- Image Optimization Start (Jimp v1 Fixed) ---');
    if (!fs.existsSync(IMAGES_DIR)) {
        console.error('Images directory not found');
        return;
    }

    const folders = fs.readdirSync(IMAGES_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory());

    for (const folder of folders) {
        console.log(`\nFolder: ${folder.name}`);
        const folderPath = path.join(IMAGES_DIR, folder.name);
        await optimizeFolder(folderPath);
    }
    console.log('\n--- Image Optimization Finished ---');
}

main();
