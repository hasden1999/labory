import { NextResponse } from 'next/server';
import https from 'https';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const REPO_OWNER = 'hasden1999';
const REPO_NAME = 'lab-releases';

function getAppVersion(): string {
  if (process.env.LABRYO_APP_VERSION) {
    const v = process.env.LABRYO_APP_VERSION.trim();
    return v.startsWith('v') ? v : `v${v}`;
  }
  try {
    const candidates = [
      path.join(process.cwd(), '..', 'desktop', 'package.json'),
      path.join(process.cwd(), 'apps', 'desktop', 'package.json'),
      path.join(process.cwd(), 'package.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const pkg = JSON.parse(fs.readFileSync(p, 'utf-8'));
        if (pkg.version) {
          return pkg.version.startsWith('v') ? pkg.version : `v${pkg.version}`;
        }
      }
    }
  } catch (e) {}

  return 'v1.0.9';
}

export async function GET() {
  const currentVersion = getAppVersion();

  try {
    const latestRelease = await new Promise<any>((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
        headers: {
          'User-Agent': 'Labryo-LIMS-App',
          'Accept': 'application/vnd.github.v3+json',
        },
      };

      const req = https.get(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              resolve(JSON.parse(data));
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.setTimeout(8000, () => {
        req.destroy();
        resolve(null);
      });
    });

    if (!latestRelease) {
      return NextResponse.json({
        currentVersion,
        latestVersion: currentVersion,
        hasUpdate: false,
        releaseNotes: 'النظام محدث لآخر إصدار مستقر.',
        downloadUrl: null,
      });
    }

    const latestTag = latestRelease.tag_name || currentVersion;
    // Compare versions (hasUpdate is true if latestTag != currentVersion)
    const hasUpdate = latestTag !== currentVersion;
    const exeAsset = latestRelease.assets?.find((a: any) => a.name.endsWith('.exe'));

    return NextResponse.json({
      currentVersion,
      latestVersion: latestTag,
      hasUpdate,
      releaseNotes: latestRelease.body || 'تحديثات واستقرار في أداء النظام',
      publishedAt: latestRelease.published_at,
      downloadUrl: exeAsset ? exeAsset.browser_download_url : latestRelease.html_url,
      assetName: exeAsset?.name || null,
      assetSize: exeAsset?.size || 0,
    });
  } catch (error: any) {
    return NextResponse.json({
      currentVersion,
      latestVersion: currentVersion,
      hasUpdate: false,
      error: error?.message || 'تعذر فحص التحديثات',
    });
  }
}
