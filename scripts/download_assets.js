import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloads = [
  { url: 'https://koszeg.hu/pictures/eventcalendar/events//event_4873_plakat2_4873.jpg', dest: 'public/images/events/hip_hop_csaladi_nap_2026.jpg' },
  { url: 'https://koszeg.hu/pictures/eventcalendar/events//event_4872_plakat2_4872.jpg', dest: 'public/images/events/olah_dezso_duo_2026.jpg' },
  { url: 'https://koszeg.hu/pictures/eventcalendar/events//event_4787_plakat2_4787.jpg', dest: 'public/images/events/concordia_korusfesztival_2026.jpg' },
  { url: 'https://koszeg.hu/pictures/eventcalendar/events//event_4867_plakat2_4867.jpg', dest: 'public/images/events/zsinagoganapok_2026.jpg' },
  { url: 'https://koszeg.hu/pictures/eventcalendar/events//event_4852_plakat2_4852.jpg', dest: 'public/images/events/historia_futas_2026.jpg' },
  { url: 'https://koszeg.hu/pictures/eventcalendar/events//4849event_plakat2.jpg', dest: 'public/images/events/nyitott_porta_napok_2026.jpg' }
];

const copies = [
  { src: 'DSC01208.JPG', dest: 'public/images/events/szuret_2026_1.jpg' },
  { src: 'DSC01212.JPG', dest: 'public/images/events/szuret_2026_2.jpg' },
  { src: 'DSC01216.JPG', dest: 'public/images/events/szuret_2026_3.jpg' }
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode} for ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${destPath}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function run() {
  const dir = path.join(__dirname, '../public/images/events');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log('Downloading event flyers...');
  for (const item of downloads) {
    try {
      await downloadFile(item.url, path.join(__dirname, '..', item.dest));
    } catch (err) {
      console.error(`Error downloading ${item.url}: ${err.message}`);
    }
  }

  console.log('Copying DSC images...');
  for (const item of copies) {
    const srcPath = path.join(__dirname, '..', item.src);
    const destPath = path.join(__dirname, '..', item.dest);
    if (fs.existsSync(srcPath)) {
      try {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${item.src} -> ${item.dest}`);
      } catch (err) {
        console.error(`Error copying ${item.src}: ${err.message}`);
      }
    } else {
      console.warn(`Source file not found: ${srcPath}`);
    }
  }
  console.log('Asset preparation complete.');
}

run();
