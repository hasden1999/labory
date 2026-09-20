const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const shortcutPath = path.join(process.env.USERPROFILE || 'C:\\Users\\azzez', 'Desktop', 'معاينة نظام لابريو الحي (Live Dev).lnk');

const ps = [
  'param([string]$path)',
  '$w = New-Object -ComObject WScript.Shell',
  '$s = $w.CreateShortcut($path)',
  'Write-Output "Target: $($s.TargetPath)"',
  'Write-Output "Icon: $($s.IconLocation)"',
  'Write-Output "WorkDir: $($s.WorkingDirectory)"'
].join('\r\n');

const tempPs = path.join(__dirname, 'temp_verify.ps1');
fs.writeFileSync(tempPs, '\uFEFF' + ps, 'utf8');

try {
  const res = execSync(`powershell -ExecutionPolicy Bypass -File "${tempPs}" -path "${shortcutPath}"`, { encoding: 'utf8' });
  console.log(res);
} catch (e) {
  console.error(e.message);
} finally {
  if (fs.existsSync(tempPs)) fs.unlinkSync(tempPs);
}
