const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const token = fs.readFileSync('.env', 'utf-8').match(/GH_TOKEN=([^\r\n]+)/)[1].trim();
const OWNER = 'hasden1999';
const REPO = 'lab-releases';
const rootPkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const TAG = process.argv[2] || `v${rootPkg.version}`;

function getRelease() {
  return new Promise((resolve, reject) => {
    const req = https.get({
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
          resolve(JSON.parse(d));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

function deleteAsset(assetId) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/releases/assets/${assetId}`,
      method: 'DELETE',
      headers: {
        'User-Agent': 'Labryo',
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json'
      }
    }, res => {
      res.on('data', () => {});
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
    req.end();
  });
}

async function uploadFile(uploadUrlTemplate, filePath, fileName) {
  const cleanUrl = uploadUrlTemplate.split('{')[0];
  const uploadUrl = new URL(cleanUrl);
  uploadUrl.searchParams.set('name', fileName);

  const stats = fs.statSync(filePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
  console.log(`Starting upload: ${fileName} (${sizeMB} MB)...`);

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
  const parsed = JSON.parse(out);
  console.log(`Successfully uploaded ${fileName}!`);
  console.log(`Download URL: ${parsed.browser_download_url}`);
  return parsed.browser_download_url;
}

async function main() {
  const release = await getRelease();
  if (!release.upload_url) {
    throw new Error('Failed to get upload_url: ' + JSON.stringify(release));
  }
  console.log(`Release found: ${release.name} (ID: ${release.id})`);

  const filesToUpload = [
    {
      filePath: 'C:\\Users\\azzez\\Desktop\\Labryo_LIMS_v2_Universal_Setup.zip',
      fileName: 'Labryo_LIMS_v2_Universal_Setup.zip'
    },
    {
      filePath: 'C:\\Users\\azzez\\Desktop\\Labryo_LIMS_v2_Universal_All_Windows_32-64bit_Setup.exe',
      fileName: 'Labryo_LIMS_v2_Universal_Setup.exe'
    }
  ];

  const results = [];

  for (const item of filesToUpload) {
    if (!fs.existsSync(item.filePath)) {
      console.error(`File does not exist: ${item.filePath}`);
      continue;
    }
    const existing = release.assets.find(a => a.name === item.fileName);
    if (existing) {
      console.log(`Existing asset ${item.fileName} found (ID: ${existing.id}), deleting first...`);
      await deleteAsset(existing.id);
      console.log(`Deleted old asset ${item.fileName}.`);
    }
    const url = await uploadFile(release.upload_url, item.filePath, item.fileName);
    results.push({ name: item.fileName, url });
  }

  console.log('\n--- ALL UPLOADS COMPLETE ---');
  results.forEach(r => console.log(`${r.name} -> ${r.url}`));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
