const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const token = fs.readFileSync('.env', 'utf-8').match(/GH_TOKEN=([^\r\n]+)/)[1].trim();
const OWNER = 'hasden1999';
const REPO = 'lab-releases';
const TAG = process.argv[2] || 'v1.1.1';
const VERSION = TAG.replace(/^v/, '');
const FILE_NAME = process.argv[3] || `Labryo.LIMS.Setup.${VERSION}.exe`;

https.get({
  hostname: 'api.github.com',
  path: `/repos/${OWNER}/${REPO}/releases/tags/${TAG}`,
  headers: {
    'User-Agent': 'Labryo',
    'Authorization': 'token ' + token,
    'Accept': 'application/vnd.github.v3+json'
  }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const release = JSON.parse(d);
      if (!release.upload_url) {
        throw new Error('Release not found or upload_url missing: ' + d);
      }
      const cleanUrl = release.upload_url.split('{')[0];
      const uploadUrl = new URL(cleanUrl);
      uploadUrl.searchParams.set('name', FILE_NAME);

      const filePath = path.resolve(__dirname, `../apps/desktop/dist/${FILE_NAME}`);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Local file not found: ${filePath}`);
      }
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
      console.log(`Uploading ${FILE_NAME} (${sizeMB} MB) to release ${TAG}...`);

      const args = [
        '--http1.1',
        '--keepalive-time', '30',
        '--connect-timeout', '60',
        '-s', '-S',
        '-X', 'POST',
        '-H', 'User-Agent: NodeJS-Labryo',
        '-H', `Authorization: token ${token}`,
        '-H', 'Content-Type: application/octet-stream',
        '-H', 'Accept: application/vnd.github.v3+json',
        '--data-binary', `@${filePath}`,
        uploadUrl.toString()
      ];

      const out = execFileSync('curl.exe', args, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
      console.log('Upload completed:', out);
      fs.writeFileSync(path.join(__dirname, 'upload_status.txt'), 'COMPLETED: 100% at ' + new Date().toLocaleTimeString(), 'utf-8');
    } catch (e) {
      console.error('Upload error:', e.message);
      fs.writeFileSync(path.join(__dirname, 'upload_status.txt'), 'ERROR: ' + e.message, 'utf-8');
    }
  });
});
