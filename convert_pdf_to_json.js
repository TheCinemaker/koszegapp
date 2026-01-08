const fs = require('fs');

const content = fs.readFileSync('pdf_content.txt', 'utf8');
const lines = content.split('\n').map(l => l.trim()).filter(l => l);

const SCHEDULE = {}; // { "YYYY-MM-DD": ["SZ1", "Z2"] }
const STREETS = {};

const CODES = ['SZ1', 'SZ2', 'SZ3', 'SZ4', 'Z1', 'Z2', 'K1', 'K2'];

// 1. PARSE CALENDAR (State Machine for Multi-line)
// Pattern:
// Line A: "1."
// Line B: "Cs"
// Line C: "SZ3" (Optional)

let currentDay = 0;
let monthIndex = 0;
let year = 2026;

let i = 0;
// We iterate until we hit the street section
while (i < lines.length) {
    const line = lines[i];

    // Stop if we hit street section headers
    if (line.includes('SZ 1.:') || line.includes('Kommunális gyűjtés') || line.includes('Zöldhulladék gyűjtés')) {
        break;
    }

    // Check for Day "D."
    const dayMatch = line.match(/^(\d+)\.$/);
    if (dayMatch) {
        const day = parseInt(dayMatch[1]);

        // Handle Month tracking
        if (day > currentDay) {
            currentDay = day;
            monthIndex = 0;
        } else if (day === currentDay) {
            monthIndex++;
        }

        // Look ahead for DoW
        if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            // Check if looks like DoW (H, K, Sze, Cs, P, Szo, V)
            // Just loose check, or check if NOT a number
            if (!nextLine.match(/^\d+\.$/)) {
                // It is likely the DoW
                i++; // Consume DoW line

                // Construct Date
                if (monthIndex < 12) {
                    const m = monthIndex + 1;
                    const dateStr = `${year}-${m.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

                    // Look ahead for Code (Optional)
                    if (i + 1 < lines.length) {
                        const potentialCode = lines[i + 1];
                        // Check if it is a code
                        // Or if it is a number (start of next day)
                        if (!potentialCode.match(/^\d+\.$/)) {
                            // It might be a code
                            // Check if it contains SZ/Z/K
                            if (CODES.some(c => potentialCode.includes(c) || potentialCode.includes(c.replace(/(\d)/, ' $1')))) {
                                // It is a code line!
                                i++; // Consume code line

                                // Normalize code
                                let extractedCodes = [];
                                CODES.forEach(c => {
                                    // Check strict or loose
                                    // The dump showed "SZ3", "Z1", "K1"
                                    if (potentialCode.includes(c)) extractedCodes.push(c);
                                    else if (potentialCode.includes(c.replace(/(\d)/, ' $1'))) {
                                        // Handle "SZ 3" -> "SZ3"
                                        extractedCodes.push(c);
                                    }
                                });
                                if (extractedCodes.length > 0) {
                                    SCHEDULE[dateStr] = extractedCodes;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    i++;
}

// 2. PARSE STREETS (Line-based)
const parsingModes = [
    { key: 'SZ 1.:', type: 'yellow', val: 'SZ1' },
    { key: 'SZ 2.:', type: 'yellow', val: 'SZ2' },
    { key: 'SZ 3.:', type: 'yellow', val: 'SZ3' },
    { key: 'SZ 4.:', type: 'yellow', val: 'SZ4' },
    { key: 'K1, Z1.:', type: 'green', val: 'Z1' },
    { key: 'K2, Z2.:', type: 'green', val: 'Z2' },
    { key: 'Hétfő:', type: 'black', val: 'Hétfő' },
    { key: 'Kedd:', type: 'black', val: 'Kedd' },
    { key: 'Szerda:', type: 'black', val: 'Szerda' },
    { key: 'Csütörtök:', type: 'black', val: 'Csütörtök' },
    { key: 'Péntek:', type: 'black', val: 'Péntek' },
    { key: 'SZ  4.:', type: 'yellow', val: 'SZ4' } // Fallback
];

let keyLocations = [];

for (let j = 0; j < lines.length; j++) {
    const line = lines[j];

    parsingModes.forEach(mode => {
        if (line.includes(mode.key) || line.includes(mode.key.replace(':', ' :'))) {
            keyLocations.push({ lineIdx: j, ...mode });
        }
    });
}

// Deduplicate locations (keep first occurrence if duplicates)
// Actually we want ALL occurrences? No, section headers appear once usually.
// But wait, "Kedd:" appears in headers listing streets.
// `keyLocations` might contain duplicates if I grep same line twice with diff keys?
// Just sort.
keyLocations.sort((a, b) => a.lineIdx - b.lineIdx);

for (let k = 0; k < keyLocations.length; k++) {
    const current = keyLocations[k];
    const nextLineIdx = (k < keyLocations.length - 1) ? keyLocations[k + 1].lineIdx : lines.length;

    let segmentText = "";

    for (let j = current.lineIdx; j < nextLineIdx; j++) {
        let l = lines[j];

        if (j === current.lineIdx) {
            // Split
            let parts = l.split(current.key);
            if (parts.length < 2 && current.key === 'SZ 4.:') parts = l.split('SZ  4.:');
            if (parts.length >= 2) {
                l = parts.slice(1).join(' ');
            }
        }

        if (l.includes('Kérjük, a hulladékokat')) break;
        if (l.includes('Kommunális gyűjtés körzetei')) break;
        if (l.includes('Zöldhulladék gyűjtés:')) break;

        segmentText += l + " ";
    }

    const streets = segmentText.split(',')
        .map(s => s.trim())
        .map(s => s.replace(/\.$/, ''))
        .filter(s => s.length > 2 && !s.includes('gyűjtési körzetek') && !s.includes('hulladéknaptár'));

    const streetNormalizations = {
        'Űrhajós u': 'Űrhajósok útja',
        'Űrhajósok u': 'Űrhajósok útja',
        'Irottkő u': 'Írottkő u',
        'Kossuth L. u': 'Kossuth Lajos u',
        'Rákóczi F. u': 'Rákóczi Ferenc u',
        'Munkácsy u': 'Munkácsy Mihály u',
        'Munkácsy M u': 'Munkácsy Mihály u'
    };

    streets.forEach(rawStreet => {
        let street = rawStreet;
        // Basic cleanup
        if (street.endsWith('.')) street = street.slice(0, -1);

        // Manual overrides
        if (streetNormalizations[street]) {
            street = streetNormalizations[street];
        }

        if (!STREETS[street]) STREETS[street] = {};
        if (current.type === 'yellow') STREETS[street].yellow = current.val;
        if (current.type === 'green') STREETS[street].green = current.val;
        if (current.type === 'black') STREETS[street].black = current.val;
    });
}

const result = {
    generatedAt: new Date().toISOString(),
    schedule: SCHEDULE,
    streets: STREETS
};

fs.writeFileSync('src/data/wasteSchedule.json', JSON.stringify(result, null, 2));
console.log('JSON generated with ' + Object.keys(STREETS).length + ' streets.');
console.log('Calendar entries found: ' + Object.keys(SCHEDULE).length);
