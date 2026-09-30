const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const desktopDir = path.join(os.homedir(), 'Desktop');
const srcHtml = path.join(__dirname, 'مولد_التراخيص.html');
const destHtml = path.join(desktopDir, 'مولد التراخيص - Labryo LIMS.html');

// 1. Copy the full HTML app to Desktop
fs.copyFileSync(srcHtml, destHtml);
console.log('✅ HTML copied to Desktop:', destHtml);

// 2. Create a batch launcher that opens the HTML tool in default browser
const batchLauncher = path.join(desktopDir, 'تشغيل مولد التراخيص.cmd');
const batchContent = `@echo off\r\nchcp 65001 >nul\r\nstart "" "%~dp0مولد التراخيص - Labryo LIMS.html"\r\nexit\r\n`;
fs.writeFileSync(batchLauncher, batchContent, 'utf-8');
console.log('✅ CMD launcher created at:', batchLauncher);

// 3. Create Windows Shortcut (.lnk) via PowerShell script file to avoid escaping issues
const psScript = `
$wsh = New-Object -ComObject WScript.Shell
$desktop = [System.Environment]::GetFolderPath('Desktop')
$target = Join-Path $desktop 'مولد التراخيص - Labryo LIMS.html'
$shortcut = $wsh.CreateShortcut((Join-Path $desktop 'مولد التراخيص (Labryo).lnk'))
$shortcut.TargetPath = $target
$shortcut.IconLocation = 'shell32.dll,47'
$shortcut.Save()
`;
const tmpPs = path.join(os.tmpdir(), 'create_shortcut.ps1');
fs.writeFileSync(tmpPs, psScript, 'utf-8');
try {
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpPs}"`);
  console.log('✅ Shortcut (.lnk) created successfully on Desktop!');
} catch (e) {
  console.warn('Notice on shortcut creation:', e.message);
}

// 4. Verify Desktop items
const files = fs.readdirSync(desktopDir);
const keygenFiles = files.filter(f => f.includes('ترخيص') || f.includes('التراخيص'));
console.log('Desktop Keygen Items:', keygenFiles);
