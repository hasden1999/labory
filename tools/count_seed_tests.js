const fs = require('fs');
const seedContent = fs.readFileSync('D:/lab/apps/server/prisma/seed.ts', 'utf8');
const testCreates = seedContent.match(/prisma\.testCatalog\.create/g) || [];
console.log('Test catalog creates in seed.ts:', testCreates.length);
