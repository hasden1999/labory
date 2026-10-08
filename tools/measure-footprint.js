#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function getDirMetrics(dirPath) {
  let size = 0;
  let files = 0;
  let dirs = 0;

  if (!fs.existsSync(dirPath)) {
    return { size, files, dirs, exists: false };
  }

  function walk(current) {
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name);
        try {
          if (entry.isDirectory()) {
            dirs++;
            walk(fullPath);
          } else if (entry.isFile()) {
            files++;
            const stat = fs.statSync(fullPath);
            size += stat.size;
          }
        } catch (e) {
          // ignore inaccessible entries
        }
      }
    } catch (e) {
      // ignore directory access error
    }
  }

  walk(dirPath);
  return { size, files, dirs, exists: true };
}

function getTopFolders(nodeModulesPath, topN = 10) {
  if (!fs.existsSync(nodeModulesPath)) return [];

  const folders = [];
  try {
    const entries = fs.readdirSync(nodeModulesPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      if (entry.name.startsWith('@')) {
        const scopePath = path.join(nodeModulesPath, entry.name);
        try {
          const subEntries = fs.readdirSync(scopePath, { withFileTypes: true });
          for (const sub of subEntries) {
            if (sub.isDirectory()) {
              const pkgName = `${entry.name}/${sub.name}`;
              const pkgPath = path.join(scopePath, sub.name);
              const m = getDirMetrics(pkgPath);
              folders.push({
                name: pkgName,
                path: path.relative(path.resolve(__dirname, '..'), pkgPath).replace(/\\/g, '/'),
                sizeBytes: m.size,
                sizeFormatted: formatBytes(m.size),
                fileCount: m.files,
              });
            }
          }
        } catch (e) {}
      } else {
        const fullPath = path.join(nodeModulesPath, entry.name);
        const m = getDirMetrics(fullPath);
        folders.push({
          name: entry.name,
          path: path.relative(path.resolve(__dirname, '..'), fullPath).replace(/\\/g, '/'),
          sizeBytes: m.size,
          sizeFormatted: formatBytes(m.size),
          fileCount: m.files,
        });
      }
    }
  } catch (e) {}

  folders.sort((a, b) => b.sizeBytes - a.sizeBytes);
  return folders.slice(0, topN);
}

function getLatestSetupExe(distDir, rootDir) {
  if (!fs.existsSync(distDir)) return null;

  try {
    const files = fs.readdirSync(distDir);
    const exeFiles = files
      .filter((f) => f.endsWith('.exe') && f.includes('Setup') && !f.includes('Portable'))
      .map((f) => {
        const fullPath = path.join(distDir, f);
        const stat = fs.statSync(fullPath);
        return {
          fileName: f,
          filePath: path.relative(rootDir, fullPath).replace(/\\/g, '/'),
          sizeBytes: stat.size,
          sizeFormatted: formatBytes(stat.size),
          modifiedTime: stat.mtime.toISOString(),
          mtimeMs: stat.mtimeMs,
        };
      });

    if (exeFiles.length === 0) return null;
    exeFiles.sort((a, b) => b.mtimeMs - a.mtimeMs);
    const latest = exeFiles[0];
    delete latest.mtimeMs;
    return latest;
  } catch (e) {
    return null;
  }
}

function measure() {
  const rootDir = path.resolve(__dirname, '..');
  const engineDir = path.join(rootDir, 'apps', 'desktop', 'engine');
  const standaloneNmDir = path.join(engineDir, 'standalone', 'node_modules');
  const distDir = path.join(rootDir, 'apps', 'desktop', 'dist');
  const outputFile = path.join(__dirname, 'footprint_metrics.json');

  console.log('\n======================================================');
  console.log('   📊 قياس البصمة التخزينية وحجم المحرك المدمج');
  console.log('======================================================\n');

  console.log('جاري حساب بصمة apps/desktop/engine...');
  const engineMetrics = getDirMetrics(engineDir);

  console.log('جاري حساب بصمة standalone/node_modules...');
  const nmMetrics = getDirMetrics(standaloneNmDir);

  console.log('جاري تحليل أكبر حزم ومجلدات node_modules...');
  const topFolders = getTopFolders(standaloneNmDir, 10);

  console.log('جاري فحص أحدث مثبت Setup.exe...');
  const latestSetup = getLatestSetupExe(distDir, rootDir);

  const report = {
    timestamp: new Date().toISOString(),
    engine: {
      path: path.relative(rootDir, engineDir).replace(/\\/g, '/'),
      exists: engineMetrics.exists,
      sizeBytes: engineMetrics.size,
      sizeFormatted: formatBytes(engineMetrics.size),
      fileCount: engineMetrics.files,
    },
    standaloneNodeModules: {
      path: path.relative(rootDir, standaloneNmDir).replace(/\\/g, '/'),
      exists: nmMetrics.exists,
      sizeBytes: nmMetrics.size,
      sizeFormatted: formatBytes(nmMetrics.size),
      fileCount: nmMetrics.files,
    },
    latestSetupExe: latestSetup,
    topNodeModulesFolders: topFolders,
  };

  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2), 'utf-8');

  // Print readable summary
  console.log('\n--- ملخص البصمة التخزينية (Footprint Summary) ---');
  console.log(`📦 حجم محرك الديسكتوب (Engine):      ${report.engine.sizeFormatted} (${report.engine.fileCount.toLocaleString()} ملف)`);
  console.log(`📁 حجم حزم الخادم (node_modules):     ${report.standaloneNodeModules.sizeFormatted} (${report.standaloneNodeModules.fileCount.toLocaleString()} ملف)`);
  
  if (report.latestSetupExe) {
    console.log(`💿 أحدث مثبت رسمي (Setup.exe):        ${report.latestSetupExe.fileName} [${report.latestSetupExe.sizeFormatted}]`);
  } else {
    console.log(`💿 أحدث مثبت رسمي (Setup.exe):        غير متوفر حالياً في dist`);
  }

  console.log('\n--- أكبر 10 مجلدات داخل standalone/node_modules ---');
  if (topFolders.length === 0) {
    console.log('  (لا توجد حزم)');
  } else {
    topFolders.forEach((f, idx) => {
      const rank = String(idx + 1).padStart(2, ' ');
      const name = f.name.padEnd(35, ' ');
      console.log(`  ${rank}. ${name} -> ${f.sizeFormatted.padStart(10, ' ')} (${f.fileCount} ملف)`);
    });
  }

  console.log(`\n✅ تم حفظ التقرير المنظم في: ${path.relative(rootDir, outputFile)}`);
  console.log('======================================================\n');

  return report;
}

if (require.main === module) {
  measure();
}

module.exports = { measure, getDirMetrics, getTopFolders, getLatestSetupExe };
