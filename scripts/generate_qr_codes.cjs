const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Load hidden gems data
const hiddenGemsPath = path.join(__dirname, '../public/data/hidden_gems.json');
const hiddenGems = JSON.parse(fs.readFileSync(hiddenGemsPath, 'utf-8'));

// Output directory for QR codes
const outputDir = path.join(__dirname, '../public/qr-codes');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✓ Created directory: ${outputDir}`);
}

// Base URL - change this for production
// Base URL - change this for production
const BASE_URL = process.env.BASE_URL || 'https://visitkoszeg.hu';

// Generate QR codes
async function generateQRCodes() {
    console.log('\n🎯 Generating QR codes for game locations...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const gem of hiddenGems) {
        try {
            // QR code content: full URL to the gem detail page
            const qrContent = `${BASE_URL}/game/gem/${gem.id}`;

            // Output file path
            const outputPath = path.join(outputDir, `${gem.id}.png`);

            // Generate QR code with options
            await QRCode.toFile(outputPath, qrContent, {
                width: 512,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            });

            console.log(`✓ ${gem.id}.png - ${gem.name}`);
            successCount++;
        } catch (error) {
            console.error(`✗ Failed to generate QR for ${gem.id}:`, error.message);
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✓ Successfully generated: ${successCount} QR codes`);
    if (errorCount > 0) {
        console.log(`✗ Failed: ${errorCount} QR codes`);
    }
    console.log(`📁 Output directory: ${outputDir}`);
    console.log('='.repeat(50) + '\n');

    // Generate index HTML for easy viewing
    generateIndexHTML(hiddenGems);
}

// Generate an HTML file to view all QR codes
function generateIndexHTML(gems) {
    const htmlPath = path.join(outputDir, 'index.html');

    const html = `<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kőszeg Játék - QR Kódok</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0b0b0c;
            color: #fff;
            padding: 40px 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 300;
            letter-spacing: 0.05em;
        }
        .subtitle {
            color: #888;
            margin-bottom: 40px;
            font-size: 0.9rem;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 30px;
        }
        .card {
            background: #1a1a1c;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: transform 0.2s, box-shadow 0.2s;
            border: 1px solid #2a2a2c;
        }
        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .card.extra {
            opacity: 0.6;
            border-color: #3a3a3c;
        }
        .qr-image {
            width: 100%;
            max-width: 200px;
            height: auto;
            margin: 0 auto 15px;
            background: white;
            padding: 10px;
            border-radius: 8px;
        }
        .gem-name {
            font-size: 1.1rem;
            margin-bottom: 8px;
            font-weight: 500;
        }
        .gem-id {
            font-size: 0.75rem;
            color: #666;
            font-family: monospace;
            margin-bottom: 10px;
        }
        .gem-type {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 8px;
        }
        .type-main {
            background: #1e3a8a;
            color: #93c5fd;
        }
        .type-extra {
            background: #374151;
            color: #9ca3af;
        }
        .download-btn {
            display: inline-block;
            margin-top: 10px;
            padding: 8px 16px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 0.85rem;
            transition: background 0.2s;
        }
        .download-btn:hover {
            background: #1d4ed8;
        }
        .info-box {
            background: #1a1a1c;
            border: 1px solid #2a2a2c;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .info-box h2 {
            font-size: 1.2rem;
            margin-bottom: 10px;
            font-weight: 400;
        }
        .info-box p {
            color: #aaa;
            line-height: 1.6;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin-top: 15px;
        }
        .stat {
            flex: 1;
            background: #0b0b0c;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-value {
            font-size: 2rem;
            font-weight: 300;
            color: #3b82f6;
        }
        .stat-label {
            font-size: 0.8rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 Kőszeg Játék - QR Kódok</h1>
        <p class="subtitle">1532-es ostrom kincsvadászat</p>
        
        <div class="info-box">
            <h2>📱 Használat</h2>
            <p>
                Ezek a QR kódok a Kőszeg játék helyszíneihez tartoznak. 
                Minden QR kód egy adott történelmi helyszínre navigál.
                Szkenneld be őket a játék során, vagy kattints a letöltés gombra a kinyomtatáshoz.
            </p>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${gems.filter(g => !g.type || g.type !== 'extra').length}</div>
                    <div class="stat-label">Fő Helyszín</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${gems.filter(g => g.type === 'extra').length}</div>
                    <div class="stat-label">Extra Helyszín</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${gems.length}</div>
                    <div class="stat-label">Összesen</div>
                </div>
            </div>
        </div>

        <div class="grid">
            ${gems.map(gem => `
                <div class="card ${gem.type === 'extra' ? 'extra' : ''}">
                    <img src="${gem.id}.png" alt="${gem.name}" class="qr-image">
                    <div class="gem-name">${gem.name}</div>
                    <div class="gem-id">${gem.id}</div>
                    <span class="gem-type ${gem.type === 'extra' ? 'type-extra' : 'type-main'}">
                        ${gem.type === 'extra' ? 'Extra' : 'Fő Helyszín'}
                    </span>
                    <br>
                    <a href="${gem.id}.png" download="${gem.id}.png" class="download-btn">
                        ⬇ Letöltés
                    </a>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(htmlPath, html, 'utf-8');
    console.log(`✓ Generated index.html for viewing QR codes`);
    console.log(`   Open: ${htmlPath}\n`);
}

// Run the generator
generateQRCodes().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
