import { NextResponse } from 'next/server';
import { updateManager } from '@/lib/updateManager';

export const dynamic = 'force-dynamic';

// POST: Execute the downloaded installer (.exe) in detached mode
export async function POST() {
  try {
    const result = updateManager.executeInstall();
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to execute installer' },
      { status: 500 }
    );
  }
}
