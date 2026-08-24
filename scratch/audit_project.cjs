const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getFiles(filePath, fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.json')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const allFiles = getFiles(srcDir);

// Map of filename -> list of files importing it
const imports = {};
const fileBasenames = {};

allFiles.forEach(file => {
  const basename = path.basename(file, path.extname(file));
  fileBasenames[file] = basename;
  imports[file] = [];
});

allFiles.forEach(file => {
  if (file.endsWith('.json')) return;
  const content = fs.readFileSync(file, 'utf8');
  allFiles.forEach(targetFile => {
    if (file === targetFile) return;
    const targetBasename = fileBasenames[targetFile];
    
    // Check if content imports the targetFile basename
    // Allow optional extension (.js, .jsx, etc.) before the closing quote
    const importRegex = new RegExp(`from\\s+['"][^'"]*${targetBasename}(\\.[a-zA-Z0-9]+)?['"]|import\\(\\s*['"][^'"]*${targetBasename}(\\.[a-zA-Z0-9]+)?['"]`, 'i');
    if (importRegex.test(content)) {
      imports[targetFile].push(file);
    }
  });
});

console.log('--- ACTUAL UNUSED PAGES (in src/pages) ---');
allFiles.forEach(file => {
  if (file.includes('src' + path.sep + 'pages') && imports[file].length === 0) {
    const relative = path.relative(srcDir, file);
    console.log(`Unused Page: src/${relative}`);
  }
});

console.log('\n--- ACTUAL UNUSED COMPONENTS (in src/components) ---');
allFiles.forEach(file => {
  if (file.includes('src' + path.sep + 'components') && imports[file].length === 0) {
    const relative = path.relative(srcDir, file);
    console.log(`Unused Component: src/${relative}`);
  }
});
