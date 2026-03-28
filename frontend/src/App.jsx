import React, { useEffect, useCallback, useState } from 'react';
import { App as CapApp } from '@capacitor/app';

import { BLANK, FORM_KEY, MOTION_KEY, ORACLE_HISTORY_KEY, RESULT_KEY, SPLASH_KEY, THEME_KEY } from './app/constants.js';
import { apiPost, apiGet, trackEvent } from './app/api.js';
import { runSecurityChecks } from './app/security.js';
import { styles } from './app/styles.js';
import { isValidReading, readStoredForm, readStoredResult, safeGet, safeRemove, safeSet } from './app/storage.js';
import { useMotionMode } from './hooks/useMotionMode.js';
import { LoadingOverlay } from './components/LoadingOverlay.jsx';
import { OnboardingScreen } from './components/OnboardingScreen.jsx';
import { OracleScreen } from './components/OracleScreen.jsx';
import { SplashScreen } from './components/SplashScreen.jsx';
import {
  BottomNav,
  ProfileContent,
} from './components/MainViews.jsx';
import { ReadingsScreen } from './components/ReadingsScreen.jsx';
import { FeedbackScreen } from './components/FeedbackScreen.jsx';
import { WhatsNew } from './components/WhatsNew.jsx';
import { GamesScreen } from './components/GamesScreen.jsx';
import { SystemApp } from './components/SystemApp.jsx';
import { TodayTab } from './components/TodayTab.jsx';
import { SystemsTabV2 } from './components/SystemsTabV2.jsx';
import { FullCombinedAnalysis } from './components/FullCombinedAnalysis.jsx';
import AdminApp from './components/AdminApp.jsx';

export default function App() {
  const _AH = '#a9fK3x7q';
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === _AH);
  const [view, setView] = useState('splash');
  const [tab, setTab] = useState('today');
  const [detailSystem, setDetailSystem] = useState(null);
  const [form, setForm] = useState(() => readStoredForm());
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [securityWarning, setSecurityWarning] = useState(null);

  useEffect(() => {
    const check = runSecurityChecks();
    if (check.warning) setSecurityWarning(check.message);
  }, []);

  useEffect(() => {
    const onHash = () => setIsAdmin(window.location.hash === _AH);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => safeGet(THEME_KEY) || 'dark');
  const { motionSetting, setMotionSetting, reducedMotion } = useMotionMode();
  const [temporal, setTemporal] = useState(null);
  const [scores, setScores] = useState(null);

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

  // Fetch temporal data on load
  useEffect(() => {
    apiGet('v2/temporal').then(setTemporal).catch(() => {});
  }, []);

  // Fetch scores when result is available
  useEffect(() => {
    if (result) {
      apiPost('v2/scores', { reading_data: result }).then(setScores).catch(() => {});
    }
  }, [result]);

  useEffect(() => {
    safeSet(FORM_KEY, JSON.stringify(form));
  }, [form]);

  const handleBackButton = useCallback(() => {
    if (view === 'onboarding' && result) { setView('main'); return; }
    if (view !== 'main') return;
    if (detailSystem) { setDetailSystem(null); return; }
    if (settingsOpen) { setSettingsOpen(false); return; }
    if (tab === 'analysis') { setTab('today'); return; }
    if (tab !== 'today') { setTab('today'); return; }
    CapApp.minimizeApp();
  }, [view, detailSystem, settingsOpen, tab]);

  useEffect(() => {
    const listener = CapApp.addListener('backButton', handleBackButton);
    return () => { listener.then(l => l.remove()); };
  }, [handleBackButton]);

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

      if (!isValidReading(payload)) {
        throw new Error('Received an incomplete reading. Please try again.');
      }

      setResult(payload);
      safeSet(RESULT_KEY, JSON.stringify(payload));
      trackEvent('reading_complete');
      setView('main');
      setTab('today');
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
    setTemporal(null);
    setScores(null);
    setView('splash');
  }

  function handleTab(nextTab) {
    setDetailSystem(null);
    setSettingsOpen(false);
    setTab(nextTab);
    trackEvent('section_view', { section: nextTab });
  }

  if (isAdmin) {
    return (
      <>
        <style>{styles}</style>
        <AdminApp />
      </>
    );
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
          onCancel={result ? () => { setView('main'); } : undefined}
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
      {securityWarning && (
        <div style={{position:'fixed',top:0,left:0,right:0,zIndex:9999,background:'#b91c1c',color:'#fff',padding:'8px 16px',fontSize:'13px',textAlign:'center'}} onClick={() => setSecurityWarning(null)}>
          {securityWarning} <span style={{opacity:0.7}}>(tap to dismiss)</span>
        </div>
      )}
      <WhatsNew />
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
          ) : tab === 'today' ? (
            <TodayTab result={result} temporal={temporal} scores={scores} onOpenSettings={() => setSettingsOpen(true)} onAnalysis={() => setTab('analysis')} />
          ) : tab === 'systems' ? (
            <SystemsTabV2 result={result} />
          ) : tab === 'oracle' ? (
            <OracleScreen result={result} form={form} reducedMotion={reducedMotion} />
          ) : tab === 'analysis' ? (
            <FullCombinedAnalysis result={result} form={form} onBack={() => handleTab('today')} />
          ) : tab === 'games' ? (
            <GamesScreen form={form} onNavigate={(target) => { if (target === 'oracle') { handleTab('oracle'); } else if (target === 'combined' || target === 'analysis' || target === 'combined-systems') { setTab('analysis'); } else { handleTab('systems'); } }} />
          ) : tab === 'readings' ? (
            <ReadingsScreen form={form} onSystemTap={setDetailSystem} />
          ) : tab === 'feedback' ? (
            <FeedbackScreen />
          ) : null}
        </div>
        <BottomNav active={detailSystem || settingsOpen ? null : tab} onChange={handleTab} />
      </div>
    </>
  );
}
