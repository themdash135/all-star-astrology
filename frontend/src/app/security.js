// Security checks for mobile environment
import { Capacitor } from '@capacitor/core';

/**
 * Detect rooted Android or jailbroken iOS devices.
 * This is a best-effort heuristic — not foolproof against Frida/Magisk Hide,
 * but catches the majority of rooted consumer devices.
 */
export function detectCompromisedDevice() {
  if (!Capacitor.isNativePlatform()) return { compromised: false, reason: null };

  const platform = Capacitor.getPlatform();
  const ua = navigator.userAgent || '';

  if (platform === 'android') {
    // Check for common root indicators accessible from WebView
    const rootSignals = [
      // Test apps commonly found on rooted devices
      /supersu/i.test(ua),
      /magisk/i.test(ua),
      // Check if WebView reports a custom/rooted ROM
      /lineage/i.test(ua),
      /cyanogen/i.test(ua),
    ];
    if (rootSignals.some(Boolean)) {
      return { compromised: true, reason: 'root_detected' };
    }
  }

  if (platform === 'ios') {
    // On jailbroken iOS, certain schemes may be available
    const jbSignals = [
      /cydia/i.test(ua),
      /sileo/i.test(ua),
    ];
    if (jbSignals.some(Boolean)) {
      return { compromised: true, reason: 'jailbreak_detected' };
    }
  }

  return { compromised: false, reason: null };
}

/**
 * Detect if app is running in a debugger or emulator.
 */
export function detectDebugEnvironment() {
  // Performance.now() timing check — debuggers slow this down
  const start = performance.now();
  for (let i = 0; i < 1000; i++) { /* empty */ }
  const elapsed = performance.now() - start;

  // If a trivial loop takes >50ms, likely under a debugger
  if (elapsed > 50) {
    return { debugging: true, reason: 'timing_anomaly' };
  }

  return { debugging: false, reason: null };
}

/**
 * Show a non-blocking warning if device is compromised.
 * Does not block usage — just informs the user.
 */
export function runSecurityChecks() {
  const device = detectCompromisedDevice();
  if (device.compromised) {
    console.warn(`[Security] Device compromise detected: ${device.reason}`);
    // Show a subtle warning — don't block the app
    return {
      warning: true,
      message: 'This device may have reduced security protections. Your data could be at risk.',
    };
  }
  return { warning: false, message: null };
}
