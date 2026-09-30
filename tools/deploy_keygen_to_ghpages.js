const fs = require('fs');
const path = require('path');
const https = require('https');

const envContent = fs.readFileSync('.env', 'utf-8');
const token = envContent.match(/GH_TOKEN=([^\r\n]+)/)[1].trim();

const OWNER = 'hasden1999';
const REPO = 'lab-releases';

function apiRequest(reqPath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: reqPath,
      method,
      headers: {
        'User-Agent': 'NodeJS-Labryo',
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json',
        ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {})
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log('🚀 Deploying License Generator to GitHub Pages...');

  const htmlContent = fs.readFileSync(path.join(__dirname, 'مولد_التراخيص.html'), 'utf-8');
  const base64Content = Buffer.from(htmlContent, 'utf-8').toString('base64');

  // 1. Check if index.html already exists in repo to get SHA
  console.log('Checking index.html on main branch...');
  const { data: existingFile } = await apiRequest(`/repos/${OWNER}/${REPO}/contents/index.html`);
  const sha = existingFile && existingFile.sha ? existingFile.sha : undefined;

  // 2. Commit index.html
  console.log('Committing index.html to main branch...');
  const commitRes = await apiRequest(`/repos/${OWNER}/${REPO}/contents/index.html`, 'PUT', JSON.stringify({
    message: 'Add mobile & web license generator tool (index.html)',
    content: base64Content,
    branch: 'main',
    ...(sha ? { sha } : {})
  }));

  if (commitRes.status === 200 || commitRes.status === 201) {
    console.log('✅ index.html committed successfully!');
  } else {
    console.error('Failed to commit index.html:', commitRes.status, commitRes.data);
  }

  // 3. Enable or verify GitHub Pages
  console.log('Configuring GitHub Pages...');
  const pagesRes = await apiRequest(`/repos/${OWNER}/${REPO}/pages`, 'POST', JSON.stringify({
    source: {
      branch: 'main',
      path: '/'
    }
  }));

  if (pagesRes.status === 201) {
    console.log('✅ GitHub Pages enabled successfully!');
    console.log(`🌐 Live URL: https://${OWNER}.github.io/${REPO}/`);
  } else if (pagesRes.status === 409) {
    console.log('ℹ️ GitHub Pages already enabled.');
    console.log(`🌐 Live URL: https://${OWNER}.github.io/${REPO}/`);
  } else {
    // Try GET to see if it's already there
    const getPages = await apiRequest(`/repos/${OWNER}/${REPO}/pages`);
    if (getPages.status === 200 && getPages.data && getPages.data.html_url) {
      console.log(`🌐 Live URL: ${getPages.data.html_url}`);
    } else {
      console.log('Pages response:', pagesRes.status, pagesRes.data);
    }
  }
}

main().catch(err => {
  console.error('Error:', err);
});
