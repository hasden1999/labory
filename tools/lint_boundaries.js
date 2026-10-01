#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🔍 [lint:boundaries] Checking architectural layer boundaries and dependency rules...');

// Scan all source files in apps/ and packages/
function getAllSourceFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', 'dist', 'build', '.git', 'backups', 'artifacts'].includes(entry.name)) {
        getAllSourceFiles(fullPath, fileList);
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = getAllSourceFiles('D:/lab/packages');
const appsFiles = getAllSourceFiles('D:/lab/apps/web/src');
const serverFiles = getAllSourceFiles('D:/lab/apps/server/src');
const allFiles = [...files, ...appsFiles, ...serverFiles];

const violations = [];

for (const file of allFiles) {
  const normalized = file.replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');

  // Rule 1: packages/domain cannot import prisma, react, or fastify
  if (normalized.includes('packages/domain/')) {
    if (/@prisma|prisma|react|fastify|next/.test(content)) {
      violations.push({
        file: normalized,
        rule: 'Domain purity: packages/domain must be pure business logic with NO UI or DB dependencies'
      });
    }
  }

  // Rule 2: packages/core cannot import UI or modules
  if (normalized.includes('packages/core/')) {
    if (/packages\/forms|packages\/design|apps\/web/.test(content)) {
      violations.push({
        file: normalized,
        rule: 'Dependency direction: packages/core cannot import from UI, forms, design, or web modules'
      });
    }
  }

  // Rule 3: packages/design cannot contain business logic / prisma
  if (normalized.includes('packages/design/')) {
    if (/@prisma|prisma|fastify|serverStore/.test(content)) {
      violations.push({
        file: normalized,
        rule: 'Design purity: packages/design cannot import backend or database services'
      });
    }
  }
}

if (violations.length > 0) {
  console.error('\n❌ [BOUNDARY VIOLATIONS DETECTED]');
  for (const v of violations) {
    console.error(`- ${v.file}: ${v.rule}`);
  }
  process.exit(1);
}

console.log(`✅ [lint:boundaries] Scanned ${allFiles.length} source files. Zero boundary violations detected!`);
process.exit(0);
