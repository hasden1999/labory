const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  if (dir.includes('node_modules') || dir.includes('.git') || dir.includes('.next')) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchDir(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith('.json') || fullPath.endsWith('.ts') || fullPath.endsWith('.js'))) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (fullPath.endsWith('.json')) {
          try {
            const j = JSON.parse(content);
            if (Array.isArray(j) && j.length === 72) {
              console.log(`FOUND ARRAY of 72 items: ${fullPath}`);
            }
            if (j.tests && Array.isArray(j.tests) && j.tests.length === 72) {
              console.log(`FOUND tests array of 72 items: ${fullPath}`);
            }
          } catch (e) {}
        }
      } catch (e) {}
    }
  }
}

searchDir('D:/lab');
console.log('Search in D:/lab done.');
searchDir('C:/Users/azzez/AppData/Roaming/@lab-manager');
console.log('Search in AppData done.');
