export const styles = `
/* ── Theme Variables ── */
:root, [data-theme="dark"] {
  /* ── Color palette ── */
  --bg: #080D1A;
  --bg2: rgba(255,255,255,0.035);
  --glass-bg: rgba(255,255,255,0.035);
  --glass-border: rgba(255,255,255,0.06);
  --glass-shadow: 0 2px 16px rgba(0,0,0,0.18);
  --glass-glow: inset 0 0.5px 0 0 rgba(255,255,255,0.04);
  --text: #E8ECF4;
  --muted: #7a8baa;
  --gold: #D4A574;
  --accent: #7B8CDE;
  --teal: #5BA89D;
  --coral: #F87171;
  --oracle-particle: rgba(212,165,116,.92);
  --oracle-particle-shadow: 0 0 10px rgba(212,165,116,.28);
  --nav-bg: rgba(8,13,26,0.95);
  --input-bg: rgba(15,23,42,0.5);
  --overlay-bg: rgba(8,13,26,0.96);
  --detail-hd-bg: rgba(8,13,26,0.92);
  --body-bg: radial-gradient(ellipse at 50% 0%, #131f3d 0%, #080D1A 60%);

  /* ── Spacing scale (4px base) ── */
  --sp-xs: 4px;
  --sp-sm: 8px;
  --sp-md: 12px;
  --sp-lg: 16px;
  --sp-xl: 20px;
  --sp-2xl: 24px;
  --sp-3xl: 32px;
  --sp-4xl: 40px;
  --sp-5xl: 48px;

  /* ── Typography scale ── */
  --fs-xs: .65rem;
  --fs-sm: .75rem;
  --fs-base: .85rem;
  --fs-md: .95rem;
  --fs-lg: 1.1rem;
  --fs-xl: 1.3rem;
  --fs-2xl: 1.6rem;
  --fs-3xl: 2rem;

  /* ── Radius scale ── */
  --r-sm: 10px;
  --r-md: 14px;
  --r-lg: 18px;
  --r-xl: 22px;
  --r-full: 999px;

  /* ── Shadows ── */
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.12);
  --shadow-md: 0 2px 12px rgba(0,0,0,0.16);
  --shadow-lg: 0 4px 24px rgba(0,0,0,0.22);
  --shadow-glow: 0 0 20px rgba(212,165,116,.12);

  /* ── Animation ── */
  --ease-out: cubic-bezier(.22, 1, .36, 1);
  --ease-spring: cubic-bezier(.34, 1.56, .64, 1);
  --ease-smooth: cubic-bezier(.4, 0, .2, 1);
  --dur-fast: 150ms;
  --dur-normal: 250ms;
  --dur-slow: 400ms;

  /* ── Layout ── */
  --nav-h: 58px;
  --safe-top: max(env(safe-area-inset-top, 0px), 14px);
  --page-top-pad: calc(24px + var(--safe-top));
  --page-x: 22px;
  --sans: -apple-system, 'SF Pro Display', 'DM Sans', system-ui, sans-serif;
  --serif: 'Playfair Display', Georgia, serif;
  --mono: 'SF Mono', 'Menlo', 'Consolas', monospace;

  /* ── V2 bridge variables ── */
  --surface: rgba(255,255,255,0.05);
  --text-secondary: #A0AECA;
  --text-muted: #7a8baa;
  --positive: #5BA89D;
  --negative: #F87171;
  --neutral: #7a8baa;
  --border: rgba(255,255,255,0.08);
  --border-light: rgba(255,255,255,0.04);
  --v2-r: 8px;
  --v2-r-lg: 12px;

  /* ── System accent colors ── */
  --sys-western: #6B8CFF;
  --sys-vedic: #FF9B5E;
  --sys-chinese: #FF6B6B;
  --sys-bazi: #5ECC8F;
  --sys-numerology: #B47EFF;
  --sys-kabbalistic: #FFD76B;
  --sys-gematria: #7BE0E0;
  --sys-persian: #E07BB4;
}

[data-theme="light"] {
  --bg: #FAF6F0;
  --bg2: rgba(0,0,0,0.02);
  --glass-bg: rgba(255,255,255,0.72);
  --glass-border: rgba(0,0,0,0.06);
  --glass-shadow: 0 1px 8px rgba(0,0,0,0.05);
  --glass-glow: none;
  --text: #1A1A2E;
  --muted: #6B7280;
  --gold: #B8896A;
  --accent: #6B7BC0;
  --teal: #4A9488;
  --coral: #DC4E4E;
  --oracle-particle: rgba(167,112,73,.98);
  --oracle-particle-shadow: 0 0 12px rgba(167,112,73,.35), 0 0 22px rgba(107,123,192,.16);
  --nav-bg: rgba(250,246,240,0.95);
  --input-bg: rgba(0,0,0,0.035);
  --overlay-bg: rgba(250,246,240,0.97);
  --detail-hd-bg: rgba(250,246,240,0.92);
  --body-bg: linear-gradient(180deg, #FAF6F0 0%, #F0EBE3 100%);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.08);
  --shadow-lg: 0 4px 16px rgba(0,0,0,0.1);
  --shadow-glow: 0 0 16px rgba(184,137,106,.08);

  /* ── V2 bridge variables (light) ── */
  --surface: #FFFFFF;
  --text-secondary: #6B6B63;
  --text-muted: #9C9C94;
  --positive: #1A7A6D;
  --negative: #C4402F;
  --neutral: #8A8A80;
  --border: rgba(0,0,0,0.08);
  --border-light: rgba(0,0,0,0.04);
  --v2-r: 8px;
  --v2-r-lg: 12px;
  --sys-western: #4A6FA5;
  --sys-vedic: #C47F17;
  --sys-chinese: #B83A3A;
  --sys-bazi: #2E7D5B;
  --sys-numerology: #7B5EA7;
  --sys-kabbalistic: #3366A0;
  --sys-gematria: #6B4D8A;
  --sys-persian: #CC6B2E;
}

/* ── Reset ── */
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
html, body, #root { height: 100%; background: var(--bg); color: var(--text); overflow-x: hidden; font-family: var(--sans); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
body { overscroll-behavior: none; -webkit-overflow-scrolling: touch; background: var(--body-bg); line-height: 1.5; letter-spacing: -0.01em; }
button { font-family: var(--sans); border: 0; cursor: pointer; background: none; color: inherit; letter-spacing: inherit; }
input { font-family: var(--sans); letter-spacing: inherit; }
.serif { font-family: var(--serif); }
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

button:focus-visible,
input:focus-visible,
[role="button"]:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 3px;
}

/* ── Glass ── */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-sm);
}

/* ── Animations ── */
@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
@keyframes staggerIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
@keyframes starPulse { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
@keyframes drawLine { from{stroke-dashoffset:200} to{stroke-dashoffset:0} }
@keyframes spin { to{transform:rotate(360deg)} }
@keyframes barScale { from{transform:scaleX(0)} to{transform:scaleX(1)} }
@keyframes drift { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.8;transform:scale(1.3)} }
@keyframes orbPulse { 0%,100%{box-shadow:0 0 40px rgba(212,165,116,.3),0 0 80px rgba(212,165,116,.1);transform:scale(1)} 50%{box-shadow:0 0 60px rgba(212,165,116,.5),0 0 120px rgba(212,165,116,.2);transform:scale(1.08)} }
@keyframes msgFade { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
@keyframes oracleDrift {
  0%,100% { opacity:.14; transform:translate3d(0, 0, 0) scale(1); }
  25% { opacity:.45; transform:translate3d(4px, -7px, 0) scale(1.2); }
  50% { opacity:.22; transform:translate3d(-3px, 5px, 0) scale(1); }
  75% { opacity:.55; transform:translate3d(6px, 3px, 0) scale(1.3); }
}
@keyframes sentenceReveal { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
@keyframes iconBreathe { 0%,100% { transform:scale(1); } 50% { transform:scale(1.08); } }
@keyframes twinkle { 0%,100% { opacity:.35; } 50% { opacity:.9; } }
@keyframes gradientRotate { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }

.fade-in { animation: fadeIn .35s var(--ease-smooth) both; }
.stagger { animation: staggerIn .3s var(--ease-smooth) both; }
.bar-anim { transform-origin: left; animation: barScale .6s var(--ease-out) both; }

[data-motion="reduce"] *,
[data-motion="reduce"] *::before,
[data-motion="reduce"] *::after {
  animation-duration: .01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: .01ms !important;
  scroll-behavior: auto !important;
}

/* ── Screen base ── */
.screen { display:flex; flex-direction:column; min-height:100vh; min-height:100dvh; padding:var(--safe-top) var(--page-x) 0; position:relative; }

/* ── Splash ── */
.splash { align-items:center; justify-content:center; background: var(--body-bg); overflow:hidden; }
.splash-bg { position:absolute; inset:0; pointer-events:none; }
.bg-star { position:absolute; border-radius:50%; background:var(--gold); animation:drift 4s ease-in-out infinite; }
.constellation { width:180px; height:180px; margin-bottom:24px; position:relative; z-index:1; }
.star-dot { animation:starPulse 3.5s ease-in-out infinite; transform-origin:center; transform-box:fill-box; }
.cline { stroke-dasharray:200; stroke-dashoffset:200; animation:drawLine 1.8s ease forwards; }
.splash-orb {
  width:72px; height:72px; border-radius:50%; position:relative; z-index:1;
  background:radial-gradient(circle, rgba(212,165,116,.2), rgba(212,165,116,.04));
  animation:orbPulse 5s ease-in-out infinite; margin-bottom:var(--sp-3xl);
}
.splash-text { text-align:center; margin-bottom:var(--sp-5xl); position:relative; z-index:1; }
.splash-text h1 { font-family:var(--serif); font-size:var(--fs-3xl); font-weight:700; color:var(--gold); margin-bottom:var(--sp-sm); letter-spacing:-.02em; }
.splash-text p { color:var(--muted); font-size:var(--fs-md); letter-spacing:.01em; }
.splash-actions { position:absolute; bottom:max(env(safe-area-inset-bottom,28px),28px); left:28px; right:28px; display:flex; flex-direction:column; align-items:center; gap:16px; z-index:1; }
.splash-actions .btn-gold { max-width:320px; }
.splash-link { color:var(--muted); font-size:.88rem; font-weight:500; min-height:48px; display:flex; align-items:center; }
.splash-link:active { color:var(--gold); }

/* ── Buttons ── */
.btn-gold {
  display:block; width:100%; min-height:50px; border-radius:var(--r-md);
  background:linear-gradient(135deg, #D4A574, #c4956a);
  color:#0B1121; font-size:var(--fs-md); font-weight:600; letter-spacing:.01em;
  transition:transform var(--dur-fast) var(--ease-smooth), opacity var(--dur-fast);
  box-shadow:0 2px 12px rgba(212,165,116,.18);
}
.btn-gold:active { transform:scale(.975); opacity:.9; }
.btn-gold:disabled { opacity:.45; cursor:wait; }
.btn-ghost { min-height:44px; padding:0 var(--sp-xl); border-radius:var(--r-md); color:var(--muted); font-size:var(--fs-base); font-weight:600; }
.btn-ghost:active { opacity:.6; }
.btn-danger { display:block; width:100%; min-height:44px; border-radius:var(--r-md); color:#ef4444; font-size:var(--fs-base); font-weight:600; margin-top:var(--sp-md); background:rgba(239,68,68,.06); border:1px solid rgba(239,68,68,.12); }

/* ── Onboarding ── */
.ob-screen { justify-content:center; background:var(--bg); padding-top:var(--sp-3xl); padding-bottom:var(--sp-3xl); position:relative; }
.ob-cancel { position:absolute; top:var(--sp-md); left:var(--sp-md); background:none; border:none; color:var(--acc); font:var(--font-sm)/1 var(--ff); cursor:pointer; z-index:2; padding:var(--sp-xs) var(--sp-sm); }
.ob-dots { display:flex; gap:var(--sp-sm); justify-content:center; padding:var(--sp-xl) 0 var(--sp-md); position:absolute; top:0; left:0; right:0; }
.ob-dot { width:6px; height:6px; border-radius:var(--r-full); background:rgba(255,255,255,.1); transition:all .3s var(--ease-smooth); }
[data-theme="light"] .ob-dot { background:rgba(0,0,0,.1); }
.ob-dot--active { background:var(--gold); }
.ob-dot--current { width:20px; border-radius:3px; }
.ob-body { flex:1; display:flex; flex-direction:column; justify-content:center; gap:var(--sp-xl); animation:fadeIn .35s var(--ease-smooth); }
.ob-q { font-size:var(--fs-2xl); font-weight:700; line-height:1.25; text-align:center; letter-spacing:-.02em; }
.ob-inp {
  width:100%; min-height:48px; background:var(--input-bg); color:var(--text);
  border:1px solid var(--glass-border); border-radius:var(--r-md); padding:var(--sp-lg);
  font-size:var(--fs-md); outline:none; backdrop-filter:blur(12px);
  transition:border-color var(--dur-normal), box-shadow var(--dur-normal);
}
.ob-inp:focus { border-color:var(--gold); box-shadow:0 0 0 3px rgba(212,165,116,.08); }
.ob-inp--sm { min-height:44px; font-size:var(--fs-base); }
.ob-sublabel { color:var(--muted); font-size:var(--fs-base); margin-top:2px; }
.ob-foot { display:flex; gap:var(--sp-md); padding:var(--sp-lg) 0 max(env(safe-area-inset-bottom,16px),16px); }
.ob-foot .btn-gold { flex:1; }
.ob-err { padding:var(--sp-md) var(--sp-lg); border-radius:var(--r-md); background:rgba(239,68,68,.06); border:1px solid rgba(239,68,68,.12); color:#fca5a5; font-size:var(--fs-base); text-align:center; }
.ob-hint { font-size:var(--fs-sm); color:var(--muted); text-align:center; margin:0 0 var(--sp-md); line-height:1.4; }
.ob-date-row { display:flex; gap:var(--sp-sm); width:100%; }
.ob-sel { appearance:none; -webkit-appearance:none; padding:var(--sp-md) var(--sp-lg); text-align:center; cursor:pointer; flex:1; }
.ob-sel--narrow { flex:0.6; }
.ob-gps-btn { width:100%; padding:12px; border-radius:12px; border:1px dashed var(--gold); background:transparent; color:var(--gold); font-size:.88rem; font-family:inherit; cursor:pointer; margin-top:10px; transition:all .2s; }
.ob-gps-btn:active { transform:scale(.97); background:rgba(212,165,116,.08); }
.ob-gps-btn:disabled { opacity:.5; cursor:default; }
.ob-gps-err { font-size:.78rem; color:#fca5a5; text-align:center; margin-top:6px; }

/* ── Theme picker ── */
.theme-picker { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.theme-card { border-radius:18px; padding:18px; display:flex; flex-direction:column; align-items:center; gap:10px; transition:transform .15s, border-color .2s; }
.theme-card:active { transform:scale(.96); }
.theme-card--active { border-color:var(--gold); box-shadow:0 0 0 2px var(--gold), var(--glass-shadow); }
.tp-preview { width:100%; height:80px; border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:8px; }
.tp-preview--dark { background:#0B1121; }
.tp-preview--light { background:#FAF6F0; }
.tp-bar { height:6px; border-radius:3px; width:70%; }
.tp-preview--dark .tp-bar { background:rgba(255,255,255,.12); }
.tp-preview--light .tp-bar { background:rgba(0,0,0,.08); }
.tp-bar--short { width:45%; }
.tp-row { display:flex; gap:4px; margin-top:auto; }
.tp-dot { width:8px; height:8px; border-radius:50%; }
.tp-preview--dark .tp-dot { background:#D4A574; }
.tp-preview--light .tp-dot { background:#B8896A; }
.tp-dot--accent { background:#7B8CDE !important; }
.tp-label { font-weight:700; font-size:.95rem; }
.tp-desc { font-size:.78rem; color:var(--muted); }

/* ── Autocomplete ── */
.ac-wrap { position:relative; }
.ac-list { position:absolute; top:100%; left:0; right:0; z-index:20; border-radius:0 0 14px 14px; overflow:hidden; margin-top:-1px; }
.ac-item { display:block; width:100%; text-align:left; padding:14px 16px; color:var(--text); font-size:.95rem; border-bottom:1px solid var(--glass-border); min-height:48px; }
.ac-item:last-child { border-bottom:0; }
.ac-item:active { background:rgba(212,165,116,.08); }

/* ── Loading overlay ── */
.loading-ov { position:fixed; inset:0; z-index:200; background:var(--overlay-bg); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:var(--sp-2xl); }
.ld-orb {
  width:56px; height:56px; border-radius:50%;
  background:radial-gradient(circle, rgba(212,165,116,.2), rgba(212,165,116,.05));
  animation:orbPulse 3s ease-in-out infinite;
}
.ld-msg { color:var(--muted); font-size:var(--fs-md); font-family:var(--serif); font-style:italic; animation:msgFade .3s var(--ease-smooth) both; text-align:center; }
.ld-progress { width:140px; height:2px; border-radius:1px; background:rgba(255,255,255,.04); overflow:hidden; }
[data-theme="light"] .ld-progress { background:rgba(0,0,0,.05); }
.ld-progress-fill { height:100%; background:linear-gradient(90deg, var(--gold), var(--accent)); border-radius:1px; transition:width .3s var(--ease-smooth); }

/* ── Main shell ── */
.shell { height:100vh; height:100dvh; display:flex; flex-direction:column; }
.scroll-area { flex:1; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; padding-bottom:var(--nav-h); scroll-behavior:smooth; }

/* ── Page ── */
.page { padding:var(--page-top-pad) var(--page-x) var(--sp-4xl); }
.pg-title { font-size:var(--fs-2xl); font-weight:700; margin-bottom:var(--sp-2xl); letter-spacing:-.02em; }
.empty-msg { color:var(--muted); text-align:center; margin-top:var(--sp-5xl); font-style:italic; font-size:var(--fs-base); }
.section-hd { font-size:var(--fs-lg); font-weight:700; color:var(--text); margin-bottom:var(--sp-md); letter-spacing:-.01em; }

/* ── Home ── */
.home-top { margin-bottom:var(--sp-2xl); }
.home-greeting { font-size:var(--fs-2xl); font-weight:700; color:var(--text); letter-spacing:-.025em; }
.home-date { color:var(--muted); font-size:var(--fs-base); margin-top:var(--sp-sm); letter-spacing:.01em; }

/* ── Cosmic message ── */
.cosmic-msg {
  position:relative; border-radius:var(--r-lg); padding:var(--sp-xl); margin-bottom:var(--sp-2xl);
  background:var(--glass-bg); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
  border:1px solid var(--glass-border); box-shadow:var(--shadow-sm);
}
.cosmic-msg::before {
  content:''; position:absolute; inset:0; border-radius:inherit; padding:1px;
  background:linear-gradient(135deg, rgba(212,165,116,.4), rgba(123,140,222,.3));
  -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite:exclude; pointer-events:none;
}
.cosmic-msg p { color:var(--text); font-size:var(--fs-base); line-height:1.65; font-style:italic; font-family:var(--serif); }

/* ── Home score cards ── */
.home-scores { display:flex; flex-direction:column; gap:var(--sp-md); margin-bottom:var(--sp-3xl); }
.hsc {
  border-radius:var(--r-lg); padding:var(--sp-lg) var(--sp-xl); cursor:pointer;
  transition:transform var(--dur-fast) var(--ease-smooth);
}
.hsc:active { transform:scale(.985); }
.hsc-top { display:flex; align-items:center; gap:var(--sp-sm); }
.hsc-icon { font-size:1.05rem; width:22px; text-align:center; }
.hsc-label { font-size:var(--fs-base); font-weight:600; color:var(--muted); flex:1; }
.hsc-pct { font-size:var(--fs-2xl); font-weight:700; }
.hsc-bar { width:100%; height:3px; border-radius:2px; background:rgba(255,255,255,.035); margin-top:var(--sp-sm); overflow:hidden; }
[data-theme="light"] .hsc-bar { background:rgba(0,0,0,.05); }
.hsc-bar-fill { height:100%; border-radius:2px; }
.hsc-expand { margin-top:var(--sp-lg); padding-top:var(--sp-lg); border-top:1px solid var(--glass-border); display:flex; flex-direction:column; gap:var(--sp-md); }
.hsc-explain { color:var(--muted); font-size:var(--fs-base); line-height:1.6; }
.hsc-meta { font-size:.82rem; color:var(--accent); font-weight:500; }
.hsc-agree { color:var(--accent); }
.hsc-votes { display:flex; gap:4px; flex-wrap:wrap; }
.vote-dot { width:10px; height:10px; border-radius:50%; }
.vote-dot--positive { background:#4ADE80; }
.vote-dot--mixed { background:#FBBF24; }
.vote-dot--negative { background:#F87171; }
.hsc-link { color:var(--gold); font-size:.85rem; font-weight:600; text-align:left; min-height:36px; display:flex; align-items:center; }
.hsc-link:active { opacity:.7; }

/* ── Do & Don't ── */
.dodont { border-radius:var(--r-lg); padding:var(--sp-xl); margin-bottom:var(--sp-2xl); }
.dodont-title { font-size:var(--fs-lg); font-weight:700; color:var(--gold); margin-bottom:var(--sp-lg); letter-spacing:-.01em; }
.dodont-note { color:var(--muted); font-size:var(--fs-sm); line-height:1.5; margin-top:calc(-1 * var(--sp-sm)); margin-bottom:var(--sp-lg); }
.dodont-cols { display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-lg); }
.dodont-col { display:flex; flex-direction:column; gap:var(--sp-md); }
.dodont-hd { font-size:var(--fs-xs); font-weight:700; text-transform:uppercase; letter-spacing:.1em; padding-bottom:var(--sp-sm); border-bottom:1.5px solid; }
.dodont-hd--do { color:var(--teal); border-color:var(--teal); }
.dodont-hd--dont { color:var(--coral); border-color:var(--coral); }
.dodont-item { font-size:var(--fs-sm); line-height:1.55; color:var(--muted); }
.dodont-item--do::before { content:'+ '; color:var(--teal); font-weight:700; }
.dodont-item--dont::before { content:'- '; color:var(--coral); font-weight:700; }

/* ── Cosmic DNA ── */
.dna-section { margin-bottom:24px; }
.dna-scroll { display:flex; gap:8px; overflow-x:auto; padding:0 20px 4px 0; scrollbar-width:none; -ms-overflow-style:none; flex-wrap:wrap; }
.dna-scroll::-webkit-scrollbar { display:none; }
.dna-pill { border-radius:20px; padding:8px 14px; display:flex; align-items:center; gap:6px; white-space:normal; flex-shrink:0; min-width:0; word-break:break-word; }
.dna-sym { font-size:.95rem; }
.dna-val { font-size:.82rem; font-weight:600; }

/* ── Oracle Screen ── */
@keyframes orbBreath {
  0%, 100% { box-shadow: 0 0 30px rgba(212,175,120,.4), 0 0 65px rgba(190,155,100,.18), 0 0 100px rgba(170,140,90,.07); transform: scale(1); }
  50% { box-shadow: 0 0 42px rgba(212,175,120,.55), 0 0 80px rgba(190,155,100,.25), 0 0 115px rgba(170,140,90,.1); transform: scale(1.05); }
}
@keyframes orbBreathActive {
  0%, 100% { box-shadow: 0 0 38px rgba(212,175,120,.55), 0 0 80px rgba(190,155,100,.28), 0 0 120px rgba(170,140,90,.1); transform: scale(1); }
  50% { box-shadow: 0 0 55px rgba(212,175,120,.7), 0 0 100px rgba(190,155,100,.38), 0 0 140px rgba(170,140,90,.15); transform: scale(1.07); }
}
@keyframes ringPulse {
  0%, 100% { opacity: .3; transform: scale(1); }
  50% { opacity: .5; transform: scale(1.06); }
}
@keyframes ringPulse2 {
  0%, 100% { opacity: .18; transform: scale(1); }
  50% { opacity: .32; transform: scale(1.08); }
}
@keyframes heroSlideIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes chipSlideIn {
  from { opacity: 0; transform: translateY(8px) scale(.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes inputGlowPulse {
  0%, 100% { box-shadow: 0 4px 20px rgba(212,165,116,.12); }
  50% { box-shadow: 0 4px 28px rgba(212,165,116,.22); }
}

.oracle-screen {
  min-height:calc(100vh - var(--nav-h));
  min-height:calc(100dvh - var(--nav-h));
  display:flex; flex-direction:column; align-items:stretch; justify-content:flex-start;
  padding:var(--page-top-pad) var(--page-x) var(--sp-5xl); position:relative; overflow:hidden;
}
.oracle-screen::before {
  content:''; position:absolute; inset:-10% -20% auto; height:360px; pointer-events:none;
  background:
    radial-gradient(circle at 50% 25%, rgba(212,165,116,.16), transparent 50%),
    radial-gradient(circle at 25% 15%, rgba(123,140,222,.1), transparent 38%),
    radial-gradient(circle at 75% 40%, rgba(212,165,116,.06), transparent 40%);
  filter:blur(8px);
}
.oracle-particles { position:absolute; inset:0; pointer-events:none; z-index:0; }
.oracle-particle {
  position:absolute; border-radius:50%; background:var(--oracle-particle); opacity:0;
  box-shadow:var(--oracle-particle-shadow);
  animation:oracleDrift ease-in-out infinite;
}
[data-theme="light"] .oracle-particle { filter:saturate(1.08); }
.oracle-particles--active .oracle-particle { animation-duration:2.6s !important; }
.oracle-top {
  width:min(100%, 440px);
  margin:0 auto;
  position:relative;
  z-index:1;
  display:flex;
  flex-direction:column;
  gap:28px;
}
.oracle-header {
  display:flex;
  flex-direction:row;
  align-items:center;
  justify-content:space-between;
  gap:6px;
  animation: heroSlideIn .5s var(--ease-out) both;
}
.oracle-settings-btn {
  width:38px; height:38px; display:flex; align-items:center; justify-content:center;
  color:var(--muted); border-radius:50%;
  background:rgba(255,255,255,.04); border:1px solid var(--glass-border);
  transition:all var(--dur-normal) var(--ease-smooth);
}
.oracle-settings-btn:active { color:var(--gold); background:rgba(212,165,116,.08); transform:scale(.92); }
.oracle-kicker {
  color:var(--gold);
  font-size:.68rem;
  text-transform:uppercase;
  letter-spacing:.2em;
  font-weight:600;
  opacity:.85;
}
.oracle-greeting { font-size:var(--fs-2xl); font-weight:700; line-height:1.15; letter-spacing:-.025em; }
.oracle-stage {
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:24px;
  animation: heroSlideIn .6s var(--ease-out) .1s both;
}

/* ── Orb — layered rings + breathing glow ── */
.oracle-orb {
  width:80px; height:80px; border-radius:50%; position:relative; z-index:1;
  background:
    radial-gradient(circle at 38% 33%, rgba(255,250,230,.35), rgba(255,230,190,.12) 30%, transparent 55%),
    radial-gradient(circle, rgba(210,170,115,.55) 0%, rgba(180,145,95,.35) 35%, rgba(130,115,140,.12) 70%, transparent);
  box-shadow: 0 0 30px rgba(212,175,120,.4), 0 0 65px rgba(190,155,100,.18), 0 0 100px rgba(170,140,90,.07);
  animation: orbBreath 5s ease-in-out infinite;
  transition: all .6s var(--ease-out);
}
.oracle-orb::before {
  content:''; position:absolute; inset:-20px; border-radius:50%;
  border:none;
  background: radial-gradient(circle, rgba(212,175,120,.1), transparent 70%);
  animation: ringPulse 5s ease-in-out infinite;
}
.oracle-orb::after {
  content:''; position:absolute; inset:-40px; border-radius:50%;
  border:none;
  background: radial-gradient(circle, rgba(212,175,120,.05), transparent 65%);
  animation: ringPulse2 6s ease-in-out 1s infinite;
}
.oracle-orb--active {
  width:110px; height:110px;
  background:
    radial-gradient(circle at 38% 33%, rgba(255,250,230,.45), rgba(255,230,190,.18) 30%, transparent 55%),
    radial-gradient(circle, rgba(215,175,120,.65) 0%, rgba(185,150,100,.4) 35%, rgba(130,115,140,.15) 70%, transparent);
  box-shadow: 0 0 38px rgba(212,175,120,.55), 0 0 80px rgba(190,155,100,.28), 0 0 120px rgba(170,140,90,.1);
  animation: orbBreathActive 1.8s ease-in-out infinite;
}

/* ── Input area ── */
.oracle-input-area {
  display:flex; flex-direction:column; align-items:center; gap:20px; width:100%;
  max-width:380px; position:relative; z-index:1;
  transition: opacity .4s var(--ease-smooth);
  animation: heroSlideIn .5s var(--ease-out) .2s both;
}
.oracle-input-area--loading { opacity:.5; pointer-events:none; }
.oracle-prompt {
  color:var(--muted); font-size:1.15rem; text-align:center; line-height:1.5; max-width:16ch;
  letter-spacing:-.01em;
}
.oracle-input-wrap {
  width:100%; position:relative; border-radius:var(--r-lg); padding:1.5px;
  background:linear-gradient(135deg, var(--gold), var(--accent));
  animation: inputGlowPulse 4s ease-in-out infinite;
}
.oracle-input-wrap:focus-within {
  animation: none;
  box-shadow: 0 4px 32px rgba(212,165,116,.28);
}
.oracle-input {
  width:100%; min-height:52px; background:rgba(8,13,26,.85); color:var(--text);
  border:none; border-radius:calc(var(--r-lg) - 1px); padding:14px var(--sp-xl); font-size:var(--fs-md); outline:none;
  text-align:center; font-family:var(--sans); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
  transition: background var(--dur-normal);
}
.oracle-input:focus { background:rgba(8,13,26,.92); }
[data-theme="light"] .oracle-input { background:rgba(250,246,240,.92); }
[data-theme="light"] .oracle-input:focus { background:rgba(250,246,240,.98); }
.oracle-input::placeholder { color:var(--muted); text-align:center; }
.oracle-input-meta {
  width:100%;
  display:flex;
  justify-content:flex-end;
  align-items:center;
  gap:12px;
  margin-top:-6px;
}
.oracle-charcount { color:var(--muted); font-size:.72rem; font-variant-numeric:tabular-nums; opacity:.7; }
.oracle-charcount--warn { color:var(--gold); opacity:1; }
.oracle-clear {
  padding:0 14px;
  min-height:36px;
  font-size:var(--fs-sm);
}

/* ── CTA Button — premium ── */
.oracle-cta {
  max-width:280px;
  box-shadow: 0 4px 20px rgba(212,165,116,.2);
  transition: transform var(--dur-fast) var(--ease-spring), box-shadow var(--dur-fast);
}
.oracle-cta:active {
  transform: scale(.96);
  box-shadow: 0 2px 12px rgba(212,165,116,.15);
}

/* ── Suggestion chips ── */
.oracle-suggestions {
  width:100%;
  display:flex;
  flex-direction:column;
  gap:10px;
}
.oracle-suggestions-label {
  color:var(--muted);
  font-size:.7rem;
  text-transform:uppercase;
  letter-spacing:.12em;
  text-align:center;
  opacity:.7;
}
.oracle-suggestions-row {
  display:flex;
  gap:8px;
  flex-wrap:wrap;
  justify-content:center;
}
.oracle-chip {
  min-height:36px;
  padding:8px 16px;
  border-radius:var(--r-full);
  font-size:.78rem;
  line-height:1.3;
  transition: transform var(--dur-fast) var(--ease-spring), background var(--dur-fast);
  animation: chipSlideIn .4s var(--ease-out) both;
}
.oracle-chip:nth-child(1) { animation-delay: .3s; }
.oracle-chip:nth-child(2) { animation-delay: .4s; }
.oracle-chip:nth-child(3) { animation-delay: .5s; }
.oracle-chip:nth-child(4) { animation-delay: .6s; }
.oracle-chip:active { transform:scale(.94); background:rgba(212,165,116,.08); }

/* ── Revealing state ── */
.oracle-revealing { display:flex; align-items:center; justify-content:center; position:relative; z-index:1; min-height:120px; }
.oracle-reveal-text { color:var(--muted); font-size:1.05rem; font-style:italic; animation:msgFade .5s var(--ease-smooth) both; letter-spacing:.01em; }

/* ── Answer area ── */
.oracle-answer-area {
  display:flex; flex-direction:column; gap:20px; width:100%; max-width:none;
  position:relative; z-index:1; border-radius:var(--r-xl); padding:28px 24px;
}
.oracle-q-echo { color:var(--muted); font-size:.82rem; text-align:center; font-style:italic; opacity:.8; }
.oracle-answer-text { color:var(--text); font-size:1rem; line-height:1.85; text-align:center; font-family:var(--serif); }
.oracle-sentence { display:inline; opacity:0; animation:sentenceReveal .45s var(--ease-out) both; }
.oracle-actions { display:flex; gap:10px; width:100%; flex-wrap:wrap; }
.oracle-actions .btn-gold,
.oracle-actions .btn-ghost { flex:1 1 120px; }
.oracle-share {
  min-width:96px; border:1px solid var(--glass-border); background:rgba(255,255,255,.03);
}
[data-theme="light"] .oracle-share { background:rgba(0,0,0,.03); }
.oracle-secondary {
  border:1px solid var(--glass-border);
  background:rgba(255,255,255,.02);
}
[data-theme="light"] .oracle-secondary { background:rgba(0,0,0,.02); }
.oracle-share-note {
  color: var(--accent);
  font-size: .8rem;
  text-align: center;
  margin-top: -4px;
}

/* ── Oracle answer paragraphs ── */
.oracle-paragraph {
  margin: 0 0 4px; opacity: 0;
  animation: sentenceReveal .4s var(--ease-out) both;
}
.oracle-paragraph:last-child { margin-bottom: 0; }

/* ── Oracle system signals ── */
.oracle-signals {
  display: flex; flex-direction: column; gap: var(--sp-md);
  padding-top: var(--sp-lg);
  border-top: 1px solid var(--glass-border);
}
.oracle-signals-title {
  font-size: var(--fs-sm); font-weight: 700; text-transform: uppercase;
  letter-spacing: .08em; color: var(--gold); margin: 0;
}
.oracle-signals-list {
  display: flex; flex-direction: column; gap: var(--sp-sm);
}
.oracle-sig-row {
  padding: var(--sp-md) var(--sp-lg); border-radius: var(--r-md);
  border-left: 3px solid var(--glass-border);
  background: rgba(255,255,255,.02);
}
[data-theme="light"] .oracle-sig-row { background: rgba(0,0,0,.02); }
.oracle-sig--pos { border-left-color: var(--teal); }
.oracle-sig--neg { border-left-color: var(--coral); }
.oracle-sig--mix { border-left-color: var(--accent); }
.oracle-sig-top {
  display: flex; justify-content: space-between; align-items: baseline;
  gap: var(--sp-sm); margin-bottom: 4px;
}
.oracle-sig-name { font-size: var(--fs-sm); font-weight: 700; color: var(--text); }
.oracle-sig-sentiment {
  font-size: var(--fs-xs); font-weight: 600; text-transform: capitalize;
  color: var(--muted);
}
.oracle-sig--pos .oracle-sig-sentiment { color: var(--teal); }
.oracle-sig--neg .oracle-sig-sentiment { color: var(--coral); }
.oracle-sig--mix .oracle-sig-sentiment { color: var(--accent); }
.oracle-sig-reason { font-size: var(--fs-sm); color: var(--muted); line-height: 1.5; margin: 0; }
.oracle-sig-detail {
  display: block; font-size: var(--fs-xs); color: var(--muted); opacity: .7;
  margin-top: 4px;
}
.oracle-agg-summary {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--sp-sm) 0; font-size: var(--fs-xs); color: var(--muted);
}
.oracle-agg-count { font-weight: 600; }
.oracle-agg-strength { text-transform: capitalize; font-weight: 600; color: var(--gold); }

/* ═══════════════════════════════════════════════════════════════════
   PREMIUM ORACLE RESULT — Staged Reveal
   ═══════════════════════════════════════════════════════════════════ */

/* Visibility states for staged reveal */
.or-hidden { opacity: 0; transform: translateY(16px); pointer-events: none; }
.or-visible { opacity: 1; transform: translateY(0); transition: opacity .5s var(--ease-smooth), transform .5s var(--ease-smooth); }

.or-result {
  display: flex; flex-direction: column; gap: 20px; width: 100%;
  position: relative; z-index: 1; padding: 0;
}

/* ── Glow backdrop ── */
.or-glow {
  position: absolute; top: -40px; left: 50%; transform: translateX(-50%);
  width: 200px; height: 200px; border-radius: 50%;
  background: radial-gradient(circle, rgba(212,165,116,.15) 0%, transparent 70%);
  filter: blur(40px); pointer-events: none; z-index: 0;
  animation: orGlowPulse 4s ease-in-out infinite;
}
@keyframes orGlowPulse {
  0%, 100% { opacity: .5; transform: translateX(-50%) scale(1); }
  50% { opacity: .8; transform: translateX(-50%) scale(1.15); }
}

/* ── Answer block ── */
.or-answer {
  text-align: center; padding: 28px 20px 20px; position: relative; z-index: 1;
  background: rgba(255,255,255,.02); border-radius: var(--r-xl);
  border: 1px solid var(--glass-border);
}
[data-theme="light"] .or-answer { background: rgba(0,0,0,.015); }
.or-answer-text {
  font-size: 1.2rem; line-height: 1.75; color: var(--text);
  font-weight: 500; letter-spacing: .01em;
}
.or-tone--firm .or-answer-text { font-size: 1.3rem; font-weight: 600; }
.or-tone--explore .or-answer-text { font-size: 1.1rem; font-style: italic; }

/* ── Confidence badge ── */
.or-confidence {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 8px 16px; border-radius: 100px; width: fit-content;
  margin: 0 auto; font-size: var(--fs-sm); font-weight: 600;
  background: rgba(255,255,255,.04); border: 1px solid var(--glass-border);
}
[data-theme="light"] .or-confidence { background: rgba(0,0,0,.03); }
.or-conf-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--gold); flex-shrink: 0;
}
.or-conf--high .or-conf-dot { background: var(--teal); box-shadow: 0 0 6px var(--teal); }
.or-conf--low .or-conf-dot { background: var(--coral); }
.or-conf--med .or-conf-dot { background: var(--gold); }
.or-conf-label { color: var(--muted); }
.or-conf--high .or-conf-label { color: var(--teal); }
.or-conf--low .or-conf-label { color: var(--coral); }
.or-conf-val { color: var(--text); font-weight: 700; }

/* ── System reasoning section ── */
.or-systems { display: flex; flex-direction: column; gap: 12px; }
.or-section-title {
  font-size: var(--fs-sm); font-weight: 700; text-transform: uppercase;
  letter-spacing: .08em; color: var(--gold); margin: 0;
}

/* Agreement pills */
.or-agreement { display: flex; flex-wrap: wrap; gap: 8px; }
.or-agree-chip {
  font-size: var(--fs-xs); color: var(--muted); padding: 4px 10px;
  border-radius: 100px; background: rgba(255,255,255,.03);
  border: 1px solid var(--glass-border);
}
[data-theme="light"] .or-agree-chip { background: rgba(0,0,0,.025); }
.or-agree-chip strong { color: var(--text); }
.or-agree-chip em { font-style: normal; color: var(--accent); }

/* System cards */
.or-cards { display: flex; flex-direction: column; gap: 10px; }
.or-card {
  padding: 14px 16px; border-radius: var(--r-md);
  border-left: 3px solid var(--glass-border);
  background: rgba(255,255,255,.025);
  opacity: 0; animation: orCardSlide .45s var(--ease-out) both;
}
[data-theme="light"] .or-card { background: rgba(0,0,0,.02); }
@keyframes orCardSlide {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.or-card--supports { border-left-color: var(--teal); }
.or-card--cautions { border-left-color: var(--coral); }
.or-card--neutral { border-left-color: var(--accent); }
.or-card-hd {
  display: flex; justify-content: space-between; align-items: baseline;
  gap: var(--sp-sm); margin-bottom: 4px;
}
.or-card-name { font-size: var(--fs-sm); font-weight: 700; color: var(--text); }
.or-card-sent {
  font-size: var(--fs-xs); font-weight: 600; text-transform: capitalize;
  color: var(--muted);
}
.or-card--supports .or-card-sent { color: var(--teal); }
.or-card--cautions .or-card-sent { color: var(--coral); }
.or-card--neutral .or-card-sent { color: var(--accent); }
.or-card-reason { font-size: var(--fs-sm); color: var(--muted); line-height: 1.5; margin: 0; }
.or-card-evidence { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.or-ev-tag {
  font-size: 10px; padding: 2px 8px; border-radius: 100px;
  background: rgba(212,165,116,.08); color: var(--gold);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;
}

/* ── Conflict note ── */
.or-conflict {
  display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px;
  border-radius: var(--r-md); background: rgba(255,255,255,.025);
  border: 1px solid rgba(212,165,116,.15);
}
[data-theme="light"] .or-conflict { background: rgba(0,0,0,.02); border-color: rgba(212,165,116,.2); }
.or-conflict-icon {
  font-size: 1.1rem; color: var(--gold); flex-shrink: 0;
  font-weight: 700; line-height: 1.4;
}
.or-conflict-text { font-size: var(--fs-sm); color: var(--muted); line-height: 1.55; margin: 0; }

/* ── Personal insight (highlighted, last reveal) ── */
.or-insight {
  padding: 16px 18px; border-radius: var(--r-md); position: relative;
  background: linear-gradient(135deg, rgba(212,165,116,.06) 0%, rgba(212,165,116,.02) 100%);
  border: 1px solid rgba(212,165,116,.18);
}
[data-theme="light"] .or-insight { background: linear-gradient(135deg, rgba(212,165,116,.08) 0%, rgba(212,165,116,.03) 100%); }
.or-insight-text {
  font-size: var(--fs-sm); color: var(--text); line-height: 1.65; margin: 0;
  font-style: italic;
}

/* ── Reasoning paragraphs ── */
.or-reasoning { display: flex; flex-direction: column; gap: 6px; }
.or-reasoning-p { font-size: var(--fs-sm); color: var(--muted); line-height: 1.6; margin: 0; text-align: center; }

/* ── Premium blur prep (for paywall gating) ── */
.or-blurred { filter: blur(6px); user-select: none; pointer-events: none; position: relative; }
.or-blurred::after {
  content: ''; position: absolute; inset: 0; z-index: 2;
  background: linear-gradient(180deg, transparent 0%, var(--bg) 90%);
  border-radius: var(--r-md);
}

.oracle-evidence { display:flex; flex-direction:column; gap:12px; margin-top:20px; }
.oracle-ev-title { font-size:1rem; color:var(--gold); margin-bottom:2px; }
.oracle-ev-card { padding:14px; border-radius:14px; border:1px solid var(--glass-border); }
.oracle-ev-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.oracle-ev-area { text-transform:capitalize; font-weight:700; font-size:.9rem; }
.oracle-ev-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
.oracle-ev-dot--positive { background:#4ADE80; }
.oracle-ev-dot--mixed { background:#FBBF24; }
.oracle-ev-dot--challenging { background:#F87171; }
.oracle-ev-label { font-size:.76rem; color:var(--muted); flex:1; }
.oracle-ev-score { font-size:.9rem; font-weight:700; flex-shrink:0; }
.oracle-ev-score--positive { color:#4ADE80; }
.oracle-ev-score--mixed { color:#FBBF24; }
.oracle-ev-score--challenging { color:#F87171; }
.oracle-ev-voices { font-size:.84rem; color:var(--text); margin-bottom:10px; font-style:italic; opacity:.85; }
.oracle-ev-systems-group { margin-bottom:8px; }
.oracle-ev-systems-group:last-child { margin-bottom:0; }
.oracle-ev-group-label { font-size:.7rem; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; display:block; margin-bottom:5px; }
.oracle-ev-chips { display:flex; flex-wrap:wrap; gap:6px; }
.oracle-ev-chip { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:20px; font-size:.72rem; font-weight:500; }
.oracle-ev-chip--lead { background:rgba(74,222,128,0.12); color:#4ADE80; border:1px solid rgba(74,222,128,0.25); }
.oracle-ev-chip--dissent { background:rgba(248,113,113,0.12); color:#F87171; border:1px solid rgba(248,113,113,0.25); }
.oracle-ev-chip--lag { background:rgba(255,255,255,0.05); color:var(--muted); border:1px solid var(--glass-border); }
.oracle-ev-chip-score { opacity:.7; font-size:.65rem; }
.oracle-history {
  width:100%;
  margin-top:0;
  position:relative;
  z-index:1;
  display:flex;
  flex-direction:column;
  gap:10px;
  max-height:none;
  overflow:visible;
  padding:16px;
  border-radius:18px;
}
.oracle-history-top {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}
.oracle-history-toggle {
  min-height:40px;
  display:flex;
  align-items:center;
  gap:10px;
  color:var(--muted);
  text-align:left;
}
.oracle-history-title { font-size:.95rem; color:var(--muted); text-align:center; }
.oracle-history-count {
  min-width:24px;
  height:24px;
  border-radius:999px;
  display:grid;
  place-items:center;
  padding:0 8px;
  background:rgba(212,165,116,.12);
  color:var(--gold);
  font-size:.74rem;
  font-weight:700;
}
.oracle-history-clear {
  min-height:36px;
  padding:0 12px;
  border-radius:999px;
  color:var(--muted);
  border:1px solid var(--glass-border);
  background:rgba(255,255,255,.02);
}
[data-theme="light"] .oracle-history-clear { background:rgba(0,0,0,.02); }
.oracle-history-hint { color:var(--muted); font-size:.78rem; text-align:center; margin-top:-2px; }
.oracle-history-item {
  border-radius:16px; padding:14px 16px; text-align:left; width:100%;
  transition:transform 150ms, border-color 150ms, background-color 150ms;
  border:1px solid var(--glass-border);
  background:rgba(255,255,255,.03);
}
[data-theme="light"] .oracle-history-item { background:rgba(0,0,0,.03); }
.oracle-history-item:active { transform:scale(.98); }
.oracle-history-item:hover { border-color:rgba(212,165,116,.28); }
.oracle-hq { font-size:.82rem; color:var(--muted); font-style:italic; margin-bottom:6px; }
.oracle-ha { font-size:.85rem; color:var(--text); line-height:1.6; opacity:.76; }
.oracle-daily {
  display:flex; flex-direction:column; gap:14px; margin-bottom:0;
  padding:24px 20px; border-radius:var(--r-xl);
  background:rgba(255,255,255,.025); border:1px solid var(--glass-border);
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
}
[data-theme="light"] .oracle-daily { background:rgba(255,255,255,.5); }
.oracle-daily-title {
  font-size:1.05rem; font-weight:700; color:var(--gold);
  letter-spacing:-.01em;
}
.oracle-daily-message {
  color:var(--text); font-size:.95rem; line-height:1.75;
  margin-top:-2px; margin-bottom:4px; opacity:.9;
}
.oracle-daily-note { color:var(--muted); font-size:.72rem; line-height:1.5; opacity:.7; }
.oracle-summary-pills { display:flex; gap:10px; margin-bottom:4px; }
.oracle-summary-pill {
  flex:1;
  padding:14px 16px;
  border-radius:var(--r-lg);
  display:flex;
  flex-direction:column;
  gap:6px;
  border:1px solid var(--glass-border);
  background:rgba(255,255,255,.02);
}
[data-theme="light"] .oracle-summary-pill { background:rgba(255,255,255,.4); }
.oracle-summary-pill--focus { border-color:rgba(91,168,157,.25); background:rgba(91,168,157,.06); }
.oracle-summary-pill--caution { border-color:rgba(248,113,113,.2); background:rgba(248,113,113,.04); }
.oracle-summary-pill-label {
  font-size:.62rem;
  text-transform:uppercase;
  letter-spacing:.14em;
  font-weight:700;
  color:var(--muted);
}
.oracle-summary-pill--focus .oracle-summary-pill-label { color:var(--teal); }
.oracle-summary-pill--caution .oracle-summary-pill-label { color:var(--coral); }
.oracle-summary-pill-value { font-size:.92rem; font-weight:700; color:var(--text); }
.oracle-dodont-box {
  margin-bottom:0;
  padding:22px 20px;
  border-radius:var(--r-xl);
}
.oracle-dodont-title {
  font-size:.95rem; font-weight:700; color:var(--text); margin-bottom:16px;
  letter-spacing:-.01em;
}

/* ── System grid ── */
.sys-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
.sys-tile {
  border-radius:var(--r-lg); padding:var(--sp-xl) var(--sp-lg);
  display:flex; flex-direction:column; align-items:center; gap:var(--sp-sm);
  min-height:48px; transition:transform var(--dur-fast) var(--ease-smooth), opacity var(--dur-fast);
  position:relative; overflow:hidden;
}
.sys-tile:active { transform:scale(.97); opacity:.85; }
.sys-tile-icon { font-size:1.8rem; position:relative; z-index:1; }
.sys-tile-name { font-weight:600; font-size:var(--fs-base); position:relative; z-index:1; letter-spacing:-.01em; }
.sys-tile-desc { color:var(--muted); font-size:var(--fs-sm); position:relative; z-index:1; }
.sys-tile-avg { font-family:var(--serif); font-size:var(--fs-base); font-weight:700; position:relative; z-index:1; margin-top:2px; }

/* ── Detail ── */
.detail { display:flex; flex-direction:column; min-height:100%; }
.detail-hd {
  position:sticky; top:0; z-index:50;
  background:var(--detail-hd-bg); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
  display:flex; align-items:center; gap:var(--sp-md); padding:calc(var(--sp-md) + var(--safe-top)) var(--sp-lg) var(--sp-md); min-height:calc(48px + var(--safe-top));
  border-bottom:1px solid var(--glass-border);
}
.detail-hd h2 { font-size:var(--fs-lg); font-weight:700; letter-spacing:-.01em; }
.back-btn { width:40px; height:40px; display:flex; align-items:center; justify-content:center; border-radius:var(--r-full); min-height:44px; transition:background var(--dur-fast); }
.back-btn:active { background:rgba(255,255,255,.06); }
.detail-bd { padding:var(--sp-2xl) var(--page-x) var(--sp-4xl); display:flex; flex-direction:column; gap:var(--sp-2xl); }
.detail-hl { font-size:var(--fs-xl); font-weight:700; line-height:1.35; color:var(--gold); letter-spacing:-.015em; }

/* ── Detail scores ── */
.d-scores { display:grid; grid-template-columns:repeat(2,1fr); gap:var(--sp-md); }
.mscore { border-radius:var(--r-lg); padding:var(--sp-lg); display:flex; flex-direction:column; gap:var(--sp-sm); }
.mscore-top { display:flex; align-items:center; gap:var(--sp-sm); font-size:var(--fs-base); font-weight:600; }
.mscore-icon { font-size:var(--fs-md); }
.mscore-pct { font-size:var(--fs-xl); font-weight:700; margin-left:auto; }
.mscore-bar { height:3px; border-radius:2px; background:rgba(255,255,255,.035); overflow:hidden; }
[data-theme="light"] .mscore-bar { background:rgba(0,0,0,.05); }
.mscore-bar div { height:100%; border-radius:2px; }
.mscore-lbl { color:var(--muted); font-size:var(--fs-sm); }

/* ── Summary ── */
.d-summary { display:flex; flex-direction:column; gap:10px; }
.d-summary p { color:var(--muted); line-height:1.7; font-size:.93rem; }

/* ── Pills ── */
.pills { display:grid; grid-template-columns:repeat(2,1fr); gap:var(--sp-sm); }
.pill { border-radius:var(--r-md); padding:var(--sp-md) var(--sp-lg); display:flex; flex-direction:column; gap:3px; }
.pill-l { color:var(--gold); font-size:var(--fs-xs); text-transform:uppercase; letter-spacing:.08em; font-weight:600; }
.pill-v { font-weight:600; font-size:var(--fs-base); line-height:1.4; }

/* ── Accordion ── */
.accordion { border-radius:var(--r-md); overflow:hidden; background:var(--bg2); border:1px solid var(--glass-border); }
.accordion + .accordion { margin-top:var(--sp-sm); }
.accordion-hd {
  width:100%; display:flex; justify-content:space-between; align-items:center;
  padding:var(--sp-lg) var(--sp-lg); min-height:48px; font-size:var(--fs-base); font-weight:600; text-align:left;
  transition:background var(--dur-fast);
}
.accordion-hd:active { background:rgba(255,255,255,.025); }
[data-theme="light"] .accordion-hd:active { background:rgba(0,0,0,.025); }
.accordion-bd { max-height:0; overflow:hidden; transition:max-height .3s var(--ease-smooth); }
.accordion-bd--open { max-height:4000px; transition:max-height .5s var(--ease-smooth); }
.accordion-inner { padding:0 var(--sp-lg) var(--sp-lg); display:flex; flex-direction:column; gap:var(--sp-md); }
.ins-text { color:var(--muted); line-height:1.65; font-size:var(--fs-base); }
.insights-list { display:flex; flex-direction:column; gap:var(--sp-sm); }
.adv-block { display:flex; flex-direction:column; gap:var(--sp-md); }

/* ── Data cards ── */
.dcards-section { display:flex; flex-direction:column; gap:var(--sp-sm); }
.dcards-title { font-size:var(--fs-base); font-weight:700; color:var(--gold); margin-bottom:var(--sp-xs); }
.dcard { border-radius:var(--r-md); padding:var(--sp-md) var(--sp-lg); display:flex; flex-direction:column; gap:var(--sp-sm); }
.dcard-field { display:flex; flex-direction:column; gap:1px; }
.dcard-label { color:var(--gold); font-size:var(--fs-xs); text-transform:uppercase; letter-spacing:.08em; font-weight:600; }
.dcard-value { font-size:var(--fs-base); color:var(--muted); line-height:1.45; }

/* ── Combined ── */
.comb-hl { color:var(--gold); font-size:var(--fs-lg); line-height:1.4; margin-bottom:var(--sp-sm); letter-spacing:-.01em; }
.comb-sum { color:var(--muted); font-size:var(--fs-base); line-height:1.65; margin-bottom:var(--sp-xl); }
.comb-scores { display:flex; flex-direction:column; gap:var(--sp-md); margin-bottom:var(--sp-3xl); }
.csc { border-radius:var(--r-lg); padding:var(--sp-lg) var(--sp-xl); display:flex; flex-direction:column; gap:var(--sp-sm); }
.csc-top { display:flex; align-items:center; gap:var(--sp-sm); }
.csc-icon { font-size:1rem; width:22px; text-align:center; }
.csc-label { font-size:var(--fs-base); font-weight:600; color:var(--muted); flex:1; }
.csc-pct { font-size:var(--fs-xl); font-weight:700; }
.csc-bar { height:3px; border-radius:2px; background:rgba(255,255,255,.035); overflow:hidden; }
[data-theme="light"] .csc-bar { background:rgba(0,0,0,.05); }
.csc-bar div { height:100%; border-radius:2px; }
.csc-conf { color:var(--accent); font-size:var(--fs-sm); font-weight:500; }
.csc-sys { color:var(--muted); font-size:var(--fs-sm); line-height:1.4; opacity:.65; }

/* ── Settings header ── */
.settings-header {
  display:flex; align-items:center; gap:12px; margin-bottom:20px;
}
.settings-header .back-btn {
  width:36px; height:36px; display:flex; align-items:center; justify-content:center;
  border-radius:50%; background:var(--glass-bg); border:1px solid var(--glass-border);
}

/* ── Combined Systems ── */
.cs-combined-section { margin-top:28px; }
.cs-combined-title { font-size:1.3rem; font-weight:700; margin-bottom:16px; }

/* ── Placeholder screens ── */
.placeholder-screen { display:flex; flex-direction:column; align-items:center; }
.placeholder-card {
  margin-top:40px; padding:40px 24px; border-radius:20px; text-align:center;
  display:flex; flex-direction:column; align-items:center; gap:12px; width:100%;
}
.placeholder-icon { font-size:3rem; }
.placeholder-text { font-size:1.05rem; font-weight:600; color:var(--text); }
.placeholder-sub { font-size:.85rem; color:var(--muted); line-height:1.5; }

/* ── Area detail modal ── */
.area-modal-overlay {
  position:fixed; inset:0; z-index:200;
  background:rgba(0,0,0,.65);
  display:flex; align-items:flex-start; justify-content:center;
  padding:48px 20px 20px;
  overflow-y:auto;
}
.area-modal {
  width:min(100%, 400px); max-height:none;
  border-radius:20px; padding:28px 24px;
  display:flex; flex-direction:column; gap:16px;
  background:var(--bg); border:1px solid var(--glass-border);
  box-shadow:0 16px 48px rgba(0,0,0,.5);
}
[data-theme="light"] .area-modal {
  background:#FAFAF8;
  box-shadow:0 16px 48px rgba(0,0,0,.18);
}
.area-modal-header {
  display:flex; align-items:center; gap:10px;
}
.area-modal-icon { font-size:1.5rem; }
.area-modal-title { font-size:1.3rem; font-weight:700; flex:1; }
.area-modal-score { font-size:1.4rem; font-weight:700; }
.area-modal-bar {
  height:6px; border-radius:3px; background:var(--glass-border); overflow:hidden;
}
.area-modal-bar-fill {
  height:100%; border-radius:3px; transition:width .4s ease;
}
.area-modal-explain {
  font-size:.92rem; line-height:1.65; color:var(--text); opacity:.92;
}
.area-modal-systems {
  display:flex; flex-direction:column; gap:4px;
}
.area-modal-systems-label { font-size:.75rem; text-transform:uppercase; letter-spacing:.1em; color:var(--muted); font-weight:600; }
.area-modal-systems-list { font-size:.85rem; color:var(--gold); }
.area-modal-conf { font-size:.8rem; color:var(--muted); }
.area-modal-close { margin-top:4px; }

/* ══════════════════════════════════════════════════════
   Mystic Games
   ══════════════════════════════════════════════════════ */
.gm-page {
  padding:var(--page-top-pad) 20px 20px;
}

/* ── Hub ── */
.gm-hub-header {
  text-align:center; margin-bottom:28px;
}
.gm-sigil {
  font-size:1.6rem; color:var(--gold); opacity:.7;
  animation:sigilPulse 3s ease-in-out infinite; margin-bottom:8px;
}
@keyframes sigilPulse {
  0%, 100% { opacity:.5; transform:scale(1); }
  50% { opacity:1; transform:scale(1.1); }
}
.gm-hub-title { font-size:1.8rem; font-weight:700; letter-spacing:.02em; }
.gm-hub-sub {
  font-size:.82rem; color:var(--muted); letter-spacing:.15em;
  text-transform:uppercase; margin-top:6px;
}

/* ── Game cards grid ── */
.gm-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.gm-card {
  position:relative; overflow:hidden;
  display:flex; flex-direction:column; align-items:center; gap:10px;
  padding:28px 14px 22px; border-radius:18px; text-align:center;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(212,165,116,.06) 0%, transparent 60%),
    var(--glass-bg);
  border:1px solid rgba(212,165,116,.12);
  box-shadow:0 4px 20px rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.04);
  transition:transform .2s, box-shadow .2s;
}
.gm-card:active {
  transform:scale(.96);
  box-shadow:0 2px 10px rgba(0,0,0,.2), inset 0 0 30px rgba(212,165,116,.06);
}
.gm-card-glow {
  position:absolute; top:-20px; left:50%; transform:translateX(-50%);
  width:80px; height:80px; border-radius:50%;
  background:radial-gradient(circle, rgba(212,165,116,.12), transparent 70%);
  pointer-events:none;
}
.gm-card-icon { font-size:2rem; position:relative; z-index:1; }
.gm-card-title { font-size:.95rem; font-weight:700; color:var(--text); position:relative; z-index:1; }
.gm-card-sub { font-size:.7rem; color:var(--gold); opacity:.8; letter-spacing:.06em; position:relative; z-index:1; }

/* ── Back button ── */
.gm-back-row { margin-bottom:8px; }
.gm-back {
  width:36px; height:36px; display:flex; align-items:center; justify-content:center;
  border-radius:50%; background:var(--glass-bg); border:1px solid var(--glass-border);
  color:var(--muted); transition:color .2s;
}
.gm-back:active { color:var(--gold); }
.gm-back-text {
  display:inline-flex; align-items:center; gap:4px; padding:10px 18px;
  border-radius:var(--r-md); background:var(--glass-bg); border:1px solid var(--glass-border);
  color:var(--muted); font-size:.9rem; font-weight:600; letter-spacing:.02em;
  transition:color .2s, background .2s;
}
.gm-back-text:active { color:var(--gold); background:rgba(212,165,116,.06); }

/* ── Ritual header ── */
.gm-ritual-header {
  display:flex; flex-direction:column; align-items:center; gap:10px;
  margin-bottom:32px; text-align:center;
}
.gm-ritual-icon {
  font-size:2.4rem;
  text-shadow:0 0 20px rgba(212,165,116,.3);
}
.gm-ritual-title { font-size:1.5rem; font-weight:700; letter-spacing:.02em; }

/* ── Reveal stage (shared) ── */
.gm-reveal-stage {
  display:flex; flex-direction:column; align-items:center; gap:20px;
  padding:20px 0 10px; min-height:260px;
}
.gm-reveal-text {
  font-size:.92rem; color:var(--gold); opacity:.85;
  text-align:center; font-style:italic;
  animation:revealTextFade 3s ease-in-out;
}
@keyframes revealTextFade {
  0% { opacity:0; transform:translateY(8px); }
  20% { opacity:.85; transform:translateY(0); }
  100% { opacity:.85; }
}

/* ─── DICE: 3D tumbling cubes on velvet table ─── */
.dice-scene { perspective:800px; width:100%; max-width:320px; }
.dice-table {
  position:relative; display:flex; justify-content:center; gap:20px;
  padding:48px 24px 44px; border-radius:20px;
  background:
    radial-gradient(ellipse at 50% 30%, rgba(212,165,116,.07), transparent 60%),
    linear-gradient(180deg, #100a1a, #0a0612);
  border:1px solid rgba(212,165,116,.1);
  box-shadow:inset 0 2px 40px rgba(0,0,0,.5), inset 0 -1px 0 rgba(212,165,116,.04), 0 12px 40px rgba(0,0,0,.4);
  transform:rotateX(10deg); transform-style:preserve-3d;
}
[data-theme="light"] .dice-table {
  background:linear-gradient(180deg, #e8e0d6, #ddd4c8);
  border-color:rgba(184,137,106,.15);
  box-shadow:inset 0 2px 20px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.08);
}
.dice-wrapper { width:66px; height:66px; transform-style:preserve-3d; position:relative; }
.dice-cube { width:66px; height:66px; position:relative; transform-style:preserve-3d; }
.dice-face {
  position:absolute; width:66px; height:66px;
  display:flex; align-items:center; justify-content:center;
  background:linear-gradient(145deg, #18102a, #0e081c);
  border:1px solid rgba(212,165,116,.2); border-radius:10px;
  font-size:1.6rem; color:var(--gold); backface-visibility:hidden;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05);
}
[data-theme="light"] .dice-face {
  background:linear-gradient(145deg, #f5ede4, #e8ddd0);
  border-color:rgba(184,137,106,.25);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.5);
}
.dice-front  { transform:translateZ(33px); }
.dice-back   { transform:rotateY(180deg) translateZ(33px); }
.dice-right  { transform:rotateY(90deg) translateZ(33px); }
.dice-left   { transform:rotateY(-90deg) translateZ(33px); }
.dice-top    { transform:rotateX(90deg) translateZ(33px); }
.dice-bottom { transform:rotateX(-90deg) translateZ(33px); }

.dice-tumble-0 { animation:diceTumble0 2.6s cubic-bezier(.22,.68,.36,1) forwards; }
.dice-tumble-1 { animation:diceTumble1 2.6s cubic-bezier(.22,.68,.36,1) .12s forwards; }
.dice-tumble-2 { animation:diceTumble2 2.6s cubic-bezier(.22,.68,.36,1) .24s forwards; }

@keyframes diceTumble0 {
  0%   { transform:translateY(-280px) translateX(-30px) rotateX(20deg) rotateY(15deg); opacity:0; }
  8%   { opacity:1; }
  20%  { transform:translateY(12px) translateX(-5px) rotateX(340deg) rotateY(280deg) rotateZ(140deg); }
  35%  { transform:translateY(-35px) translateX(8px) rotateX(520deg) rotateY(440deg) rotateZ(220deg); }
  52%  { transform:translateY(8px) translateX(-3px) rotateX(640deg) rotateY(600deg) rotateZ(310deg); }
  70%  { transform:translateY(-10px) translateX(1px) rotateX(700deg) rotateY(700deg) rotateZ(350deg); }
  88%  { transform:translateY(2px) rotateX(718deg) rotateY(718deg) rotateZ(359deg); }
  100% { transform:translateY(0) rotateX(720deg) rotateY(720deg) rotateZ(360deg); }
}
@keyframes diceTumble1 {
  0%   { transform:translateY(-320px) translateX(25px) rotateX(-15deg) rotateY(20deg); opacity:0; }
  10%  { opacity:1; }
  22%  { transform:translateY(15px) translateX(8px) rotateX(360deg) rotateY(300deg) rotateZ(170deg); }
  38%  { transform:translateY(-30px) translateX(-6px) rotateX(540deg) rotateY(480deg) rotateZ(260deg); }
  56%  { transform:translateY(6px) translateX(2px) rotateX(660deg) rotateY(640deg) rotateZ(330deg); }
  74%  { transform:translateY(-6px) rotateX(710deg) rotateY(710deg) rotateZ(354deg); }
  90%  { transform:translateY(1px) rotateX(719deg) rotateY(719deg) rotateZ(359deg); }
  100% { transform:translateY(0) rotateX(720deg) rotateY(720deg) rotateZ(360deg); }
}
@keyframes diceTumble2 {
  0%   { transform:translateY(-260px) translateX(40px) rotateX(10deg) rotateY(-20deg); opacity:0; }
  12%  { opacity:1; }
  24%  { transform:translateY(18px) translateX(-10px) rotateX(380deg) rotateY(320deg) rotateZ(150deg); }
  40%  { transform:translateY(-28px) translateX(5px) rotateX(560deg) rotateY(500deg) rotateZ(270deg); }
  58%  { transform:translateY(5px) translateX(-2px) rotateX(670deg) rotateY(660deg) rotateZ(338deg); }
  76%  { transform:translateY(-4px) rotateX(712deg) rotateY(714deg) rotateZ(356deg); }
  92%  { transform:translateY(1px) rotateX(720deg) rotateY(720deg) rotateZ(360deg); }
  100% { transform:translateY(0) rotateX(720deg) rotateY(720deg) rotateZ(360deg); }
}

.dice-shadow {
  position:absolute; bottom:-18px; left:50%;
  width:50px; height:8px; border-radius:50%;
  background:radial-gradient(ellipse, rgba(0,0,0,.5), transparent);
  opacity:0; transform:translateX(-50%) scale(.3);
}
.dice-shadow-0 { animation:diceShadow 2.6s ease forwards; }
.dice-shadow-1 { animation:diceShadow 2.6s ease .12s forwards; }
.dice-shadow-2 { animation:diceShadow 2.6s ease .24s forwards; }
@keyframes diceShadow {
  0%,15% { opacity:0; transform:translateX(-50%) scale(.3); }
  20%  { opacity:.6; transform:translateX(-50%) scale(1.2); }
  35%  { opacity:.2; transform:translateX(-50%) scale(.8); }
  52%  { opacity:.5; transform:translateX(-50%) scale(1.1); }
  70%  { opacity:.3; transform:translateX(-50%) scale(.9); }
  100% { opacity:.4; transform:translateX(-50%) scale(1); }
}

/* ─── FATE: Card shuffle and flip ─── */
.card-scene { position:relative; width:150px; height:210px; margin:0 auto; }
.card-stack { position:absolute; inset:0; }
.stack-card {
  position:absolute; left:0; width:100%; height:100%;
  border-radius:12px; overflow:hidden;
}
.stack-card-inner {
  width:100%; height:100%; border-radius:12px;
  background:
    radial-gradient(ellipse at 50% 30%, rgba(212,165,116,.06), transparent 50%),
    linear-gradient(160deg, #14101e, #0c0816);
  border:1.5px solid rgba(212,165,116,.15);
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 16px rgba(0,0,0,.3);
}
[data-theme="light"] .stack-card-inner {
  background:linear-gradient(160deg, #f0e8dd, #e4d9cc);
  border-color:rgba(184,137,106,.18);
  box-shadow:0 2px 10px rgba(0,0,0,.06);
}
.card-back-design {
  position:relative; width:calc(100% - 16px); height:calc(100% - 16px);
  border:1px solid rgba(212,165,116,.1); border-radius:8px;
  display:flex; align-items:center; justify-content:center;
}
.card-back-star { font-size:1.8rem; color:var(--gold); opacity:.35; }
.card-back-ring {
  position:absolute; width:54px; height:54px; border-radius:50%;
  border:1px solid rgba(212,165,116,.08);
}

.stack-card-0 { top:10px; animation:shuffleL 1.8s ease-in-out forwards; }
.stack-card-1 { top:7px;  animation:shuffleR 1.8s ease-in-out .06s forwards; }
.stack-card-2 { top:4px;  animation:shuffleL 1.8s ease-in-out .12s forwards; }
.stack-card-3 { top:1px;  animation:shuffleR 1.8s ease-in-out .18s forwards; }
.stack-card-4 { top:-2px; animation:shuffleL 1.8s ease-in-out .24s forwards; }

@keyframes shuffleL {
  0%   { transform:translateX(0); opacity:1; }
  18%  { transform:translateX(-48px) rotate(-10deg); }
  36%  { transform:translateX(36px) rotate(7deg); }
  54%  { transform:translateX(-20px) rotate(-4deg); }
  72%  { transform:translateX(8px) rotate(1.5deg); }
  86%  { transform:translateX(0) rotate(0); opacity:1; }
  100% { transform:translateX(0) scale(.94); opacity:0; }
}
@keyframes shuffleR {
  0%   { transform:translateX(0); opacity:1; }
  18%  { transform:translateX(48px) rotate(10deg); }
  36%  { transform:translateX(-36px) rotate(-7deg); }
  54%  { transform:translateX(20px) rotate(4deg); }
  72%  { transform:translateX(-8px) rotate(-1.5deg); }
  86%  { transform:translateX(0) rotate(0); opacity:1; }
  100% { transform:translateX(0) scale(.94); opacity:0; }
}

.card-hero {
  position:absolute; left:0; top:0; width:100%; height:100%;
  perspective:600px;
}
.card-hero-inner {
  width:100%; height:100%; position:relative;
  transform-style:preserve-3d;
  animation:heroFlip 3.4s ease forwards;
}
.card-hero-back, .card-hero-front {
  position:absolute; inset:0;
  backface-visibility:hidden; border-radius:12px;
}
.card-hero-back {
  background:
    radial-gradient(ellipse at 50% 30%, rgba(212,165,116,.06), transparent 50%),
    linear-gradient(160deg, #14101e, #0c0816);
  border:1.5px solid rgba(212,165,116,.15);
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 16px rgba(0,0,0,.3);
}
[data-theme="light"] .card-hero-back {
  background:linear-gradient(160deg, #f0e8dd, #e4d9cc);
  border-color:rgba(184,137,106,.18);
}
.card-hero-front {
  transform:rotateY(180deg);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:12px; padding:24px 14px;
  background:
    radial-gradient(ellipse at 50% 20%, rgba(212,165,116,.12), transparent 60%),
    linear-gradient(160deg, #16101e, #0c0818);
  border:1.5px solid rgba(212,165,116,.28);
  box-shadow:0 0 30px rgba(212,165,116,.12), 0 8px 24px rgba(0,0,0,.3);
}
[data-theme="light"] .card-hero-front {
  background:
    radial-gradient(ellipse at 50% 20%, rgba(184,137,106,.08), transparent 60%),
    linear-gradient(160deg, #faf5ee, #f0e8dc);
  border-color:rgba(184,137,106,.25);
  box-shadow:0 0 20px rgba(184,137,106,.08), 0 6px 16px rgba(0,0,0,.06);
}
.card-hero-sigil { font-size:1.6rem; color:var(--gold); opacity:.6; }
.card-hero-title {
  font-size:1.05rem; font-weight:700; color:var(--gold);
  text-align:center; line-height:1.3;
}
.card-hero-line {
  width:36px; height:1px;
  background:linear-gradient(90deg, transparent, var(--gold), transparent);
  opacity:.5;
}

@keyframes heroFlip {
  0%, 50%  { transform:translateY(0) rotateY(0) scale(.7); opacity:0; }
  58%  { transform:translateY(-12px) rotateY(0) scale(.92); opacity:1; }
  68%  { transform:translateY(-22px) rotateY(0) scale(1); }
  82%  { transform:translateY(-28px) rotateY(180deg) scale(1.02); }
  92%  { transform:translateY(-20px) rotateY(180deg) scale(1); }
  100% { transform:translateY(-16px) rotateY(180deg) scale(1); }
}

/* ─── COMPATIBILITY: Orbital convergence ─── */
.compat-scene {
  position:relative; width:220px; height:220px; margin:0 auto;
}
.compat-ring-track {
  position:absolute; top:50%; left:50%;
  width:170px; height:170px; border-radius:50%;
  border:1px solid rgba(212,165,116,.1);
  transform:translate(-50%,-50%);
  animation:ringSpin 4s linear infinite;
}
.compat-ring-track-2 {
  width:110px; height:110px;
  border-color:rgba(123,140,222,.08);
  animation-direction:reverse; animation-duration:3s;
}
@keyframes ringSpin { to { transform:translate(-50%,-50%) rotate(360deg); } }

.compat-orb {
  position:absolute; top:50%; left:50%;
  width:62px; height:62px; margin:-31px 0 0 -31px;
  border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  background:
    radial-gradient(circle at 38% 32%, rgba(255,255,255,.08), transparent 50%),
    radial-gradient(circle, rgba(212,165,116,.18), rgba(123,140,222,.08));
  border:1.5px solid rgba(212,165,116,.2);
  box-shadow:0 0 24px rgba(212,165,116,.18), 0 0 50px rgba(212,165,116,.06);
}
[data-theme="light"] .compat-orb {
  background:
    radial-gradient(circle at 38% 32%, rgba(255,255,255,.3), transparent 50%),
    radial-gradient(circle, rgba(184,137,106,.15), rgba(107,123,192,.06));
  border-color:rgba(184,137,106,.2);
  box-shadow:0 0 16px rgba(184,137,106,.1);
}
.compat-orb-sign { font-size:1.8rem; text-shadow:0 0 12px rgba(212,165,116,.3); }
.compat-orb-1 { animation:orbitOne 3s ease-in-out forwards; }
.compat-orb-2 { animation:orbitTwo 3s ease-in-out forwards; }

@keyframes orbitOne {
  0%   { transform:translate(-85px, 0) scale(.7); opacity:0; }
  10%  { opacity:1; }
  25%  { transform:translate(-50px, -45px) scale(1.05); }
  45%  { transform:translate(18px, -20px) scale(.95); }
  65%  { transform:translate(-15px, 22px) scale(1); }
  85%  { transform:translate(-18px, 0) scale(1); }
  100% { transform:translate(-18px, 0) scale(1); }
}
@keyframes orbitTwo {
  0%   { transform:translate(85px, 0) scale(.7); opacity:0; }
  10%  { opacity:1; }
  25%  { transform:translate(50px, 45px) scale(1.05); }
  45%  { transform:translate(-18px, 20px) scale(.95); }
  65%  { transform:translate(15px, -22px) scale(1); }
  85%  { transform:translate(18px, 0) scale(1); }
  100% { transform:translate(18px, 0) scale(1); }
}

.compat-burst {
  position:absolute; top:50%; left:50%;
  border-radius:50%; pointer-events:none;
  background:radial-gradient(circle, rgba(212,165,116,.5), rgba(123,140,222,.25), transparent 70%);
  transform:translate(-50%,-50%);
  animation:compatBurst 3s ease forwards;
}
@keyframes compatBurst {
  0%, 70%  { width:0; height:0; opacity:0; }
  82%  { width:160px; height:160px; opacity:.75; }
  100% { width:200px; height:200px; opacity:0; }
}

/* ─── NUMEROLOGY: Slot machine reel ─── */
.num-scene { display:flex; justify-content:center; }
.num-machine {
  position:relative; width:110px; border-radius:16px;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(212,165,116,.06), transparent 50%),
    var(--glass-bg);
  border:2px solid rgba(212,165,116,.2);
  box-shadow:0 0 28px rgba(212,165,116,.06), inset 0 0 20px rgba(0,0,0,.25);
  overflow:hidden;
}
[data-theme="light"] .num-machine {
  border-color:rgba(184,137,106,.18);
  box-shadow:0 0 16px rgba(184,137,106,.04), inset 0 0 10px rgba(0,0,0,.03);
}
.num-window { height:80px; overflow:hidden; }
.num-reel { transition:transform 2.8s cubic-bezier(.06,.82,.06,1); }
.num-digit {
  height:80px; display:flex; align-items:center; justify-content:center;
  font-size:2.8rem; font-weight:700; color:var(--gold);
  text-shadow:0 0 16px rgba(212,165,116,.2);
}
.num-shine-top, .num-shine-bot {
  position:absolute; left:0; right:0; height:22px; pointer-events:none; z-index:2;
}
.num-shine-top { top:0; background:linear-gradient(to bottom, var(--bg), transparent); }
.num-shine-bot { bottom:0; background:linear-gradient(to top, var(--bg), transparent); }

/* ── Play area (inputs + button) ── */
.gm-play-area {
  display:flex; flex-direction:column; gap:16px;
  max-width:340px; margin:0 auto; width:100%;
}
.gm-inputs { display:flex; flex-direction:column; gap:16px; }
.gm-input-group { display:flex; flex-direction:column; gap:5px; }
.gm-input-label {
  font-size:.72rem; font-weight:600; color:var(--gold); opacity:.8;
  text-transform:uppercase; letter-spacing:.14em;
}
.gm-input {
  width:100%; padding:14px 16px; border-radius:14px;
  background:rgba(212,165,116,.04);
  border:1px solid rgba(212,165,116,.15);
  color:var(--text); font-size:.95rem; font-family:var(--sans);
  transition:border-color .2s, box-shadow .2s;
}
.gm-input:focus {
  outline:none;
  border-color:var(--gold);
  box-shadow:0 0 0 3px rgba(212,165,116,.1);
}
[data-theme="light"] .gm-input { background:rgba(0,0,0,.03); }

/* ── Action button (ritual style) ── */
.gm-action-btn {
  position:relative; width:100%; padding:16px 24px; border-radius:14px;
  background:linear-gradient(135deg, rgba(212,165,116,.15), rgba(123,140,222,.1));
  border:1px solid rgba(212,165,116,.25);
  color:var(--gold); font-family:var(--serif); font-size:1rem; font-weight:600;
  letter-spacing:.04em;
  overflow:hidden; transition:all .2s;
}
.gm-action-btn::before {
  content:''; position:absolute; inset:0;
  background:linear-gradient(135deg, rgba(212,165,116,.08), transparent 60%);
  opacity:0; transition:opacity .2s;
}
.gm-action-btn:active::before { opacity:1; }
.gm-action-btn:disabled { opacity:.4; }
.gm-action-text { position:relative; z-index:1; }
.gm-error { color:var(--coral); font-size:.85rem; text-align:center; }

/* ── Result area ── */
.gm-result { display:flex; flex-direction:column; gap:20px; }
.gm-teaser {
  padding:20px; border-radius:16px; font-size:.9rem; line-height:1.65;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(212,165,116,.05) 0%, transparent 50%),
    var(--glass-bg);
  border:1px solid var(--glass-border);
}
.gm-teaser p { margin:0; }

/* ── Deep reading (unlocked) ── */
.gm-deep-reading { padding:16px; border-radius:14px; margin-top:4px; }
.gm-deep-header { margin-bottom:8px; }
.gm-deep-title { font-size:.95rem; font-weight:700; color:var(--gold); }
.gm-deep-text { font-size:.84rem; line-height:1.6; color:var(--text); margin:0; }

/* ── CTA + again ── */
.gm-cta { margin-top:4px; }
.gm-again {
  width:100%; text-align:center; padding:12px;
  font-size:.85rem; color:var(--muted);
  letter-spacing:.08em; text-transform:uppercase;
  transition:color .2s;
}
.gm-again:active { color:var(--gold); }

/* ── Dice result ── */
.gm-dice { margin-bottom:4px; }
.gm-dice-row { display:flex; gap:12px; justify-content:center; }
.gm-die {
  flex:1; max-width:110px; padding:20px 8px; border-radius:14px;
  display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center;
  background:
    radial-gradient(ellipse at 50% 20%, rgba(212,165,116,.08), transparent 60%),
    var(--glass-bg);
  border:1px solid rgba(212,165,116,.12);
  box-shadow:0 4px 16px rgba(0,0,0,.12);
}
.gm-die-label {
  font-size:.6rem; text-transform:uppercase; letter-spacing:.14em;
  color:var(--gold); opacity:.7; font-weight:600;
}
.gm-die-face { font-size:2rem; text-shadow:0 0 12px rgba(212,165,116,.2); }
.gm-die-name { font-size:.72rem; font-weight:600; color:var(--text); }

/* ── Fate card ── */
.gm-fate { display:flex; justify-content:center; margin-bottom:4px; }
.gm-fate-card {
  position:relative; width:100%; max-width:300px;
  border-radius:18px; overflow:hidden;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(212,165,116,.08), transparent 50%),
    var(--glass-bg);
  border:1px solid rgba(212,165,116,.15);
  box-shadow:0 8px 32px rgba(0,0,0,.2);
}
.gm-fate-border {
  position:absolute; inset:6px; border-radius:14px;
  border:1px solid rgba(212,165,116,.1);
  pointer-events:none;
}
.gm-fate-inner { position:relative; padding:32px 24px; text-align:center; }
.gm-fate-star {
  font-size:1.5rem; color:var(--gold); opacity:.6; margin-bottom:12px;
}
.gm-fate-title { font-size:1.3rem; font-weight:700; color:var(--gold); margin-bottom:12px; }
.gm-fate-meaning { font-size:.9rem; line-height:1.65; margin-bottom:16px; }
.gm-fate-divider {
  width:40px; height:1px; margin:0 auto 16px;
  background:linear-gradient(90deg, transparent, var(--gold), transparent);
}
.gm-fate-advice { font-size:.82rem; color:var(--muted); line-height:1.5; }
.gm-fate-advice em { color:var(--gold); font-style:normal; font-weight:600; }

/* ── Compatibility ── */
.gm-compat { display:flex; flex-direction:column; align-items:center; gap:20px; margin-bottom:4px; }
.gm-compat-duo { display:flex; align-items:center; gap:20px; }
.gm-compat-soul { display:flex; flex-direction:column; align-items:center; gap:4px; }
.gm-compat-icon { font-size:2.4rem; text-shadow:0 0 16px rgba(212,165,116,.2); }
.gm-compat-name { font-size:.8rem; font-weight:600; }
.gm-compat-bond { opacity:.6; }
.gm-compat-ring {
  width:130px; height:130px; border-radius:50%;
  border:2px solid rgba(212,165,116,.3);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
  box-shadow:0 0 30px rgba(212,165,116,.08), inset 0 0 30px rgba(212,165,116,.04);
}
.gm-compat-score { font-size:2.2rem; font-weight:700; color:var(--gold); }
.gm-compat-label {
  font-size:.65rem; text-transform:uppercase; letter-spacing:.08em;
  color:var(--muted); max-width:100px; text-align:center; line-height:1.3;
}

/* ── Numerology ── */
.gm-num { display:flex; flex-direction:column; align-items:center; gap:14px; margin-bottom:4px; }
.gm-num-circle {
  width:110px; height:110px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  background:
    radial-gradient(circle at 40% 35%, rgba(255,255,255,.06), transparent 40%),
    radial-gradient(circle, rgba(212,165,116,.1), rgba(123,140,222,.05));
  border:2px solid rgba(212,165,116,.2);
  box-shadow:0 0 40px rgba(212,165,116,.1);
}
.gm-num-number { font-size:3rem; font-weight:700; color:var(--gold); text-shadow:0 0 20px rgba(212,165,116,.3); }
.gm-num-trait { font-size:1.05rem; font-weight:700; color:var(--text); letter-spacing:.03em; }

/* ── Profile ── */
.prof-card { border-radius:var(--r-xl); padding:var(--sp-3xl) var(--sp-2xl); display:flex; flex-direction:column; align-items:center; gap:var(--sp-sm); margin-bottom:var(--sp-2xl); }
.prof-av {
  width:68px; height:68px; border-radius:50%;
  background:linear-gradient(135deg, var(--gold), #b8896a);
  display:flex; align-items:center; justify-content:center;
  font-size:1.6rem; font-weight:700; color:#0B1121;
  box-shadow:0 2px 16px rgba(212,165,116,.2);
}
.prof-name { font-size:var(--fs-xl); font-weight:700; margin-top:var(--sp-xs); letter-spacing:-.015em; }
.prof-tier { font-size:var(--fs-sm); color:var(--muted); margin-top:2px; letter-spacing:.02em; }
.prof-heb { color:var(--muted); font-size:var(--fs-md); }
.prof-group { margin-bottom:var(--sp-xl); }
.prof-group-title { font-size:var(--fs-xs); text-transform:uppercase; letter-spacing:.1em; color:var(--gold); font-weight:600; margin-bottom:var(--sp-sm); padding-left:var(--sp-xs); }
.prof-signs { border-radius:var(--r-md); overflow:hidden; }
.sign-row { display:flex; align-items:center; gap:var(--sp-md); padding:var(--sp-md) var(--sp-lg); border-bottom:1px solid var(--glass-border); min-height:44px; }
.sign-row:last-child { border-bottom:0; }
.sign-sym { font-size:1.05rem; width:22px; text-align:center; }
.sign-label { flex:1; color:var(--muted); font-size:var(--fs-base); }
.sign-value { font-weight:600; font-size:var(--fs-base); }
.prof-rows { border-radius:var(--r-md); overflow:hidden; }
.prow { display:flex; justify-content:space-between; align-items:center; padding:var(--sp-md) var(--sp-lg); border-bottom:1px solid var(--glass-border); min-height:44px; font-size:var(--fs-base); }
.prow:last-child { border-bottom:0; }
.prow-l { color:var(--muted); }
.prow--btn { width:100%; text-align:left; cursor:pointer; transition:background var(--dur-fast); }
.prow--btn:active { background:rgba(255,255,255,.025); }
[data-theme="light"] .prow--btn:active { background:rgba(0,0,0,.025); }
.prow-about { padding:0 var(--sp-lg) var(--sp-lg); color:var(--muted); font-size:var(--fs-base); line-height:1.65; }
.prow-theme { display:flex; gap:var(--sp-xs); }
.prow-theme-btn { padding:var(--sp-sm) var(--sp-lg); border-radius:var(--r-sm); font-size:var(--fs-sm); font-weight:600; color:var(--muted); background:var(--bg2); border:1px solid var(--glass-border); transition:all var(--dur-normal); }
.prow-theme-btn--on { color:var(--gold); border-color:var(--gold); background:rgba(212,165,116,.06); }
.prow-coming-soon { font-size:var(--fs-sm); color:var(--muted); font-style:italic; }
.segmented { display:flex; gap:var(--sp-sm); flex-wrap:wrap; justify-content:flex-end; }
.segmented-btn { padding:var(--sp-sm) var(--sp-md); border-radius:var(--r-full); font-size:var(--fs-sm); font-weight:600; color:var(--muted); background:var(--bg2); border:1px solid var(--glass-border); transition:all var(--dur-normal); }
.segmented-btn--on { color:var(--gold); border-color:var(--gold); background:rgba(212,165,116,.06); }
.prof-edit { margin-top:var(--sp-xs); }
.profile-panel-body { padding:var(--sp-xl) var(--page-x) var(--sp-4xl); display:flex; flex-direction:column; gap:var(--sp-lg); }
.legal-stack { display:flex; flex-direction:column; gap:var(--sp-md); }
.legal-card { border-radius:var(--r-lg); padding:var(--sp-xl); }
.legal-title { font-size:var(--fs-md); font-weight:700; margin-bottom:var(--sp-sm); letter-spacing:-.01em; }
.legal-copy { color:var(--muted); font-size:var(--fs-base); line-height:1.65; }
.subscription-status { border-radius:var(--r-xl); padding:var(--sp-xl); }
.subscription-status-title { font-size:1.15rem; font-weight:700; margin-bottom:8px; color:var(--gold); }
.subscription-status-copy { color:var(--muted); font-size:.92rem; line-height:1.65; }
.subscription-grid { display:grid; gap:10px; }
.subscription-card { border-radius:18px; padding:16px; display:flex; flex-direction:column; gap:8px; }
.subscription-card-title { font-size:.92rem; font-weight:700; }
.subscription-card-copy { color:var(--muted); font-size:.86rem; line-height:1.55; }
.subscription-badge {
  align-self:flex-start;
  padding:6px 10px;
  border-radius:999px;
  font-size:.72rem;
  font-weight:700;
  color:var(--gold);
  background:rgba(212,165,116,.08);
  border:1px solid rgba(212,165,116,.18);
}
.prow-note { padding:14px 16px; color:var(--muted); font-size:.82rem; line-height:1.55; }
.prof-ver { text-align:center; color:var(--muted); font-size:.78rem; margin-top:28px; opacity:.4; letter-spacing:.04em; }

/* ── Toggle ── */
.toggle { width:48px; height:28px; border-radius:14px; background:rgba(255,255,255,.08); position:relative; transition:background .2s; flex-shrink:0; }
[data-theme="light"] .toggle { background:rgba(0,0,0,.08); }
.toggle--on { background:var(--gold) !important; }
.toggle-knob { width:22px; height:22px; border-radius:50%; background:#fff; position:absolute; top:3px; left:3px; transition:transform .2s cubic-bezier(.4,0,.2,1); box-shadow:0 1px 4px rgba(0,0,0,.2); }
.toggle--on .toggle-knob { transform:translateX(20px); }

/* ── Bottom nav ── */
.bnav {
  position:fixed; bottom:0; left:0; right:0; z-index:100;
  height:var(--nav-h);
  background:var(--nav-bg); backdrop-filter:blur(28px); -webkit-backdrop-filter:blur(28px);
  border-top:1px solid var(--glass-border);
  display:flex; justify-content:space-around; align-items:flex-start;
  padding-top:6px;
  padding-bottom:env(safe-area-inset-bottom,0);
}
.bnav-tab {
  display:flex; flex-direction:column; align-items:center; gap:2px;
  flex:1; min-width:0; min-height:44px; padding:4px 0;
  font-size:.6rem; color:var(--muted); transition:color var(--dur-normal) var(--ease-smooth);
  letter-spacing:.02em;
}
.bnav-tab--on { color:var(--gold); }
.bnav-tab span { font-weight:600; }
.bnav-tab svg { transition:transform var(--dur-fast) var(--ease-spring); }
.bnav-tab:active svg { transform:scale(.85); }

/* ══════════════════════════════════════════════════════
   SystemApp — individual system "mini app" with swipe
   ══════════════════════════════════════════════════════ */

/* ── Gauge animations ── */
@keyframes gaugeReveal {
  from { stroke-dashoffset: var(--gauge-circ); }
  to { stroke-dashoffset: var(--gauge-offset); }
}
@keyframes sysParticle {
  0%, 100% { opacity: 0; transform: scale(0.5) translateY(0); }
  20% { opacity: 0.7; }
  50% { opacity: 0.4; transform: scale(1.2) translateY(-20px); }
  80% { opacity: 0.6; }
}
@keyframes heroGlow {
  0%, 100% { transform: scale(1); opacity: 0.25; }
  50% { transform: scale(1.3); opacity: 0.5; }
}
@keyframes sephirahPulse {
  0%, 100% { r: 22; opacity: 0.15; }
  50% { r: 28; opacity: 0.35; }
}
@keyframes chartDraw {
  from { opacity: 0; stroke-dashoffset: 600; }
  to { opacity: 1; stroke-dashoffset: 0; }
}
@keyframes planetFadeIn {
  from { opacity: 0; transform: scale(0); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes numberPop {
  0% { opacity: 0; transform: scale(0.3); }
  60% { transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes pullQuoteSlide {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}

.sysapp {
  display: flex; flex-direction: column; min-height: 100%; background: var(--bg);
  --sys-color: var(--gold);
}

/* ── Header ── */
.sysapp-header {
  position: sticky; top: 0; z-index: 50;
  background: var(--detail-hd-bg); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  display: flex; align-items: center; gap: var(--sp-md);
  padding: calc(var(--sp-md) + var(--safe-top)) var(--sp-lg) var(--sp-md);
  min-height: calc(48px + var(--safe-top));
  border-bottom: 1px solid var(--glass-border);
}
.sysapp-header-icon { font-size: 1.4rem; }
.sysapp-header-text { display: flex; flex-direction: column; gap: 1px; }
.sysapp-header-name { font-size: var(--fs-lg); font-weight: 700; line-height: 1.2; letter-spacing: -.01em; }
.sysapp-header-page { font-size: var(--fs-xs); color: var(--sys-color, var(--gold)); font-weight: 600; text-transform: uppercase; letter-spacing: .08em; }

/* ── Page indicator tabs (iOS segmented control feel) ── */
.sysapp-pages-indicator {
  display: flex; justify-content: center; gap: 2px; padding: var(--sp-md) var(--sp-lg) var(--sp-sm);
  background: var(--bg); position: sticky; top: calc(48px + var(--safe-top)); z-index: 40;
}
.sysapp-page-dot {
  flex: 1; max-width: 88px; min-height: 32px; border-radius: var(--r-sm);
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none;
  transition: all var(--dur-normal) var(--ease-smooth);
}
.sysapp-page-dot--active {
  background: var(--glass-bg); border-radius: var(--r-sm);
  box-shadow: var(--shadow-sm);
}
.sysapp-page-dot-label {
  font-size: var(--fs-xs); font-weight: 600; color: var(--muted);
  letter-spacing: .03em; transition: color var(--dur-normal);
}
.sysapp-page-dot--active .sysapp-page-dot-label { color: var(--text); font-weight: 700; }

/* ── Active page container ── */
.sysapp-active-page {
  padding-bottom: calc(var(--nav-h) + 24px);
}
.sysapp-content {
  padding: 20px 20px 32px;
  display: flex; flex-direction: column; gap: 18px;
  position: relative;
}

/* ── Swipe hint ── */
.sysapp-swipe-hint {
  position: fixed; bottom: calc(var(--nav-h) + 8px); left: 0; right: 0;
  display: flex; justify-content: center; pointer-events: none; z-index: 10;
}
.sysapp-swipe-hint span {
  font-size: .72rem; color: var(--muted); opacity: .5;
  padding: 4px 12px; border-radius: 999px;
  background: var(--glass-bg); backdrop-filter: blur(8px);
}


/* ══════════════════════════════════════════════
   Score Gauge Component
   ══════════════════════════════════════════════ */
.sa-gauge {
  position: relative; display: flex; align-items: center; justify-content: center;
  margin: 0 auto;
  animation: staggerIn .5s cubic-bezier(.4,0,.2,1) both;
}
.sa-gauge-svg { width: 100%; height: 100%; }
.sa-gauge-ring {
  stroke-dashoffset: var(--gauge-circ);
  animation: gaugeReveal 1.2s cubic-bezier(.22,1,.36,1) both;
  filter: drop-shadow(0 0 6px currentColor);
}
.sa-gauge-inner {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.sa-gauge-value { font-weight: 700; line-height: 1; }
.sa-gauge-label { font-size: .65rem; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; margin-top: 2px; }

/* Mini gauge (insight cards) */
.sa-mini-gauge { position: relative; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sa-mini-gauge svg { width: 100%; height: 100%; }
.sa-mini-gauge-val {
  position: absolute; font-weight: 700; line-height: 1;
}


/* ══════════════════════════════════════════════
   Floating Particles
   ══════════════════════════════════════════════ */
.sa-particles {
  position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0;
}
.sa-particle {
  position: absolute; border-radius: 50%;
  animation: sysParticle 5s ease-in-out infinite;
  opacity: 0;
}


/* ══════════════════════════════════════════════
   PAGE 1 — Overview (the "wow" page)
   ══════════════════════════════════════════════ */
.sa-overview { position: relative; z-index: 1; }

/* Hero section */
.sa-hero {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  padding: 24px 0 8px; position: relative; z-index: 1;
}
.sa-hero-icon-wrap {
  position: relative; width: 80px; height: 80px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12px;
}
.sa-hero-glow {
  position: absolute; inset: -16px; border-radius: 50%;
  background: radial-gradient(circle, var(--sys-color), transparent 70%);
  animation: heroGlow 3s ease-in-out infinite;
  pointer-events: none;
}
.sa-hero-icon {
  font-size: 3.2rem; position: relative; z-index: 1;
  animation: iconBreathe 3s ease-in-out infinite;
  filter: drop-shadow(0 0 12px var(--sys-color));
}
.sa-hero-name {
  font-size: 1.5rem; font-weight: 700; margin-bottom: 4px;
  background: linear-gradient(135deg, var(--text), var(--sys-color));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.sa-hero-desc { color: var(--muted); font-size: .88rem; margin-bottom: 16px; }

/* System flavor badges */
.sa-flavor { display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%; }
.sa-flavor-trifecta { flex-direction: row; justify-content: center; flex-wrap: wrap; gap: 8px; }
.sa-flavor-pill {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 999px;
  background: color-mix(in srgb, var(--pill-color, var(--sys-color)) 10%, var(--glass-bg));
  border: 1px solid color-mix(in srgb, var(--pill-color, var(--sys-color)) 25%, transparent);
  backdrop-filter: blur(12px);
}
.sa-flavor-sym { font-size: 1rem; }
.sa-flavor-lbl { font-size: .68rem; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
.sa-flavor-val { font-size: .82rem; font-weight: 700; color: var(--text); }

/* Chinese animal flavor */
.sa-flavor-chinese { align-items: center; }
.sa-flavor-animal-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 18px 28px; border-radius: 20px;
  background: color-mix(in srgb, var(--pill-color) 8%, var(--glass-bg));
  border: 1px solid color-mix(in srgb, var(--pill-color) 20%, transparent);
  backdrop-filter: blur(12px);
}
.sa-flavor-animal-icon { font-size: 2.4rem; animation: iconBreathe 3s ease-in-out infinite; }
.sa-flavor-animal-name { font-size: 1.3rem; font-weight: 700; }
.sa-flavor-element-badge {
  font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
  padding: 3px 12px; border-radius: 999px;
  background: color-mix(in srgb, var(--pill-color) 15%, transparent);
  color: var(--pill-color);
}
.sa-flavor-polarity { font-size: .75rem; color: var(--muted); }

/* BaZi flavor */
.sa-flavor-bazi { flex-direction: row; justify-content: center; gap: 12px; flex-wrap: wrap; }
.sa-flavor-daymaster {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px; border-radius: 16px;
  background: color-mix(in srgb, var(--pill-color) 8%, var(--glass-bg));
  border: 1px solid color-mix(in srgb, var(--pill-color) 20%, transparent);
  backdrop-filter: blur(12px);
}
.sa-flavor-dm-char { font-size: 2rem; color: var(--pill-color); }
.sa-flavor-dm-info { display: flex; flex-direction: column; gap: 2px; }
.sa-flavor-dm-label { font-size: .68rem; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
.sa-flavor-dm-value { font-size: 1.1rem; font-weight: 700; }

/* Numerology flavor */
.sa-flavor-numerology { align-items: center; gap: 12px; }
.sa-flavor-number-hero {
  display: flex; flex-direction: column; align-items: center;
  padding: 20px 32px; border-radius: 20px;
  background: color-mix(in srgb, var(--pill-color) 8%, var(--glass-bg));
  border: 1px solid color-mix(in srgb, var(--pill-color) 20%, transparent);
  backdrop-filter: blur(12px);
  animation: numberPop .6s cubic-bezier(.22,1,.36,1) both;
}
.sa-flavor-number-big {
  font-size: 3rem; font-weight: 700; line-height: 1;
  background: linear-gradient(135deg, var(--pill-color), var(--text));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 8px var(--pill-color));
}
.sa-flavor-number-label {
  font-size: .72rem; color: var(--muted); text-transform: uppercase; letter-spacing: .1em;
  font-weight: 600; margin-top: 4px;
}
.sa-flavor-number-row { display: flex; gap: 10px; }
.sa-flavor-number-sm {
  display: flex; flex-direction: column; align-items: center;
  padding: 10px 16px; border-radius: 14px;
  background: color-mix(in srgb, var(--pill-color) 6%, var(--glass-bg));
  border: 1px solid color-mix(in srgb, var(--pill-color) 15%, transparent);
}
.sa-flavor-number-sm-val { font-size: 1.4rem; font-weight: 700; color: var(--pill-color); }
.sa-flavor-number-sm-lbl { font-size: .62rem; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }

/* Kabbalistic flavor */
.sa-flavor-kabbalistic { align-items: center; gap: 12px; }
.sa-flavor-sephirah {
  display: flex; flex-direction: column; align-items: center;
  padding: 18px 28px; border-radius: 20px;
  background: color-mix(in srgb, var(--pill-color) 8%, var(--glass-bg));
  border: 1px solid color-mix(in srgb, var(--pill-color) 20%, transparent);
  backdrop-filter: blur(12px);
}
.sa-flavor-sephirah-glow {
  font-size: 2.2rem; animation: iconBreathe 3s ease-in-out infinite;
  filter: drop-shadow(0 0 10px var(--pill-color));
}
.sa-flavor-sephirah-name { font-size: 1.2rem; font-weight: 700; margin-top: 4px; }
.sa-flavor-sephirah-label { font-size: .68rem; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; font-weight: 600; }

/* Gematria flavor - reuses number-hero */
.sa-flavor-gematria { align-items: center; gap: 10px; }

/* Persian flavor - reuses pills */
.sa-flavor-persian { flex-direction: row; justify-content: center; flex-wrap: wrap; gap: 8px; }


/* Agreement badge */
.sa-agreement {
  border-radius: 16px; padding: 14px 16px;
  display: flex; align-items: center; gap: 14px;
}
.sa-agreement-gauge { flex-shrink: 0; }
.sa-agreement-info { display: flex; flex-direction: column; gap: 3px; }
.sa-agreement-label { font-size: .9rem; font-weight: 700; }
.sa-agreement-sub { font-size: .78rem; color: var(--muted); line-height: 1.4; }

/* Headline */
.sa-headline { margin-top: 2px; }
.sa-headline-text {
  font-size: 1.2rem; font-weight: 700; line-height: 1.45;
  background: linear-gradient(135deg, var(--gold), color-mix(in srgb, var(--gold) 60%, var(--text)));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Area scores */
.sa-scores { display: flex; flex-direction: column; gap: 8px; }
.sa-score-row {
  border-radius: 14px; padding: 12px 14px;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.sa-score-left { display: flex; align-items: center; gap: 8px; min-width: 80px; }
.sa-score-icon { font-size: 1rem; width: 20px; text-align: center; }
.sa-score-label { font-size: .82rem; font-weight: 600; color: var(--muted); }
.sa-score-bar-track {
  flex: 1; height: 6px; border-radius: 3px;
  background: rgba(255,255,255,.04); overflow: hidden; min-width: 60px;
}
[data-theme="light"] .sa-score-bar-track { background: rgba(0,0,0,.06); }
.sa-score-bar { height: 100%; border-radius: 3px; position: relative; }
.sa-score-bar::after {
  content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 8px;
  border-radius: 0 3px 3px 0;
  background: inherit; filter: brightness(1.3);
}
.sa-score-pct { font-size: 1.1rem; font-weight: 700; min-width: 42px; text-align: right; }
.sa-score-sentiment {
  font-size: .7rem; color: var(--muted); width: 100%;
  padding-left: 88px; margin-top: -4px;
}

/* Summary preview */
.sa-summary-preview { margin-top: 4px; position: relative; z-index: 1; }
.sa-summary-preview p {
  color: var(--muted); font-size: .9rem; line-height: 1.7;
  font-style: italic; position: relative; padding-left: 16px;
}
.sa-summary-preview p::before {
  content: '\u201C'; position: absolute; left: 0; top: -4px;
  font-size: 1.6rem; color: var(--sys-color); opacity: .4;
  font-family: var(--serif);
}


/* ══════════════════════════════════════════════
   PAGE 2 — Details (deep dive + charts)
   ══════════════════════════════════════════════ */

/* Section header */
.sa-section-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 4px;
}
.sa-section-header h3 { font-size: 1.25rem; font-weight: 700; }

/* Badges */
.sa-badge {
  font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em;
  padding: 4px 10px; border-radius: 999px;
}
.sa-badge-chart {
  background: color-mix(in srgb, var(--sys-color) 12%, transparent);
  color: var(--sys-color);
  border: 1px solid color-mix(in srgb, var(--sys-color) 25%, transparent);
}
.sa-badge-data {
  background: rgba(123,140,222,.1); color: var(--accent);
  border: 1px solid rgba(123,140,222,.2);
}

/* Chart wrapper (shared) */
.sa-chart-wrap {
  width: 100%; border-radius: 18px; padding: 16px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
  overflow: hidden;
}
.sa-chart-svg {
  width: 100%; height: auto; display: block;
}
.sa-chart-draw {
  stroke-dasharray: 600; stroke-dashoffset: 600;
  animation: chartDraw 1.5s cubic-bezier(.22,1,.36,1) both;
}
.sa-chart-text {
  animation: staggerIn .5s cubic-bezier(.4,0,.2,1) both;
  animation-delay: 0.8s;
}
.sa-chart-planet {
  opacity: 0;
  animation: planetFadeIn .4s cubic-bezier(.22,1,.36,1) both;
}

/* Kabbalistic sephirah nodes */
.sa-chart-sephirah {
  opacity: 0;
  animation: planetFadeIn .4s cubic-bezier(.22,1,.36,1) both;
}
.sa-chart-sephirah--active .sa-sephirah-glow {
  animation: sephirahPulse 2s ease-in-out infinite;
}

/* BaZi Four Pillars */
.sa-bazi-pillars {
  display: flex; justify-content: center; gap: 12px; padding: 12px 0;
}
.sa-bazi-pillar {
  display: flex; flex-direction: column; align-items: center;
  padding: 16px 14px; border-radius: 16px; min-width: 64px;
  background: color-mix(in srgb, var(--sys-color) 6%, var(--glass-bg));
  border: 1px solid color-mix(in srgb, var(--sys-color) 18%, transparent);
  backdrop-filter: blur(12px);
}
.sa-bazi-pillar-label {
  font-size: .65rem; color: var(--muted); text-transform: uppercase;
  letter-spacing: .06em; font-weight: 600; margin-bottom: 8px;
}
.sa-bazi-pillar-stem {
  font-size: 1.3rem; font-weight: 700; color: var(--sys-color);
  margin-bottom: 6px;
}
.sa-bazi-pillar-divider {
  width: 24px; height: 2px; border-radius: 1px; opacity: .4;
  margin: 4px 0;
}
.sa-bazi-pillar-branch {
  font-size: 1.1rem; font-weight: 600; color: var(--text);
  margin-top: 6px;
}

/* ═══ Rich BaZi Display ═══ */
.bz-rich { width: 100%; }
.bz-tabs {
  display: flex; gap: 4px; overflow-x: auto; padding: 4px 0 12px;
  -webkit-overflow-scrolling: touch; scrollbar-width: none;
}
.bz-tabs::-webkit-scrollbar { display: none; }
.bz-tab {
  flex: 0 0 auto; padding: 6px 14px; border-radius: 20px;
  font-size: .72rem; font-weight: 600; letter-spacing: .03em;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--muted); white-space: nowrap; transition: all .25s;
}
.bz-tab--active {
  background: var(--bz-accent, #d4a44a); color: #000;
  border-color: var(--bz-accent, #d4a44a); box-shadow: 0 0 12px rgba(212,164,74,.3);
}
.bz-section { padding: 0 0 16px; }
.bz-sub-title {
  font-size: .8rem; font-weight: 700; color: var(--text);
  margin: 12px 0 8px; letter-spacing: .02em;
}
.bz-section-badge {
  display: inline-block; font-size: .65rem; font-weight: 700;
  padding: 3px 10px; border-radius: 12px;
  background: linear-gradient(135deg, #d4a44a, #b8860b); color: #000;
  letter-spacing: .05em; text-transform: uppercase;
}
.bz-section-badge--transit {
  background: linear-gradient(135deg, #7c4dff, #536dfe); color: #fff;
}

/* ── Pillar Cards ── */
.bz-pillar-label-row { margin-bottom: 10px; }
.bz-pillars-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
}
.bz-pillar-card {
  display: flex; flex-direction: column; align-items: center;
  padding: 10px 4px 8px; border-radius: 14px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px); position: relative; overflow: hidden;
}
.bz-pillar-card--dm {
  border: 2px solid var(--stem-color, #d4a44a);
  box-shadow: 0 0 16px rgba(212,164,74,.15);
}
.bz-pillar-header {
  font-size: .6rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .08em; color: var(--muted); margin-bottom: 4px;
}
.bz-pillar-tg {
  font-size: .55rem; color: var(--muted); margin-bottom: 6px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 100%; text-align: center;
}
.bz-pillar-stem-box, .bz-pillar-branch-box {
  width: 90%; padding: 6px 2px; border-radius: 10px;
  border: 1.5px solid; display: flex; flex-direction: column;
  align-items: center; margin: 2px 0;
}
.bz-pillar-chinese {
  font-size: 1.6rem; font-weight: 700; line-height: 1.2;
  color: var(--text);
}
.bz-pillar-pinyin {
  font-size: .58rem; color: var(--muted); margin-top: 1px;
}
.bz-pillar-element-badge {
  display: inline-block; font-size: .5rem; font-weight: 700;
  padding: 1px 6px; border-radius: 8px; margin-top: 3px;
  color: #000; letter-spacing: .04em;
}
.bz-hidden-stems {
  width: 90%; margin-top: 6px; display: flex; flex-direction: column;
  gap: 2px;
}
.bz-hidden-stem {
  display: flex; align-items: center; gap: 3px;
  font-size: .5rem; color: var(--muted);
  padding: 1px 4px; border-radius: 4px;
  background: rgba(255,255,255,.03);
}
.bz-hs-chinese { font-weight: 700; color: var(--text); font-size: .6rem; }
.bz-hs-name { font-weight: 600; }
.bz-hs-tg { margin-left: auto; font-size: .45rem; opacity: .7; }
.bz-pillar-nayin {
  font-size: .5rem; color: var(--muted); margin-top: 6px;
  text-align: center; font-style: italic; line-height: 1.2;
}
.bz-dm-badge {
  position: absolute; top: 0; right: 0;
  font-size: .45rem; font-weight: 700; padding: 2px 6px;
  border-radius: 0 14px 0 8px; color: #000;
  letter-spacing: .04em; text-transform: uppercase;
}

/* ── Branch interactions ── */
.bz-interactions { margin-top: 14px; }
.bz-interaction-list { display: flex; flex-wrap: wrap; gap: 6px; }
.bz-interaction-pill {
  display: flex; flex-direction: column; padding: 6px 10px;
  border-radius: 10px; font-size: .6rem;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
}
.bz-ix-pos { border-color: rgba(76,175,80,.4); }
.bz-ix-neg { border-color: rgba(244,67,54,.4); }
.bz-ix-type { font-weight: 700; }
.bz-ix-detail { color: var(--muted); font-size: .55rem; }

/* ── Transit pillar cards (smaller) ── */
.bz-current-section { margin-top: 18px; }
.bz-pillars-grid--sm { gap: 6px; }
.bz-transit-card {
  display: flex; flex-direction: column; align-items: center;
  padding: 8px 4px; border-radius: 10px;
  background: rgba(124,77,255,.06); border: 1px solid rgba(124,77,255,.2);
}
.bz-transit-header {
  font-size: .55rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: var(--muted); margin-bottom: 2px;
}
.bz-transit-chinese { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.bz-transit-info { font-size: .55rem; color: var(--muted); }
.bz-transit-tg { font-size: .5rem; color: #7c4dff; font-weight: 600; margin-top: 2px; }

/* ── Element Balance ── */
.bz-element-bars { display: flex; flex-direction: column; gap: 10px; }
.bz-el-row { display: flex; align-items: center; gap: 8px; }
.bz-el-name {
  width: 48px; font-size: .72rem; font-weight: 600; color: var(--text);
  text-align: right;
}
.bz-el-track {
  flex: 1; height: 22px; border-radius: 11px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  overflow: hidden;
}
.bz-el-fill { height: 100%; border-radius: 11px; min-width: 2px; }
.bz-el-pct { width: 36px; font-size: .72rem; font-weight: 700; text-align: left; }

/* ── Day Master Strength ── */
.bz-strength-section { margin-top: 20px; }
.bz-strength-bar-wrap { margin: 8px 0 12px; }
.bz-strength-bar {
  display: flex; height: 28px; border-radius: 14px; overflow: hidden;
  border: 1px solid var(--glass-border);
}
.bz-str-fill {
  display: flex; align-items: center; justify-content: center;
  font-size: .65rem; font-weight: 700; color: #fff;
  transition: width .6s ease;
}
.bz-str-support { background: linear-gradient(90deg, #4caf50, #66bb6a); }
.bz-str-drain { background: linear-gradient(90deg, #ef5350, #f44336); }
.bz-str-labels {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 4px; font-size: .6rem; color: var(--muted);
}
.bz-str-verdict {
  font-weight: 700; font-size: .75rem; padding: 2px 12px;
  border-radius: 10px;
}
.bz-str-strong { color: #4caf50; background: rgba(76,175,80,.12); }
.bz-str-weak { color: #ff9800; background: rgba(255,152,0,.12); }

/* ── Favorable / Unfavorable ── */
.bz-fav-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0;
}
.bz-fav-col { display: flex; flex-direction: column; gap: 6px; }
.bz-fav-title {
  font-size: .65rem; font-weight: 700; color: #4caf50;
  text-transform: uppercase; letter-spacing: .05em;
}
.bz-fav-title--neg { color: #f44336; }
.bz-fav-pills { display: flex; flex-wrap: wrap; gap: 4px; }
.bz-fav-pill {
  font-size: .6rem; font-weight: 700; padding: 3px 10px;
  border-radius: 10px; color: #000;
}
.bz-fav-pill--neg {
  background: transparent; border: 1.5px solid;
  color: var(--text);
}
.bz-strategy {
  font-size: .72rem; color: var(--muted); line-height: 1.5;
  margin-top: 8px; padding: 10px; border-radius: 10px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
}

/* ── Day Master Profile ── */
.bz-profile-hero {
  text-align: center; padding: 20px 16px 16px;
  border-radius: 16px; margin-bottom: 14px;
  background: linear-gradient(135deg, rgba(212,164,74,.08), rgba(212,164,74,.02));
  border: 1px solid rgba(212,164,74,.2);
}
.bz-profile-chinese {
  font-size: 3rem; display: block; margin-bottom: 4px;
  color: var(--dm-color, #d4a44a); text-shadow: 0 0 20px rgba(212,164,74,.3);
}
.bz-profile-title { font-size: 1.1rem; color: var(--text); margin: 0; }
.bz-profile-nature {
  font-size: .7rem; color: var(--muted); font-weight: 600;
  letter-spacing: .05em; text-transform: uppercase;
}
.bz-profile-body { display: flex; flex-direction: column; gap: 12px; }
.bz-profile-text {
  font-size: .78rem; color: var(--text); line-height: 1.6;
  opacity: .9;
}
.bz-profile-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.bz-profile-list-card {
  padding: 10px; border-radius: 12px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
}
.bz-profile-list-card h5 {
  margin: 0 0 6px; font-size: .68rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: .04em;
}
.bz-profile-list-card--pos h5 { color: #4caf50; }
.bz-profile-list-card--neg h5 { color: #f44336; }
.bz-profile-list-card ul {
  margin: 0; padding: 0 0 0 14px; font-size: .68rem;
  color: var(--text); line-height: 1.6;
}
.bz-profile-detail-card {
  padding: 12px; border-radius: 12px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
}
.bz-profile-detail-card h5 {
  margin: 0 0 6px; font-size: .7rem; font-weight: 700;
  color: #d4a44a; text-transform: uppercase; letter-spacing: .04em;
}
.bz-profile-detail-card p {
  margin: 0; font-size: .72rem; color: var(--text); line-height: 1.5;
}

/* ── Symbolic Stars ── */
.bz-stars-list { display: flex; flex-direction: column; gap: 8px; }
.bz-star-card {
  padding: 12px; border-radius: 12px;
}
.bz-star--pos { border-left: 3px solid #4caf50; }
.bz-star--neg { border-left: 3px solid #f44336; }
.bz-star-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
  flex-wrap: wrap;
}
.bz-star-chinese { font-size: 1rem; color: #d4a44a; }
.bz-star-name { font-size: .78rem; font-weight: 700; color: var(--text); }
.bz-star-badge {
  font-size: .5rem; font-weight: 700; padding: 2px 8px;
  border-radius: 8px; background: rgba(76,175,80,.15); color: #4caf50;
  text-transform: uppercase; letter-spacing: .04em;
}
.bz-star-badge--neg { background: rgba(244,67,54,.15); color: #f44336; }
.bz-star-desc { font-size: .72rem; color: var(--text); line-height: 1.5; margin: 0 0 4px; }
.bz-star-found { font-size: .6rem; color: var(--muted); }
.bz-empty { font-size: .75rem; color: var(--muted); text-align: center; padding: 20px; }

/* ── Luck Periods ── */
.bz-current-luck {
  padding: 14px; border-radius: 14px; margin-bottom: 14px;
  border: 1.5px solid var(--bz-accent, #d4a44a);
  background: rgba(212,164,74,.06);
}
.bz-cl-badge {
  font-size: .55rem; font-weight: 700; padding: 2px 8px;
  border-radius: 8px; background: var(--bz-accent, #d4a44a); color: #000;
  text-transform: uppercase; letter-spacing: .05em;
}
.bz-cl-main {
  display: flex; align-items: baseline; gap: 10px; margin: 8px 0 4px;
  flex-wrap: wrap;
}
.bz-cl-chinese { font-size: 1.4rem; color: var(--text); }
.bz-cl-name { font-size: .85rem; font-weight: 600; color: var(--text); }
.bz-cl-ages { font-size: .7rem; color: var(--muted); }
.bz-cl-details {
  display: flex; gap: 12px; font-size: .65rem; color: var(--muted);
}
.bz-cl-tg { font-weight: 600; }
.bz-cl-nayin { font-style: italic; }

.bz-luck-timeline {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
}
.bz-luck-card {
  display: flex; flex-direction: column; align-items: center;
  padding: 10px 6px; border-radius: 12px; text-align: center;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  position: relative;
}
.bz-luck-card--current {
  border: 2px solid #d4a44a;
  box-shadow: 0 0 16px rgba(212,164,74,.15);
}
.bz-luck-ages { font-size: .72rem; font-weight: 700; color: var(--text); }
.bz-luck-years { font-size: .55rem; color: var(--muted); margin-bottom: 4px; }
.bz-luck-pillar { margin: 4px 0; }
.bz-luck-chinese { font-size: 1.2rem; display: block; color: var(--text); }
.bz-luck-pinyin { font-size: .55rem; color: var(--muted); }
.bz-luck-elements {
  display: flex; gap: 4px; margin: 4px 0;
}
.bz-luck-el {
  font-size: .48rem; font-weight: 700; padding: 1px 6px;
  border-radius: 6px; color: #000;
}
.bz-luck-tg { font-size: .52rem; color: var(--muted); font-weight: 600; }
.bz-luck-nayin { font-size: .48rem; color: var(--muted); font-style: italic; }
.bz-luck-now-badge {
  position: absolute; top: -1px; right: -1px;
  font-size: .45rem; font-weight: 800; padding: 2px 6px;
  border-radius: 0 12px 0 8px;
  background: #d4a44a; color: #000;
  letter-spacing: .06em;
}

/* Numerology number cards */
.sa-number-cards {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
}
.sa-number-card {
  border-radius: 16px; padding: 18px 14px;
  display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 6px; position: relative; overflow: hidden;
}
.sa-number-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: var(--sys-color); opacity: .6; border-radius: 3px 3px 0 0;
}
.sa-number-card-value {
  font-size: 2rem; font-weight: 700; line-height: 1;
  color: var(--sys-color);
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--sys-color) 30%, transparent));
  animation: numberPop .5s cubic-bezier(.22,1,.36,1) both;
}
.sa-number-card-label {
  font-size: .7rem; color: var(--muted); text-transform: uppercase;
  letter-spacing: .06em; font-weight: 600;
}

/* Chinese animal card (details) */
.sa-chinese-card { width: 100%; }
.sa-chinese-hero {
  display: flex; align-items: center; gap: 16px;
  padding: 20px; border-radius: 18px; margin-bottom: 12px;
}
.sa-chinese-icon-wrap {
  width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--sys-color) 12%, transparent);
  border: 2px solid color-mix(in srgb, var(--sys-color) 30%, transparent);
}
.sa-chinese-icon { font-size: 2rem; animation: iconBreathe 3s ease-in-out infinite; }
.sa-chinese-hero-text { display: flex; flex-direction: column; gap: 4px; }
.sa-chinese-animal { font-size: 1.4rem; font-weight: 700; }
.sa-chinese-element { font-size: .82rem; color: var(--sys-color); font-weight: 600; }
.sa-chinese-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px; }
.sa-chinese-detail {
  border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 4px; text-align: center;
}
.sa-chinese-detail-label { font-size: .68rem; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
.sa-chinese-detail-value { font-size: .88rem; font-weight: 700; }

/* Gematria breakdown */
.sa-gematria-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.sa-gematria-item {
  border-radius: 16px; padding: 16px 14px;
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px;
  position: relative; overflow: hidden;
}
.sa-gematria-item::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: var(--sys-color); opacity: .5;
}
.sa-gematria-item-icon { font-size: 1.4rem; color: var(--sys-color); opacity: .7; }
.sa-gematria-item-value {
  font-size: 1.8rem; font-weight: 700; line-height: 1;
  color: var(--sys-color);
  animation: numberPop .5s cubic-bezier(.22,1,.36,1) both;
}
.sa-gematria-item-label { font-size: .65rem; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }

/* Persian cards */
.sa-persian-layout { display: flex; flex-direction: column; gap: 12px; }
.sa-persian-ruler {
  display: flex; align-items: center; gap: 14px;
  padding: 16px; border-radius: 16px;
}
.sa-persian-ruler-circle {
  width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--sys-color) 12%, transparent);
  border: 2px solid color-mix(in srgb, var(--sys-color) 30%, transparent);
  animation: iconBreathe 3s ease-in-out infinite;
}
.sa-persian-ruler-icon { font-size: 1.4rem; }
.sa-persian-ruler-text { display: flex; flex-direction: column; gap: 2px; }
.sa-persian-ruler-label { font-size: .68rem; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
.sa-persian-ruler-value { font-size: 1.1rem; font-weight: 700; }
.sa-persian-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 8px; }
.sa-persian-cell {
  border-radius: 14px; padding: 12px; display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 4px;
}
.sa-persian-cell-icon { font-size: 1.2rem; color: var(--sys-color); opacity: .7; }
.sa-persian-cell-label { font-size: .65rem; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
.sa-persian-cell-value { font-size: .85rem; font-weight: 700; }

/* Highlight cards grid */
.sa-highlight-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.sa-highlight-card {
  border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 5px;
  position: relative; overflow: hidden;
}
.sa-highlight-accent {
  position: absolute; top: 0; left: 0; width: 3px; height: 100%;
  background: var(--sys-color); border-radius: 3px 0 0 3px; opacity: .7;
}
.sa-highlight-label {
  font-size: .68rem; text-transform: uppercase; letter-spacing: .1em;
  font-weight: 600; color: var(--sys-color);
}
.sa-highlight-value { font-size: .9rem; font-weight: 600; line-height: 1.35; }

/* Full summary */
.sa-full-summary { display: flex; flex-direction: column; gap: 10px; }
.sa-full-summary p { color: var(--muted); font-size: .9rem; line-height: 1.7; }


/* ══════════════════════════════════════════════
   PAGE 3 — Insights (actionable)
   ══════════════════════════════════════════════ */

/* Pull quote */
.sa-pull-quote {
  border-radius: 16px; padding: 16px 18px;
  background: color-mix(in srgb, var(--sys-color) 6%, var(--glass-bg));
  border: 1px solid color-mix(in srgb, var(--sys-color) 18%, transparent);
  backdrop-filter: blur(12px);
  position: relative; overflow: hidden;
  animation: pullQuoteSlide .5s cubic-bezier(.22,1,.36,1) both;
}
.sa-pull-quote-bar {
  position: absolute; top: 0; left: 0; width: 4px; height: 100%;
  background: var(--sys-color); border-radius: 4px 0 0 4px;
}
.sa-pull-quote-content {
  display: flex; align-items: center; gap: 12px; padding-left: 8px;
}
.sa-pull-quote-icon { font-size: 1.2rem; flex-shrink: 0; }
.sa-pull-quote-text { display: flex; flex-direction: column; gap: 3px; flex: 1; }
.sa-pull-quote-area { font-size: 1rem; font-weight: 700; color: var(--sys-color); }
.sa-pull-quote-sentiment { font-size: .82rem; color: var(--muted); }

/* Insight card list */
.sa-insight-list { display: flex; flex-direction: column; gap: 8px; }
.sa-insight-card {
  border-radius: 14px; padding: 14px 16px;
  display: flex; align-items: center; gap: 12px;
}
.sa-insight-left { flex-shrink: 0; }
.sa-insight-mid { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.sa-insight-top-row { display: flex; align-items: center; gap: 6px; }
.sa-insight-icon { font-size: .95rem; }
.sa-insight-area { font-size: .88rem; font-weight: 700; }
.sa-insight-sentiment { font-size: .8rem; color: var(--muted); line-height: 1.4; }
.sa-insight-right { flex-shrink: 0; }
.sa-insight-pct { font-size: 1.15rem; font-weight: 700; }

/* Action section */
.sa-action-section {
  padding: 16px 18px; border-radius: 16px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
}
.sa-action-title { font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--gold); }
.sa-action-bullets { display: flex; flex-direction: column; gap: 10px; }
.sa-action-bullet { display: flex; align-items: flex-start; gap: 10px; }
.sa-action-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  margin-top: 5px;
}
.sa-action-text { font-size: .85rem; color: var(--muted); line-height: 1.5; }

/* Insights accordions */
.sa-insights-accordions { display: flex; flex-direction: column; gap: 6px; }


/* ══════════════════════════════════════════════
   PAGE 4 — Data (the nerd screen)
   ══════════════════════════════════════════════ */

/* Data header */
.sa-data-header {
  display: flex; align-items: center; justify-content: space-between;
}
.sa-data-system-badge {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px; border-radius: 999px;
  background: color-mix(in srgb, var(--sys-color) 8%, var(--glass-bg));
  border: 1px solid color-mix(in srgb, var(--sys-color) 20%, transparent);
}
.sa-data-badge-icon { font-size: 1rem; }
.sa-data-badge-name { font-size: .88rem; font-weight: 700; }

/* Score breakdown section */
.sa-data-scores {
  padding: 16px; border-radius: 16px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
  display: flex; flex-direction: column; gap: 10px;
}
.sa-data-subtitle { font-size: 1rem; font-weight: 700; margin-bottom: 4px; color: var(--gold); }
.sa-data-score-row {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 6px 0; border-bottom: 1px solid var(--glass-border);
}
.sa-data-score-row:last-child { border-bottom: none; }
.sa-data-score-meta { display: flex; align-items: center; gap: 6px; min-width: 76px; }
.sa-data-score-icon { font-size: .9rem; }
.sa-data-score-name { font-size: .82rem; font-weight: 600; color: var(--muted); }
.sa-data-score-bar-wrap {
  flex: 1; height: 5px; border-radius: 3px;
  background: rgba(255,255,255,.04); overflow: hidden; min-width: 50px;
}
[data-theme="light"] .sa-data-score-bar-wrap { background: rgba(0,0,0,.06); }
.sa-data-score-bar { height: 100%; border-radius: 3px; }
.sa-data-score-pct { font-size: .92rem; font-weight: 700; min-width: 36px; text-align: right; }
.sa-data-score-label { font-size: .75rem; color: var(--muted); min-width: 60px; text-align: right; }

/* Data tables */
.sa-data-tables { display: flex; flex-direction: column; gap: 14px; }
.sa-data-table-wrap {
  border-radius: 16px; overflow: hidden;
}
/* Enhance DataCards within data page */
.sa-data .dcards-section { margin-bottom: 0; }
.sa-data .dcard {
  border-radius: 12px;
  transition: transform .15s ease;
}
.sa-data .dcard:nth-child(even) {
  background: color-mix(in srgb, var(--sys-color) 3%, var(--glass-bg));
}

/* Methodology note */
.sa-data-methodology {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 14px 16px; border-radius: 14px;
  background: color-mix(in srgb, var(--accent) 5%, var(--glass-bg));
  border: 1px solid color-mix(in srgb, var(--accent) 12%, transparent);
}
.sa-data-meth-icon { font-size: 1rem; color: var(--accent); flex-shrink: 0; margin-top: 2px; }
.sa-data-meth-text { font-size: .78rem; color: var(--muted); line-height: 1.6; }


/* ── Enhanced Systems Hub ── */
.sys-hub-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 6px; }
.sys-hub-sub { color: var(--muted); font-size: .88rem; margin-bottom: 20px; line-height: 1.5; }
.sys-tile-agreement {
  font-size: .68rem; font-weight: 600; position: relative; z-index: 1;
  padding: 3px 8px; border-radius: 999px; margin-top: 4px;
}
.sys-tile-agreement--high { color: #4ADE80; background: rgba(74,222,128,.1); }
.sys-tile-agreement--medium { color: #FBBF24; background: rgba(251,191,36,.1); }
.sys-tile-agreement--low { color: #F87171; background: rgba(248,113,113,.1); }
.sys-tile-agreement--unknown { color: var(--muted); background: var(--bg2); }

/* ══════════════════════════════════════════════════════
   System Calendar Tab
   ══════════════════════════════════════════════════════ */
.cal-page { padding:8px 4px 16px; }

/* ── Month bar ── */
.cal-month-bar {
  display:flex; align-items:center; justify-content:center; gap:16px;
  margin-bottom:10px;
}
.cal-month-arrow {
  width:32px; height:32px; display:flex; align-items:center; justify-content:center;
  border-radius:50%; background:var(--glass-bg); border:1px solid var(--glass-border);
  color:var(--text); font-size:1.3rem; cursor:pointer;
  transition:background .15s;
}
.cal-month-arrow:active { background:rgba(212,165,116,.15); }
.cal-month-label { font-size:1.05rem; color:var(--text); letter-spacing:.02em; }

/* ── Category tabs ── */
.cal-cat-bar {
  display:flex; gap:4px; overflow-x:auto; padding:0 2px 8px;
  -webkit-overflow-scrolling:touch; scrollbar-width:none;
}
.cal-cat-bar::-webkit-scrollbar { display:none; }
.cal-cat-tab {
  flex-shrink:0; display:flex; align-items:center; gap:4px;
  padding:6px 10px; border-radius:8px;
  background:var(--glass-bg); border:1px solid var(--glass-border);
  color:var(--muted); font-size:.68rem; cursor:pointer;
  transition:all .15s; white-space:nowrap;
}
.cal-cat-tab--active {
  background:rgba(212,165,116,.12); border-color:var(--gold);
  color:var(--gold);
}
.cal-cat-icon { font-size:.85rem; }
.cal-cat-label { font-weight:600; }

/* ── Legend ── */
.cal-legend {
  display:flex; gap:12px; justify-content:center; margin-bottom:6px;
}
.cal-legend-item {
  display:flex; align-items:center; gap:4px;
  font-size:.58rem; color:var(--muted); text-transform:uppercase; letter-spacing:.06em;
}
.cal-legend-dot { width:8px; height:8px; border-radius:2px; }

/* ── Day grid ── */
.cal-grid { width:100%; }
.cal-header-row {
  display:grid; grid-template-columns:repeat(7, 1fr); gap:2px;
  margin-bottom:2px;
}
.cal-header-cell {
  text-align:center; font-size:.62rem; font-weight:700;
  color:var(--muted); text-transform:uppercase; letter-spacing:.08em;
  padding:4px 0;
}
.cal-week-row {
  display:grid; grid-template-columns:repeat(7, 1fr); gap:2px;
  margin-bottom:2px;
}
.cal-cell {
  position:relative; min-height:54px; padding:3px 4px;
  border-radius:6px; border:1px solid transparent;
  display:flex; flex-direction:column; justify-content:space-between;
  cursor:pointer; transition:border-color .15s, transform .1s;
}
.cal-cell:active { transform:scale(.95); }
.cal-cell--outside {
  opacity:.25; pointer-events:none;
}
.cal-cell--today {
  border-color:var(--gold) !important;
  box-shadow:0 0 0 1px rgba(212,165,116,.3);
}
.cal-cell--selected {
  border-color:var(--text) !important;
  box-shadow:0 0 0 1px rgba(255,255,255,.2);
}
.cal-cell-day {
  font-size:.72rem; font-weight:600; color:var(--text); line-height:1;
}
.cal-cell-scores {
  display:flex; justify-content:space-between; align-items:baseline;
  margin-top:auto;
}
.cal-cell-primary {
  font-size:.72rem; font-weight:700; line-height:1;
}
.cal-cell-secondary {
  font-size:.58rem; font-weight:600; opacity:.7; line-height:1;
}

/* ── Day detail panel ── */
.cal-detail {
  margin-top:12px; padding:16px; border-radius:14px;
  background:var(--glass-bg); border:1px solid var(--glass-border);
}
.cal-detail-header {
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:12px;
}
.cal-detail-date { display:flex; flex-direction:column; }
.cal-detail-day { font-size:1.8rem; color:var(--text); line-height:1; }
.cal-detail-month { font-size:.7rem; color:var(--muted); }
.cal-detail-scores-hero { display:flex; align-items:baseline; gap:8px; }
.cal-detail-primary { font-size:1.6rem; line-height:1; }
.cal-detail-secondary { font-size:.9rem; opacity:.6; }
.cal-detail-close {
  width:28px; height:28px; display:flex; align-items:center; justify-content:center;
  border-radius:50%; background:var(--bg2); border:none;
  color:var(--muted); font-size:.8rem; cursor:pointer;
}
.cal-detail-close:active { color:var(--text); }

.cal-detail-cat {
  display:flex; align-items:center; gap:6px; margin-bottom:10px;
  padding:6px 10px; border-radius:8px;
  background:rgba(212,165,116,.08);
}
.cal-detail-cat-icon { font-size:1rem; }
.cal-detail-cat-name { font-size:.78rem; font-weight:700; color:var(--gold); }
.cal-detail-cat-desc { font-size:.68rem; color:var(--muted); margin-left:auto; }

.cal-detail-summary {
  font-size:.82rem; color:var(--text); line-height:1.5;
  margin:0 0 12px; padding-bottom:10px;
  border-bottom:1px solid var(--glass-border);
}

/* Factors */
.cal-detail-section-title { font-size:.78rem; color:var(--text); margin:0 0 8px; }
.cal-detail-factors { margin-bottom:12px; }
.cal-factor {
  display:flex; align-items:center; gap:8px;
  padding:6px 8px; border-radius:8px; margin-bottom:4px;
  background:var(--bg2);
}
.cal-factor-label { font-size:.72rem; color:var(--muted); min-width:80px; }
.cal-factor-value { font-size:.76rem; color:var(--text); flex:1; font-weight:600; }
.cal-factor-badge { font-size:.6rem; width:18px; text-align:center; }
.cal-factor-badge--helps { color:#4ADE80; }
.cal-factor-badge--hurts { color:#F87171; }
.cal-factor-badge--neutral { color:var(--muted); opacity:.4; }

/* Helps & Hurts */
.cal-detail-hh { display:flex; gap:12px; margin-bottom:12px; }
.cal-detail-helps, .cal-detail-hurts { flex:1; }
.cal-section-helps { color:#4ADE80; }
.cal-section-hurts { color:#F87171; }
.cal-hh-row {
  display:flex; align-items:flex-start; gap:6px;
  font-size:.72rem; color:var(--muted); margin-bottom:4px; line-height:1.4;
}
.cal-hh-dot { width:5px; height:5px; min-width:5px; border-radius:50%; margin-top:4px; }
.cal-hh-help .cal-hh-dot { background:#4ADE80; }
.cal-hh-hurt .cal-hh-dot { background:#F87171; }

/* Actions */
.cal-detail-actions { margin-top:8px; }
.cal-action-row {
  display:flex; align-items:center; gap:6px;
  font-size:.72rem; color:var(--muted); margin-bottom:4px;
}
.cal-action-dot {
  width:5px; height:5px; min-width:5px; border-radius:50%;
  background:var(--gold); opacity:.5;
}

/* ══════════════════════════════════════════════════════
   System Games Tab
   ══════════════════════════════════════════════════════ */
.sg-page { padding:16px; min-height:200px; }

/* ── Intro ── */
.sg-intro { text-align:center; margin-bottom:20px; }
.sg-intro-title { color:var(--gold); font-size:1.3rem; margin:0 0 4px; }
.sg-intro-sub { color:var(--muted); font-size:.8rem; margin:0; }

/* ── Game card grid ── */
.sg-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.sg-card {
  position:relative; overflow:hidden; padding:18px 12px 14px;
  border-radius:14px; border:1px solid var(--glass-border);
  background:var(--glass-bg); text-align:center;
  display:flex; flex-direction:column; align-items:center; gap:4px;
  cursor:pointer; transition:transform .18s, box-shadow .18s;
}
.sg-card:active { transform:scale(.96); }
.sg-card-glow {
  position:absolute; top:-30%; left:50%; transform:translateX(-50%);
  width:80px; height:80px; border-radius:50%;
  background:radial-gradient(circle, rgba(212,165,116,.12), transparent 70%);
  pointer-events:none;
}
.sg-card-icon { font-size:1.8rem; margin-bottom:2px; }
.sg-card-title { font-size:.88rem; color:var(--text); }
.sg-card-sub { font-size:.68rem; color:var(--muted); line-height:1.3; }
.sg-card-meta {
  display:flex; gap:8px; margin-top:6px; align-items:center;
}
.sg-card-type {
  font-size:.58rem; text-transform:uppercase; letter-spacing:.08em;
  color:var(--gold); opacity:.7; font-weight:600;
}
.sg-card-dur {
  font-size:.58rem; color:var(--muted); opacity:.6;
}

/* ── Back row ── */
.sg-back-row {
  display:flex; align-items:center; gap:8px; margin-bottom:12px;
}
.sg-back {
  width:32px; height:32px; display:flex; align-items:center; justify-content:center;
  border-radius:50%; background:var(--glass-bg); border:1px solid var(--glass-border);
  color:var(--text); cursor:pointer;
}
.sg-back-label { color:var(--muted); font-size:.85rem; }

/* ── Ritual header ── */
.sg-ritual-header {
  text-align:center; margin-bottom:20px;
}
.sg-ritual-icon { font-size:2.4rem; display:block; margin-bottom:6px; }
.sg-ritual-title { color:var(--gold); font-size:1.2rem; margin:0 0 4px; }
.sg-ritual-sub { color:var(--muted); font-size:.78rem; margin:0; }

/* ── Reveal stage ── */
.sg-reveal-stage {
  display:flex; justify-content:center; align-items:center;
  min-height:220px; padding:20px 0;
}
.sg-mystic-reveal {
  display:flex; flex-direction:column; align-items:center; gap:16px;
}
.sg-reveal-orb {
  position:relative; width:100px; height:100px;
}
.sg-reveal-ring {
  position:absolute; border-radius:50%; border:1px solid var(--gold);
  animation:sgOrbPulse 2s ease-in-out infinite;
}
.sg-reveal-ring-1 { inset:0; opacity:.4; }
.sg-reveal-ring-2 { inset:10px; opacity:.6; animation-delay:.3s; }
.sg-reveal-ring-3 { inset:20px; opacity:.8; animation-delay:.6s; }
.sg-reveal-core {
  position:absolute; inset:30px; border-radius:50%;
  background:radial-gradient(circle, var(--gold), rgba(212,165,116,.3));
  animation:sgCorePulse 1.4s ease-in-out infinite alternate;
}
@keyframes sgOrbPulse {
  0%,100% { transform:scale(1); opacity:.4; }
  50% { transform:scale(1.1); opacity:.8; }
}
@keyframes sgCorePulse {
  0% { transform:scale(.85); opacity:.6; }
  100% { transform:scale(1.05); opacity:1; }
}
.sg-reveal-type {
  font-size:.65rem; text-transform:uppercase; letter-spacing:.16em;
  color:var(--gold); opacity:.7;
}
.sg-reveal-headline {
  color:var(--text); font-size:1.1rem; text-align:center;
  animation:sgFadeIn 1s ease-out .5s both;
}
@keyframes sgFadeIn {
  from { opacity:0; transform:translateY(8px); }
  to { opacity:1; transform:translateY(0); }
}

/* ── Input form ── */
.sg-play-area { display:flex; flex-direction:column; gap:14px; }
.sg-inputs { display:flex; flex-direction:column; gap:12px; }
.sg-input-group { display:flex; flex-direction:column; gap:4px; }
.sg-input-label { font-size:.72rem; color:var(--muted); text-transform:uppercase; letter-spacing:.08em; }
.sg-input {
  padding:10px 14px; border-radius:10px;
  background:var(--glass-bg); border:1px solid var(--glass-border);
  color:var(--text); font-size:.9rem;
  transition:border-color .2s;
}
.sg-input:focus { outline:none; border-color:var(--gold); }
.sg-action-btn {
  padding:14px; border-radius:12px; border:none;
  background:linear-gradient(135deg, var(--gold), #C4956A);
  color:#080D1A; font-weight:700; font-size:.9rem;
  letter-spacing:.04em; cursor:pointer;
  transition:transform .15s, opacity .15s;
}
.sg-action-btn:disabled { opacity:.35; pointer-events:none; }
.sg-action-btn:active { transform:scale(.97); }
.sg-action-text { text-transform:uppercase; letter-spacing:.1em; }
.sg-error { color:#F87171; font-size:.8rem; text-align:center; margin:0; }

/* ── Play again ── */
.sg-again {
  width:100%; text-align:center; padding:14px; margin-top:8px;
  font-size:.82rem; color:var(--muted); letter-spacing:.08em;
  text-transform:uppercase; transition:color .2s;
  background:none; border:none; cursor:pointer;
}
.sg-again:active { color:var(--gold); }

/* ── Result shared ── */
.sg-result { display:flex; flex-direction:column; gap:14px; }
.sg-result-headline {
  text-align:center; font-size:1.15rem; color:var(--gold);
  margin:0 0 4px;
}

/* ── Identity result ── */
.sg-identity { display:flex; flex-direction:column; gap:12px; }
.sg-section { padding:14px; border-radius:14px; }
.sg-section-header {
  display:flex; align-items:center; gap:8px; margin-bottom:10px;
}
.sg-section-icon { font-size:1.2rem; }
.sg-section-title { font-size:.92rem; color:var(--text); margin:0; }
.sg-section-items { display:flex; flex-direction:column; gap:10px; }
.sg-item { }
.sg-item-top {
  display:flex; justify-content:space-between; align-items:baseline; gap:8px;
}
.sg-item-label { font-size:.82rem; color:var(--text); font-weight:600; }
.sg-item-value { font-size:.82rem; color:var(--gold); white-space:nowrap; }
.sg-item-desc { font-size:.75rem; color:var(--muted); margin:3px 0 0; line-height:1.45; }

.sg-traits { padding:14px; border-radius:14px; }
.sg-traits-title { font-size:.88rem; color:var(--text); margin:0 0 8px; }
.sg-trait { display:flex; align-items:flex-start; gap:8px; font-size:.78rem; color:var(--muted); margin-bottom:6px; line-height:1.4; }
.sg-trait-dot {
  width:6px; height:6px; min-width:6px; border-radius:50%; margin-top:5px;
}
.sg-trait-strength .sg-trait-dot { background:#4ADE80; }
.sg-trait-caution .sg-trait-dot { background:#FBBF24; }

.sg-advice { padding:14px; border-radius:14px; border-left:3px solid var(--gold); }
.sg-advice-text { font-size:.82rem; color:var(--text); margin:0; line-height:1.5; font-style:italic; }

/* ── Compatibility result ── */
.sg-compat { display:flex; flex-direction:column; align-items:center; gap:14px; }
.sg-compat-ring {
  position:relative; width:120px; height:120px;
}
.sg-compat-ring-svg { width:100%; height:100%; }
.sg-compat-ring-fill {
  animation:sgRingFill .8s ease-out .2s both;
}
@keyframes sgRingFill {
  from { stroke-dasharray:0 327; }
}
.sg-compat-ring-inner {
  position:absolute; inset:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
}
.sg-compat-score { font-size:1.6rem; line-height:1; }
.sg-compat-label { font-size:.62rem; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; margin-top:2px; }

.sg-cat { padding:12px; border-radius:12px; width:100%; }
.sg-cat-top { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px; }
.sg-cat-name { font-size:.8rem; color:var(--text); font-weight:600; }
.sg-cat-score { font-size:.8rem; }
.sg-cat-bar-track { height:5px; border-radius:3px; background:var(--glass-border); overflow:hidden; margin-bottom:6px; }
.sg-cat-bar { height:100%; border-radius:3px; transition:width .6s ease-out; }
.sg-cat-desc { font-size:.72rem; color:var(--muted); margin:0; line-height:1.4; }

.sg-callout {
  display:flex; align-items:flex-start; gap:8px;
  padding:12px; border-radius:12px; width:100%;
}
.sg-callout-icon { font-size:1rem; flex-shrink:0; }
.sg-callout p { font-size:.78rem; color:var(--muted); margin:0; line-height:1.4; }
.sg-callout-good { border-left:3px solid #4ADE80; }
.sg-callout-warn { border-left:3px solid #FBBF24; }

/* ── Timeline result ── */
.sg-timeline { display:flex; flex-direction:column; gap:14px; }
.sg-tl-track { position:relative; padding-left:24px; }
.sg-tl-node { position:relative; margin-bottom:6px; }
.sg-tl-dot {
  position:absolute; left:-24px; top:14px;
  width:10px; height:10px; border-radius:50%;
  background:var(--glass-border);
  z-index:1;
}
.sg-tl-line {
  position:absolute; left:-19px; top:24px; bottom:-6px;
  width:1px; background:var(--glass-border);
}
.sg-tl-node:last-child .sg-tl-line { display:none; }
.sg-tl-fav .sg-tl-dot { background:#4ADE80; }
.sg-tl-chal .sg-tl-dot { background:#F87171; }
.sg-tl-neut .sg-tl-dot { background:#60A5FA; }
.sg-tl-current .sg-tl-dot {
  box-shadow:0 0 0 3px rgba(212,165,116,.3);
  background:var(--gold);
}
.sg-tl-content { padding:10px 12px; border-radius:12px; }
.sg-tl-header { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px; }
.sg-tl-label { font-size:.88rem; color:var(--text); }
.sg-tl-years { font-size:.68rem; color:var(--muted); }
.sg-tl-theme { font-size:.72rem; color:var(--gold); font-weight:600; margin-bottom:4px; display:block; }
.sg-tl-desc { font-size:.72rem; color:var(--muted); margin:0; line-height:1.4; }
.sg-tl-badge {
  display:inline-block; margin-top:6px;
  font-size:.58rem; text-transform:uppercase; letter-spacing:.1em;
  color:var(--gold); background:rgba(212,165,116,.12);
  padding:3px 10px; border-radius:999px; font-weight:700;
}

/* ── Oracle result ── */
.sg-oracle { display:flex; flex-direction:column; gap:14px; }
.sg-oracle-verse {
  padding:18px; border-radius:14px;
  border-left:3px solid var(--gold);
  text-align:center;
}
.sg-oracle-verse-text { font-size:1rem; color:var(--text); margin:0; line-height:1.6; font-style:italic; }
.sg-oracle-answer, .sg-oracle-guidance, .sg-oracle-caution, .sg-oracle-actions {
  padding:14px; border-radius:12px;
}
.sg-oracle-label { font-size:.78rem; color:var(--gold); margin:0 0 6px; }
.sg-oracle-answer p, .sg-oracle-guidance p, .sg-oracle-caution p {
  font-size:.82rem; color:var(--text); margin:0; line-height:1.5;
}
.sg-oracle-caution { border-left:3px solid #FBBF24; }
.sg-oracle-timing {
  display:flex; align-items:center; gap:8px; justify-content:center;
  font-size:.78rem;
}
.sg-oracle-timing-label { color:var(--muted); }
.sg-oracle-timing-val { color:var(--gold); }
.sg-oracle-action {
  display:flex; align-items:center; gap:8px;
  font-size:.78rem; color:var(--muted); margin-bottom:6px;
}
.sg-oracle-action-dot {
  width:5px; height:5px; min-width:5px; border-radius:50%;
  background:var(--gold); opacity:.6;
}

/* ── Explorer result ── */
.sg-explorer { display:flex; flex-direction:column; gap:12px; }
.sg-exp-item { padding:12px; border-radius:12px; }
.sg-exp-top { display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
.sg-exp-label { font-size:.82rem; color:var(--text); font-weight:600; }
.sg-exp-value { font-size:.82rem; color:var(--gold); }
.sg-exp-desc { font-size:.72rem; color:var(--muted); margin:4px 0 0; line-height:1.45; }
.sg-exp-total { padding:14px; border-radius:12px; text-align:center; }
.sg-exp-total-label { font-size:.92rem; color:var(--gold); }
.sg-exp-meaning { padding:14px; border-radius:12px; }
.sg-exp-meaning p { font-size:.82rem; color:var(--text); margin:0; line-height:1.5; }

/* ── Share button ── */
.sg-share {
  width:100%; text-align:center; padding:12px; margin-top:0;
  font-size:.78rem; color:var(--gold); letter-spacing:.08em;
  text-transform:uppercase; transition:color .2s, background .2s;
  background:rgba(212,165,116,.08); border:1px solid rgba(212,165,116,.2);
  border-radius:10px; cursor:pointer;
}
.sg-share:active { background:rgba(212,165,116,.18); }

/* ── Card type accents ── */
.sg-card-compatibility { border-left:3px solid rgba(244,114,182,.5); }
.sg-card-oracle { border-left:3px solid rgba(168,85,247,.5); }
.sg-card-timeline { border-left:3px solid rgba(96,165,250,.5); }
.sg-card-identity { border-left:3px solid rgba(250,204,21,.5); }
.sg-card-explorer { border-left:3px solid rgba(74,222,128,.5); }

/* ── Card watermarks ── */
.sg-card-watermark {
  position:absolute; bottom:4px; right:6px;
  font-size:2.2rem; opacity:.06; pointer-events:none;
  line-height:1;
}
.sg-wm-compatibility::after { content:'\u2665'; }
.sg-wm-oracle::after { content:'\uD83D\uDD2E'; }
.sg-wm-timeline::after { content:'\u29D7'; }
.sg-wm-identity::after { content:'\u2605'; }
.sg-wm-explorer::after { content:'\u2316'; }

/* ── Try This badge ── */
.sg-card-badge {
  position:absolute; top:6px; right:6px; z-index:2;
  font-size:.52rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
  color:#080D1A; background:var(--gold);
  padding:2px 7px; border-radius:999px;
  animation:sgBadgePulse 2s ease-in-out infinite;
}
@keyframes sgBadgePulse {
  0%,100% { opacity:1; transform:scale(1); }
  50% { opacity:.85; transform:scale(1.06); }
}

/* ═══════════════════════════════════════════════════════
   Type-specific reveal animations
   ═══════════════════════════════════════════════════════ */

/* ── Identity: swirling particles converging ── */
.sg-rv-identity-stage {
  position:relative; width:120px; height:120px;
}
.sg-rv-particle {
  position:absolute; width:8px; height:8px; border-radius:50%;
  background:var(--gold);
  top:50%; left:50%;
  animation:sgParticleSwirl 2.4s ease-in-out infinite;
  animation-delay:calc(var(--i) * 0.3s);
}
@keyframes sgParticleSwirl {
  0% {
    transform:rotate(calc(var(--i) * 45deg)) translateX(50px) scale(1);
    opacity:.3;
  }
  70% {
    transform:rotate(calc(var(--i) * 45deg + 270deg)) translateX(6px) scale(.6);
    opacity:1;
  }
  100% {
    transform:rotate(calc(var(--i) * 45deg + 360deg)) translateX(50px) scale(1);
    opacity:.3;
  }
}
.sg-rv-identity-glow {
  position:absolute; inset:30px; border-radius:50%;
  background:radial-gradient(circle, var(--gold), rgba(250,204,21,.15));
  animation:sgIdentityGlow 2.4s ease-in-out infinite;
}
@keyframes sgIdentityGlow {
  0%,100% { transform:scale(.6); opacity:.2; }
  70% { transform:scale(1.1); opacity:.9; }
}

/* ── Compatibility: two orbs merging ── */
.sg-rv-compat-stage {
  position:relative; width:140px; height:100px;
}
.sg-rv-orb {
  position:absolute; width:36px; height:36px; border-radius:50%; top:32px;
}
.sg-rv-orb-a {
  background:radial-gradient(circle, #F472B6, rgba(244,114,182,.2));
  left:10px;
  animation:sgOrbMergeA 2.6s ease-in-out infinite;
}
.sg-rv-orb-b {
  background:radial-gradient(circle, #60A5FA, rgba(96,165,250,.2));
  right:10px;
  animation:sgOrbMergeB 2.6s ease-in-out infinite;
}
@keyframes sgOrbMergeA {
  0%,100% { transform:translateX(0) scale(1); opacity:.8; }
  50% { transform:translateX(30px) scale(.75); opacity:1; }
}
@keyframes sgOrbMergeB {
  0%,100% { transform:translateX(0) scale(1); opacity:.8; }
  50% { transform:translateX(-30px) scale(.75); opacity:1; }
}
.sg-rv-merge-flash {
  position:absolute; left:50%; top:50%; width:20px; height:20px;
  border-radius:50%; transform:translate(-50%,-50%);
  background:radial-gradient(circle, #fff, transparent 70%);
  animation:sgMergeFlash 2.6s ease-in-out infinite;
}
@keyframes sgMergeFlash {
  0%,30%,100% { opacity:0; transform:translate(-50%,-50%) scale(.5); }
  50% { opacity:.9; transform:translate(-50%,-50%) scale(2.5); }
  70% { opacity:0; transform:translate(-50%,-50%) scale(3); }
}

/* ── Timeline: horizontal line drawing with nodes ── */
.sg-rv-tl-stage {
  position:relative; width:200px; height:60px;
  display:flex; align-items:center; justify-content:center;
}
.sg-rv-tl-line {
  position:absolute; left:10px; right:10px; top:50%; height:2px;
  background:var(--gold); transform-origin:left;
  animation:sgTlLineDraw 2s ease-out forwards;
}
@keyframes sgTlLineDraw {
  from { transform:scaleX(0); opacity:.3; }
  to { transform:scaleX(1); opacity:1; }
}
.sg-rv-tl-node {
  position:absolute; width:10px; height:10px; border-radius:50%;
  background:var(--gold); top:50%; transform:translateY(-50%) scale(0);
  animation:sgTlNodePop .4s ease-out forwards;
  animation-delay:calc(0.4s + var(--i) * 0.35s);
}
.sg-rv-tl-node:nth-child(2) { left:10px; }
.sg-rv-tl-node:nth-child(3) { left:calc(25% + 2px); }
.sg-rv-tl-node:nth-child(4) { left:50%; transform:translateX(-50%) translateY(-50%) scale(0); }
.sg-rv-tl-node:nth-child(5) { left:calc(75% - 2px); }
.sg-rv-tl-node:nth-child(6) { right:10px; }
@keyframes sgTlNodePop {
  0% { transform:translateY(-50%) scale(0); }
  60% { transform:translateY(-50%) scale(1.4); }
  100% { transform:translateY(-50%) scale(1); }
}

/* ── Oracle: crystal ball with mist ── */
.sg-rv-oracle-stage {
  position:relative; width:100px; height:100px;
}
.sg-rv-crystal {
  position:absolute; inset:15px; border-radius:50%;
  background:radial-gradient(circle at 35% 35%, rgba(168,85,247,.6), rgba(88,28,135,.8));
  box-shadow:0 0 20px rgba(168,85,247,.3), inset 0 0 12px rgba(255,255,255,.1);
  animation:sgCrystalPulse 2s ease-in-out infinite alternate;
}
@keyframes sgCrystalPulse {
  0% { box-shadow:0 0 15px rgba(168,85,247,.2), inset 0 0 8px rgba(255,255,255,.05); }
  100% { box-shadow:0 0 30px rgba(168,85,247,.5), inset 0 0 16px rgba(255,255,255,.15); }
}
.sg-rv-mist {
  position:absolute; border-radius:50%; opacity:0;
  background:radial-gradient(circle, rgba(255,255,255,.15), transparent 70%);
}
.sg-rv-mist-1 {
  inset:5px; animation:sgMistDrift 3s ease-in-out infinite;
}
.sg-rv-mist-2 {
  inset:0; animation:sgMistDrift 3s ease-in-out .8s infinite;
}
.sg-rv-mist-3 {
  inset:10px; animation:sgMistDrift 3s ease-in-out 1.6s infinite;
}
@keyframes sgMistDrift {
  0% { opacity:.5; transform:translateY(0) scale(1); }
  50% { opacity:0; transform:translateY(-12px) scale(1.3); }
  100% { opacity:.5; transform:translateY(0) scale(1); }
}

/* ── Explorer: layers peeling back ── */
.sg-rv-explorer-stage {
  position:relative; width:100px; height:100px;
}
.sg-rv-layer {
  position:absolute; border-radius:12px;
  border:1.5px solid rgba(74,222,128,.4);
  animation:sgLayerPeel 2.4s ease-out infinite;
  animation-delay:calc(var(--i) * 0.5s);
}
.sg-rv-layer:nth-child(1) { inset:0; border-color:rgba(74,222,128,.2); }
.sg-rv-layer:nth-child(2) { inset:10px; border-color:rgba(74,222,128,.35); }
.sg-rv-layer:nth-child(3) { inset:20px; border-color:rgba(74,222,128,.5); }
.sg-rv-layer:nth-child(4) {
  inset:30px; border-color:rgba(74,222,128,.7);
  background:rgba(74,222,128,.08);
}
@keyframes sgLayerPeel {
  0% { transform:scale(.85) rotate(-4deg); opacity:0; }
  20% { transform:scale(1) rotate(0); opacity:1; }
  80% { transform:scale(1) rotate(0); opacity:1; }
  100% { transform:scale(1.15) rotate(2deg); opacity:0; }
}

/* ══════════════════════════════════════════════════════════
   READINGS TAB
   ══════════════════════════════════════════════════════════ */
.rdg-page { padding:var(--page-top-pad) var(--page-x) 0; }
.rdg-section { margin-bottom:var(--sp-3xl); }
.rdg-section-title { font-size:var(--fs-lg); color:var(--text); margin:0 0 2px; letter-spacing:-.01em; font-weight:700; }
.rdg-section-sub { font-size:var(--fs-sm); color:var(--muted); margin:0 0 var(--sp-lg); }

/* ── Back button (reused in quiz + quick read) ── */
.rdg-back { display:inline-flex; align-items:center; gap:4px; background:none; border:none; color:var(--gold); font-size:.85rem; padding:0 0 12px; cursor:pointer; font-family:var(--sans); }

/* ── Quiz Hero Cards ── */
.rdg-quiz-stack { display:flex; flex-direction:column; gap:var(--sp-md); }
.rdg-quiz-card {
  position:relative; overflow:hidden; display:flex; align-items:center;
  background:var(--q-grad); border:none; border-radius:var(--r-lg);
  padding:var(--sp-xl) var(--sp-lg); cursor:pointer; text-align:left;
  animation: rdg-slideUp .4s var(--ease-out) both;
  transition: transform var(--dur-fast) var(--ease-smooth);
}
.rdg-quiz-card:active { transform:scale(.98); }
.rdg-quiz-card--done { opacity:.85; }

/* Shimmer overlay — subtle */
.rdg-quiz-shimmer {
  position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(110deg, transparent 35%, rgba(255,255,255,.06) 50%, transparent 65%);
  background-size:200% 100%;
  animation: rdg-shimmer 4s ease-in-out infinite;
}
@keyframes rdg-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

.rdg-quiz-content { position:relative; display:flex; align-items:center; gap:var(--sp-lg); width:100%; z-index:1; }
.rdg-quiz-icon { font-size:1.5rem; flex-shrink:0; }
.rdg-quiz-text { flex:1; display:flex; flex-direction:column; gap:2px; }
.rdg-quiz-title { font-size:var(--fs-base); color:#fff; font-weight:600; }
.rdg-quiz-sub { font-size:var(--fs-sm); color:rgba(255,255,255,.75); }
.rdg-quiz-meta { display:flex; flex-direction:column; align-items:flex-end; gap:var(--sp-xs); flex-shrink:0; }
.rdg-quiz-dur { font-size:var(--fs-xs); color:rgba(255,255,255,.65); }
.rdg-quiz-cta {
  font-size:var(--fs-xs); font-weight:600; color:#fff;
  background:rgba(255,255,255,.15); border-radius:var(--r-full); padding:4px 14px;
}

@keyframes rdg-slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

/* ── Quick Reads ── */
.rdg-qr-row { display:grid; grid-template-columns:repeat(2,1fr); gap:var(--sp-md); }
.rdg-qr-card {
  position:relative; display:flex; flex-direction:column; align-items:center;
  background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:var(--r-lg);
  padding:var(--sp-xl) var(--sp-md) var(--sp-lg); cursor:pointer; text-align:center;
  animation: rdg-slideUp .4s var(--ease-out) both;
  transition: transform var(--dur-fast) var(--ease-smooth);
}
.rdg-qr-card:active { transform:scale(.975); }
.rdg-qr-badge {
  position:absolute; top:var(--sp-sm); right:var(--sp-sm);
  font-size:var(--fs-xs); font-weight:600; text-transform:uppercase; letter-spacing:.04em;
  color:var(--gold); background:rgba(212,165,116,.08);
  padding:2px 7px; border-radius:var(--r-sm);
}
.rdg-qr-icon { font-size:1.4rem; margin-bottom:var(--sp-sm); }
.rdg-qr-title { font-size:var(--fs-sm); color:var(--text); font-weight:600; }
.rdg-qr-sub { font-size:var(--fs-xs); color:var(--muted); margin-top:2px; }

/* ── Fortune Tools Grid (3-col like reference app) ── */
.rdg-tools-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:var(--sp-md); }
.rdg-tool-card {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  background:linear-gradient(135deg, rgba(212,165,116,.08) 0%, var(--glass-bg) 60%);
  border:1px solid rgba(212,165,116,.18); border-left:3px solid hsla(calc(var(--tool-hue, 30)), 60%, 60%, .5);
  border-radius:var(--r-lg);
  padding:var(--sp-xl) var(--sp-sm) var(--sp-lg); cursor:pointer; text-align:center; aspect-ratio:1;
  animation: rdg-slideUp .4s var(--ease-out) both;
  transition: transform var(--dur-fast) var(--ease-smooth), box-shadow var(--dur-fast) var(--ease-smooth);
}
.rdg-tool-card:active { transform:scale(.97); box-shadow:0 0 12px rgba(212,165,116,.15); }
.rdg-tool-glyph { font-size:1.8rem; margin-bottom:var(--sp-sm); opacity:.85; }
.rdg-tool-title { font-size:var(--fs-sm); color:var(--text); font-weight:600; line-height:1.3; }

/* ── Recommendations ── */
.rdg-recs-row { display:flex; gap:10px; overflow-x:auto; padding-bottom:4px; -webkit-overflow-scrolling:touch; }
.rdg-recs-row::-webkit-scrollbar { display:none; }
.rdg-rec-card {
  flex:0 0 140px; display:flex; flex-direction:column; align-items:center;
  background:var(--glass-bg); border:1px solid var(--gold); border-radius:14px;
  padding:14px 10px; cursor:pointer; text-align:center;
  transition: transform .15s ease;
}
.rdg-rec-card:active { transform:scale(.96); }
.rdg-rec-glyph { font-size:1.3rem; margin-bottom:6px; }
.rdg-rec-title { font-size:.78rem; color:var(--gold); font-weight:600; }
.rdg-rec-reason { font-size:.58rem; color:var(--muted); margin-top:3px; line-height:1.3; }

/* ── Quick Read Detail ── */
.rdg-read-page { padding:var(--page-top-pad) 16px 0; display:flex; flex-direction:column; align-items:center; }
.rdg-read-card { text-align:center; padding:32px 24px; border-radius:20px; max-width:360px; width:100%; margin-top:12px; }
.rdg-read-icon { font-size:2.4rem; display:block; margin-bottom:12px; filter:drop-shadow(0 0 8px var(--gold)); }
.rdg-read-title { font-size:1.25rem; color:var(--gold); margin:0 0 6px; }
.rdg-read-extra { font-size:.7rem; color:var(--muted); display:block; margin-bottom:12px; }
.rdg-read-body { font-size:.88rem; color:var(--text); line-height:1.6; margin:0; }

/* ══════════════════════════════════════════════════════════
   QUIZ FLOW
   ══════════════════════════════════════════════════════════ */
.qz-page { padding:var(--page-top-pad) 16px 0; min-height:100%; }

/* ── Intro ── */
.qz-intro {
  display:flex; flex-direction:column; align-items:center; text-align:center;
  padding-top:60px; gap:8px;
}
.qz-intro-icon { font-size:3rem; filter:drop-shadow(0 0 12px var(--gold)); animation: qz-float 3s ease-in-out infinite; }
@keyframes qz-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
.qz-intro-title { font-size:1.4rem; color:var(--text); }
.qz-intro-sub { font-size:.85rem; color:var(--muted); max-width:280px; }
.qz-intro-meta { font-size:.72rem; color:var(--muted); margin-top:4px; }
.qz-start-btn {
  margin-top:28px; padding:14px 48px; border:none; border-radius:28px;
  background:linear-gradient(135deg, var(--gold), #c9956a);
  color:#fff; font-family:var(--serif); font-size:1rem; font-weight:700;
  cursor:pointer; position:relative; overflow:hidden;
  transition: transform .15s ease;
}
.qz-start-btn:active { transform:scale(.96); }
.qz-start-btn::after {
  content:''; position:absolute; inset:0;
  background:linear-gradient(110deg, transparent 30%, rgba(255,255,255,.2) 50%, transparent 70%);
  background-size:200% 100%;
  animation: rdg-shimmer 2.5s ease-in-out infinite;
}

/* ── Progress ── */
.qz-progress {
  height:4px; background:var(--glass-border); border-radius:4px;
  margin:0 0 6px; overflow:hidden;
}
.qz-progress-fill {
  height:100%; background:var(--gold); border-radius:4px;
  transition: width .4s ease;
}
.qz-progress-label { font-size:.65rem; color:var(--muted); display:block; text-align:right; margin-bottom:24px; }

/* ── Question ── */
.qz-question { animation: rdg-slideUp .35s ease both; }
.qz-q-text { font-size:1.1rem; color:var(--text); margin:0 0 20px; line-height:1.5; }
.qz-options { display:flex; flex-direction:column; gap:10px; }
.qz-option {
  background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:14px;
  padding:16px 18px; color:var(--text); font-size:.85rem; text-align:left;
  cursor:pointer; font-family:var(--sans);
  transition: border-color .2s, background .2s, transform .15s;
}
.qz-option:active { transform:scale(.98); }
.qz-option--selected {
  border-color:var(--gold) !important;
  background:rgba(212,165,116,.12) !important;
  box-shadow:0 0 12px rgba(212,165,116,.18);
}

/* ── Reveal ── */
.qz-reveal-page {
  display:flex; flex-direction:column; align-items:center;
  justify-content:center; min-height:80vh; text-align:center; gap:20px;
}
.qz-reveal-orb { position:relative; width:120px; height:120px; }
.qz-reveal-ring { width:100%; height:100%; transform:rotate(-90deg); }
.qz-reveal-pct {
  position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  font-family:var(--serif); font-size:1.4rem; color:var(--gold); font-weight:700;
}
.qz-reveal-text { font-size:.88rem; color:var(--muted); animation: qz-pulse 1.2s ease-in-out infinite; }
@keyframes qz-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }

/* ── Result ── */
.qz-result-page { display:flex; flex-direction:column; align-items:center; padding-bottom:40px; }
.qz-result-hero {
  text-align:center; padding:32px 20px 24px;
  animation: rdg-slideUp .5s ease both;
}
.qz-result-icon { font-size:2.6rem; display:block; margin-bottom:12px; filter:drop-shadow(0 0 10px var(--gold)); }
.qz-result-title { font-size:1.5rem; color:var(--gold); margin:0 0 10px; }
.qz-result-teaser { font-size:.88rem; color:var(--text); max-width:320px; line-height:1.6; margin:0 auto; }

.qz-result-strengths { width:100%; max-width:360px; margin:20px 0; }
.qz-result-sh { font-size:.92rem; color:var(--text); margin:0 0 12px; }
.qz-strength-row {
  display:flex; align-items:center; gap:10px;
  padding:12px 16px; margin-bottom:8px;
  background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:12px;
  animation: rdg-slideUp .4s ease both;
}
.qz-strength-dot {
  width:8px; height:8px; border-radius:50%;
  background:var(--gold); flex-shrink:0;
  box-shadow:0 0 6px rgba(212,165,116,.4);
}
.qz-strength-row span:last-child { font-size:.82rem; color:var(--text); }

.qz-result-tools { width:100%; max-width:360px; margin:16px 0; }
.qz-rec-tools { display:flex; flex-wrap:wrap; gap:8px; }
.qz-rec-tool-btn {
  display:flex; align-items:center; gap:6px;
  background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:20px;
  padding:8px 14px; cursor:pointer; color:var(--text); font-size:.78rem;
  font-family:var(--sans); transition: border-color .2s;
}
.qz-rec-tool-btn:active { border-color:var(--gold); }
.qz-rec-tool-glyph { font-size:1rem; }

.qz-done-btn {
  margin-top:24px; padding:12px 36px; border:none; border-radius:24px;
  background:var(--glass-bg); border:1px solid var(--gold); color:var(--gold);
  font-family:var(--serif); font-size:.88rem; cursor:pointer;
  transition: transform .15s;
}
.qz-done-btn:active { transform:scale(.96); }

/* ══════════════════════════════════════════════════════════
   FORTUNE TOOL DETAIL PAGES
   ══════════════════════════════════════════════════════════ */
.ft-page { padding:var(--page-top-pad) 16px 32px; }
.ft-title { font-size:1.3rem; color:var(--text); margin:0 0 8px; }
.ft-sub-title { font-size:.92rem; color:var(--text); margin:20px 0 10px; }
.ft-date-label { font-size:.78rem; color:var(--muted); margin:0 0 16px; }

/* Hero block (horoscope, numerology) */
.ft-hero { text-align:center; padding:16px 0 8px; }
.ft-hero-icon { font-size:2.4rem; display:block; margin-bottom:6px; }
.ft-num-icon { background:var(--gold); color:#fff; width:52px; height:52px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:1.5rem; }
.ft-hero-title { font-size:1.2rem; color:var(--text); margin:6px 0 2px; }
.ft-hero-sub { font-size:.78rem; color:var(--muted); }

/* Tabs */
.ft-tabs { display:flex; gap:0; margin:16px 0; border-bottom:1px solid var(--glass-border); }
.ft-tab {
  flex:1; padding:10px 0; background:none; border:none; border-bottom:2px solid transparent;
  color:var(--muted); font-size:.82rem; font-family:var(--sans); font-weight:600; cursor:pointer;
  transition: color .2s, border-color .2s;
}
.ft-tab--on { color:var(--gold); border-bottom-color:var(--gold); }

.ft-body { margin:8px 0; }
.ft-reading-text { font-size:.85rem; color:var(--text); line-height:1.6; margin:0 0 12px; }

/* Score ring */
.ft-score-ring { width:100px; height:100px; margin:8px auto 16px; position:relative; }
.ft-score-ring svg { width:100%; height:100%; }
.ft-score-val { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:1.3rem; color:var(--gold); font-weight:700; }

/* Area rows (horoscope daily) */
.ft-areas { display:flex; flex-direction:column; gap:12px; }
.ft-area-row { padding:12px 14px; background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:12px; }
.ft-area-label { font-size:.72rem; color:var(--gold); font-weight:700; text-transform:uppercase; letter-spacing:.5px; display:block; margin-bottom:4px; }
.ft-area-val { font-size:.82rem; color:var(--text); line-height:1.5; }

/* Lucky grid */
.ft-lucky-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:16px; }
.ft-lucky-item { padding:12px; background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:12px; text-align:center; }
.ft-lucky-label { font-size:.62rem; color:var(--muted); display:block; margin-bottom:4px; text-transform:uppercase; letter-spacing:.5px; }
.ft-lucky-val { font-size:.82rem; color:var(--gold); font-weight:600; }

/* Tarot cards */
.ft-tarot-cards { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; margin:12px 0; }
.ft-tarot-card {
  flex:0 0 calc(50% - 6px); max-width:180px;
  display:flex; flex-direction:column; align-items:center; text-align:center;
  padding:20px 12px 16px; border-radius:16px;
  animation: rdg-slideUp .4s ease both;
}
.ft-tarot-pos { font-size:.62rem; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; margin-bottom:6px; }
.ft-tarot-glyph { font-size:2.2rem; margin-bottom:8px; color:var(--gold); }
.ft-tarot-reversed { transform:rotate(180deg); color:var(--coral); }
.ft-tarot-name { font-size:.88rem; color:var(--text); margin-bottom:2px; }
.ft-tarot-orient { font-size:.62rem; color:var(--muted); margin-bottom:6px; }
.ft-tarot-meaning { font-size:.72rem; color:var(--text); line-height:1.45; margin:0; }

.ft-summary { padding:16px; border-radius:14px; margin:8px 0; }
.ft-summary-title { font-size:.88rem; color:var(--gold); margin:0 0 6px; }
.ft-summary-text { font-size:.82rem; color:var(--text); line-height:1.55; margin:0; }

/* Match Making */
.ft-match-inputs { display:flex; align-items:center; gap:12px; margin:16px 0; }
.ft-match-person { flex:1; display:flex; flex-direction:column; gap:4px; }
.ft-match-label { font-size:.72rem; color:var(--muted); font-weight:600; }
.ft-input {
  padding:10px 12px; border:1px solid var(--glass-border); border-radius:10px;
  background:var(--input-bg); color:var(--text); font-size:.82rem; font-family:var(--sans);
}
.ft-match-amp { font-size:1.1rem; color:var(--gold); font-weight:700; padding-top:16px; }
.ft-action-btn {
  width:100%; padding:14px; border:none; border-radius:14px;
  background:linear-gradient(135deg, var(--gold), #c9956a); color:#fff;
  font-family:var(--serif); font-size:.92rem; font-weight:700; cursor:pointer;
  transition: transform .15s;
}
.ft-action-btn:active { transform:scale(.97); }
.ft-action-btn:disabled { opacity:.4; }

.ft-match-result { margin-top:20px; }
.ft-match-hero { display:flex; align-items:center; justify-content:center; gap:16px; margin-bottom:16px; }
.ft-match-sign { font-size:.82rem; color:var(--text); font-weight:600; text-align:center; }
.ft-match-score-ring { width:80px; height:80px; position:relative; flex-shrink:0; }
.ft-match-score-ring svg { width:100%; height:100%; }

.ft-match-areas { display:flex; flex-direction:column; gap:10px; margin:12px 0; }
.ft-match-area-row { display:flex; align-items:center; gap:8px; }
.ft-match-area-label { font-size:.72rem; color:var(--muted); width:90px; flex-shrink:0; text-transform:capitalize; }
.ft-match-bar { flex:1; height:6px; background:var(--glass-border); border-radius:3px; overflow:hidden; }
.ft-match-bar-fill { height:100%; background:var(--gold); border-radius:3px; transition:width .5s ease; }
.ft-match-area-pct { font-size:.72rem; color:var(--gold); width:32px; text-align:right; }
.ft-advice { font-size:.82rem; color:var(--text); line-height:1.5; margin-top:12px; }

/* Numerology grid */
.ft-num-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:12px 0; }
.ft-num-cell { padding:14px; border-radius:12px; text-align:center; }
.ft-num-cell-label { font-size:.62rem; color:var(--muted); display:block; margin-bottom:4px; text-transform:uppercase; letter-spacing:.5px; }
.ft-num-cell-val { font-size:1.4rem; color:var(--gold); font-weight:700; }

/* Birth Chart */
.ft-chart-big3 { display:flex; gap:10px; margin:16px 0; }
.ft-big3-item { flex:1; display:flex; flex-direction:column; align-items:center; padding:16px 8px; border-radius:14px; text-align:center; }
.ft-big3-icon { font-size:1.6rem; margin-bottom:4px; }
.ft-big3-label { font-size:.6rem; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; }
.ft-big3-sign { font-size:.88rem; color:var(--gold); margin-top:2px; }

.ft-placements { display:flex; flex-direction:column; gap:8px; }
.ft-placement-row { display:flex; justify-content:space-between; padding:10px 14px; border-radius:10px; font-size:.78rem; }
.ft-placement-planet { color:var(--text); font-weight:600; }
.ft-placement-sign { color:var(--gold); }
.ft-placement-house { color:var(--muted); }

/* Almanac */
.ft-almanac-hero { display:flex; gap:10px; margin:0 0 16px; }
.ft-almanac-item { flex:1; display:flex; flex-direction:column; align-items:center; padding:16px 8px; border-radius:14px; text-align:center; }
.ft-almanac-icon { font-size:1.6rem; margin-bottom:4px; }
.ft-almanac-label { font-size:.6rem; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; }
.ft-almanac-val { font-size:.88rem; color:var(--gold); margin-top:2px; }

.ft-list { display:flex; flex-direction:column; gap:6px; margin-bottom:8px; }
.ft-list-row { display:flex; align-items:center; gap:8px; font-size:.82rem; color:var(--text); }
.ft-list-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.ft-list-good .ft-list-dot { background:var(--teal); }
.ft-list-warn .ft-list-dot { background:var(--coral); }

.ft-hours { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.ft-hour-row { display:flex; justify-content:space-between; padding:8px 12px; background:var(--glass-bg); border-radius:8px; font-size:.75rem; }
.ft-hour-time { color:var(--muted); }
.ft-hour-planet { color:var(--text); }

/* Menu list (Horoscope sub-pages) */
.ft-menu { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
.ft-menu-row {
  display:flex; align-items:center; gap:14px;
  padding:16px 14px; background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:14px;
  cursor:pointer; text-align:left; font-family:var(--sans);
  transition: transform .12s, background .15s;
}
.ft-menu-row:active { transform:scale(.98); background:var(--bg2); }
.ft-menu-icon { font-size:1.3rem; flex-shrink:0; width:32px; text-align:center; }
.ft-menu-label { flex:1; font-size:.88rem; color:var(--text); font-weight:600; }
.ft-menu-chevron { font-size:1.2rem; color:var(--muted); }

/* Area icon+label combo */
.ft-area-icon-label { display:flex; align-items:center; gap:6px; margin-bottom:4px; }
.ft-area-icon { font-size:.9rem; color:var(--gold); }

/* Zodiac meta row */
.ft-zodiac-meta { display:flex; gap:8px; margin:16px 0; }
.ft-zodiac-meta-item { flex:1; padding:12px 8px; border-radius:12px; text-align:center; }
.ft-zodiac-meta-label { font-size:.58rem; color:var(--muted); display:block; text-transform:uppercase; letter-spacing:.5px; margin-bottom:3px; }
.ft-zodiac-meta-val { font-size:.82rem; color:var(--gold); font-weight:600; }

/* Trait pills */
.ft-traits { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
.ft-trait-pill {
  padding:6px 14px; border-radius:20px;
  background:rgba(212,165,116,.1); border:1px solid rgba(212,165,116,.25);
  font-size:.75rem; color:var(--gold); font-weight:600;
}

/* Zodiac detail tabs */
.ft-zodiac-tabs { display:flex; flex-wrap:wrap; gap:6px; margin:12px 0 16px; }
.ft-zodiac-tab {
  padding:8px 16px; border-radius:20px; border:1px solid var(--glass-border);
  background:var(--glass-bg); color:var(--muted); font-size:.75rem; font-weight:600;
  cursor:pointer; font-family:var(--sans); transition:all .15s;
}
.ft-zodiac-tab--on { background:var(--gold); color:#fff; border-color:var(--gold); }

/* Zodiac detail section card */
.ft-zodiac-section { margin-bottom:16px; }
.ft-zodiac-section-title { font-size:.72rem; color:var(--gold); text-transform:uppercase; letter-spacing:.5px; margin:0 0 8px; font-weight:700; }

/* Card flip animation */
.ft-flip-container {
  perspective:800px; width:180px; height:270px; margin:0 auto; cursor:pointer;
}
.ft-flip-sm { width:100px; height:155px; }
.ft-flip-inner {
  position:relative; width:100%; height:100%;
  transition:transform 0.6s cubic-bezier(.4,0,.2,1);
  transform-style:preserve-3d;
}
.ft-flipped { transform:rotateY(180deg); }
.ft-flip-front, .ft-flip-back {
  position:absolute; inset:0; backface-visibility:hidden; border-radius:14px; overflow:hidden;
}
.ft-flip-back { transform:rotateY(180deg); }
.ft-card-back {
  width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;
  background:linear-gradient(145deg, rgba(212,165,116,.15), rgba(123,140,222,.1));
  border:2px solid var(--gold); border-radius:14px;
  gap:12px;
}
.ft-card-back-sm { gap:6px; }
.ft-card-back-star { font-size:2.4rem; color:var(--gold); animation:pulse-glow 2s infinite; }
.ft-card-back-sm .ft-card-back-star { font-size:1.4rem; }
.ft-card-back-label { font-size:.82rem; color:var(--gold); letter-spacing:1px; }
.ft-card-back-sm .ft-card-back-label { font-size:.68rem; }

.ft-three-cards { display:flex; justify-content:center; gap:12px; margin:0 auto; }

.ft-tarot-card-sm { padding:8px 4px; }
.ft-tarot-card-sm .ft-tarot-pos { font-size:.58rem; }

@keyframes pulse-glow {
  0%, 100% { opacity:.7; text-shadow:0 0 8px rgba(212,165,116,.3); }
  50% { opacity:1; text-shadow:0 0 16px rgba(212,165,116,.6); }
}

/* Gender selector (Love Compat) */
.ft-gender-row { display:flex; gap:10px; margin:12px 0 16px; }
.ft-gender-btn {
  flex:1; display:flex; align-items:center; justify-content:center; gap:8px;
  padding:14px; border-radius:14px; border:1px solid var(--glass-border);
  background:var(--glass-bg); color:var(--muted);
  font-family:var(--sans); font-size:.88rem; font-weight:600; cursor:pointer;
  transition:all .2s;
}
.ft-gender-btn--on { background:var(--gold); color:#fff; border-color:var(--gold); }

/* Sign grid (Love Compat) */
.ft-sign-grid {
  display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:16px;
}
.ft-sign-btn {
  padding:12px 4px; border-radius:12px; border:1px solid var(--glass-border);
  background:var(--glass-bg); color:var(--text);
  font-family:var(--sans); font-size:.72rem; font-weight:600; cursor:pointer;
  text-align:center; transition:all .2s;
}
.ft-sign-btn--on { background:var(--gold); color:#fff; border-color:var(--gold); }

/* Chinese Horoscope section cards */
.ft-cn-section-card {
  margin-bottom:12px; padding:16px; border-radius:14px;
  background:var(--glass-bg); border:1px solid var(--glass-border);
}
.ft-cn-section-title {
  display:flex; align-items:center; gap:8px;
  font-family:var(--serif); font-size:.88rem; font-weight:700; color:var(--gold); margin:0 0 8px;
}
.ft-cn-section-text { font-size:.82rem; color:var(--text); line-height:1.55; margin:0; }

/* Yearly Horoscope section cards */
.ft-year-section {
  margin-bottom:12px; padding:16px; border-radius:14px;
  background:var(--glass-bg); border:1px solid var(--glass-border);
}
.ft-year-section-title {
  display:flex; align-items:center; gap:8px;
  font-family:var(--serif); font-size:.88rem; font-weight:700; color:var(--gold); margin:0 0 8px;
}
.ft-year-section-text { font-size:.82rem; color:var(--text); line-height:1.55; margin:0; }

/* ═══════════════════════════════════════════════════════
   KUNDLI
   ═══════════════════════════════════════════════════════ */
/* Main 3×3+1 grid (10 items → 3 cols) */
.kd-grid {
  display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:16px 0;
}
.kd-grid-btn {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:16px 8px; border-radius:14px; border:1px solid var(--gold);
  background:var(--glass-bg); cursor:pointer; text-align:center;
  font-family:var(--sans); transition:transform .12s, background .15s;
  animation:fade-up .3s ease both;
  aspect-ratio:1;
}
.kd-grid-btn:active { transform:scale(.96); background:var(--bg2); }
.kd-grid-icon { font-size:1.6rem; margin-bottom:6px; }
.kd-grid-label { font-size:.68rem; color:var(--text); font-weight:600; line-height:1.2; }

/* Data table */
.kd-table { display:flex; flex-direction:column; gap:0; margin:12px 0; border-radius:14px; overflow:hidden; border:1px solid var(--glass-border); }
.kd-row { display:flex; justify-content:space-between; padding:10px 14px; border-bottom:1px solid var(--glass-border); }
.kd-row:last-child { border-bottom:none; }
.kd-row-label { font-size:.75rem; color:var(--muted); }
.kd-row-val { font-size:.75rem; color:var(--text); font-weight:600; text-align:right; max-width:55%; }

/* Chart grid (4x4 South Indian) */
.kd-chart-grid {
  display:grid; grid-template-columns:repeat(4,1fr); gap:3px; margin:12px 0;
  aspect-ratio:1; max-width:320px; margin-left:auto; margin-right:auto;
}
.kd-chart-slot { min-height:0; }
.kd-chart-cell {
  width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:4px 2px; border-radius:8px; border:1px solid var(--glass-border);
  font-size:.62rem; gap:2px; min-height:60px;
}
.kd-chart-center { }
.kd-chart-center-label { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; }
.kd-chart-sign { font-size:.62rem; color:var(--gold); font-weight:700; }
.kd-chart-asc { font-size:.5rem; color:var(--coral); font-weight:700; text-transform:uppercase; }
.kd-chart-planets { display:flex; flex-wrap:wrap; gap:2px; justify-content:center; }
.kd-chart-planet { font-size:.65rem; color:var(--text); font-weight:600; }
.kd-retro { color:var(--coral); }

.kd-houses-list { display:flex; flex-direction:column; gap:4px; }
.kd-house-row { display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--glass-bg); border-radius:8px; font-size:.75rem; }
.kd-house-num { width:24px; color:var(--gold); font-weight:700; }
.kd-house-sign { flex:1; color:var(--text); }
.kd-house-planets { color:var(--muted); }

/* Planet cards */
.kd-planet-cards { display:flex; flex-direction:column; gap:10px; }
.kd-planet-card { padding:14px; border-radius:14px; }
.kd-planet-header { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
.kd-planet-sym { font-size:1.4rem; color:var(--gold); }
.kd-planet-name { font-size:.88rem; color:var(--text); }
.kd-retro-badge { display:inline-block; font-size:.58rem; color:var(--coral); background:rgba(248,113,113,.1); border:1px solid rgba(248,113,113,.25); padding:2px 6px; border-radius:8px; margin-left:6px; }
.kd-planet-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.kd-pfield { display:flex; flex-direction:column; gap:1px; }
.kd-pf-label { font-size:.58rem; color:var(--muted); text-transform:uppercase; letter-spacing:.3px; }
.kd-pf-val { font-size:.75rem; color:var(--text); font-weight:600; }

/* Favorable grid */
.kd-fav-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:12px 0; }
.kd-fav-card { padding:12px; border-radius:12px; display:flex; flex-direction:column; align-items:center; text-align:center; gap:4px; }
.kd-fav-icon { font-size:1.2rem; }
.kd-fav-label { font-size:.6rem; color:var(--muted); text-transform:uppercase; letter-spacing:.3px; }
.kd-fav-val { font-size:.78rem; color:var(--gold); font-weight:600; }

/* Dasha */
.kd-dasha-current { display:flex; flex-direction:column; align-items:center; padding:16px; border-radius:14px; text-align:center; gap:2px; margin-bottom:12px; }
.kd-dasha-list { display:flex; flex-direction:column; gap:4px; }
.kd-dasha-row {
  display:flex; align-items:center; gap:6px; padding:10px 12px; width:100%;
  background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:10px;
  cursor:pointer; font-family:var(--sans); font-size:.75rem; text-align:left;
}
.kd-dasha-current-row { border-color:var(--gold); background:rgba(212,165,116,.06); }
.kd-dasha-planet { flex:1; color:var(--text); font-weight:600; }
.kd-dasha-years { color:var(--gold); font-weight:700; width:45px; text-align:center; }
.kd-dasha-dates { color:var(--muted); font-size:.65rem; flex:1.5; text-align:right; }
.kd-dasha-chevron { color:var(--muted); font-size:.6rem; width:16px; text-align:center; }
.kd-antar-list { padding:4px 0 4px 20px; display:flex; flex-direction:column; gap:3px; }
.kd-antar-row { display:flex; justify-content:space-between; padding:6px 10px; background:var(--glass-bg); border-radius:8px; font-size:.72rem; color:var(--text); }

/* Dosha */
.kd-dosha-card { padding:14px; border-radius:14px; margin-bottom:10px; }
.kd-dosha-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.kd-dosha-badge { font-size:.6rem; color:#fff; padding:3px 10px; border-radius:10px; font-weight:700; }
.kd-dosha-text { font-size:.78rem; color:var(--text); line-height:1.5; margin:0; }

/* Remedies */
.kd-remedy-card { padding:14px; border-radius:14px; margin-bottom:10px; display:flex; flex-direction:column; gap:2px; }
.kd-remedy-badge { font-size:.58rem; color:var(--gold); text-transform:uppercase; letter-spacing:.5px; font-weight:700; }
.kd-remedy-text { font-size:.78rem; color:var(--text); line-height:1.5; margin:4px 0 0; }

/* Nakshatra meta grid */
.kd-nk-meta { display:flex; flex-wrap:wrap; gap:6px; margin:12px 0; justify-content:center; }
.kd-nk-meta-item { padding:8px 10px; border-radius:10px; text-align:center; min-width:70px; }
.kd-nk-meta-label { display:block; font-size:.52rem; color:var(--muted); text-transform:uppercase; letter-spacing:.3px; margin-bottom:2px; }
.kd-nk-meta-val { font-size:.72rem; color:var(--gold); font-weight:600; }

/* Biorhythm */
.kd-bio-cards { display:flex; flex-direction:column; gap:10px; }
.kd-bio-card { padding:14px; border-radius:14px; }
.kd-bio-header { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.kd-bio-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
.kd-bio-pct { margin-left:auto; font-size:1.1rem; font-weight:700; }
.kd-bio-bar { height:8px; position:relative; }
.kd-bio-bar-bg { width:100%; height:100%; background:var(--glass-border); border-radius:4px; position:relative; overflow:hidden; }
.kd-bio-bar-zero { position:absolute; left:50%; top:0; bottom:0; width:1px; background:var(--muted); }
.kd-bio-bar-fill { position:absolute; top:0; height:100%; border-radius:4px; transition:width .5s ease; }
.kd-bio-overall { display:flex; flex-direction:column; align-items:center; padding:16px; border-radius:14px; text-align:center; gap:4px; }
.kd-bio-week { display:flex; gap:6px; justify-content:space-between; }
.kd-bio-day { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; }
.kd-bio-day-label { font-size:.6rem; color:var(--muted); }
.kd-bio-day-bars { display:flex; gap:2px; align-items:flex-end; height:40px; }
.kd-bio-mini-bar { width:6px; border-radius:3px 3px 0 0; min-height:4px; }
.kd-bio-day-score { font-size:.6rem; font-weight:600; }

/* Panchang */
.ft-panch-vara { display:flex; align-items:center; gap:12px; padding:16px; border-radius:14px; margin-bottom:16px; }
.ft-panch-vara-sym { font-size:1.8rem; color:var(--gold); }
.ft-panch-vara-info { display:flex; flex-direction:column; }
.ft-panch-vara-name { font-size:1rem; color:var(--gold); }
.ft-panch-vara-eng { font-size:.72rem; color:var(--muted); margin-top:2px; }
.ft-panch-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px; }
.ft-panch-cell { display:flex; flex-direction:column; align-items:center; padding:14px 8px; border-radius:14px; text-align:center; gap:3px; }
.ft-panch-cell-label { font-size:.6rem; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; }
.ft-panch-cell-val { font-size:.85rem; color:var(--gold); }
.ft-panch-cell-note { font-size:.65rem; color:var(--muted); }
.ft-panch-cell-note--good { color:var(--teal); }
.ft-panch-cell-note--warn { color:var(--coral); }
.ft-panch-cell-note--neutral { color:var(--muted); }
.ft-panch-row { display:flex; gap:8px; margin-bottom:16px; }
.ft-panch-item { flex:1; display:flex; flex-direction:column; align-items:center; padding:14px 6px; border-radius:14px; text-align:center; }
.ft-panch-icon { font-size:1.4rem; margin-bottom:4px; }
.ft-panch-label { font-size:.6rem; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; }
.ft-panch-val { font-size:.82rem; color:var(--gold); margin-top:2px; }
.ft-panch-rahu { display:flex; flex-direction:column; align-items:center; padding:14px; border-radius:14px; margin-bottom:16px; text-align:center; border:1px solid var(--coral); }
.ft-panch-rahu-label { font-size:.75rem; color:var(--coral); font-weight:600; margin-bottom:4px; }
.ft-panch-rahu-val { font-size:1rem; color:var(--text); font-weight:600; }
.ft-panch-rahu-note { font-size:.65rem; color:var(--muted); margin-top:4px; }
.ft-panch-hint { display:flex; align-items:center; gap:10px; padding:14px; border-radius:14px; margin-top:16px; }
.ft-panch-hint-icon { font-size:1.3rem; }
.ft-panch-hint-text { font-size:.8rem; color:var(--text); line-height:1.4; }

@keyframes fade-up { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

/* ── Match Making (8-System) ── */
.mm-form-header { text-align:center; margin-bottom:20px; }
.mm-form-glyph { font-size:2.5rem; display:block; margin-bottom:4px; color:var(--gold); }
.mm-input { width:100%; padding:13px 14px; border-radius:12px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.05); color:var(--text); font-size:.9rem; margin-bottom:14px; box-sizing:border-box; -webkit-appearance:none; font-family:inherit; }
.mm-input::placeholder { color:var(--muted); }
.mm-input:focus { outline:none; border-color:var(--gold); box-shadow:0 0 0 2px rgba(212,165,116,0.15); }

.mm-hero { display:flex; align-items:center; justify-content:center; gap:10px; margin:16px 0 12px; }
.mm-person { display:flex; flex-direction:column; align-items:center; gap:2px; flex:1; min-width:0; }
.mm-icon { font-size:2.2rem; line-height:1; }
.mm-name { font-size:.82rem; color:var(--text); text-align:center; max-width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600; }
.mm-sign { font-size:.7rem; color:var(--muted); }
.mm-verdict { text-align:center; font-size:1.25rem; color:var(--gold); margin:8px 0 4px; }
.mm-summary { text-align:center; font-size:.82rem; color:var(--muted); margin-bottom:16px; line-height:1.45; padding:0 8px; }

.mm-systems { display:flex; flex-direction:column; gap:10px; }
.mm-sys-card { padding:14px; border-radius:14px; cursor:pointer; transition:all .2s; border:1px solid var(--glass-border); }
.mm-sys-card:active { transform:scale(.985); }
.mm-sys-expanded { border-color:var(--gold); }
.mm-sys-header { display:flex; align-items:center; gap:10px; }
.mm-sys-icon { font-size:1.4rem; width:34px; text-align:center; flex-shrink:0; }
.mm-sys-info { flex:1; min-width:0; }
.mm-sys-name { font-size:.82rem; font-weight:600; color:var(--text); display:block; }
.mm-sys-summary { font-size:.7rem; color:var(--muted); display:block; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mm-sys-score { font-size:1.1rem; color:var(--gold); font-weight:700; flex-shrink:0; min-width:38px; text-align:right; }
.mm-sys-detail { margin-top:12px; padding-top:12px; border-top:1px solid var(--glass-border); }
.mm-factor { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.mm-factor-label { font-size:.72rem; color:var(--muted); width:85px; flex-shrink:0; }
.mm-factor-value { font-size:.72rem; color:var(--text); width:90px; flex-shrink:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mm-factor-bar { flex:1; height:5px; background:var(--glass-border); border-radius:3px; overflow:hidden; }
.mm-factor-fill { height:100%; background:linear-gradient(90deg, var(--gold), #e8c97a); border-radius:3px; transition:width .4s ease; }
.mm-sys-desc { font-size:.78rem; color:var(--text); line-height:1.5; margin-top:10px; opacity:.85; white-space:pre-line; }
.mm-optional { font-size:.72rem; color:var(--muted); font-weight:400; }
.mm-hint { font-size:.72rem; color:var(--muted); margin:-8px 0 14px; line-height:1.3; }
.mm-field-label { font-size:.78rem; color:var(--muted); margin-bottom:4px; display:block; }
.partner-geo-dropdown { position:absolute; top:100%; left:0; right:0; z-index:50; background:var(--bg, #0a0e1a); border:1px solid var(--gold); border-radius:10px; overflow:hidden; margin-top:2px; max-height:220px; overflow-y:auto; box-shadow:0 8px 24px rgba(0,0,0,0.6); }
.partner-geo-item { display:block; width:100%; text-align:left; padding:11px 14px; border:none; background:transparent; color:var(--text); font-size:.82rem; cursor:pointer; border-bottom:1px solid var(--glass-border); line-height:1.35; }
.partner-geo-item:last-child { border-bottom:none; }
.partner-geo-item:active { background:rgba(212,165,116,0.15); }
.mm-sca-group { margin-top:14px; padding-top:12px; border-top:1px solid var(--glass-border); }
.mm-sca-title { font-size:.74rem; text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px; }
.mm-sca-title--good { color:#4ADE80; }
.mm-sca-title--warn { color:#FBBF24; }
.mm-sca-title--advice { color:var(--gold); }
.mm-sca-item { font-size:.78rem; line-height:1.5; margin:0 0 6px; padding-left:14px; position:relative; }
.mm-sca-item::before { content:''; position:absolute; left:0; top:7px; width:6px; height:6px; border-radius:50%; }
.mm-sca-item--good::before { background:#4ADE80; }
.mm-sca-item--warn::before { background:#FBBF24; }
.mm-sca-item--advice { padding-left:0; font-style:italic; color:var(--muted); }
.mm-sca-item--advice::before { display:none; }
.btn-outline { padding:12px 0; border-radius:12px; border:1px solid var(--glass-border); background:transparent; color:var(--text); font-size:.88rem; font-family:inherit; cursor:pointer; }

/* ══════════════════════════════════════════
   FULL COMBINED ANALYSIS
   ══════════════════════════════════════════ */
.fca-page { padding-bottom:60px; }
.fca-hidden { opacity:0; transform:translateY(18px); pointer-events:none; }
.fca-visible { opacity:1; transform:translateY(0); transition:opacity .6s ease, transform .6s ease; }

/* Header */
.fca-header { position:relative; text-align:center; padding:20px 0 10px; overflow:hidden; }
.fca-stars { position:absolute; inset:0; pointer-events:none; }
.fca-star { position:absolute; font-size:10px; color:var(--gold); opacity:0.25; animation:fca-twinkle 3s ease-in-out infinite; }
@keyframes fca-twinkle { 0%,100%{opacity:0.15;transform:scale(0.8)} 50%{opacity:0.5;transform:scale(1.2)} }
.fca-kicker { font-size:.68rem; text-transform:uppercase; letter-spacing:1.5px; color:var(--gold); margin-bottom:6px; }
.fca-title { font-size:1.5rem; color:var(--text); margin:0 0 4px; line-height:1.2; }
.fca-subtitle { font-size:.9rem; color:var(--muted); margin:0 0 2px; }
.fca-date { font-size:.7rem; color:var(--muted); opacity:0.6; }

/* Score ring */
.fca-score-section { text-align:center; margin:16px 0 20px; }
.fca-ring { position:relative; width:140px; height:140px; margin:0 auto 10px; }
.fca-ring svg { width:100%; height:100%; }
.fca-ring-fill { transition:stroke-dasharray 1.5s ease; }
.fca-ring-inner { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.fca-ring-score { font-size:2rem; color:var(--text); line-height:1; }
.fca-ring-label { font-size:.68rem; color:var(--muted); text-transform:uppercase; letter-spacing:1px; }
.fca-verdict { text-align:center; font-size:1.3rem; color:var(--gold); margin:0 0 6px; }
.fca-verdict-text { text-align:center; font-size:.84rem; color:var(--muted); line-height:1.5; padding:0 12px; }

/* At a Glance bars */
.fca-glance { margin:20px 0; }
.fca-section-title { font-size:1rem; color:var(--text); margin:0 0 12px; }
.fca-bar-grid { display:flex; flex-direction:column; gap:8px; }
.fca-bar-row { display:flex; align-items:center; gap:8px; }
.fca-bar-icon { font-size:.9rem; width:22px; text-align:center; flex-shrink:0; }
.fca-bar-name { font-size:.72rem; color:var(--muted); width:90px; flex-shrink:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.fca-bar-track { flex:1; height:8px; background:var(--glass-border); border-radius:4px; overflow:hidden; }
.fca-bar-fill { height:100%; border-radius:4px; transition:width 1.2s ease; }
.fca-bar-val { font-size:.72rem; font-weight:700; width:32px; text-align:right; flex-shrink:0; }

/* Tier sections */
.fca-tier { margin:24px 0; }
.fca-tier-intro { font-size:.8rem; color:var(--muted); margin:-4px 0 14px; line-height:1.4; }
.fca-sys-block { padding:14px; margin-bottom:12px; border-radius:14px; }
.fca-sys-hd { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.fca-sys-icon { font-size:1.1rem; }
.fca-sys-name { font-size:.9rem; color:var(--text); flex:1; }
.fca-sys-pct { font-size:.9rem; font-weight:700; }
.fca-sys-prose { font-size:.82rem; color:var(--muted); line-height:1.55; margin:0 0 10px; }
.fca-pills { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
.fca-pill { font-size:.72rem; padding:5px 10px; border-radius:8px; line-height:1.3; }
.fca-pill--good { background:rgba(74,222,128,0.1); color:#4ADE80; border:1px solid rgba(74,222,128,0.2); }
.fca-pill--warn { background:rgba(251,191,36,0.1); color:#FBBF24; border:1px solid rgba(251,191,36,0.2); }
.fca-advice { font-size:.78rem; color:var(--muted); font-style:italic; line-height:1.45; margin-top:10px; padding-top:8px; border-top:1px solid var(--glass-border); }

/* Combined strengths/challenges */
.fca-combined { margin:24px 0; }
.fca-combined-list { display:flex; flex-direction:column; gap:8px; }
.fca-combo-item { display:flex; align-items:flex-start; gap:8px; padding:10px 12px; border-radius:10px; background:rgba(255,255,255,0.03); }
.fca-combo-item--good { border-left:3px solid #4ADE80; }
.fca-combo-item--warn { border-left:3px solid #FBBF24; }
.fca-combo-dot { flex-shrink:0; font-size:.7rem; margin-top:2px; }
.fca-combo-text { flex:1; font-size:.8rem; color:var(--text); line-height:1.4; }
.fca-combo-src { font-size:.65rem; color:var(--muted); flex-shrink:0; align-self:center; }

/* Guidance */
.fca-guidance { margin:24px 0; }
.fca-advice-card { display:flex; gap:12px; padding:12px 14px; border-radius:12px; margin-bottom:10px; align-items:flex-start; }
.fca-advice-icon { font-size:1.2rem; flex-shrink:0; margin-top:2px; }
.fca-advice-sys { font-size:.7rem; text-transform:uppercase; letter-spacing:.5px; color:var(--gold); display:block; margin-bottom:3px; }
.fca-advice-text { font-size:.8rem; color:var(--muted); line-height:1.45; margin:0; }

/* Advanced toggle */
.fca-advanced-toggle { margin:24px 0 8px; text-align:center; }
.fca-adv-btn { display:inline-block; padding:12px 24px; border:1px solid var(--glass-border); border-radius:12px; background:transparent; color:var(--gold); font-size:.85rem; cursor:pointer; font-family:inherit; }
.fca-advanced { margin:12px 0; }
.fca-adv-sys { margin-bottom:20px; }
.fca-adv-sys-title { font-size:.88rem; color:var(--text); margin:0 0 10px; }
.fca-adv-factors { display:flex; flex-direction:column; gap:8px; }
.fca-adv-factor { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.fca-adv-factor-hd { display:flex; gap:6px; width:100%; }
.fca-adv-factor-label { font-size:.72rem; color:var(--muted); }
.fca-adv-factor-val { font-size:.72rem; color:var(--text); margin-left:auto; }
.fca-adv-factor-bar { flex:1; height:6px; background:var(--glass-border); border-radius:3px; overflow:hidden; min-width:60%; }
.fca-adv-factor-fill { height:100%; border-radius:3px; transition:width 1s ease; }
.fca-adv-factor-pct { font-size:.68rem; color:var(--muted); width:28px; text-align:right; flex-shrink:0; }

/* Actions */
.fca-actions { text-align:center; margin:28px 0 16px; }
.fca-download-btn { width:100%; padding:15px 0; font-size:.95rem; }
.fca-full-btn { width:100%; padding:15px 0; font-size:.95rem; }
.fca-footer { text-align:center; font-size:.68rem; color:var(--muted); opacity:0.5; margin-top:20px; padding-bottom:20px; }

/* Neuro-symbolic additions */
.fca-loading-hint { font-size:.72rem; color:var(--gold); opacity:0.7; animation:fca-twinkle 2s ease-in-out infinite; margin-top:6px; }
.fca-engine-badge { display:inline-block; font-size:.65rem; text-transform:uppercase; letter-spacing:1px; color:var(--gold); border:1px solid var(--gold); border-radius:20px; padding:3px 12px; margin-top:8px; opacity:0.7; }
.fca-legend { font-size:.65rem; color:var(--muted); text-align:center; margin-top:8px; }
.fca-legend span { margin-right:4px; }

/* Life Area Synergy */
.fca-areas { margin:20px 0; }
.fca-area-grid { display:flex; flex-direction:column; gap:10px; }
.fca-area-card { padding:12px 14px; border-radius:12px; }
.fca-area-hd { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.fca-area-icon { font-size:1rem; }
.fca-area-name { font-size:.85rem; color:var(--text); flex:1; font-weight:500; }
.fca-area-synergy { font-size:.88rem; font-weight:700; }
.fca-area-bars { display:flex; flex-direction:column; gap:4px; }
.fca-area-bar-row { display:flex; align-items:center; gap:6px; }
.fca-area-bar-label { font-size:.65rem; color:var(--muted); width:55px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex-shrink:0; }
.fca-area-bar-pct { font-size:.65rem; color:var(--muted); width:28px; text-align:right; flex-shrink:0; }
.fca-area-note { font-size:.75rem; color:var(--muted); line-height:1.4; margin-top:6px; font-style:italic; }

/* NS insight blocks inside system cards */
.fca-ns-insight { margin:10px 0; padding:10px 12px; border-radius:10px; background:rgba(212,165,116,0.06); border-left:3px solid var(--gold); }
.fca-ns-label { font-size:.65rem; text-transform:uppercase; letter-spacing:.8px; color:var(--gold); margin-bottom:4px; }
.fca-ns-text { font-size:.78rem; color:var(--muted); line-height:1.45; margin:2px 0; }
.fca-ns-harmony { font-size:.78rem; color:var(--text); line-height:1.45; margin-top:4px; font-style:italic; }
.fca-evidence-row { display:flex; flex-wrap:wrap; gap:5px; margin-top:6px; }
.fca-ev-tag { font-size:.65rem; padding:3px 8px; border-radius:6px; background:rgba(255,255,255,0.05); color:var(--muted); border:1px solid var(--glass-border); }
.fca-harmony-dot { font-size:.55rem; flex-shrink:0; margin-left:2px; }

/* Advanced evidence trail */
.fca-adv-evidence { margin-top:12px; padding-top:10px; border-top:1px solid var(--glass-border); }
.fca-adv-evidence-title { font-size:.7rem; text-transform:uppercase; letter-spacing:.8px; color:var(--gold); margin-bottom:8px; }
.fca-adv-ev-cols { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.fca-adv-ev-col { }
.fca-adv-ev-who { font-size:.7rem; color:var(--text); font-weight:600; margin-bottom:4px; }
.fca-adv-ev-item { display:flex; flex-wrap:wrap; gap:4px; margin-bottom:4px; align-items:baseline; }
.fca-adv-ev-feature { font-size:.68rem; color:var(--muted); }
.fca-adv-ev-value { font-size:.68rem; color:var(--text); }
.fca-adv-ev-cat { font-size:.58rem; padding:1px 5px; border-radius:4px; background:rgba(212,165,116,0.12); color:var(--gold); }

/* ══════════════════════════════════════════
   V2 TODAY TAB
   ══════════════════════════════════════════ */
.v2-section-label {
  font: 600 11px/1 var(--mono);
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.v2-section-explainer {
  font: 400 12px/1.4 var(--sans);
  color: var(--text-muted);
  margin-bottom: 14px;
  opacity: 0.7;
}

/* Status line */
.v2-status-line {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 20px;
}
.v2-status-item {
  font: 500 11px/1.3 var(--mono);
  color: var(--text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
}
.v2-status-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Today header */
.v2-today-header { display:flex; align-items:center; justify-content:space-between; }
.v2-today-header .v2-settings-btn { flex-shrink:0; }
.v2-settings-btn {
  width:48px; height:48px; display:flex; align-items:center; justify-content:center;
  color:var(--muted); border-radius:50%;
  background:rgba(255,255,255,.04); border:1px solid var(--glass-border);
  transition:all var(--dur-normal) var(--ease-smooth);
  font-size:0;
}
.v2-settings-btn svg { width:26px; height:26px; }
.v2-settings-btn:active { color:var(--gold); background:rgba(212,165,116,.08); transform:scale(.92); }
[data-theme="light"] .v2-settings-btn { background:rgba(0,0,0,.03); }
.v2-today-greeting {
  font: 400 20px/1.3 var(--serif);
  color: var(--gold);
  margin-bottom: 2px;
  letter-spacing: -0.005em;
}
.v2-today-date {
  font: 300 28px/1.15 var(--serif);
  color: var(--text);
  margin-bottom: 4px;
  letter-spacing: -0.01em;
}
.v2-today-sub {
  font: 400 14px/1.5 var(--sans);
  color: var(--text-secondary);
  margin-bottom: 24px;
}

/* Agreement Spectrum */
.v2-spectrum-section { margin-bottom: 28px; }
.v2-spectrum-label {
  font: 600 11px/1 var(--mono);
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.v2-spectrum-bar-wrap {
  position: relative;
  height: 28px;
  margin-bottom: 6px;
}
.v2-spectrum-track {
  position: absolute;
  top: 12px; left: 0; right: 0;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
}
.v2-spectrum-dot {
  position: absolute;
  top: 4px;
  width: 20px; height: 20px;
  border-radius: 50%;
  border: 2px solid var(--surface);
  box-shadow: var(--shadow-sm);
  transform: translateX(-50%);
  transition: left 0.5s ease-out;
}
.v2-spectrum-labels {
  display: flex;
  justify-content: space-between;
}
.v2-spectrum-labels span {
  font: 400 10px/1 var(--mono);
  color: var(--text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.v2-spectrum-conf {
  font: 500 12px/1 var(--mono);
  color: var(--text-secondary);
  text-align: center;
  margin-top: 10px;
}

/* Score Dot-Plot */
.v2-dotplot-section { margin-bottom: 28px; }
.v2-dotplot-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);
}
.v2-dotplot-row:last-child { border-bottom: none; }
.v2-dotplot-label {
  font: 500 13px/1 var(--sans);
  color: var(--text);
  width: 72px;
  flex-shrink: 0;
}
.v2-dotplot-track {
  flex: 1;
  position: relative;
  height: 20px;
  margin: 0 12px;
}
.v2-dotplot-line {
  position: absolute;
  top: 9px; left: 0; right: 0;
  height: 2px;
  background: var(--border);
}
.v2-dotplot-center {
  position: absolute;
  top: 4px; left: 50%;
  width: 1px; height: 12px;
  background: var(--border);
}
.v2-dotplot-dot {
  position: absolute;
  top: 4px;
  width: 12px; height: 12px;
  border-radius: 50%;
  transform: translateX(-50%);
  transition: left 0.5s ease-out;
}
.v2-dotplot-value {
  font: 600 12px/1 var(--mono);
  width: 48px;
  text-align: right;
  flex-shrink: 0;
}
.v2-dotplot-agree {
  font: 400 10px/1 var(--mono);
  color: var(--text-muted);
  width: 32px;
  text-align: right;
  flex-shrink: 0;
}

/* Daily pull-quote */
.v2-daily-quote {
  font: 300 22px/1.4 var(--serif);
  color: var(--text);
  margin: 24px 0 20px;
  letter-spacing: -0.005em;
  position: relative;
  padding-left: 18px;
}
.v2-daily-quote::before {
  content: '';
  position: absolute;
  left: 0; top: 4px; bottom: 4px;
  width: 3px;
  background: var(--gold);
  border-radius: 2px;
}
.v2-daily-meta {
  font: 400 13px/1.6 var(--sans);
  color: var(--text-secondary);
  margin-bottom: 24px;
  padding-left: 18px;
}
.v2-daily-meta strong {
  font-weight: 600;
  color: var(--text);
}

/* Focus / Caution / Anchor pills */
.v2-daily-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
  padding-left: 18px;
}
.v2-pill {
  display: inline-block;
  font: 500 12px/1 var(--sans);
  padding: 7px 14px;
  border-radius: 20px;
  letter-spacing: 0.01em;
}
.v2-pill--focus {
  background: rgba(212,165,116,0.12);
  color: var(--gold);
  border: 1px solid rgba(212,165,116,0.2);
}
.v2-pill--caution {
  background: rgba(255,90,90,0.08);
  color: var(--negative);
  border: 1px solid rgba(255,90,90,0.15);
}
.v2-pill--anchor {
  background: rgba(100,180,255,0.08);
  color: var(--accent);
  border: 1px solid rgba(100,180,255,0.15);
}
[data-theme="light"] .v2-pill--focus {
  background: rgba(180,130,60,0.08);
}
[data-theme="light"] .v2-pill--caution {
  background: rgba(200,50,50,0.06);
}
[data-theme="light"] .v2-pill--anchor {
  background: rgba(60,130,220,0.06);
}

/* Do / Don't columns (v2) */
.v2-dodont {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 28px;
}
.v2-dodont-col h4 {
  font: 600 11px/1 var(--mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.v2-dodont-col.do h4 { color: var(--positive); }
.v2-dodont-col.dont h4 { color: var(--negative); }
.v2-dodont-item {
  font: 400 13px/1.5 var(--sans);
  color: var(--text-secondary);
  padding: 5px 0 5px 14px;
  position: relative;
}
.v2-dodont-item::before {
  content: '';
  position: absolute;
  left: 0; top: 11px;
  width: 5px; height: 5px;
  border-radius: 50%;
}
.v2-dodont-col.do .v2-dodont-item::before { background: var(--positive); }
.v2-dodont-col.dont .v2-dodont-item::before { background: var(--negative); }

/* ══════════════════════════════════════════
   V2 SYSTEMS TAB
   ══════════════════════════════════════════ */
.v2-sys-header { padding: 16px 0 20px; }
.v2-sys-header h2 {
  font: 700 24px/1.15 var(--serif);
  color: var(--text);
  margin-bottom: 4px;
}
.v2-sys-header-sub {
  font: 400 13px/1.5 var(--sans);
  color: var(--text-secondary);
}
.v2-sys-overall {
  font: 500 14px/1.4 var(--sans);
  color: var(--text-secondary);
  margin: 4px 0 2px;
}
.v2-sys-overall-val {
  font-weight: 700;
  font-family: var(--mono);
}

/* System rows */
.v2-sys-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
}
.v2-sys-row:last-child { border-bottom: none; }
.v2-sys-icon {
  width: 36px; height: 36px;
  border-radius: var(--v2-r);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: var(--surface);
  border: 1px solid var(--border);
}
.v2-sys-info { flex: 1; min-width: 0; }
.v2-sys-name {
  font: 600 14px/1.2 var(--sans);
  color: var(--text);
}
.v2-sys-headline {
  font: 400 12px/1.4 var(--sans);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.v2-sys-score-bar-mini {
  width: 48px; height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
  flex-shrink: 0;
}
.v2-sys-score-fill-mini {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease-out;
}
.v2-sys-score-num {
  font: 600 12px/1 var(--mono);
  width: 36px;
  text-align: right;
  flex-shrink: 0;
}
.v2-sys-chevron {
  font-size: 18px;
  color: var(--text-muted);
  flex-shrink: 0;
  margin-left: -4px;
  opacity: 0.6;
}

/* System Detail Overlay */
.v2-sys-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--bg);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  animation: fadeSlideIn 0.2s ease-out;
}
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.v2-sys-overlay-inner {
  padding: calc(var(--safe-top) + 16px) var(--page-x) calc(var(--nav-h) + 32px);
  max-width: 600px;
  margin: 0 auto;
}
.v2-sys-back {
  font: 500 14px/1 var(--sans);
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 0;
  margin-bottom: 16px;
}
.v2-sys-back:hover { color: var(--text); }
.v2-sys-detail-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.v2-sys-detail-topbar .v2-sys-back { margin-bottom: 0; }
.v2-sys-swipe-hint {
  font: 400 11px/1 var(--sans);
  color: var(--text-muted);
  opacity: 0.7;
  letter-spacing: 0.02em;
}
.v2-sys-detail-header { margin-bottom: 24px; }
.v2-sys-detail-icon { font-size: 28px; margin-bottom: 8px; }
.v2-sys-detail-name {
  font: 700 24px/1.15 var(--serif);
  color: var(--text);
  margin-bottom: 6px;
}
.v2-sys-detail-headline {
  font: 400 14px/1.5 var(--sans);
  color: var(--text-secondary);
}

/* Sub-tabs */
.v2-sys-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg);
  padding-top: 4px;
}
.v2-sys-tab {
  font: 500 13px/1 var(--sans);
  color: var(--text-muted);
  background: none;
  border: none;
  padding: 10px 16px;
  cursor: pointer;
  position: relative;
  transition: color 0.15s;
  touch-action: manipulation;
}
.v2-sys-tab:hover { color: var(--text-secondary); }
.v2-sys-tab.active { color: var(--text); }
.v2-sys-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 0; right: 0;
  height: 2px;
  background: var(--gold);
}

/* Score rows */
.v2-sys-score-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}
.v2-sys-score-label {
  font: 500 13px/1 var(--sans);
  color: var(--text);
  width: 72px;
  text-transform: capitalize;
  flex-shrink: 0;
}
.v2-sys-score-bar {
  flex: 1;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}
.v2-sys-score-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease-out;
}
.v2-sys-score-val {
  font: 600 12px/1 var(--mono);
  width: 40px;
  text-align: right;
  flex-shrink: 0;
}

/* Highlights / Evidence / Data */
.v2-sys-highlights { display: flex; flex-wrap: wrap; gap: 6px; }
.v2-sys-hl-pill {
  font: 400 12px/1.3 var(--sans);
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 100px;
  padding: 6px 12px;
}
.v2-sys-hl-pill.v2-sys-hl-primary {
  border-color: var(--gold);
  background: linear-gradient(135deg, rgba(212,165,116,0.1), rgba(212,165,116,0.04));
  box-shadow: 0 0 0 1px rgba(212,165,116,0.15);
}
.v2-sys-hl-pill.v2-sys-hl-primary .v2-sys-hl-label {
  color: var(--gold);
}
.v2-sys-hl-label { font-weight: 500; color: var(--text); }
.v2-sys-evidence-tag {
  display: inline-block;
  font: 400 11px/1.3 var(--mono);
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 5px 10px;
  margin: 0 4px 4px 0;
}
.v2-sys-table {
  width: 100%;
  border-collapse: collapse;
  font: 400 12px/1.4 var(--sans);
}
.v2-sys-table th {
  font: 600 11px/1 var(--mono);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}
.v2-sys-table td {
  color: var(--text-secondary);
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-light);
}
.v2-sys-table-title {
  font: 600 12px/1 var(--mono);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
}
.v2-sys-data-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-light);
  gap: 12px;
}
.v2-sys-data-row:last-child { border-bottom: none; }
.v2-sys-data-key {
  font: 500 12px/1.4 var(--sans);
  color: var(--text-muted);
  text-transform: capitalize;
  flex-shrink: 0;
}
.v2-sys-data-val {
  font: 400 12px/1.4 var(--sans);
  color: var(--text);
  text-align: right;
  word-break: break-word;
}
.v2-sys-insight-row {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}
.v2-sys-insight-row:last-child { border-bottom: none; }
.v2-sys-insight-row.v2-sys-insight-bordered {
  border-left: 3px solid var(--insight-color, var(--gold));
  padding-left: 14px;
  margin-bottom: 8px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--insight-color, var(--gold)) 6%, transparent), transparent);
  border-radius: 0 var(--v2-r) var(--v2-r) 0;
}
.v2-sys-insight-area {
  font: 600 13px/1.2 var(--sans);
  color: var(--text);
  text-transform: none;
  letter-spacing: 0;
  margin-bottom: 6px;
}
.v2-sys-insight-text {
  font: 400 13px/1.6 var(--sans);
  color: var(--text-secondary);
}
/* Today's Takeaway card */
.v2-sys-takeaway {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  margin-bottom: 24px;
  border-radius: var(--v2-r-lg);
  background: var(--glass-bg);
  border: 1px solid rgba(212,165,116,0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.v2-sys-takeaway-icon {
  font-size: 18px;
  color: var(--gold);
  flex-shrink: 0;
}
.v2-sys-takeaway-text {
  font: 400 14px/1.4 var(--sans);
  color: var(--text);
}

/* Ask the Oracle CTA */
.v2-sys-ask-oracle {
  font: 600 14px/1 var(--sans);
  color: var(--gold);
  background: linear-gradient(135deg, rgba(212,165,116,0.12), rgba(212,165,116,0.04));
  border: 1px solid rgba(212,165,116,0.3);
  border-radius: var(--v2-r-lg);
  padding: 14px 28px;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.01em;
}
.v2-sys-ask-oracle:hover {
  background: linear-gradient(135deg, rgba(212,165,116,0.2), rgba(212,165,116,0.08));
  border-color: var(--gold);
}
.v2-sys-ask-oracle:active {
  transform: scale(0.97);
}

/* Evidence table formatting */
.v2-sys-ev-group-label {
  font: 600 11px/1 var(--mono);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}
.v2-sys-ev-table-wrap {
  overflow-x: auto;
  border-radius: var(--v2-r);
  border: 1px solid var(--border);
  margin-bottom: 4px;
}
.v2-sys-ev-table thead th {
  position: sticky;
  top: 0;
  background: var(--surface);
  z-index: 2;
}
.v2-sys-ev-table .v2-zebra td {
  background: var(--surface);
}
.v2-sys-ev-feature {
  text-transform: capitalize;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
}

/* Data tab header & groups */
.v2-sys-data-header {
  margin-bottom: 16px;
}
.v2-sys-data-title {
  font: 700 18px/1.2 var(--serif);
  color: var(--text);
  margin-bottom: 4px;
}
.v2-sys-data-subtitle {
  font: 400 13px/1.4 var(--sans);
  color: var(--text-muted);
}
.v2-sys-data-group {
  margin-bottom: 4px;
}
.v2-sys-data-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border-light);
  padding: 10px 0;
  cursor: pointer;
  transition: color 0.15s;
}
.v2-sys-data-group-header:hover .v2-sys-data-group-label {
  color: var(--text);
}
.v2-sys-data-group-label {
  font: 600 12px/1 var(--mono);
  color: var(--text-muted);
  text-transform: capitalize;
  letter-spacing: 0.04em;
}
.v2-sys-data-group-chevron {
  font-size: 10px;
  color: var(--text-muted);
}
.v2-sys-data-group-body {
  padding: 4px 0 8px;
}
.v2-sys-data-row.v2-zebra {
  background: var(--surface);
  border-radius: 2px;
}

.v2-empty {
  font: 400 13px/1.6 var(--sans);
  color: var(--text-muted);
  text-align: center;
  padding: 28px 16px;
}

/* ══════════════════════════════════════════
   V2 ORACLE RECENT QUESTIONS
   ══════════════════════════════════════════ */
.v2-oracle-history { margin-top: 12px; }
.v2-oracle-hist-toggle {
  font: 500 13px/1 var(--sans);
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 0;
}
.v2-oracle-hist-toggle:hover { color: var(--text-secondary); }
.v2-oracle-hist-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
}
.v2-oracle-hist-q {
  font: 500 13px/1.3 var(--sans);
  color: var(--text);
  margin-bottom: 4px;
}
.v2-oracle-hist-a {
  font: 400 12px/1.5 var(--sans);
  color: var(--text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ══════════════════════════════════════════
   V2 PATTERN DASHBOARD (for You tab)
   ══════════════════════════════════════════ */
.v2-pattern-section { margin-bottom: 8px; }
.v2-pattern-card {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}
.v2-pattern-card:last-child { border-bottom: none; }
.v2-pattern-name {
  font: 600 13px/1.2 var(--sans);
  color: var(--text);
  margin-bottom: 4px;
}
.v2-pattern-desc {
  font: 400 13px/1.6 var(--sans);
  color: var(--text-secondary);
}

/* ══════════════════════════════════════════
   V2 ICON FOR NAV (Today = sun, Systems = grid)
   ══════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════
   FULL COMBINED ANALYSIS v2 — Celestial Convergence
   ══════════════════════════════════════════════════════════════ */

/* ── Keyframes ── */
@keyframes fca2Orbit {
  0% { transform: translate(calc(var(--orb-x) - 50%), calc(var(--orb-y) - 50%)) scale(1); opacity:1; }
  100% { transform: translate(0, 0) scale(0.3); opacity:0; }
}
@keyframes fca2NexusBirth {
  0% { transform:scale(0); opacity:0; }
  50% { transform:scale(1.4); opacity:1; }
  100% { transform:scale(1); opacity:1; }
}
@keyframes fca2NexusPulse {
  0%,100% { transform:scale(1); opacity:.25; }
  50% { transform:scale(2.2); opacity:0; }
}
@keyframes fca2StarField {
  0%,100% { opacity:.15; transform:scale(1); }
  50% { opacity:.6; transform:scale(1.4); }
}
@keyframes fca2TextReveal {
  0% { opacity:0; transform:translateY(24px); filter:blur(8px); }
  100% { opacity:1; transform:translateY(0); filter:blur(0); }
}
@keyframes fca2EdgeDraw {
  0% { stroke-dashoffset:100; opacity:0; }
  100% { stroke-dashoffset:0; opacity:1; }
}
@keyframes fca2NodePop {
  0% { transform:scale(0); opacity:0; }
  60% { transform:scale(1.3); }
  100% { transform:scale(1); opacity:1; }
}
@keyframes fca2CenterPulse {
  0%,100% { r:5; opacity:.15; }
  50% { r:10; opacity:.05; }
}
@keyframes fca2AreaSlide {
  0% { opacity:0; transform:translateX(-30px); }
  100% { opacity:1; transform:translateX(0); }
}
@keyframes fca2VoiceSlide {
  0% { opacity:0; transform:translateY(20px) scale(0.96); }
  100% { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes fca2BarGrow {
  0% { width:0%; }
}
@keyframes fca2GlowDrift {
  0%,100% { box-shadow:0 0 30px rgba(212,165,116,.08); }
  50% { box-shadow:0 0 50px rgba(212,165,116,.18), 0 0 80px rgba(123,140,222,.08); }
}
@keyframes fca2HmRow {
  0% { opacity:0; transform:translateX(-12px); }
  100% { opacity:1; transform:translateX(0); }
}
@keyframes fca2BadgeSpin {
  to { transform:rotate(360deg); }
}
@keyframes fca2TrailFade {
  0% { width:40px; opacity:.6; }
  100% { width:0; opacity:0; }
}

/* ── Page ── */
.fca2-page {
  padding:0 var(--page-x) 40px;
  padding-top:var(--page-top-pad);
  min-height:100vh;
  position:relative;
  overflow-x:hidden;
}
.fca2-back {
  display:flex; align-items:center; gap:6px;
  color:var(--muted); font-size:.85rem; font-weight:500;
  margin-bottom:8px; min-height:40px;
}
.fca2-back:active { opacity:.6; }

/* ── Reveal states ── */
.fca2-hidden { opacity:0; transform:translateY(24px); pointer-events:none; }
.fca2-reveal { opacity:1; transform:translateY(0); transition:opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1); }

/* ── HERO ── */
.fca2-hero {
  position:relative; text-align:center;
  min-height:320px; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  margin:0 calc(-1 * var(--page-x)) 24px;
  padding:40px var(--page-x) 20px;
  overflow:hidden;
}
.fca2-hero-bg { position:absolute; inset:0; pointer-events:none; }
.fca2-star {
  position:absolute; color:var(--gold); opacity:.15;
  animation:fca2StarField 4s ease-in-out infinite;
}

/* Orbit ring container */
.fca2-orbit-ring {
  position:relative; width:220px; height:220px; margin:0 auto 20px;
}

/* System orbs */
.fca2-orb {
  position:absolute; width:36px; height:36px;
  left:calc(var(--orb-x) - 18px); top:calc(var(--orb-y) - 18px);
  display:flex; align-items:center; justify-content:center;
  border-radius:50%;
  background:radial-gradient(circle, color-mix(in srgb, var(--orb-color) 30%, transparent), transparent);
  border:1.5px solid color-mix(in srgb, var(--orb-color) 50%, transparent);
  box-shadow:0 0 20px color-mix(in srgb, var(--orb-color) 25%, transparent);
  transition:all 1.8s cubic-bezier(.22,1,.36,1);
  transition-delay:var(--orb-delay);
  z-index:2;
}
.fca2-orb-icon { font-size:14px; z-index:1; }
.fca2-orb-trail {
  position:absolute; inset:0; border-radius:50%;
  box-shadow:0 0 12px color-mix(in srgb, var(--orb-color) 40%, transparent);
  transition:all 1.8s cubic-bezier(.22,1,.36,1);
  transition-delay:var(--orb-delay);
}

/* Converged state */
.fca2-orb--merged {
  left:calc(50% - 18px) !important;
  top:calc(50% - 18px) !important;
  opacity:0;
  transform:scale(0.2);
}
.fca2-orb--merged .fca2-orb-trail {
  width:80px; height:80px; left:-22px; top:-22px;
  opacity:0;
}

/* Center nexus */
.fca2-nexus {
  position:absolute; left:50%; top:50%;
  transform:translate(-50%, -50%) scale(0);
  width:60px; height:60px; border-radius:50%;
  transition:transform .8s cubic-bezier(.34,1.56,.64,1);
  z-index:3;
}
.fca2-nexus--active { transform:translate(-50%, -50%) scale(1); }
.fca2-nexus-core {
  position:absolute; inset:12px; border-radius:50%;
  background:radial-gradient(circle, var(--gold), rgba(212,165,116,.3));
  box-shadow:0 0 40px rgba(212,165,116,.5), 0 0 80px rgba(212,165,116,.2);
}
.fca2-nexus-pulse {
  position:absolute; inset:0; border-radius:50%;
  border:1.5px solid var(--gold); opacity:.3;
  animation:fca2NexusPulse 2.5s ease-out infinite;
}
.fca2-nexus-pulse--2 { animation-delay:1.25s; }

/* Hero text */
.fca2-hero-text {
  opacity:0; transform:translateY(24px); filter:blur(8px);
  transition:opacity .8s ease, transform .8s ease, filter .8s ease;
  transition-delay:.3s;
}
.fca2-hero-text--visible { opacity:1; transform:translateY(0); filter:blur(0); }
.fca2-kicker {
  font-size:.6rem; text-transform:uppercase; letter-spacing:3px;
  color:var(--gold); margin-bottom:8px; font-weight:600;
}
.fca2-title {
  font-size:1.8rem; color:var(--text); line-height:1.15;
  margin:0 0 8px; letter-spacing:-.02em;
}
.fca2-subtitle { font-size:.88rem; color:var(--muted); margin:0; }

/* ── SCORE NEXUS ── */
.fca2-score-section {
  text-align:center; margin:0 0 32px; padding:20px 0;
}
.fca2-ring-wrap {
  position:relative; width:180px; height:180px; margin:0 auto 16px;
}
.fca2-ring-svg { width:100%; height:100%; }
.fca2-ring-center {
  position:absolute; inset:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
}
.fca2-ring-score { font-size:2.8rem; color:var(--text); line-height:1; letter-spacing:-.03em; }
.fca2-ring-pct { font-size:1rem; color:var(--muted); margin-left:2px; vertical-align:super; }
.fca2-ring-label { font-size:.55rem; text-transform:uppercase; letter-spacing:2px; color:var(--muted); margin-top:2px; }
.fca2-confidence-badge {
  display:inline-flex; align-items:center; gap:6px;
  font-size:.7rem; color:var(--muted); margin-top:8px;
  padding:4px 12px; border-radius:20px;
  background:var(--glass-bg); border:1px solid var(--glass-border);
}
.fca2-conf-dot { width:6px; height:6px; border-radius:50%; }
.fca2-headline {
  font-size:1.25rem; color:var(--gold); line-height:1.3;
  margin:16px 0 8px; letter-spacing:-.01em;
}
.fca2-summary-text {
  font-size:.82rem; color:var(--muted); line-height:1.6;
  max-width:400px; margin:0 auto 12px;
}
.fca2-engine-tag {
  display:inline-flex; align-items:center; gap:6px;
  font-size:.6rem; text-transform:uppercase; letter-spacing:1.5px;
  color:var(--gold); opacity:.6; margin-top:8px;
}
.fca2-engine-dot {
  width:5px; height:5px; border-radius:50%; background:var(--gold);
  animation:fca2NexusPulse 2s ease-out infinite;
}

/* ── SECTION HEADER ── */
.fca2-section-hd { text-align:center; margin:40px 0 20px; }
.fca2-section-icon { font-size:1.2rem; color:var(--gold); display:block; margin-bottom:6px; }
.fca2-section-title { font-size:1.2rem; color:var(--text); margin:0 0 4px; letter-spacing:-.01em; }
.fca2-section-sub { font-size:.78rem; color:var(--muted); margin:0 0 12px; }
.fca2-section-line {
  width:40px; height:1px; margin:0 auto;
  background:linear-gradient(90deg, transparent, var(--gold), transparent);
}

/* ── CONSTELLATION ── */
.fca2-constellation { margin:0 0 32px; }
.fca2-constellation-wrap { margin:0 auto; max-width:360px; }
.fca2-constellation-svg { width:100%; }
.fca2-edge-line {
  stroke-dasharray:100; stroke-dashoffset:100;
  animation:fca2EdgeDraw 1.2s ease forwards;
}
.fca2-node { animation:fca2NodePop .5s ease both; }
.fca2-node-ring { animation:fca2NexusPulse 4s ease-in-out infinite; }
.fca2-center-pulse { animation:fca2CenterPulse 3s ease-in-out infinite; }
.fca2-constellation-legend {
  font-size:.65rem; color:var(--muted); text-align:center;
  margin-top:8px; opacity:.6;
}

/* ── AREA CARDS ── */
.fca2-areas-section { margin:0 0 32px; }
.fca2-area-card {
  border-radius:var(--r-lg); padding:14px 16px;
  margin-bottom:12px; cursor:pointer;
  animation:fca2GlowDrift 6s ease-in-out infinite;
}
.fca2-area-reveal {
  animation:fca2AreaSlide .6s cubic-bezier(.22,1,.36,1) both;
  animation-delay:var(--area-delay);
}
.fca2-area-header {
  display:flex; align-items:center; gap:10px;
}
.fca2-area-icon-wrap {
  width:38px; height:38px; border-radius:12px; display:flex;
  align-items:center; justify-content:center;
  background:color-mix(in srgb, var(--area-color) 12%, transparent);
  border:1px solid color-mix(in srgb, var(--area-color) 20%, transparent);
}
.fca2-area-icon { font-size:1.1rem; }
.fca2-area-info { flex:1; display:flex; flex-direction:column; gap:1px; }
.fca2-area-name { font-size:.9rem; font-weight:600; color:var(--text); }
.fca2-area-sentiment { font-size:.7rem; font-weight:500; }
.fca2-area-score-col { text-align:right; }
.fca2-area-score { font-size:1.3rem; font-weight:700; line-height:1; }
.fca2-area-conf { font-size:.6rem; color:var(--muted); display:block; }
.fca2-area-chevron {
  font-size:1.2rem; color:var(--muted); transition:transform .3s ease;
  font-weight:300;
}
.fca2-area-chevron--open { transform:rotate(90deg); }

/* Area bar */
.fca2-area-bar {
  height:4px; border-radius:2px; margin:10px 0 8px;
  background:rgba(255,255,255,.04); position:relative; overflow:visible;
}
[data-theme="light"] .fca2-area-bar { background:rgba(0,0,0,.04); }
.fca2-area-bar-fill {
  height:100%; border-radius:2px;
  transition:width 1.2s cubic-bezier(.22,1,.36,1);
}
.fca2-area-bar-glow {
  position:absolute; top:-4px; width:8px; height:12px;
  border-radius:50%; filter:blur(6px); opacity:.5;
  transition:left 1.2s cubic-bezier(.22,1,.36,1);
}

/* Area agreement */
.fca2-area-agree {
  display:flex; flex-wrap:wrap; align-items:center; gap:4px;
  margin-top:4px;
}
.fca2-area-agree-label { font-size:.6rem; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; }
.fca2-area-agree-tag {
  font-size:.6rem; padding:2px 7px; border-radius:6px;
  background:rgba(212,165,116,.08); color:var(--gold);
  border:1px solid rgba(212,165,116,.12);
}

/* Expanded system bars */
.fca2-area-expanded { padding:12px 0 4px; }
.fca2-area-sys-bars { display:flex; flex-direction:column; gap:6px; }
.fca2-sys-bar-row {
  display:flex; align-items:center; gap:6px;
  animation:fca2AreaSlide .4s ease both;
}
.fca2-sys-bar-icon { font-size:.8rem; width:18px; text-align:center; flex-shrink:0; }
.fca2-sys-bar-name { font-size:.68rem; color:var(--muted); width:70px; flex-shrink:0; }
.fca2-sys-bar-track {
  flex:1; height:6px; border-radius:3px;
  background:rgba(255,255,255,.04); overflow:hidden;
}
[data-theme="light"] .fca2-sys-bar-track { background:rgba(0,0,0,.04); }
.fca2-sys-bar-fill {
  height:100%; border-radius:3px;
  animation:fca2BarGrow .8s cubic-bezier(.22,1,.36,1) both;
}
.fca2-sys-bar-val { font-size:.7rem; font-weight:700; width:30px; text-align:right; }
.fca2-area-leaders { margin-top:8px; display:flex; flex-wrap:wrap; align-items:center; gap:4px; }
.fca2-area-leaders-label { font-size:.6rem; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; }
.fca2-leader-chip {
  font-size:.6rem; padding:2px 8px; border-radius:6px;
  background:rgba(91,168,157,.08); color:var(--teal);
  border:1px solid rgba(91,168,157,.15);
}

/* ── SYSTEM VOICES ── */
.fca2-voices-section { margin:0 0 32px; }
.fca2-voices-grid { display:flex; flex-direction:column; gap:10px; }
.fca2-voice-card {
  border-radius:var(--r-lg); padding:12px 14px; cursor:pointer;
  border-left:3px solid var(--sys-color);
}
.fca2-voice-reveal {
  animation:fca2VoiceSlide .5s cubic-bezier(.22,1,.36,1) both;
  animation-delay:var(--voice-delay);
}
.fca2-voice-header { display:flex; align-items:center; gap:10px; }
.fca2-voice-icon {
  width:32px; height:32px; border-radius:8px; display:flex;
  align-items:center; justify-content:center; font-size:.9rem;
  color:white; flex-shrink:0;
}
.fca2-voice-info { flex:1; }
.fca2-voice-name { font-size:.85rem; font-weight:600; color:var(--text); display:block; }
.fca2-voice-desc { font-size:.65rem; color:var(--muted); }
.fca2-voice-score { font-size:1.1rem; font-weight:700; }
.fca2-voice-chevron {
  font-size:1.1rem; color:var(--muted); transition:transform .3s ease; font-weight:300;
}
.fca2-voice-chevron--open { transform:rotate(90deg); }
.fca2-voice-headline {
  font-size:.75rem; color:var(--muted); line-height:1.45;
  margin:6px 0 4px; padding-left:42px;
}
.fca2-voice-bar {
  height:3px; border-radius:2px; margin:8px 0 0;
  background:rgba(255,255,255,.04); overflow:hidden;
}
[data-theme="light"] .fca2-voice-bar { background:rgba(0,0,0,.04); }
.fca2-voice-bar-fill {
  height:100%; border-radius:2px;
  transition:width 1s cubic-bezier(.22,1,.36,1) .2s;
}
.fca2-voice-details { padding:8px 0 0 42px; }
.fca2-voice-pills { display:flex; flex-wrap:wrap; gap:4px; }
.fca2-voice-pill {
  font-size:.6rem; padding:3px 8px; border-radius:6px;
  background:rgba(255,255,255,.04); color:var(--muted);
  border:1px solid var(--glass-border);
}

/* ── HEATMAP ── */
.fca2-heatmap-section { margin:0 0 32px; }
.fca2-heatmap-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; margin:0 -4px; padding:0 4px; }
.fca2-heatmap {
  width:100%; border-collapse:separate; border-spacing:3px;
  font-size:.68rem;
}
.fca2-hm-corner { width:70px; }
.fca2-hm-col-hd {
  text-align:center; color:var(--muted); font-weight:600;
  padding:4px 2px; font-size:.6rem; text-transform:uppercase;
  letter-spacing:.3px; line-height:1.3;
}
.fca2-hm-row { animation:fca2HmRow .4s ease both; }
.fca2-hm-sys {
  font-size:.65rem; color:var(--text); white-space:nowrap;
  padding:6px 4px; font-weight:500;
}
.fca2-hm-cell {
  text-align:center; padding:8px 4px; border-radius:6px;
  font-weight:700; font-size:.72rem; color:var(--text);
  background:hsla(var(--cell-hue), 60%, 50%, var(--cell-opacity));
  min-width:40px;
}
.fca2-hm-avg { font-weight:800; }

/* ── INSIGHTS ── */
.fca2-insights-section { margin:0 0 32px; }
.fca2-highlights {
  display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px;
}
.fca2-highlight {
  border-radius:var(--r-md); padding:12px; text-align:center;
  animation:fca2VoiceSlide .5s ease both;
}
.fca2-hl-label { display:block; font-size:.6rem; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
.fca2-hl-value { display:block; font-size:.88rem; color:var(--gold); font-weight:600; }
.fca2-insights-list { display:flex; flex-direction:column; gap:8px; }
.fca2-insight {
  border-radius:var(--r-md); padding:12px 14px; cursor:pointer;
}
.fca2-insight-hd { display:flex; align-items:center; justify-content:space-between; }
.fca2-insight-title { font-size:.85rem; font-weight:600; color:var(--text); }
.fca2-insight-chevron { font-size:1rem; color:var(--muted); transition:transform .3s ease; font-weight:300; }
.fca2-insight-chevron--open { transform:rotate(90deg); }
.fca2-insight-text { font-size:.78rem; color:var(--muted); line-height:1.55; margin-top:8px; }

/* ── FOOTER ── */
.fca2-footer { text-align:center; padding:32px 0 20px; }
.fca2-footer-line {
  width:60px; height:1px; margin:0 auto 24px;
  background:linear-gradient(90deg, transparent, var(--gold), transparent);
}
.fca2-engine-badge-lg {
  display:inline-flex; flex-direction:column; align-items:center;
  gap:6px; position:relative;
}
.fca2-badge-orbit {
  position:relative; width:40px; height:40px; display:block;
  animation:fca2BadgeSpin 12s linear infinite;
}
.fca2-badge-particle {
  position:absolute; font-size:8px; color:var(--gold); opacity:.5;
  left:50%; top:50%;
  transform:rotate(var(--bp-angle)) translateY(-18px);
  animation:fca2StarField 3s ease-in-out infinite;
  animation-delay:var(--bp-delay);
}
.fca2-badge-text {
  font-size:.6rem; text-transform:uppercase; letter-spacing:3px;
  color:var(--gold); font-weight:600;
}
.fca2-badge-sub { font-size:.55rem; color:var(--muted); opacity:.6; }

/* ── Light theme overrides ── */
[data-theme="light"] .fca2-nexus-core {
  background:radial-gradient(circle, var(--gold), rgba(184,137,106,.3));
  box-shadow:0 0 30px rgba(184,137,106,.3);
}
[data-theme="light"] .fca2-orb {
  background:radial-gradient(circle, color-mix(in srgb, var(--orb-color) 15%, transparent), transparent);
}
[data-theme="light"] .fca2-hm-cell {
  background:hsla(var(--cell-hue), 50%, 45%, calc(var(--cell-opacity) * 0.6));
}

/* CTA on Today tab */
.fca2-today-cta {
  display:flex; align-items:center; gap:12px;
  width:100%; padding:14px 16px; margin:16px 0;
  border-radius:var(--r-lg); cursor:pointer;
  background:linear-gradient(135deg, rgba(212,165,116,.08), rgba(123,140,222,.06));
  border:1px solid rgba(212,165,116,.18);
  box-shadow:0 0 24px rgba(212,165,116,.06);
  transition:all .3s ease;
  text-align:left;
}
.fca2-today-cta:active { transform:scale(.98); opacity:.85; }
.fca2-today-cta-icon { font-size:1.3rem; color:var(--gold); flex-shrink:0; }
.fca2-today-cta-text { flex:1; display:flex; flex-direction:column; gap:2px; }
.fca2-today-cta-text strong { font-size:.82rem; color:var(--text); }
.fca2-today-cta-text span { font-size:.65rem; color:var(--gold); text-transform:uppercase; letter-spacing:.8px; }
.fca2-today-cta-arrow { font-size:1.1rem; color:var(--gold); flex-shrink:0; }

/* ── Area Narrative / Drivers ── */
.fca2-area-narrative { padding:8px 14px 4px; }
.fca2-area-opening {
  font-size:.72rem; color:var(--text); line-height:1.6;
  margin:0; opacity:.85;
}
.fca2-area-story {
  font-size:.74rem; color:var(--text); line-height:1.7;
  margin:0 0 8px; opacity:.9;
}
.fca2-area-data-toggle {
  display:flex; align-items:center; justify-content:center; gap:6px;
  padding:8px 0; cursor:pointer; user-select:none;
  border-top:1px solid rgba(255,255,255,.06);
}
.fca2-area-data-label {
  font-size:.6rem; text-transform:uppercase; letter-spacing:.8px;
  color:var(--gold); font-weight:600; opacity:.8;
}
.fca2-area-data-toggle:hover .fca2-area-data-label { opacity:1; }
.fca2-area-drivers { padding:8px 0 4px; }
.fca2-drivers-col { margin-bottom:12px; }
.fca2-drivers-title {
  font-size:.6rem; text-transform:uppercase; letter-spacing:.8px;
  font-weight:600; margin-bottom:6px; padding-left:2px;
}
.fca2-driver-item {
  display:flex; gap:6px; align-items:flex-start;
  padding:5px 8px; margin-bottom:4px;
  border-radius:8px; font-size:.66rem; line-height:1.5;
}
.fca2-driver-positive {
  background:rgba(74,222,128,.04);
  border-left:2px solid rgba(74,222,128,.3);
}
.fca2-driver-caution {
  background:rgba(255,107,107,.04);
  border-left:2px solid rgba(255,107,107,.3);
}
.fca2-driver-sys {
  font-size:.55rem; color:var(--muted); min-width:60px; flex-shrink:0;
  padding-top:1px; font-weight:500;
}
.fca2-driver-text { color:var(--text); flex:1; }

/* ═══════════════════════════════════════════════════════════════
   LOVE & COMPATIBILITY SECTION (inside FullCombinedAnalysis)
   ═══════════════════════════════════════════════════════════════ */

.lc-section { padding:0 var(--px); }

/* ── Gate / CTA ── */
.lc-gate {
  text-align:center; padding:32px 16px;
  background:linear-gradient(135deg, rgba(224,123,180,.06), rgba(212,165,116,.04));
  border:1px solid rgba(224,123,180,.15);
  border-radius:var(--v2-r-lg, 16px);
}
.lc-gate-icon { font-size:2.4rem; margin-bottom:8px; display:block; }
.lc-gate-title { font-size:1.05rem; font-weight:600; color:var(--text); margin-bottom:4px; }
.lc-gate-sub { font-size:.72rem; color:var(--muted); margin-bottom:20px; line-height:1.5; }
.lc-gate-actions { display:flex; flex-direction:column; gap:10px; align-items:center; }
.lc-btn-primary {
  padding:12px 28px; border-radius:12px; border:none; cursor:pointer;
  font-size:.8rem; font-weight:600; letter-spacing:.5px;
  background:linear-gradient(135deg, #E07BB4, #d4a574);
  color:#fff; box-shadow:0 4px 16px rgba(224,123,180,.25);
  transition:all .3s ease;
}
.lc-btn-primary:active { transform:scale(.96); }
.lc-btn-skip {
  padding:8px 20px; border-radius:10px; border:1px solid var(--glass-border);
  background:transparent; color:var(--muted); font-size:.7rem; cursor:pointer;
}

/* ── Partner Form ── */
.lc-form-overlay {
  padding:20px 16px;
  background:linear-gradient(135deg, rgba(224,123,180,.04), rgba(212,165,116,.03));
  border:1px solid rgba(224,123,180,.12);
  border-radius:var(--v2-r-lg, 16px);
}
.lc-form-title {
  font-size:.9rem; font-weight:600; text-align:center;
  color:var(--text); margin-bottom:16px;
}
.lc-form-grid { display:flex; flex-direction:column; gap:12px; }
.lc-field { display:flex; flex-direction:column; gap:4px; }
.lc-field label {
  font-size:.65rem; text-transform:uppercase; letter-spacing:.8px;
  color:var(--muted); font-weight:500;
}
.lc-field input, .lc-field select {
  padding:10px 12px; border-radius:10px;
  background:var(--glass-bg, rgba(30,30,30,.6));
  border:1px solid var(--glass-border, rgba(255,255,255,.08));
  color:var(--text); font-size:.82rem;
  outline:none; transition:border-color .2s;
}
.lc-field input:focus, .lc-field select:focus {
  border-color:rgba(224,123,180,.4);
}
.lc-form-actions {
  display:flex; gap:10px; margin-top:16px; justify-content:center;
}
.lc-btn-cancel {
  padding:10px 20px; border-radius:10px; border:1px solid var(--glass-border);
  background:transparent; color:var(--muted); font-size:.75rem; cursor:pointer;
}

/* ── Loading ── */
.lc-loading {
  text-align:center; padding:40px 16px;
}
.lc-loading-icon {
  font-size:2rem; display:block; margin-bottom:12px;
  animation:fca2NexusPulse 1.5s ease-in-out infinite;
}
.lc-loading-text { font-size:.78rem; color:var(--muted); }

/* ── Results Header ── */
.lc-results { animation:fca2FadeUp .6s ease-out both; }
.lc-verdict-card {
  text-align:center; padding:28px 16px;
  background:linear-gradient(135deg, rgba(224,123,180,.08), rgba(212,165,116,.06));
  border:1px solid rgba(224,123,180,.18);
  border-radius:var(--v2-r-lg, 16px);
  margin-bottom:20px;
}
.lc-verdict-score {
  font-size:3rem; font-weight:700; line-height:1;
  font-family:var(--serif, Georgia, serif);
  background:linear-gradient(135deg, #E07BB4, #d4a574);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  background-clip:text;
}
.lc-verdict-pct { font-size:1.2rem; opacity:.7; }
.lc-verdict-label {
  font-size:.65rem; text-transform:uppercase; letter-spacing:2px;
  color:var(--gold); margin-top:4px;
}
.lc-verdict-title {
  font-size:1.1rem; font-weight:600; color:var(--text);
  margin:12px 0 6px; font-family:var(--serif, Georgia, serif);
}
.lc-verdict-prose {
  font-size:.75rem; color:var(--muted); line-height:1.6; max-width:340px;
  margin:0 auto;
}

/* ── Area Synergy Bars ── */
.lc-areas { display:flex; flex-direction:column; gap:10px; margin-bottom:24px; }
.lc-area-row {
  display:flex; align-items:center; gap:10px; padding:10px 12px;
  background:var(--glass-bg, rgba(30,30,30,.3));
  border:1px solid var(--glass-border, rgba(255,255,255,.06));
  border-radius:12px;
}
.lc-area-label { font-size:.72rem; color:var(--text); width:52px; flex-shrink:0; font-weight:500; }
.lc-area-bars { flex:1; display:flex; flex-direction:column; gap:4px; }
.lc-area-bar-row { display:flex; align-items:center; gap:6px; }
.lc-area-bar-name { font-size:.55rem; color:var(--muted); width:50px; text-align:right; flex-shrink:0; }
.lc-area-bar-track {
  flex:1; height:6px; border-radius:3px;
  background:rgba(255,255,255,.06); overflow:hidden;
}
.lc-area-bar-fill {
  height:100%; border-radius:3px;
  transition:width .8s ease-out;
}
.lc-area-bar-val { font-size:.6rem; color:var(--muted); width:28px; }
.lc-area-synergy {
  font-size:.58rem; color:var(--gold); text-align:center;
  margin-top:2px; font-style:italic;
}

/* ── System Compatibility Cards ── */
.lc-sys-list { display:flex; flex-direction:column; gap:14px; }
.lc-sys-card {
  background:var(--glass-bg, rgba(30,30,30,.3));
  border:1px solid var(--glass-border, rgba(255,255,255,.06));
  border-radius:14px; overflow:hidden;
  border-left:3px solid var(--lc-sys-color, #888);
  animation:fca2FadeUp .5s ease-out both;
  animation-delay:var(--lc-delay, 0s);
}
.lc-sys-header {
  display:flex; align-items:center; gap:10px;
  padding:14px 14px 10px; cursor:pointer;
}
.lc-sys-icon {
  width:32px; height:32px; border-radius:8px;
  display:flex; align-items:center; justify-content:center;
  font-size:1rem; flex-shrink:0;
  background:color-mix(in srgb, var(--lc-sys-color) 15%, transparent);
}
.lc-sys-info { flex:1; min-width:0; }
.lc-sys-name { font-size:.78rem; font-weight:600; color:var(--text); display:block; }
.lc-sys-dynamic { font-size:.62rem; color:var(--muted); display:block; margin-top:2px;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.lc-sys-score {
  font-size:1.1rem; font-weight:700; font-family:var(--serif, Georgia, serif);
  color:var(--lc-sys-color);
}
.lc-sys-chevron {
  font-size:1rem; color:var(--muted); transition:transform .2s;
}
.lc-sys-chevron--open { transform:rotate(90deg); }

/* ── Expanded System Card ── */
.lc-sys-body { padding:0 14px 16px; }
.lc-profiles { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }
.lc-profile-card {
  padding:10px; border-radius:10px;
  background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.05);
}
.lc-profile-who {
  font-size:.58rem; text-transform:uppercase; letter-spacing:.8px;
  color:var(--gold); margin-bottom:6px; font-weight:600;
}
.lc-profile-trait {
  font-size:.65rem; color:var(--text); line-height:1.5; margin-bottom:4px;
}
.lc-profile-trait strong { color:var(--lc-sys-color); }
.lc-profile-style { font-size:.62rem; color:var(--muted); line-height:1.5; font-style:italic; }

.lc-dynamic-full {
  font-size:.72rem; color:var(--text); line-height:1.6;
  padding:10px 12px; margin-bottom:12px;
  background:linear-gradient(135deg, rgba(224,123,180,.04), transparent);
  border-left:2px solid var(--lc-sys-color);
  border-radius:0 8px 8px 0;
}

.lc-strengths-challenges { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
.lc-sc-col {}
.lc-sc-title {
  font-size:.6rem; text-transform:uppercase; letter-spacing:.8px;
  font-weight:600; margin-bottom:6px;
}
.lc-sc-title.positive { color:var(--positive, #4ADE80); }
.lc-sc-title.caution { color:var(--coral, #FF6B6B); }
.lc-sc-item { font-size:.62rem; color:var(--muted); line-height:1.5; margin-bottom:4px; padding-left:8px; border-left:1px solid rgba(255,255,255,.08); }

.lc-advice {
  font-size:.68rem; color:var(--text); line-height:1.6;
  padding:10px; border-radius:10px;
  background:rgba(212,165,116,.05);
  border:1px solid rgba(212,165,116,.1);
  margin-bottom:10px;
}
.lc-advice-label {
  font-size:.55rem; text-transform:uppercase; letter-spacing:1px;
  color:var(--gold); font-weight:600; margin-bottom:4px; display:block;
}

.lc-best-matches { display:flex; flex-wrap:wrap; gap:6px; }
.lc-best-match-tag {
  font-size:.6rem; padding:3px 8px; border-radius:6px;
  background:rgba(224,123,180,.08);
  border:1px solid rgba(224,123,180,.15);
  color:var(--text);
}
.lc-best-label {
  font-size:.55rem; text-transform:uppercase; letter-spacing:.8px;
  color:var(--muted); font-weight:500; margin-bottom:6px; display:block;
}

/* ── Detail Bars ── */
.lc-detail-bars { display:flex; flex-direction:column; gap:6px; margin-top:10px; }
.lc-detail-row { display:flex; align-items:center; gap:8px; }
.lc-detail-label { font-size:.6rem; color:var(--muted); width:90px; flex-shrink:0; }
.lc-detail-track {
  flex:1; height:5px; border-radius:3px;
  background:rgba(255,255,255,.06); overflow:hidden;
}
.lc-detail-fill {
  height:100%; border-radius:3px;
  background:var(--lc-sys-color);
  transition:width .8s ease-out;
}
.lc-detail-val { font-size:.6rem; color:var(--lc-sys-color); width:28px; text-align:right; }

/* ── Couple Guide Sections ── */
.cg-section {
  margin-bottom:20px; padding:14px 16px;
  background:var(--glass-bg, rgba(30,30,30,.3));
  border:1px solid var(--glass-border, rgba(255,255,255,.06));
  border-radius:14px;
}
.cg-section-header {
  font-size:.85rem; font-weight:600; margin-bottom:10px; color:var(--text);
}
.cg-section-header.caution { color:#FFAA55; }
.cg-section-header.positive { color:#5ECC8F; }
.cg-section-sub {
  font-size:.65rem; color:var(--muted); margin:-6px 0 12px; font-style:italic;
}
.cg-item {
  font-size:.72rem; color:var(--text); line-height:1.65;
  margin:0 0 10px; padding:0 0 0 0;
  opacity:.9;
}
.cg-item:last-child { margin-bottom:0; }
.cg-subsection { margin-bottom:14px; }
.cg-subsection:last-child { margin-bottom:0; }
.cg-sub-title {
  font-size:.7rem; font-weight:600; text-transform:uppercase;
  letter-spacing:.6px; margin-bottom:8px;
}
.cg-sub-title.positive { color:#5ECC8F; }
.cg-sub-title.caution { color:#FFAA55; }
[data-theme="light"] .cg-section {
  background:rgba(245,245,245,.5);
  border-color:rgba(0,0,0,.06);
}

/* ── Re-do / change partner ── */
.lc-redo-btn {
  display:block; margin:16px auto 0; padding:8px 16px;
  border-radius:8px; border:1px solid rgba(224,123,180,.2);
  background:transparent; color:var(--muted); font-size:.65rem; cursor:pointer;
}

/* ══════════════════════════════════════════
   TIERED COMPATIBILITY LAYOUT
   ══════════════════════════════════════════ */

/* ── Tier Section Container ── */
.lc-tier-section { margin-top:32px; padding-top:20px; border-top:1px solid rgba(255,255,255,.05); }
.lc-tier-section:first-of-type { border-top:none; padding-top:0; }
.lc-tier-header { text-align:center; margin-bottom:18px; }
.lc-tier-badge {
  display:inline-block; font-size:.55rem; font-weight:700; letter-spacing:1.5px;
  padding:3px 10px; border-radius:20px; margin-bottom:6px;
}
.lc-tier-badge--1 { background:linear-gradient(135deg, rgba(107,140,255,.25), rgba(255,155,94,.25)); color:var(--gold); }
.lc-tier-badge--2 { background:rgba(123,224,224,.12); color:var(--teal); }
.lc-tier-badge--3 { background:rgba(180,126,255,.10); color:var(--muted); }
.lc-tier-label { display:block; font-size:1rem; color:var(--text); margin-bottom:3px; }
.lc-tier-sub { display:block; font-size:.62rem; color:var(--muted); line-height:1.4; }

/* ── Tier 1: Deep Analysis Card ── */
.lc-t1-card {
  background:var(--glass-bg, rgba(255,255,255,.04)); border:1px solid var(--glass-border, rgba(255,255,255,.06));
  border-left:3px solid var(--lc-sys-color); border-radius:12px; padding:16px; margin-bottom:14px;
  animation-delay:var(--lc-delay, 0s);
}
.lc-t1-header {
  display:flex; align-items:center; gap:10px; cursor:pointer; -webkit-tap-highlight-color:transparent;
}
.lc-t1-icon {
  width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center;
  font-size:.9rem; flex-shrink:0;
}
.lc-t1-info { flex:1; min-width:0; }
.lc-t1-name { display:block; font-size:.82rem; color:var(--text); font-weight:600; }
.lc-t1-rel-type {
  display:inline-block; font-size:.55rem; color:var(--lc-sys-color); opacity:.8;
  background:rgba(255,255,255,.04); padding:1px 6px; border-radius:8px; margin-top:2px;
}
.lc-t1-chevron {
  font-size:1.1rem; color:var(--muted); transition:transform .2s; flex-shrink:0;
}
.lc-t1-chevron--open { transform:rotate(90deg); }
.lc-t1-body { margin-top:12px; }
.lc-t1-dynamic {
  font-size:.72rem; color:var(--text); line-height:1.65; margin-bottom:14px;
  padding-left:12px; border-left:2px solid var(--lc-sys-color); opacity:.9;
}
.lc-t1-block { margin-bottom:12px; }
.lc-t1-block-title {
  font-size:.6rem; font-weight:700; letter-spacing:.8px; text-transform:uppercase;
  color:var(--positive, #4ADE80); margin-bottom:6px;
}
.lc-t1-block-title--caution { color:var(--gold); }
.lc-t1-item {
  font-size:.68rem; color:var(--text); line-height:1.55; margin-bottom:5px;
  padding-left:12px; position:relative; opacity:.85;
}
.lc-t1-item::before {
  content:''; position:absolute; left:0; top:7px; width:4px; height:4px; border-radius:50%;
}
.lc-t1-item--positive::before { background:var(--positive, #4ADE80); }
.lc-t1-item--caution::before { background:var(--gold); }
.lc-t1-advice {
  margin-top:14px; padding:12px; border-radius:10px;
  background:linear-gradient(135deg, rgba(107,140,255,.06), rgba(224,123,180,.06));
  border:1px solid rgba(255,255,255,.04);
}
.lc-t1-advice-label {
  font-size:.58rem; font-weight:700; letter-spacing:.8px; text-transform:uppercase;
  color:var(--teal); margin-bottom:6px;
}
.lc-t1-advice-text { font-size:.68rem; color:var(--text); line-height:1.65; opacity:.88; }

/* ── Tier 2: Supporting Insight Card ── */
.lc-t2-card {
  background:var(--glass-bg, rgba(255,255,255,.03)); border:1px solid var(--glass-border, rgba(255,255,255,.05));
  border-left:2px solid var(--lc-sys-color); border-radius:10px; padding:14px; margin-bottom:10px;
  animation-delay:var(--lc-delay, 0s);
}
.lc-t2-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.lc-t2-icon {
  width:26px; height:26px; border-radius:6px; display:flex; align-items:center; justify-content:center;
  font-size:.75rem; flex-shrink:0;
}
.lc-t2-name { font-size:.76rem; color:var(--text); font-weight:600; }
.lc-t2-rel-type {
  font-size:.52rem; color:var(--lc-sys-color); opacity:.7; margin-left:auto;
  background:rgba(255,255,255,.04); padding:1px 5px; border-radius:6px;
}
.lc-t2-dynamic { font-size:.68rem; color:var(--text); line-height:1.55; margin-bottom:6px; opacity:.85; }
.lc-t2-insight { font-size:.64rem; line-height:1.5; margin-bottom:3px; padding-left:10px; position:relative; }
.lc-t2-insight::before {
  content:''; position:absolute; left:0; top:6px; width:3px; height:3px; border-radius:50%;
}
.lc-t2-insight--positive { color:var(--positive, #4ADE80); opacity:.8; }
.lc-t2-insight--positive::before { background:var(--positive, #4ADE80); }
.lc-t2-insight--caution { color:var(--gold); opacity:.75; }
.lc-t2-insight--caution::before { background:var(--gold); }

/* ── Tier 3: Symbolic Layer Card ── */
.lc-tier3-row { display:flex; gap:10px; flex-wrap:wrap; }
.lc-t3-card {
  flex:1 1 140px; min-width:0; background:var(--glass-bg, rgba(255,255,255,.02)); border:1px solid var(--glass-border, rgba(255,255,255,.04));
  border-radius:10px; padding:12px; animation-delay:var(--lc-delay, 0s);
}
.lc-t3-header { display:flex; align-items:center; gap:6px; margin-bottom:6px; }
.lc-t3-icon { font-size:.85rem; }
.lc-t3-name { font-size:.65rem; font-weight:600; color:var(--text); opacity:.8; }
.lc-t3-text { font-size:.62rem; color:var(--muted); line-height:1.55; }

/* ── Tier 1 Synthesis (Combined Insight) ── */
.lc-synthesis {
  margin-top:28px; padding:22px 18px; border-radius:14px;
  background:linear-gradient(135deg, rgba(107,140,255,.07), rgba(94,204,143,.05), rgba(212,165,116,.04));
  border:1px solid rgba(107,140,255,.12);
}
.lc-synthesis-header { text-align:center; margin-bottom:18px; }
.lc-synthesis-icon { font-size:1.3rem; display:block; margin-bottom:6px; color:var(--gold); }
.lc-synthesis-title { display:block; font-size:1rem; color:var(--text); margin-bottom:3px; }
.lc-synthesis-sub { display:block; font-size:.56rem; color:var(--muted); letter-spacing:.3px; margin-top:3px; }
.lc-synthesis-body { display:flex; flex-direction:column; gap:14px; }
.lc-synthesis-para {
  font-size:.72rem; line-height:1.72; color:var(--text); opacity:.88; margin:0;
  max-width:600px;
}

/* ── Relationship Roles & Dynamics ── */
.lc-roles {
  margin-top:24px; padding:20px 16px; border-radius:14px;
  background:var(--glass-bg, rgba(255,255,255,.02));
  border:1px solid rgba(255,255,255,.06);
}
.lc-roles-header { text-align:center; margin-bottom:14px; }
.lc-roles-header-icon { font-size:1.1rem; display:block; margin-bottom:4px; color:var(--muted); }
.lc-roles-title { display:block; font-size:.92rem; color:var(--text); }
.lc-roles-badges {
  display:flex; justify-content:center; align-items:center; gap:14px;
  margin-bottom:16px; padding:10px 0;
}
.lc-roles-badge { text-align:center; flex:0 1 140px; }
.lc-roles-name {
  display:block; font-size:.55rem; color:var(--muted); letter-spacing:.4px;
  text-transform:uppercase; font-weight:600; margin-bottom:4px;
}
.lc-roles-label { font-size:.8rem; font-weight:700; color:var(--gold); }
.lc-roles-nuance {
  display:block; font-size:.52rem; color:var(--teal); opacity:.8;
  margin-top:3px; font-style:italic;
}
.lc-roles-link { font-size:.95rem; color:var(--muted); opacity:.4; }
.lc-roles-narrative {
  font-size:.7rem; line-height:1.7; color:var(--text); opacity:.88; margin:0;
}

/* ── Intent Mode Selector ── */
.lc-intent-bar {
  display:flex; justify-content:center; gap:8px;
  margin-bottom:20px; padding:6px 0;
}
.lc-intent-pill {
  display:flex; align-items:center; gap:5px;
  padding:6px 14px; border-radius:20px;
  background:var(--glass-bg, rgba(255,255,255,.03));
  border:1px solid rgba(255,255,255,.08);
  color:var(--muted); font-size:.6rem; font-weight:600;
  letter-spacing:.3px; cursor:pointer;
  transition:all .2s ease;
}
.lc-intent-pill:hover { border-color:rgba(212,165,116,.25); color:var(--text); }
.lc-intent-pill--active {
  background:rgba(212,165,116,.12); border-color:rgba(212,165,116,.35);
  color:var(--gold); box-shadow:0 0 8px rgba(212,165,116,.15);
}
.lc-intent-pill-icon { font-size:.72rem; }
.lc-intent-pill-label { text-transform:uppercase; letter-spacing:.5px; }

/* ── When You Clash ── */
.lc-clash {
  margin-top:24px; padding:20px 16px; border-radius:14px;
  background:rgba(255,107,107,.06);
  border:1px solid rgba(255,107,107,.12);
  border-left:3px solid var(--coral);
}
.lc-clash-header { text-align:center; margin-bottom:14px; }
.lc-clash-icon { font-size:1.1rem; display:block; margin-bottom:4px; color:var(--coral); }
.lc-clash-title { display:block; font-size:.92rem; color:var(--text); }
.lc-clash-sub { display:block; font-size:.54rem; color:var(--coral); letter-spacing:.3px; margin-top:3px; font-weight:600; text-transform:uppercase; opacity:.8; }
.lc-clash-narrative {
  font-size:.7rem; line-height:1.7; color:var(--text); opacity:.88; margin:0;
}

/* ── Relationship Playbook ── */
.lc-playbook {
  margin-top:36px; padding:22px 16px 20px; border-radius:14px;
  background:linear-gradient(160deg, rgba(212,165,116,.08), rgba(224,123,180,.06), rgba(107,140,255,.05));
  border:1px solid rgba(212,165,116,.15);
}
.lc-playbook-header { text-align:center; margin-bottom:18px; }
.lc-playbook-icon { font-size:1.4rem; display:block; margin-bottom:4px; }
.lc-playbook-title { display:block; font-size:1rem; color:var(--text); margin-bottom:3px; }
.lc-playbook-sub { display:block; font-size:.58rem; color:var(--gold); letter-spacing:.5px; font-weight:600; text-transform:uppercase; }

.lc-pb-section { margin-bottom:16px; }
.lc-pb-label {
  font-size:.58rem; font-weight:700; letter-spacing:.8px; text-transform:uppercase;
  color:var(--teal); margin-bottom:6px;
}
.lc-pb-label--positive { color:var(--positive, #4ADE80); }
.lc-pb-label--caution { color:var(--gold); }
.lc-pb-label--danger { color:var(--coral); }
.lc-pb-label--peace { color:var(--teal); }
.lc-pb-text { font-size:.7rem; color:var(--text); line-height:1.65; opacity:.9; }
.lc-pb-behaviors { display:flex; flex-direction:column; gap:10px; }
.lc-pb-behavior { display:flex; gap:10px; align-items:flex-start; }
.lc-pb-num {
  width:24px; height:24px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:.62rem; font-weight:800; color:var(--gold);
  background:rgba(212,165,116,.15); border:1px solid rgba(212,165,116,.25);
  margin-top:1px;
}
.lc-pb-behavior-text { font-size:.68rem; color:var(--text); line-height:1.6; opacity:.88; }
.lc-pb-mistake {
  padding:14px; border-radius:10px;
  background:rgba(255,107,107,.08); border:1px solid rgba(255,107,107,.15);
  border-left:3px solid var(--coral);
}
.lc-pb-mistake .lc-pb-label { font-size:.62rem; }

/* ── Light theme ── */
[data-theme="light"] .lc-verdict-card {
  background:linear-gradient(135deg, rgba(224,123,180,.06), rgba(212,165,116,.04));
}
[data-theme="light"] .lc-field input, [data-theme="light"] .lc-field select {
  background:rgba(245,245,245,.8); border-color:rgba(0,0,0,.1);
}
[data-theme="light"] .lc-t1-card { background:rgba(0,0,0,.02); border-color:rgba(0,0,0,.06); }
[data-theme="light"] .lc-t2-card { background:rgba(0,0,0,.015); border-color:rgba(0,0,0,.05); }
[data-theme="light"] .lc-t3-card { background:rgba(0,0,0,.01); border-color:rgba(0,0,0,.04); }
[data-theme="light"] .lc-synthesis {
  background:linear-gradient(135deg, rgba(107,140,255,.04), rgba(94,204,143,.03), rgba(212,165,116,.02));
  border-color:rgba(107,140,255,.08);
}
[data-theme="light"] .lc-intent-pill { background:rgba(0,0,0,.03); border-color:rgba(0,0,0,.08); }
[data-theme="light"] .lc-intent-pill--active { background:rgba(212,165,116,.1); border-color:rgba(212,165,116,.3); }
[data-theme="light"] .lc-roles { background:rgba(0,0,0,.015); border-color:rgba(0,0,0,.06); }
[data-theme="light"] .lc-clash { background:rgba(255,107,107,.04); border-color:rgba(255,107,107,.08); border-left-color:var(--coral); }
[data-theme="light"] .lc-playbook {
  background:linear-gradient(160deg, rgba(212,165,116,.05), rgba(224,123,180,.04), rgba(107,140,255,.03));
  border-color:rgba(212,165,116,.1);
}
[data-theme="light"] .lc-pb-mistake { background:rgba(255,107,107,.05); border-color:rgba(255,107,107,.1); border-left-color:var(--coral); }
[data-theme="light"] .lc-tier-section { border-top-color:rgba(0,0,0,.06); }

/* ── Feedback — Liquid Glass ── */
.lg-feedback { padding:24px 20px 32px; min-height:100%; }
.lg-fb-header { text-align:center; margin-bottom:28px; position:relative; overflow:hidden; padding:32px 0 12px; }
.lg-fb-glow {
  position:absolute; top:-40px; left:50%; transform:translateX(-50%);
  width:200px; height:200px; border-radius:50%;
  background:radial-gradient(circle, rgba(200,170,110,.15) 0%, transparent 70%);
  filter:blur(40px); pointer-events:none;
}
.lg-fb-title {
  font-family:var(--heading); font-size:28px; font-weight:700;
  background:linear-gradient(135deg, var(--gold), #e8d5a8, var(--gold));
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  background-clip:text; margin:0 0 6px; position:relative;
}
.lg-fb-sub { color:var(--muted); font-size:14px; margin:0; position:relative; }

.lg-fb-cats {
  display:flex; gap:8px; margin-bottom:20px;
  overflow-x:auto; -webkit-overflow-scrolling:touch;
  scrollbar-width:none; padding:2px;
}
.lg-fb-cats::-webkit-scrollbar { display:none; }

.lg-fb-pill {
  flex:1; min-width:0;
  display:flex; flex-direction:column; align-items:center; gap:4px;
  padding:12px 8px; border-radius:16px; border:none; cursor:pointer;
  background:rgba(255,255,255,.04);
  backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
  border:1px solid rgba(255,255,255,.06);
  transition:all .3s cubic-bezier(.4,0,.2,1);
  color:var(--muted); font-size:12px; font-family:var(--body);
}
.lg-fb-pill:active { transform:scale(.95); }
.lg-fb-pill--on {
  background:rgba(200,170,110,.1);
  border-color:rgba(200,170,110,.25);
  color:var(--gold);
  box-shadow:0 0 20px rgba(200,170,110,.08), inset 0 1px 0 rgba(255,255,255,.05);
}
.lg-fb-pill-icon { font-size:20px; line-height:1; }
.lg-fb-pill-label { font-weight:500; }

.lg-fb-glass {
  position:relative;
  background:rgba(255,255,255,.03);
  backdrop-filter:blur(24px) saturate(1.2); -webkit-backdrop-filter:blur(24px) saturate(1.2);
  border:1px solid rgba(255,255,255,.07);
  border-radius:20px;
  padding:2px;
  margin-bottom:16px;
  box-shadow:0 4px 24px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.04);
  transition:border-color .3s, box-shadow .3s;
}
.lg-fb-glass:focus-within {
  border-color:rgba(200,170,110,.3);
  box-shadow:0 4px 32px rgba(200,170,110,.08), inset 0 1px 0 rgba(255,255,255,.06);
}

.lg-fb-input {
  width:100%; box-sizing:border-box;
  background:transparent; border:none; outline:none; resize:none;
  padding:16px 18px; color:var(--text); font-size:15px;
  font-family:var(--body); line-height:1.6;
}
.lg-fb-input::placeholder { color:var(--muted); opacity:.6; }

.lg-fb-count {
  text-align:right; padding:0 18px 12px; font-size:12px;
  color:var(--muted); opacity:.5;
}
.lg-fb-count span { opacity:.6; }

.lg-fb-send {
  width:100%; padding:16px; border:none; border-radius:16px; cursor:pointer;
  font-family:var(--body); font-size:15px; font-weight:600;
  color:#080D1A; letter-spacing:.3px;
  background:linear-gradient(135deg, var(--gold), #e8d5a8, var(--gold));
  background-size:200% 200%; animation:lg-shimmer 3s ease infinite;
  box-shadow:0 4px 16px rgba(200,170,110,.2), 0 1px 2px rgba(0,0,0,.1);
  transition:transform .2s, opacity .2s;
}
.lg-fb-send:active { transform:scale(.97); }
.lg-fb-send:disabled { opacity:.4; cursor:default; transform:none; }
.lg-fb-send--done { background:linear-gradient(135deg, #6ec47e, #4da85e); }

@keyframes lg-shimmer {
  0% { background-position:0% 50%; }
  50% { background-position:100% 50%; }
  100% { background-position:0% 50%; }
}

/* Confirmation screen */
.lg-fb-confirm {
  display:flex; flex-direction:column; align-items:center;
  text-align:center; padding:60px 20px; position:relative;
}
.lg-fb-confirm-glow {
  position:absolute; top:20px; left:50%; transform:translateX(-50%);
  width:200px; height:200px; border-radius:50%;
  background:radial-gradient(circle, rgba(110,196,126,.12) 0%, transparent 70%);
  filter:blur(50px); pointer-events:none;
}
.lg-fb-confirm-icon {
  font-size:56px; margin-bottom:20px; position:relative;
  animation:wn-slide-up .5s cubic-bezier(.16,1,.3,1);
}
.lg-fb-confirm-title {
  font-family:var(--heading); font-size:24px; font-weight:700;
  color:var(--text); margin:0 0 12px; position:relative;
}
.lg-fb-confirm-text {
  color:var(--muted); font-size:15px; line-height:1.6;
  margin:0 0 32px; max-width:280px; position:relative;
}

/* Light theme */
[data-theme="light"] .lg-fb-pill { background:rgba(0,0,0,.03); border-color:rgba(0,0,0,.06); }
[data-theme="light"] .lg-fb-pill--on { background:rgba(180,140,60,.08); border-color:rgba(180,140,60,.2); }
[data-theme="light"] .lg-fb-glass { background:rgba(255,255,255,.6); border-color:rgba(0,0,0,.08); box-shadow:0 2px 16px rgba(0,0,0,.04); }
[data-theme="light"] .lg-fb-glass:focus-within { border-color:rgba(180,140,60,.3); }
[data-theme="light"] .lg-fb-send { color:#fff; background:linear-gradient(135deg, #b08d3e, #c8a86e); }

/* Email input */
.lg-fb-glass--sm { margin-bottom:14px; }
.lg-fb-email {
  width:100%; box-sizing:border-box;
  background:transparent; border:none; outline:none;
  padding:14px 18px; color:var(--text); font-size:14px;
  font-family:var(--body);
}
.lg-fb-email::placeholder { color:var(--muted); opacity:.6; }

/* Response cards */
.lg-fb-responses { margin-bottom:20px; display:flex; flex-direction:column; gap:12px; }
.lg-fb-response-card {
  background:rgba(110,196,126,.06);
  backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
  border:1px solid rgba(110,196,126,.15);
  border-radius:18px; padding:16px; position:relative;
  animation:wn-slide-up .4s cubic-bezier(.16,1,.3,1);
}
.lg-fb-response-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.lg-fb-response-badge {
  display:inline-block; padding:3px 10px; border-radius:8px;
  font-size:11px; font-weight:700; letter-spacing:.5px;
  background:linear-gradient(135deg, #6ec47e, #4da85e); color:#fff;
}
.lg-fb-response-cat { color:var(--muted); font-size:12px; text-transform:capitalize; }
.lg-fb-response-your {
  color:var(--muted); font-size:13px; margin:0 0 10px;
  padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,.06);
}
.lg-fb-response-reply {
  display:flex; align-items:flex-start; gap:8px;
}
.lg-fb-response-reply p { margin:0; color:var(--text); font-size:14px; line-height:1.5; }
.lg-fb-response-dot {
  flex-shrink:0; width:6px; height:6px; border-radius:50%; margin-top:7px;
  background:linear-gradient(135deg, #6ec47e, #4da85e);
  box-shadow:0 0 8px rgba(110,196,126,.4);
}

/* Submission history */
.lg-fb-history { margin-top:20px; }
.lg-fb-history-title {
  font-size:13px; color:var(--muted); text-transform:uppercase;
  letter-spacing:1px; margin:0 0 10px; font-weight:600;
}
.lg-fb-history-item {
  display:flex; align-items:center; gap:8px; padding:10px 0;
  border-bottom:1px solid rgba(255,255,255,.04); font-size:13px;
}
.lg-fb-history-cat {
  flex-shrink:0; padding:2px 8px; border-radius:6px; font-size:11px;
  background:rgba(255,255,255,.05); color:var(--muted); text-transform:capitalize;
}
.lg-fb-history-msg { flex:1; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.lg-fb-history-status {
  flex-shrink:0; font-size:11px; color:var(--gold); opacity:.7;
}

/* Light overrides */
[data-theme="light"] .lg-fb-response-card { background:rgba(110,196,126,.05); border-color:rgba(110,196,126,.15); }
[data-theme="light"] .lg-fb-response-your { border-bottom-color:rgba(0,0,0,.06); }
[data-theme="light"] .lg-fb-history-item { border-bottom-color:rgba(0,0,0,.06); }
[data-theme="light"] .lg-fb-history-cat { background:rgba(0,0,0,.04); }

/* ── What's New — Liquid Glass Modal ── */
.wn-overlay {
  position:fixed; inset:0; z-index:10000;
  background:rgba(0,0,0,.5); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
  display:flex; align-items:center; justify-content:center; padding:24px;
  animation:wn-fade-in .3s ease;
}
@keyframes wn-fade-in { from { opacity:0; } to { opacity:1; } }

.wn-card {
  position:relative; width:100%; max-width:360px;
  background:rgba(20,24,40,.85);
  backdrop-filter:blur(40px) saturate(1.4); -webkit-backdrop-filter:blur(40px) saturate(1.4);
  border:1px solid rgba(255,255,255,.08);
  border-radius:28px; padding:32px 28px 24px; overflow:hidden;
  box-shadow:0 24px 64px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.06);
  animation:wn-slide-up .4s cubic-bezier(.16,1,.3,1);
}
@keyframes wn-slide-up { from { transform:translateY(40px); opacity:0; } to { transform:translateY(0); opacity:1; } }

.wn-glow {
  position:absolute; top:-60px; left:50%; transform:translateX(-50%);
  width:240px; height:240px; border-radius:50%;
  background:radial-gradient(circle, rgba(200,170,110,.12) 0%, transparent 70%);
  filter:blur(50px); pointer-events:none;
}

.wn-badge {
  display:inline-block; padding:4px 12px; border-radius:8px; font-size:11px;
  font-weight:700; letter-spacing:1.5px; margin-bottom:12px;
  background:linear-gradient(135deg, var(--gold), #e8d5a8);
  color:#080D1A; position:relative;
}

.wn-title {
  font-family:var(--heading); font-size:24px; font-weight:700; margin:0 0 4px;
  color:var(--text); position:relative;
}
.wn-version { color:var(--muted); font-size:13px; margin:0 0 20px; position:relative; }

.wn-list { list-style:none; padding:0; margin:0 0 24px; position:relative; }
.wn-item {
  display:flex; align-items:flex-start; gap:10px; padding:8px 0;
  color:var(--text); font-size:14px; line-height:1.5;
  opacity:0; animation:wn-item-in .4s ease forwards;
}
@keyframes wn-item-in { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }

.wn-dot {
  flex-shrink:0; width:6px; height:6px; border-radius:50%; margin-top:7px;
  background:linear-gradient(135deg, var(--gold), #e8d5a8);
  box-shadow:0 0 6px rgba(200,170,110,.3);
}

.wn-btn {
  width:100%; padding:14px; border:none; border-radius:14px; cursor:pointer;
  font-family:var(--body); font-size:15px; font-weight:600;
  color:#080D1A;
  background:linear-gradient(135deg, var(--gold), #e8d5a8, var(--gold));
  background-size:200% 200%; animation:lg-shimmer 3s ease infinite;
  box-shadow:0 4px 16px rgba(200,170,110,.2);
  transition:transform .2s;
  position:relative;
}
.wn-btn:active { transform:scale(.97); }

/* Light theme */
[data-theme="light"] .wn-card { background:rgba(255,255,255,.88); border-color:rgba(0,0,0,.08); }
[data-theme="light"] .wn-btn { color:#fff; background:linear-gradient(135deg, #b08d3e, #c8a86e); }

/* ── Admin Area ── */

/* Gate — full-screen auth form */
.admin-gate {
  display:flex; align-items:center; justify-content:center;
  min-height:100vh; padding:var(--sp-lg);
  background:var(--bg);
}
.admin-gate > div {
  width:100%; max-width:360px;
  background:var(--glass-bg); border:1px solid var(--glass-border);
  border-radius:var(--r-lg); padding:var(--sp-4xl) var(--sp-3xl);
  box-shadow:var(--glass-shadow);
  display:flex; flex-direction:column; gap:var(--sp-lg);
  text-align:center;
}

/* Title & subtitle */
.admin-title {
  font-family:var(--serif); font-size:var(--fs-2xl); font-weight:700;
  color:var(--text); margin:0 0 var(--sp-sm);
}
.admin-subtitle {
  font-family:var(--sans); font-size:var(--fs-sm); font-weight:500;
  color:var(--muted); margin:0 0 var(--sp-md); text-transform:uppercase; letter-spacing:.05em;
}

/* Auth key input */
.admin-key-input {
  width:100%; padding:var(--sp-md) var(--sp-lg);
  background:var(--input-bg); border:1px solid var(--glass-border); border-radius:var(--r-sm);
  color:var(--text); font-family:var(--mono); font-size:var(--fs-base);
  outline:none; transition:border-color var(--dur-fast);
}
.admin-key-input::placeholder { color:var(--muted); opacity:.6; }
.admin-key-input:focus { border-color:var(--gold); }

/* Auth login button */
.admin-login-btn {
  width:100%; padding:var(--sp-md) var(--sp-lg); border:none; border-radius:var(--r-sm);
  background:linear-gradient(135deg, var(--gold), #e8d5a8); color:#080D1A;
  font-family:var(--sans); font-size:var(--fs-base); font-weight:600;
  cursor:pointer; transition:opacity var(--dur-fast), transform var(--dur-fast);
}
.admin-login-btn:hover { opacity:.9; }
.admin-login-btn:active { transform:scale(.97); }
.admin-login-btn:disabled { opacity:.5; cursor:not-allowed; }

/* Shell — sidebar + content grid */
.admin-shell {
  display:grid; grid-template-columns:240px 1fr;
  min-height:100vh; background:var(--bg);
  color:var(--text); font-family:var(--sans);
}

/* Sidebar navigation */
.admin-nav {
  background:var(--glass-bg); border-right:1px solid var(--glass-border);
  padding:var(--sp-2xl) 0; display:flex; flex-direction:column; gap:var(--sp-xs);
  overflow-y:auto;
}
.admin-nav__header {
  padding:0 var(--sp-lg) var(--sp-xl);
  font-family:var(--serif); font-size:var(--fs-lg); font-weight:700; color:var(--gold);
  border-bottom:1px solid var(--glass-border); margin-bottom:var(--sp-sm);
}
.admin-nav a, .admin-nav button {
  display:block; width:100%; padding:var(--sp-sm) var(--sp-lg);
  background:none; border:none; text-align:left; cursor:pointer;
  font-family:var(--sans); font-size:var(--fs-base); color:var(--muted);
  text-decoration:none; border-left:3px solid transparent;
  transition:color var(--dur-fast), border-color var(--dur-fast), background var(--dur-fast);
}
.admin-nav a:hover, .admin-nav button:hover { color:var(--text); background:rgba(255,255,255,.03); }
.admin-nav a.active, .admin-nav button.active {
  color:var(--gold); border-left-color:var(--gold); background:rgba(212,165,116,.06);
}

/* Main content area */
.admin-page {
  padding:var(--sp-3xl); overflow-y:auto; max-width:1200px;
}

/* Metric cards grid */
.admin-cards {
  display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));
  gap:var(--sp-lg); margin-bottom:var(--sp-2xl);
}

/* Individual metric card */
.admin-card {
  background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:var(--r-md);
  padding:var(--sp-lg); display:flex; flex-direction:column; gap:var(--sp-xs);
}
.admin-card__label { font-size:var(--fs-xs); color:var(--muted); text-transform:uppercase; letter-spacing:.04em; }
.admin-card__value { font-size:var(--fs-2xl); font-weight:700; color:var(--text); }
.admin-card--ok  { border-color:rgba(91,168,157,.25); background:rgba(91,168,157,.06); }
.admin-card--ok  .admin-card__value { color:var(--teal); }
.admin-card--warn { border-color:rgba(212,165,116,.25); background:rgba(212,165,116,.06); }
.admin-card--warn .admin-card__value { color:var(--gold); }
.admin-card--bad  { border-color:rgba(248,113,113,.25); background:rgba(248,113,113,.06); }
.admin-card--bad  .admin-card__value { color:var(--coral); }

/* Data table */
.admin-table {
  width:100%; border-collapse:collapse;
  background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:var(--r-md);
  overflow:hidden; margin-bottom:var(--sp-2xl);
}
.admin-table thead th {
  position:sticky; top:0; z-index:2;
  background:rgba(255,255,255,.04); border-bottom:1px solid var(--glass-border);
  padding:var(--sp-sm) var(--sp-md); text-align:left;
  font-size:var(--fs-xs); font-weight:600; color:var(--muted);
  text-transform:uppercase; letter-spacing:.04em;
}
.admin-table tbody tr { border-bottom:1px solid rgba(255,255,255,.03); transition:background var(--dur-fast); }
.admin-table tbody tr:hover { background:rgba(255,255,255,.025); }
.admin-table tbody tr:last-child { border-bottom:none; }
.admin-table td { padding:var(--sp-sm) var(--sp-md); font-size:var(--fs-base); color:var(--text); vertical-align:middle; }

/* Inline status badges */
.admin-badge {
  display:inline-flex; align-items:center; padding:2px var(--sp-sm);
  border-radius:var(--r-full); font-size:var(--fs-xs); font-weight:600;
  line-height:1.4; white-space:nowrap;
}
.admin-badge--healthy { color:var(--teal); background:rgba(91,168,157,.12); }
.admin-badge--review  { color:var(--gold); background:rgba(212,165,116,.12); }
.admin-badge--poor    { color:var(--coral); background:rgba(248,113,113,.12); }
.admin-badge--reading       { color:var(--accent); background:rgba(123,140,222,.12); }
.admin-badge--compatibility { color:var(--teal); background:rgba(91,168,157,.12); }

/* Filter bar */
.admin-filter {
  display:flex; flex-wrap:wrap; gap:var(--sp-sm); align-items:center;
  margin-bottom:var(--sp-lg);
}
.admin-filter select,
.admin-filter input {
  padding:var(--sp-xs) var(--sp-md);
  background:var(--input-bg); border:1px solid var(--glass-border); border-radius:var(--r-sm);
  color:var(--text); font-family:var(--sans); font-size:var(--fs-sm);
  outline:none; transition:border-color var(--dur-fast);
}
.admin-filter select:focus,
.admin-filter input:focus { border-color:var(--gold); }

/* Session detail layout */
.admin-detail {
  display:flex; flex-direction:column; gap:var(--sp-lg);
}
.admin-detail__header {
  background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:var(--r-md);
  padding:var(--sp-lg); display:flex; flex-wrap:wrap; gap:var(--sp-md) var(--sp-2xl);
}
.admin-detail__meta { display:flex; flex-direction:column; gap:2px; }
.admin-detail__meta-label { font-size:var(--fs-xs); color:var(--muted); }
.admin-detail__meta-value { font-size:var(--fs-base); color:var(--text); font-weight:500; }

/* Collapsible section */
.admin-section {
  background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:var(--r-md);
  overflow:hidden;
}
.admin-section__header {
  display:flex; align-items:center; justify-content:space-between;
  padding:var(--sp-md) var(--sp-lg); cursor:pointer;
  font-size:var(--fs-base); font-weight:600; color:var(--text);
  transition:background var(--dur-fast); user-select:none;
}
.admin-section__header:hover { background:rgba(255,255,255,.025); }
.admin-section__arrow {
  font-size:var(--fs-sm); color:var(--muted); transition:transform var(--dur-normal);
}
.admin-section--open .admin-section__arrow { transform:rotate(90deg); }
.admin-section__body { padding:0 var(--sp-lg) var(--sp-lg); }

/* Empty state */
.admin-empty {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:var(--sp-5xl) var(--sp-lg); text-align:center; color:var(--muted);
  font-size:var(--fs-base); gap:var(--sp-sm);
}
.admin-empty__icon { font-size:var(--fs-3xl); opacity:.4; }

/* ── Admin responsive: < 900px ── */
@media (max-width:899px) {
  .admin-shell {
    grid-template-columns:1fr; grid-template-rows:auto 1fr;
  }
  .admin-nav {
    flex-direction:row; border-right:none; border-bottom:1px solid var(--glass-border);
    padding:var(--sp-sm) var(--sp-sm); gap:0; overflow-x:auto; overflow-y:hidden;
  }
  .admin-nav__header { display:none; }
  .admin-nav a, .admin-nav button {
    width:auto; white-space:nowrap; padding:var(--sp-xs) var(--sp-md);
    border-left:none; border-bottom:2px solid transparent; text-align:center;
    font-size:var(--fs-sm);
  }
  .admin-nav a.active, .admin-nav button.active {
    border-left-color:transparent; border-bottom-color:var(--gold);
  }
  .admin-page { padding:var(--sp-lg); }
  .admin-cards { grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); }
  .admin-table { font-size:var(--fs-sm); }
  .admin-detail__header { flex-direction:column; gap:var(--sp-sm); }
}

/* ── Admin UX Enhancements ── */

/* Login branding star */
.admin-brand-star {
  font-size:var(--fs-3xl); color:var(--gold); display:block; margin-bottom:var(--sp-sm);
}
.admin-auth-error {
  color:var(--coral); font-size:var(--fs-sm); font-weight:500;
  background:rgba(248,113,113,.1); border:1px solid rgba(248,113,113,.25);
  border-radius:var(--r-sm); padding:var(--sp-sm) var(--sp-md);
  margin-top:var(--sp-xs);
}

/* Feedback badge in nav */
.admin-feedback-badge {
  display:inline-flex; align-items:center; justify-content:center;
  min-width:20px; height:20px; padding:0 6px;
  border-radius:var(--r-full); font-size:11px; font-weight:700;
  background:var(--coral); color:#fff; margin-left:var(--sp-xs);
  line-height:1;
}

/* Health: status indicator */
.admin-status-bar {
  display:flex; align-items:center; gap:var(--sp-md);
  margin-bottom:var(--sp-lg); padding:var(--sp-md) var(--sp-lg);
  background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:var(--r-md);
}
.admin-status-dot {
  width:12px; height:12px; border-radius:50%; flex-shrink:0;
}
.admin-status-dot--online { background:#22c55e; box-shadow:0 0 8px rgba(34,197,94,.5); }
.admin-status-dot--offline { background:#ef4444; box-shadow:0 0 8px rgba(239,68,68,.5); }
.admin-status-text { font-size:var(--fs-base); font-weight:600; }
.admin-status-text--online { color:#22c55e; }
.admin-status-text--offline { color:#ef4444; }

/* Health: header row with refresh */
.admin-header-row {
  display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap;
  gap:var(--sp-sm); margin-bottom:var(--sp-md);
}
.admin-refresh-btn {
  display:inline-flex; align-items:center; gap:var(--sp-xs);
  padding:var(--sp-xs) var(--sp-md); border:1px solid var(--glass-border); border-radius:var(--r-sm);
  background:var(--glass-bg); color:var(--text); font-family:var(--sans); font-size:var(--fs-sm);
  cursor:pointer; transition:border-color var(--dur-fast), background var(--dur-fast);
}
.admin-refresh-btn:hover { border-color:var(--gold); background:rgba(212,165,116,.06); }
.admin-refresh-btn:disabled { opacity:.5; cursor:not-allowed; }
.admin-last-updated {
  font-size:var(--fs-xs); color:var(--muted);
}
.admin-countdown {
  display:inline-flex; align-items:center; gap:4px;
  font-size:var(--fs-xs); color:var(--muted); margin-left:var(--sp-sm);
}

/* Health: response time color coding */
.admin-card--fast .admin-card__value { color:#22c55e; }
.admin-card--fast { border-color:rgba(34,197,94,.25); background:rgba(34,197,94,.06); }
.admin-card--moderate .admin-card__value { color:var(--gold); }
.admin-card--moderate { border-color:rgba(212,165,116,.25); background:rgba(212,165,116,.06); }
.admin-card--slow .admin-card__value { color:var(--coral); }
.admin-card--slow { border-color:rgba(248,113,113,.25); background:rgba(248,113,113,.06); }

/* Health: expandable error rows */
.admin-error-row { cursor:pointer; }
.admin-error-row:hover { background:rgba(255,255,255,.04); }
.admin-error-text { max-width:400px; }
.admin-error-text--truncated {
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.admin-error-text--expanded {
  white-space:pre-wrap; word-break:break-word;
}
.admin-expand-hint {
  font-size:var(--fs-xs); color:var(--muted); margin-left:var(--sp-xs);
}

/* Analytics: pill toggle group */
.admin-pill-group {
  display:inline-flex; gap:0; background:var(--glass-bg);
  border:1px solid var(--glass-border); border-radius:var(--r-full);
  padding:3px; margin-bottom:var(--sp-lg);
}
.admin-pill {
  padding:var(--sp-xs) var(--sp-lg); border:none; border-radius:var(--r-full);
  background:transparent; color:var(--muted); font-family:var(--sans);
  font-size:var(--fs-sm); font-weight:500; cursor:pointer;
  transition:all var(--dur-fast);
}
.admin-pill:hover { color:var(--text); }
.admin-pill--active {
  background:linear-gradient(135deg, var(--gold), #e8d5a8);
  color:#080D1A; font-weight:600;
}

/* Analytics: section view bar */
.admin-bar-cell {
  display:flex; align-items:center; gap:var(--sp-sm);
}
.admin-bar {
  height:8px; border-radius:4px; min-width:2px;
  background:linear-gradient(90deg, var(--gold), var(--teal));
  transition:width var(--dur-normal) ease;
}
.admin-bar-count {
  white-space:nowrap; font-variant-numeric:tabular-nums;
}

/* ── Admin Sessions / Quality UX Enhancements ── */

/* Copy button — small inline icon button next to IDs */
.admin-copy-btn {
  display:inline-flex; align-items:center; justify-content:center;
  width:22px; height:22px; padding:0; margin-left:var(--sp-xs);
  background:rgba(255,255,255,.06); border:1px solid var(--glass-border); border-radius:var(--r-sm);
  color:var(--muted); font-size:11px; cursor:pointer; vertical-align:middle;
  transition:color var(--dur-fast), background var(--dur-fast), border-color var(--dur-fast);
  position:relative; flex-shrink:0;
}
.admin-copy-btn:hover { color:var(--text); background:rgba(255,255,255,.1); border-color:var(--gold); }
.admin-copy-btn:active { transform:scale(.92); }
.admin-copy-btn__tooltip {
  position:absolute; bottom:calc(100% + 4px); left:50%; transform:translateX(-50%);
  padding:2px 6px; border-radius:var(--r-sm);
  background:var(--gold); color:#080D1A; font-size:10px; font-weight:600;
  white-space:nowrap; pointer-events:none;
  animation:admin-fade-out 1.2s ease-out forwards;
}
@keyframes admin-fade-out {
  0%,70% { opacity:1; }
  100% { opacity:0; }
}

/* Search input for session list */
.admin-search {
  width:100%; max-width:340px; padding:var(--sp-sm) var(--sp-md);
  background:var(--input-bg); border:1px solid var(--glass-border); border-radius:var(--r-sm);
  color:var(--text); font-family:var(--mono); font-size:var(--fs-sm);
  outline:none; transition:border-color var(--dur-fast);
}
.admin-search::placeholder { color:var(--muted); opacity:.6; }
.admin-search:focus { border-color:var(--gold); }

/* Stale / old row highlight */
.admin-stale-row {
  background:rgba(248,113,113,.04);
}
.admin-stale-row:hover { background:rgba(248,113,113,.08); }

/* Duration color coding */
.admin-duration--fast { color:var(--teal); }
.admin-duration--mid  { color:var(--gold); }
.admin-duration--slow { color:var(--coral); }

/* Fallback count color coding */
.admin-fallback--zero { color:var(--muted); }
.admin-fallback--warn { color:var(--gold); font-weight:600; }
.admin-fallback--bad  { color:var(--coral); font-weight:700; }

/* Flag badge color variants */
.admin-badge--flag-missing   { color:var(--coral); background:rgba(248,113,113,.12); }
.admin-badge--flag-short     { color:var(--gold); background:rgba(212,165,116,.12); }
.admin-badge--flag-truncated { color:var(--gold); background:rgba(212,165,116,.10); }
.admin-badge--flag-fallback  { color:var(--coral); background:rgba(248,113,113,.10); }
.admin-badge--flag-default   { color:var(--accent); background:rgba(123,140,222,.12); }

/* Date-range hint */
.admin-date-range {
  font-size:var(--fs-sm); color:var(--muted); margin-bottom:var(--sp-md);
  font-style:italic;
}

/* ── Admin responsive: < 768px — scrollable tables ── */
@media (max-width:767px) {
  .admin-table-wrap {
    overflow-x:auto; -webkit-overflow-scrolling:touch;
    margin-left:calc(-1 * var(--sp-lg)); margin-right:calc(-1 * var(--sp-lg));
    padding:0 var(--sp-lg);
  }
  .admin-table-wrap .admin-table { min-width:600px; }
  .admin-search { max-width:100%; }
}

/* ── Admin Feedback UX Enhancements ── */

/* Search input in filter bar */
.admin-search-input {
  flex:1; min-width:180px;
}

/* Export button */
.admin-export-btn {
  padding:var(--sp-xs) var(--sp-md);
  background:transparent; border:1px solid var(--glass-border); border-radius:var(--r-sm);
  color:var(--muted); font-family:var(--sans); font-size:var(--fs-sm); font-weight:500;
  cursor:pointer; transition:color var(--dur-fast), border-color var(--dur-fast), background var(--dur-fast);
  white-space:nowrap;
}
.admin-export-btn:hover { color:var(--text); border-color:var(--gold); background:rgba(212,165,116,.06); }

/* Priority row tints */
.admin-row--error { border-left:3px solid var(--coral); background:rgba(248,113,113,.04); }
.admin-row--error:hover { background:rgba(248,113,113,.08) !important; }
.admin-row--improve { border-left:3px solid var(--gold); background:rgba(212,165,116,.03); }
.admin-row--improve:hover { background:rgba(212,165,116,.06) !important; }

/* Stale ticket (pending > 3 days) */
.admin-row--stale {
  background:rgba(212,165,116,.08);
  animation:stale-pulse 2.5s ease-in-out infinite;
}
@keyframes stale-pulse {
  0%,100% { box-shadow:inset 0 0 0 0 transparent; }
  50%     { box-shadow:inset 0 0 8px rgba(248,113,113,.18); }
}
.admin-row--stale.admin-row--error {
  background:rgba(248,113,113,.08);
  animation:stale-pulse-red 2.5s ease-in-out infinite;
}
@keyframes stale-pulse-red {
  0%,100% { box-shadow:inset 0 0 0 0 transparent; }
  50%     { box-shadow:inset 0 0 10px rgba(248,113,113,.25); }
}

/* Canned reply chips */
.admin-canned-row {
  display:flex; flex-wrap:wrap; gap:var(--sp-xs); margin-bottom:var(--sp-sm);
}
.admin-canned-chip {
  padding:4px var(--sp-sm);
  background:transparent; border:1px solid var(--glass-border); border-radius:var(--r-full);
  color:var(--muted); font-family:var(--sans); font-size:var(--fs-xs);
  cursor:pointer; transition:color var(--dur-fast), border-color var(--dur-fast), background var(--dur-fast);
  white-space:nowrap; line-height:1.4;
}
.admin-canned-chip:hover {
  color:var(--text); border-color:var(--gold); background:rgba(212,165,116,.08);
}
`;
