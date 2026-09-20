import { NextResponse } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';

const CURRENT_VERSION = 'v1.0.8';
const REPO_OWNER = 'hasden1999';
const REPO_NAME = 'lab-releases';

export async function GET() {
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
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(null);
      });
    });

    if (!latestRelease) {
      return NextResponse.json({
        currentVersion: CURRENT_VERSION,
        latestVersion: CURRENT_VERSION,
        hasUpdate: false,
        releaseNotes: 'النظام محدث لآخر إصدار مستقر.',
        downloadUrl: null,
      });
    }

    const latestTag = latestRelease.tag_name || CURRENT_VERSION;
    const hasUpdate = latestTag !== CURRENT_VERSION;
    const exeAsset = latestRelease.assets?.find((a: any) => a.name.endsWith('.exe'));

    return NextResponse.json({
      currentVersion: CURRENT_VERSION,
      latestVersion: latestTag,
      hasUpdate,
      releaseNotes: latestRelease.body || 'تحديثات واستقرار في أداء النظام',
      publishedAt: latestRelease.published_at,
      downloadUrl: exeAsset ? exeAsset.browser_download_url : latestRelease.html_url,
    });
  } catch (error: any) {
    return NextResponse.json({
      currentVersion: CURRENT_VERSION,
      latestVersion: CURRENT_VERSION,
      hasUpdate: false,
      error: error.message,
    });
  }
}
