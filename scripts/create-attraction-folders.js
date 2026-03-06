import fs from 'fs';
import path from 'path';

const DATA_FILE = './public/data/attractions.json';
const IMAGES_DIR = './public/images/attractions';

try {
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    const attractions = JSON.parse(rawData);

    if (!fs.existsSync(IMAGES_DIR)) {
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }

    attractions.forEach(attr => {
        const folderPath = path.join(IMAGES_DIR, attr.id);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
            console.log(`Created folder: ${attr.id}`);
        } else {
            console.log(`Folder already exists: ${attr.id}`);
        }
    });

    console.log('All folders processed.');
} catch (error) {
    console.error('Error:', error);
}
