export function normalizeMotionSetting(value) {
  return ['system', 'reduce', 'full'].includes(value) ? value : 'system';
}

export function shouldReduceMotion(setting, prefersReduced) {
  return setting === 'reduce' || (setting === 'system' && prefersReduced);
}
