const fs = require('fs');
const path = require('path');

const JSON_PATH = 'src/data/wasteSchedule.json';

try {
    const scheduleData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    let streets = scheduleData.streets;
    let deletedCount = 0;

    // Normalization mapping (Bad -> Good)
    const MERGE_MAP = {
        'Munkácsy M u': 'Munkácsy Mihály u',
        'Munkácsy u': 'Munkácsy Mihály u',
        'Kossuth L. u': 'Kossuth Lajos u',
        'Kossuth L u': 'Kossuth Lajos u',
        'Rákóczi F. u': 'Rákóczi Ferenc u',
        'Rákóczi F u': 'Rákóczi Ferenc u',
        'Irottkő u': 'Írottkő u',
        'Szt. Imre herceg u': 'Szent Imre herceg u',
        'Szt. Lénárd u': 'Szent Lénárd u',
        'Petőfi tér': 'Petőfi tér', // Self-map check
        // Add others if needed
    };

    Object.keys(MERGE_MAP).forEach(badKey => {
        const goodKey = MERGE_MAP[badKey];
        if (badKey === goodKey) return;

        if (streets[badKey]) {
            console.log(`Merging ${badKey} -> ${goodKey}`);

            if (!streets[goodKey]) {
                // If good key doesn't exist, just rename
                streets[goodKey] = streets[badKey];
            } else {
                // Merge properties
                // We prefer the 'black' (communal) from the bad key if it was recently updated from the PDF
                // But generally we want to union the known days.

                // For simplicity, let's just fill in missing data in Good Key from Bad Key
                // OR override specific fields if we know Bad Key has fresher data.
                // The recent update touched 'black'.

                if (streets[badKey].black) streets[goodKey].black = streets[badKey].black;
                if (streets[badKey].yellow && !streets[goodKey].yellow) streets[goodKey].yellow = streets[badKey].yellow;
                if (streets[badKey].green && !streets[goodKey].green) streets[goodKey].green = streets[badKey].green;
            }

            delete streets[badKey];
            deletedCount++;
        }
    });

    // Also do a generic pass for trailing dots which often cause dups like "Ady E. u" vs "Ady E. u."
    Object.keys(streets).forEach(key => {
        if (key.endsWith('.')) {
            const cleanKey = key.slice(0, -1);
            if (streets[cleanKey] && key !== cleanKey) {
                console.log(`Generic Merge: ${key} -> ${cleanKey}`);
                if (streets[key].black) streets[cleanKey].black = streets[key].black;
                if (streets[key].yellow && !streets[cleanKey].yellow) streets[cleanKey].yellow = streets[key].yellow;
                if (streets[key].green && !streets[cleanKey].green) streets[cleanKey].green = streets[key].green;

                delete streets[key];
                deletedCount++;
            }
        }
    });

    scheduleData.streets = streets;
    fs.writeFileSync(JSON_PATH, JSON.stringify(scheduleData, null, 2));

    console.log(`Cleanup complete. Removed ${deletedCount} duplicate keys.`);

} catch (e) {
    console.error("Error:", e);
}
