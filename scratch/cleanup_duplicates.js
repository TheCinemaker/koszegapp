import fs from 'fs';

const eventsPath = './public/data/events.json';
const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

console.log(`Initial events count: ${events.length}`);

// We will explicitly remove the duplicate IDs that we know are redundant
const idsToRemove = new Set([
  'new_1771696209734', // Old duplicate of Berecz Mátyás (with wrong location)
  'varszinhaz-20260715-27', // Old duplicate of Tiszavirág
  'varszinhaz-20260717-29', // Old duplicate of Az igazmondó juhász
  'varszinhaz-20260718-30', // Old duplicate of Operett-musical est
  'varszinhaz-20260719-32', // Old duplicate of A zöldszakállú király
  'varszinhaz-20260720-34', // Old duplicate of Robin Hood
  'varszinhaz-20260725-36'  // Old duplicate of Házastársas
]);

const cleanedEvents = events.filter(e => !idsToRemove.has(e.id));

console.log(`Cleaned events count: ${cleanedEvents.length}`);

fs.writeFileSync(eventsPath, JSON.stringify(cleanedEvents, null, 2), 'utf8');
console.log('Successfully cleaned up duplicate events!');
