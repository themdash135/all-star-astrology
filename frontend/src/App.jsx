import React, { useEffect, useState } from 'react';

import { BLANK, FORM_KEY, MOTION_KEY, ORACLE_HISTORY_KEY, RESULT_KEY, SPLASH_KEY, THEME_KEY } from './app/constants.js';
import { apiPost } from './app/api.js';
import { styles } from './app/styles.js';
import { readStoredForm, readStoredResult, safeGet, safeRemove, safeSet } from './app/storage.js';
import { useMotionMode } from './hooks/useMotionMode.js';
import { LoadingOverlay } from './components/LoadingOverlay.jsx';
import { OnboardingScreen } from './components/OnboardingScreen.jsx';
import { OracleScreen } from './components/OracleScreen.jsx';
import { SplashScreen } from './components/SplashScreen.jsx';
import {
  BottomNav,
  CombinedSystemsContent,
  ProfileContent,
} from './components/MainViews.jsx';
import { ReadingsScreen } from './components/ReadingsScreen.jsx';
import { GamesScreen } from './components/GamesScreen.jsx';
import { SystemApp } from './components/SystemApp.jsx';

export default function App() {
  const [view, setView] = useState('splash');
  const [tab, setTab] = useState('oracle');
  const [detailSystem, setDetailSystem] = useState(null);
  const [form, setForm] = useState(() => readStoredForm());
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => safeGet(THEME_KEY) || 'dark');
  const { motionSetting, setMotionSetting, reducedMotion } = useMotionMode();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = theme === 'light' ? '#FAF6F0' : '#080D1A';
    }
    safeSet(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-motion', reducedMotion ? 'reduce' : 'full');
  }, [reducedMotion]);

  useEffect(() => {
    const splashSeen = safeGet(SPLASH_KEY);
    const stored = readStoredResult();
    if (stored) {
      setResult(stored);
      setView('main');
    } else if (splashSeen) {
      setView('onboarding');
    }
  }, []);

  useEffect(() => {
    safeSet(FORM_KEY, JSON.stringify(form));
  }, [form]);

  function handleSplash() {
    safeSet(SPLASH_KEY, '1');
    setView('onboarding');
  }

  function handleRestore() {
    safeSet(SPLASH_KEY, '1');
    const stored = readStoredResult();
    if (stored) {
      setResult(stored);
      setView('main');
    } else {
      setView('onboarding');
    }
  }

  async function handleGenerate() {
    setError('');
    setLoading(true);

    try {
      const payload = await apiPost('reading', form);

      setResult(payload);
      safeSet(RESULT_KEY, JSON.stringify(payload));
      setView('main');
      setTab('oracle');
      setDetailSystem(null);
    } catch (err) {
      setError(err.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit() {
    setView('onboarding');
    setDetailSystem(null);
  }

  function handleReset() {
    if (!window.confirm('This will clear all your saved data. Continue?')) {
      return;
    }

    safeRemove(FORM_KEY);
    safeRemove(RESULT_KEY);
    safeRemove(SPLASH_KEY);
    safeRemove(THEME_KEY);
    safeRemove(MOTION_KEY);
    safeRemove(ORACLE_HISTORY_KEY);
    setResult(null);
    setForm({ ...BLANK });
    setTheme('dark');
    setMotionSetting('system');
    setView('splash');
  }

  function handleTab(nextTab) {
    setDetailSystem(null);
    setSettingsOpen(false);
    setTab(nextTab);
  }

  if (view === 'splash') {
    return (
      <>
        <style>{styles}</style>
        <SplashScreen onStart={handleSplash} onRestore={handleRestore} />
      </>
    );
  }

  if (view === 'onboarding') {
    return (
      <>
        <style>{styles}</style>
        {loading && <LoadingOverlay />}
        <OnboardingScreen
          form={form}
          setForm={setForm}
          onSubmit={handleGenerate}
          loading={loading}
          error={error}
          theme={theme}
          setTheme={setTheme}
        />
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="shell">
        <div className="scroll-area">
          {detailSystem ? (
            <SystemApp
              systemId={detailSystem}
              result={result}
              form={form}
              onBack={() => setDetailSystem(null)}
            />
          ) : settingsOpen ? (
            <ProfileContent
              form={form}
              result={result}
              onEdit={handleEdit}
              onReset={handleReset}
              theme={theme}
              setTheme={setTheme}
              motionSetting={motionSetting}
              setMotionSetting={setMotionSetting}
              onBack={() => setSettingsOpen(false)}
            />
          ) : tab === 'oracle' ? (
            <OracleScreen result={result} form={form} reducedMotion={reducedMotion} onOpenSettings={() => setSettingsOpen(true)} />
          ) : tab === 'combined-systems' ? (
            <CombinedSystemsContent result={result} onSystemTap={setDetailSystem} />
          ) : tab === 'games' ? (
            <GamesScreen form={form} onNavigate={(target) => { if (target === 'oracle') { handleTab('oracle'); } else { handleTab('combined-systems'); } }} />
          ) : tab === 'readings' ? (
            <ReadingsScreen form={form} onSystemTap={setDetailSystem} />
          ) : null}
        </div>
        <BottomNav active={detailSystem || settingsOpen ? null : tab} onChange={handleTab} />
      </div>
    </>
  );
}
