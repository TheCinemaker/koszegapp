
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'public/data');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });

    return arrayOfFiles;
}

const report = {
    missingImages: [],
    jsonErrors: [],
    summary: { totalJsonFiles: 0, totalImagesChecked: 0, missingCount: 0 }
};

try {
    const dataFiles = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json'));
    report.summary.totalJsonFiles = dataFiles.length;

    dataFiles.forEach(file => {
        try {
            const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
            const data = JSON.parse(content);

            // Recursive search for keys 'image', 'imageDark', 'icon', 'img'
            const checkImages = (obj) => {
                if (!obj || typeof obj !== 'object') return;

                for (const key in obj) {
                    const value = obj[key];
                    if ((key.toLowerCase().includes('image') || key === 'icon' || key === 'img') && typeof value === 'string' && value.startsWith('/')) {
                        report.summary.totalImagesChecked++;
                        const cleanPath = value.split('?')[0]; // remove query params
                        const fullPath = path.join(PUBLIC_DIR, cleanPath);

                        if (!fs.existsSync(fullPath)) {
                            report.missingImages.push({
                                jsonFile: file,
                                key: key,
                                missingPath: value
                            });
                            report.summary.missingCount++;
                        }
                    }
                    if (typeof value === 'object') {
                        checkImages(value);
                    }
                }
            };

            if (Array.isArray(data)) {
                data.forEach(item => checkImages(item));
            } else {
                checkImages(data);
            }

        } catch (e) {
            report.jsonErrors.push({ file: file, error: e.message });
        }
    });

} catch (e) {
    console.error("Critical error running audit:", e);
}

console.log(JSON.stringify(report, null, 2));
