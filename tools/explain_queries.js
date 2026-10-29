const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve('apps/web/data/lab.db');
const db = new Database(dbPath);

console.log('=== EXPLAIN QUERY PLAN Patient search by name ===');
console.table(db.prepare("EXPLAIN QUERY PLAN SELECT * FROM Patient WHERE name LIKE 'A%'").all());

console.log('=== EXPLAIN QUERY PLAN Patient search by phone ===');
console.table(db.prepare("EXPLAIN QUERY PLAN SELECT * FROM Patient WHERE phone = '07701234567'").all());

console.log('=== EXPLAIN QUERY PLAN TestCatalog search by code ===');
console.table(db.prepare("EXPLAIN QUERY PLAN SELECT * FROM TestCatalog WHERE code = 'CBC'").all());

console.log('=== EXPLAIN QUERY PLAN TestCatalog search by category & active ===');
console.table(db.prepare("EXPLAIN QUERY PLAN SELECT * FROM TestCatalog WHERE category = 'عام' AND active = 1").all());

console.log('=== EXPLAIN QUERY PLAN Sample search by status & urgent ===');
console.table(db.prepare("EXPLAIN QUERY PLAN SELECT * FROM Sample WHERE isDeleted = 0 AND status = 'RECEIVED' ORDER BY createdAt DESC").all());

db.close();
