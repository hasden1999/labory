import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getTempFilePath(filename: string): string {
  const tmpDir = process.env.TEMP || process.env.TMP || (os as any)['tmpdir']();
  return [tmpDir, filename].join(path.sep);
}

function resolveScriptPath(): string | null {
  const candidates = [
    'D:\\lab\\apps\\desktop\\services\\whatsappAutoPaste.ps1',
    path.join(process.cwd(), 'apps', 'desktop', 'services', 'whatsappAutoPaste.ps1'),
    path.join(process.cwd(), 'services', 'whatsappAutoPaste.ps1'),
    path.join(process.cwd(), 'scripts', 'whatsappAutoPaste.ps1'),
    path.join(process.cwd(), '..', 'desktop', 'services', 'whatsappAutoPaste.ps1'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sampleId, phone, caption, section, imageBase64, imagesBase64 } = body || {};

    if (!sampleId) {
      return NextResponse.json({ success: false, error: 'معرف العينة مطلوب' }, { status: 400 });
    }

    let cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('07') && cleanPhone.length === 11) {
      cleanPhone = '964' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('7') && cleanPhone.length === 10) {
      cleanPhone = '964' + cleanPhone;
    }

    if (!cleanPhone) {
      return NextResponse.json({ success: false, error: 'رقم هاتف المريض غير صالح' }, { status: 400 });
    }

    const scriptPath = resolveScriptPath();
    if (!scriptPath) {
      return NextResponse.json({ success: false, error: 'ملف سكربت الأتمتة غير موجود على الخادم' }, { status: 500 });
    }

    // 1. Resolve Report Image Buffers (multiple separate images supported)
    const imgBuffers: Buffer[] = [];

    if (Array.isArray(imagesBase64) && imagesBase64.length > 0) {
      for (const raw of imagesBase64) {
        if (typeof raw === 'string' && raw.length > 50) {
          const clean = raw.replace(/^data:image\/\w+;base64,/, '');
          imgBuffers.push(Buffer.from(clean, 'base64'));
        }
      }
    } else if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.length > 100) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      imgBuffers.push(Buffer.from(cleanBase64, 'base64'));
    } else {
      const origin = req.nextUrl.origin || 'http://127.0.0.1:8080';
      const qs = section && section !== 'all' ? `?section=${encodeURIComponent(section)}` : '';
      const imagesUrl = `${origin}/api/samples/${sampleId}/images${qs}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      try {
        const imagesRes = await fetch(imagesUrl, { signal: controller.signal, cache: 'no-store' });
        if (imagesRes.ok) {
          const data = await imagesRes.json();
          if (data && Array.isArray(data.pages) && data.pages.length > 0) {
            for (const p of data.pages) {
              if (p.dataUrl) {
                const clean = p.dataUrl.replace(/^data:image\/\w+;base64,/, '');
                imgBuffers.push(Buffer.from(clean, 'base64'));
              }
            }
          }
        }
      } catch {} finally {
        clearTimeout(timeoutId);
      }

      // Fallback to single image endpoint if /images produced nothing
      if (imgBuffers.length === 0) {
        const singleUrl = `${origin}/api/samples/${sampleId}/image?${qs ? qs.replace('?', '') : 'format=png'}`;
        const sController = new AbortController();
        const sTimeout = setTimeout(() => sController.abort(), 60000);
        const imgRes = await fetch(singleUrl, { signal: sController.signal, cache: 'no-store' }).finally(() => clearTimeout(sTimeout));
        if (imgRes.ok) {
          imgBuffers.push(Buffer.from(await imgRes.arrayBuffer()));
        }
      }
    }

    if (imgBuffers.length === 0) {
      return NextResponse.json({ success: false, error: 'تعذر توليد صور التقرير الطبي' }, { status: 502 });
    }

    const tempPaths: string[] = [];
    const timestamp = Date.now();
    for (let i = 0; i < imgBuffers.length; i++) {
      const p = getTempFilePath(`labryo-wa-${sampleId}-${timestamp}-${i + 1}.png`);
      fs.writeFileSync(p, imgBuffers[i]);
      tempPaths.push(p);
    }

    // 2. Write Caption to temporary UTF-8 file
    let tempCaptionPath = '';
    if (caption && typeof caption === 'string') {
      tempCaptionPath = getTempFilePath(`labryo-wa-cap-${sampleId}-${timestamp}.txt`);
      fs.writeFileSync(tempCaptionPath, caption, 'utf8');
    }

    // 3. Launch PowerShell via exec with multiple image paths
    const combinedPaths = tempPaths.join('|');
    let cmd = `powershell -STA -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${scriptPath}" -Phone "${cleanPhone}" -ImagePath "${tempPaths[0]}" -ImagePaths "${combinedPaths}"`;
    if (tempCaptionPath) {
      cmd += ` -CaptionFile "${tempCaptionPath}"`;
    }

    exec(cmd, { windowsHide: true }, (err) => {
      if (err) {
        console.error('[WhatsAppShareDesktop] exec error:', err);
      }
    });

    const msg = tempPaths.length > 1
      ? `تم فتح تطبيق واتساب لسطح المكتب للمريض ولصق ${tempPaths.length} صور منفصلة مع النص بنجاح. اضغط زر الإرسال في واتساب.`
      : 'تم فتح تطبيق واتساب لسطح المكتب للمريض ولصق صورة التقرير والنص بنجاح. اضغط زر الإرسال في واتساب.';

    return NextResponse.json({
      success: true,
      mode: 'desktop',
      totalImages: tempPaths.length,
      message: msg,
    });
  } catch (err: any) {
    console.error('[WhatsAppShareDesktop] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'فشل تشغيل أتمتة واتساب' }, { status: 500 });
  }
}
