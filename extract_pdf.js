const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('public/Koszeg-naptar-2026.pdf');

pdf(dataBuffer).then(function (data) {
    fs.writeFileSync('pdf_content.txt', data.text, 'utf8');
});
