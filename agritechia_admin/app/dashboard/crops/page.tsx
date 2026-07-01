'use client';

import React from 'react';
import { CropsList } from '@/src/components/CropsList';

export default function CropsPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CropsList />
    </div>
  );
}
