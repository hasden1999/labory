const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const desktopDir = path.join(process.env.USERPROFILE || 'C:\\Users\\azzez', 'Desktop');
const iconPath = path.join(rootDir, 'apps', 'desktop', 'assets', 'app.ico');
const batchLauncherPath = path.join(rootDir, 'tools', 'launch-live-desktop.bat');

const shortcutsToCreate = [
  path.join(desktopDir, 'معاينة نظام لابريو الحي (Live Dev).lnk'),
  path.join(rootDir, 'معاينة نظام لابريو الحي (Live Dev).lnk')
];

// Ensure app.ico exists
if (!fs.existsSync(iconPath)) {
  console.log('Generating app.ico...');
  execSync('powershell -ExecutionPolicy Bypass -File "' + path.join(rootDir, 'tools', 'generate-ico.ps1') + '"', { stdio: 'inherit' });
}

// Generate PowerShell script with explicit UTF-8 and hardcoded parameters to prevent ANSI mangling
for (const shortcutPath of shortcutsToCreate) {
  const psCode = `
$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut("${shortcutPath.split('\\').join('/')}")
$s.TargetPath = "${batchLauncherPath.split('\\').join('\\')}"
$s.WorkingDirectory = "${rootDir.split('\\').join('\\')}"
$s.Description = "معاينة حية وفورية لنظام مختبرات لابريو - تحديث تلقائي مع الكود"
$s.IconLocation = "${iconPath.split('\\').join('\\')},0"
$s.WindowStyle = 1
$s.Save()
Write-Output "Shortcut created: ${shortcutPath.split('\\').join('/')}"
`;

  const tempPs = path.join(rootDir, 'tools', `temp_make_${Date.now()}.ps1`);
  fs.writeFileSync(tempPs, '\uFEFF' + psCode, 'utf8');

  try {
    const out = execSync(`powershell -ExecutionPolicy Bypass -File "${tempPs}"`, { encoding: 'utf8' });
    console.log(out.trim());
  } catch (err) {
    console.error('Failed to create shortcut:', shortcutPath, err.message);
  } finally {
    if (fs.existsSync(tempPs)) fs.unlinkSync(tempPs);
  }
}

console.log('All shortcuts successfully configured!');
