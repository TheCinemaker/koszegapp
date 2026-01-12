const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const dataBuffer = fs.readFileSync('public/Koszeg-kommunalis-utcalista-2026.pdf');

pdf(dataBuffer).then(function (data) {
    fs.writeFileSync('street_pdf_content.txt', data.text);
    console.log("Extracted text to street_pdf_content.txt");
});
