'use client';

import React from 'react';
import { SensorsGrid } from '@/src/components/SensorsGrid';

export default function SensorsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-serif italic tracking-tight">Sensor Matrix</h2>
        <p className="text-muted-foreground">Surveillance en temps réel de tous les capteurs déployés.</p>
      </div>
      <SensorsGrid />
    </div>
  );
}
