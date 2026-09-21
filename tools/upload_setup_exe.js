const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const token = fs.readFileSync('.env', 'utf-8').match(/GH_TOKEN=([^\r\n]+)/)[1].trim();
const OWNER = 'hasden1999';
const REPO = 'lab-releases';
const TAG = 'v1.0.9';

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
      const cleanUrl = release.upload_url.split('{')[0];
      const uploadUrl = new URL(cleanUrl);
      uploadUrl.searchParams.set('name', 'Labryo.LIMS.Setup.1.0.9.exe');

      const filePath = path.resolve(__dirname, '../apps/desktop/dist/Labryo.LIMS.Setup.1.0.9.exe');
      console.log('Uploading 147MB setup exe via curl HTTP/1.1...');

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
