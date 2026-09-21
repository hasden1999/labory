import { NextRequest, NextResponse } from 'next/server';
import { updateManager } from '@/lib/updateManager';

export const dynamic = 'force-dynamic';

// GET: Returns current in-app download progress & state
export async function GET() {
  try {
    const state = updateManager.getState();
    return NextResponse.json(state);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch download state' },
      { status: 500 }
    );
  }
}

// POST: Triggers or resumes in-app download
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { downloadUrl, version } = body;

    if (!downloadUrl) {
      return NextResponse.json(
        { error: 'Missing downloadUrl parameter' },
        { status: 400 }
      );
    }

    const state = await updateManager.startDownload(downloadUrl, version || 'latest');
    return NextResponse.json(state);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to start download' },
      { status: 500 }
    );
  }
}

// DELETE: Pause or cancel active download
export async function DELETE() {
  try {
    const state = updateManager.pauseOrCancel();
    return NextResponse.json(state);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to pause download' },
      { status: 500 }
    );
  }
}
