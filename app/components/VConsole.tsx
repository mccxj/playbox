'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    vConsoleInstance?: import('vconsole').default;
  }
}

export default function VConsole() {
  useEffect(() => {
    if (typeof window === 'undefined' || window.vConsoleInstance) return;

    import('vconsole').then(({ default: VConsole }) => {
      window.vConsoleInstance = new VConsole({ maxLogNumber: 1000 });
    });

    return () => {
      window.vConsoleInstance?.destroy();
      delete window.vConsoleInstance;
    };
  }, []);

  return null;
}
