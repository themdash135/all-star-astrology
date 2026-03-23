import { useEffect, useState } from 'react';

import { MOTION_KEY } from '../app/constants.js';
import { normalizeMotionSetting, shouldReduceMotion } from '../app/motion.js';
import { safeGet, safeSet } from '../app/storage.js';

export function useMotionMode() {
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [motionSetting, setMotionSetting] = useState(() => normalizeMotionSetting(safeGet(MOTION_KEY)));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setPrefersReduced(mediaQuery.matches);

    syncPreference();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncPreference);
      return () => mediaQuery.removeEventListener('change', syncPreference);
    }

    mediaQuery.addListener(syncPreference);
    return () => mediaQuery.removeListener(syncPreference);
  }, []);

  useEffect(() => {
    safeSet(MOTION_KEY, motionSetting);
  }, [motionSetting]);

  return {
    motionSetting,
    setMotionSetting,
    reducedMotion: shouldReduceMotion(motionSetting, prefersReduced),
  };
}
