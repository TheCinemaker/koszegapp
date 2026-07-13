import fs from 'fs';

const eventsPath = './public/data/events.json';
const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

console.log(`Checking ${events.length} events for duplicates...`);

const seen = new Map();
const duplicates = [];

events.forEach(e => {
  const key = `${e.name.toLowerCase().trim()}_${e.date}`;
  if (seen.has(key)) {
    duplicates.push({
      key,
      first: seen.get(key),
      second: e
    });
  } else {
    seen.set(key, e);
  }
});

if (duplicates.length > 0) {
  console.log(`Found ${duplicates.length} duplicates:`);
  duplicates.forEach(d => {
    console.log(`- Duplicate name: "${d.first.name}" on date ${d.first.date}`);
    console.log(`  ID 1: "${d.first.id}"`);
    console.log(`  ID 2: "${d.second.id}"`);
  });
} else {
  console.log('No duplicates found!');
}
