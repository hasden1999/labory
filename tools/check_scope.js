#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const MODULE_RULES = {
  forms: [
    /^packages\/forms\//,
    /^apps\/web\/src\/components\/UrineFormModal\.tsx/,
    /^apps\/web\/data\/clinical_templates\.json/,
    /^apps\/web\/src\/lib\/clinicalTemplates/
  ],
  design: [
    /^packages\/design\//,
    /^apps\/web\/src\/app\/globals\.css/,
    /^apps\/web\/src\/components\/ThemeContext\.tsx/
  ],
  reports: [
    /^packages\/reports\//,
    /^apps\/server\/src\/utils\/pdf\.ts/,
    /^apps\/web\/src\/lib\/puppeteerPdfGenerator\.ts/,
    /^apps\/server\/src\/routes\/reports\.ts/
  ],
  data: [
    /^packages\/data\//,
    /^apps\/web\/src\/app\/catalog\//,
    /^apps\/web\/src\/lib\/catalog/,
    /^apps\/server\/prisma\/seed\.ts/,
    /^tools\/.*(?:catalog|dedupe|duplicate).*/
  ],
  core: [
    /^packages\/core\//,
    /^apps\/server\//,
    /^apps\/desktop\//,
    /^package\.json/,
    /^package-lock\.json/,
    /^tsconfig.*\.json/
  ],
  messaging: [
    /^packages\/messaging\//,
    /^apps\/server\/src\/services\/whatsappService\.ts/,
    /^apps\/server\/src\/routes\/whatsapp\.ts/,
    /^apps\/web\/src\/app\/api\/whatsapp\//
  ],
  domain: [
    /^packages\/domain\//,
    /^apps\/web\/src\/lib\/clinicalIntelligence\.ts/,
    /^apps\/web\/src\/lib\/deltaCheck\.ts/
  ],
  qa: [
    /^tests\//
  ],
  docs: [
    /\.md$/,
    /^docs\//
  ],
  size: [
    /^tools\/size\//,
    /^SIZE_REPORT\.md/
  ]
};

function checkScope() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const moduleName = (args[0] || '').toLowerCase().trim();

  if (!moduleName) {
    console.error('❌ Error: Module name required. Usage: npm run check:scope -- <module>');
    console.error('Available modules: ' + Object.keys(MODULE_RULES).join(', '));
    process.exit(1);
  }

  const allowedPatterns = MODULE_RULES[moduleName];
  if (!allowedPatterns) {
    console.error(`❌ Error: Unknown module "${moduleName}". Allowed: ${Object.keys(MODULE_RULES).join(', ')}`);
    process.exit(1);
  }

  // Get changed files from git
  let changedFiles = [];
  try {
    const diffOutput = execSync('git diff --name-only HEAD', { encoding: 'utf8' }).trim();
    const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' }).trim();

    const diffFiles = diffOutput ? diffOutput.split('\n').map(s => s.trim().replace(/\\/g, '/')) : [];
    const statusFiles = statusOutput
      ? statusOutput.split('\n').map(line => line.replace(/^[^\w\/]+/, '').trim().replace(/\\/g, '/'))
      : [];

    changedFiles = Array.from(new Set([...diffFiles, ...statusFiles])).filter(Boolean);
  } catch (err) {
    console.error('Failed to get git status:', err.message);
    process.exit(1);
  }

  if (changedFiles.length === 0) {
    console.log(`✅ [check:scope] Clean working tree. No changes detected for module: "${moduleName}".`);
    process.exit(0);
  }

  console.log(`🔍 [check:scope] Checking ${changedFiles.length} changed file(s) against boundary rules for module "${moduleName}"...`);

  const violations = [];
  for (const file of changedFiles) {
    // Ignore temporary scratch, log, and golden test artifacts
    if (file.startsWith('.gemini/') || file.startsWith('scratch/') || file.startsWith('tests/golden/artifacts/')) continue;

    const isAllowed = allowedPatterns.some(pattern => pattern.test(file));
    if (!isAllowed) {
      violations.push(file);
    }
  }

  if (violations.length > 0) {
    console.error(`\n❌ [SCOPE VIOLATION] Module "${moduleName}" touched files outside its designated boundary!`);
    console.error('Violating files:');
    for (const v of violations) {
      console.error(`  - ${v}`);
    }
    console.error(`\nEvery agent must ONLY touch files in its owned layer.`);
    process.exit(1);
  }

  console.log(`✅ [check:scope] All ${changedFiles.length} changed file(s) strictly belong to module "${moduleName}". Scope verified!`);
  process.exit(0);
}

checkScope();
