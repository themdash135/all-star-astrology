import { BLANK, FORM_KEY, ORACLE_HISTORY_KEY, RESULT_KEY } from './constants.js';

export function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function readStoredForm() {
  let raw = safeGet(FORM_KEY);
  if (!raw) {
    raw = safeGet('astrofusion-form-v1');
    if (raw) {
      safeSet(FORM_KEY, raw);
    }
  }

  if (!raw) {
    return { ...BLANK };
  }

  try {
    return { ...BLANK, ...JSON.parse(raw) };
  } catch {
    return { ...BLANK };
  }
}

export function readStoredResult() {
  const raw = safeGet(RESULT_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readStoredOracleHistory() {
  const raw = safeGet(ORACLE_HISTORY_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
