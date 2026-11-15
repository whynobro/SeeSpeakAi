'use client';

import { useEffect, useState } from 'react';
import { PageHeader, Screen } from '@/components/PageHeader';
import { Button } from '@/components/ui';

/** Remove every SeeSpeak key from one storage area. Safe when storage is blocked. */
function clearArea(area: Storage | undefined): number {
  if (!area) return 0;
  const keys: string[] = [];
  for (let i = 0; i < area.length; i++) {
    const key = area.key(i);
    if (key && key.toLowerCase().startsWith('seespeak')) keys.push(key);
  }
  keys.forEach((key) => area.removeItem(key));
  return keys.length;
}

/**
 * Start over: clears the hearing check, plan, practice history, settings and tester nickname saved on this
 * device, so the next person starts fresh. Everything lives on the device, so this is all there is to clear.
 */
export default function ResetPage() {
  const [cleared, setCleared] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      let n = 0;
      try {
        n += clearArea(window.localStorage);
        n += clearArea(window.sessionStorage);
      } catch {
        // Storage blocked: nothing was saved, so there is nothing to clear.
      }
      setCleared(n);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Screen>
      <PageHeader title="Start over" />
      <p role="status" className="text-lg">
        {cleared === null
          ? 'Clearing this device...'
          : 'Done. Everything saved on this device is cleared: hearing check, plan, practice and progress.'}
      </p>
      <Button href="/" size="lg">
        Start from the beginning
      </Button>
    </Screen>
  );
}
