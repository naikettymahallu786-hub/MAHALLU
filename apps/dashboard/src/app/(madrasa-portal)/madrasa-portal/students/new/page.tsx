'use client';

import { Suspense } from 'react';
import NewStudentPage from '@/app/(admin)/students/new/page';

export default function MadrasaPortalNewStudentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading form...</div>}>
      <NewStudentPage />
    </Suspense>
  );
}
