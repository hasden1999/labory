'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { useUnifiedWorkspace, UnifiedWorkspace } from '../widgets/unified-workspace';

function IntakePageContent() {
  const workspace = useUnifiedWorkspace();
  return <UnifiedWorkspace workspace={workspace} />;
}

export default function IntakePage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          Loading Clinical Intake Console...
        </div>
      }
    >
      <IntakePageContent />
    </Suspense>
  );
}
