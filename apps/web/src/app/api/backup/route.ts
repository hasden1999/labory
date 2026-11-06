import { NextResponse } from 'next/server';
import {
  createBackupSnapshot,
  listBackupSnapshots,
  restoreBackupFromFile,
  getStore,
} from '../../../lib/serverStore';
import { isLocalLoopbackRequest, forbiddenLoopbackResponse } from '../../../lib/backupSecurity';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_DIR = process.env.LABRYO_DATA_DIR
  ? path.resolve(process.env.LABRYO_DATA_DIR)
  : process.env.VERCEL
    ? path.join('/tmp', 'labryo_data')
    : path.resolve(
        process.cwd().includes('apps')
          ? process.cwd()
          : path.join(process.cwd(), 'apps', 'web'),
        'data'
      );
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

function resolveSafeBackupPath(fileName: string): string | null {
  const clean = path.basename(String(fileName || '').trim());
  if (!clean || !clean.endsWith('.json') || clean.includes('..')) return null;
  const fullPath = path.join(BACKUP_DIR, clean);
  if (!fs.existsSync(fullPath)) return null;
  return fullPath;
}

export async function POST(request: Request) {
  try {
    if (!isLocalLoopbackRequest(request)) {
      return forbiddenLoopbackResponse();
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    // Support restoring a specific snapshot by fileName cleanly without touching /api/backup/restore
    if (body?.action === 'restore' && body?.fileName) {
      const fullPath = resolveSafeBackupPath(body.fileName);
      if (!fullPath) {
        return NextResponse.json(
          { success: false, message: 'ملف النسخة الاحتياطية المطلوب غير موجود' },
          { status: 404 }
        );
      }
      const jsonContent = fs.readFileSync(fullPath, 'utf-8');
      const result = restoreBackupFromFile(jsonContent);
      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json(result);
    }

    const label = body?.label || '';
    const fileName = createBackupSnapshot(label || 'user_manual');
    const snapshots = listBackupSnapshots();
    const snap = snapshots.find((s) => s.fileName === fileName) || {
      fileName,
      sizeBytes: 0,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      backup: snap,
      fileName: snap.fileName,
      sizeBytes: snap.sizeBytes,
      createdAt: snap.createdAt,
      message: 'تم إنشاء النسخة الاحتياطية بنجاح',
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'فشل إنشاء النسخة الاحتياطية: ' + (err?.message || ''),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  if (!isLocalLoopbackRequest(request)) {
    return forbiddenLoopbackResponse();
  }

  try {
    const url = new URL(request.url);
    const fileNameParam = url.searchParams.get('fileName');
    const downloadParam = url.searchParams.get('download');

    if (fileNameParam) {
      const fullPath = resolveSafeBackupPath(fileNameParam);
      if (!fullPath) {
        return NextResponse.json(
          { success: false, message: 'ملف النسخة الاحتياطية غير موجود' },
          { status: 404 }
        );
      }
      const content = fs.readFileSync(fullPath, 'utf-8');
      const cleanName = path.basename(fullPath);
      if (downloadParam === '1') {
        return new NextResponse(content, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(cleanName)}"`,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        });
      }
      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    const snapshots = listBackupSnapshots();
    return NextResponse.json(snapshots);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'فشل جلب قائمة النسخ الاحتياطية: ' + (err?.message || ''),
      },
      { status: 500 }
    );
  }
}
