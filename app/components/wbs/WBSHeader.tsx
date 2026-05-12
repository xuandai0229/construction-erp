'use client';

import { useERPStore } from '@/store/erpStore';
import Header from '@/app/components/Header';

// WBSHeader reuses the shared Header component for consistency.
// The old custom header (with hardcoded dark colors) has been replaced.
export default function WBSHeader() {
  return <Header />;
}
