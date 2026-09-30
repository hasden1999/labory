const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const tokenMatch = fs.readFileSync('.env', 'utf-8').match(/GH_TOKEN=([^\r\n]+)/);
if (!tokenMatch) {
  console.error('GH_TOKEN not found in .env');
  process.exit(1);
}
const token = tokenMatch[1].trim();
const OWNER = 'hasden1999';
const REPO = 'lab-releases';
const TAG = 'v1.1.1';

function requestGitHub(method, apiPath, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: apiPath,
      method: method,
      headers: {
        'User-Agent': 'Labryo-Release-Manager',
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json',
      }
    };
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function uploadAssetFile(uploadUrlTemplate, filePath, fileName, contentType = 'application/octet-stream') {
  const cleanUrl = uploadUrlTemplate.split('{')[0];
  const uploadUrl = new URL(cleanUrl);
  uploadUrl.searchParams.set('name', fileName);

  const stats = fs.statSync(filePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\nUploading ${fileName} (${sizeMB} MB)...`);

  const args = [
    '--http1.1',
    '--keepalive-time', '30',
    '--connect-timeout', '60',
    '-s', '-S',
    '-X', 'POST',
    '-H', 'User-Agent: NodeJS-Labryo',
    '-H', `Authorization: token ${token}`,
    '-H', `Content-Type: ${contentType}`,
    '-H', 'Accept: application/vnd.github.v3+json',
    '--data-binary', `@${filePath}`,
    uploadUrl.toString()
  ];

  const out = execFileSync('curl.exe', args, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  console.log(`Upload completed for ${fileName}!`);
  return out;
}

async function main() {
  console.log(`Fetching release ${TAG} from ${OWNER}/${REPO}...`);
  const relRes = await requestGitHub('GET', `/repos/${OWNER}/${REPO}/releases/tags/${TAG}`);
  if (relRes.status !== 200 || !relRes.data) {
    console.error(`Failed to fetch release ${TAG}:`, relRes);
    process.exit(1);
  }

  const release = relRes.data;
  console.log(`Found release: ID ${release.id}, published at: ${release.published_at}`);

  const filesToUpload = [
    {
      name: 'Labryo.LIMS.Setup.1.1.1.exe',
      path: path.resolve(__dirname, '../apps/desktop/dist/Labryo.LIMS.Setup.1.1.1.exe'),
      type: 'application/octet-stream'
    },
    {
      name: 'latest.yml',
      path: path.resolve(__dirname, '../apps/desktop/dist/latest.yml'),
      type: 'text/yaml'
    }
  ];

  // 1. Delete existing conflicting assets if they exist
  for (const f of filesToUpload) {
    const existing = (release.assets || []).find(a => a.name === f.name);
    if (existing) {
      console.log(`Deleting old asset ${f.name} (ID ${existing.id})...`);
      const delRes = await requestGitHub('DELETE', `/repos/${OWNER}/${REPO}/releases/assets/${existing.id}`);
      console.log(`Deleted old ${f.name}: Status ${delRes.status}`);
    }
  }

  // 2. Upload new assets
  for (const f of filesToUpload) {
    if (!fs.existsSync(f.path)) {
      console.error(`File not found: ${f.path}`);
      continue;
    }
    uploadAssetFile(release.upload_url, f.path, f.name, f.type);
  }

  console.log('\n======================================================');
  console.log('  SILENT UPDATE PACKAGE UPLOADED SUCCESSFULLY!');
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('Fatal upload error:', err);
  process.exit(1);
});
