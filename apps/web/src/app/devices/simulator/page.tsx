'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MindrayBc30Simulator from '../../../components/devices/MindrayBc30Simulator';

export default function MindraySimulatorPage() {
  const router = useRouter();

  return (
    <MindrayBc30Simulator
      onClose={() => router.push('/devices')}
      onOpenSampleInReception={(sampleNumber) => {
        router.push(`/patients?sampleNumber=${sampleNumber}`);
      }}
    />
  );
}
