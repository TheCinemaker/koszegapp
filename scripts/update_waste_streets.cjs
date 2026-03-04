const fs = require('fs');
const path = require('path');

const RAW_TEXT_PATH = 'street_pdf_content.txt';
const JSON_PATH = 'src/data/wasteSchedule.json';

try {
    const rawText = fs.readFileSync(RAW_TEXT_PATH, 'utf8');
    const scheduleData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);

    const DAYS = ['hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek'];
    const DAY_MAP = {
        'hétfő': 'Hétfő',
        'kedd': 'Kedd',
        'szerda': 'Szerda',
        'csütörtök': 'Csütörtök',
        'péntek': 'Péntek'
    };

    let updatedCount = 0;
    let newStreetsCount = 0;

    lines.forEach(line => {
        // Skip header/footer lines based on keywords
        if (line.includes('STKH') || line.includes('www.stkh.hu') || line.includes('Szolgáltató elérhetősége') || line.includes('Ürítés napja:') || line.includes('Közterület neve:') || line.includes('Kérjük, tartsa be')) {
            return;
        }

        // Regex to find "Street Name Day"
        // We match case insensitive for the day at the end of the line
        const dayMatch = line.match(/^(.*)\s+(hétfő|kedd|szerda|csütörtök|péntek)$/i);

        if (dayMatch) {
            let streetName = dayMatch[1].trim();
            const dayRaw = dayMatch[2].toLowerCase();
            const day = DAY_MAP[dayRaw];

            // Cleanup Street Name
            // Remove trailing dot if it exists, maybe? 
            // In the PDF dump: "Ady E. u. kedd" -> Street: "Ady E. u.".
            // Existing JSON keys often don't have trailing dot for "u", or do they?
            // Let's check existing keys. 
            // Existing: "Ady E. u", "Arborétum u. (Freh Alfonz utcáig)"
            // PDF: "Ady E. u." (with dot after u)

            // Heuristic: remove trailing dot if it follows 'u' or just generally?
            // "Ady E. u." -> "Ady E. u"
            if (streetName.endsWith('.')) {
                streetName = streetName.slice(0, -1);
            }

            // Normalization map specifically for Kőszeg streets to match existing keys if needed
            const normalizations = {
                // Add any specific fixes here
                'Irottkő u': 'Írottkő u',
                'Kossuth L. u': 'Kossuth Lajos u',
                'Rákóczi F. u': 'Rákóczi Ferenc u'
            };
            if (normalizations[streetName]) streetName = normalizations[streetName];


            // Update data
            if (!scheduleData.streets[streetName]) {
                scheduleData.streets[streetName] = {};
                newStreetsCount++;
            }

            scheduleData.streets[streetName].black = day;
            updatedCount++;
        }
    });

    // Update generatedAt timestamp
    scheduleData.generatedAt = new Date().toISOString();

    fs.writeFileSync(JSON_PATH, JSON.stringify(scheduleData, null, 2));

    console.log(`Updated ${updatedCount} streets.`);
    console.log(`Added ${newStreetsCount} new streets.`);
    console.log('Success!');

} catch (e) {
    console.error("Error:", e);
}
