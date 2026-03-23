export const styles = `
/* ── Theme Variables ── */
:root, [data-theme="dark"] {
  --bg: #080D1A;
  --bg2: rgba(255,255,255,0.04);
  --glass-bg: rgba(255,255,255,0.04);
  --glass-border: rgba(255,255,255,0.08);
  --glass-shadow: 0 8px 32px rgba(0,0,0,0.25);
  --glass-glow: inset 0 1px 0 0 rgba(255,255,255,0.04);
  --text: #E8ECF4;
  --muted: #7a8baa;
  --gold: #D4A574;
  --accent: #7B8CDE;
  --teal: #5BA89D;
  --coral: #F87171;
  --oracle-particle: rgba(212,165,116,.92);
  --oracle-particle-shadow: 0 0 10px rgba(212,165,116,.28);
  --nav-bg: rgba(8,13,26,0.94);
  --input-bg: rgba(15,23,42,0.6);
  --overlay-bg: rgba(8,13,26,0.96);
  --detail-hd-bg: rgba(8,13,26,0.92);
  --body-bg: radial-gradient(ellipse at 50% 0%, #162040 0%, #080D1A 60%);
  --nav-h: 56px;
  --safe-top: max(env(safe-area-inset-top, 0px), 14px);
  --page-top-pad: calc(24px + var(--safe-top));
  --sans: 'DM Sans', system-ui, sans-serif;
  --serif: 'Playfair Display', Georgia, serif;
}

[data-theme="light"] {
  --bg: #FAF6F0;
  --bg2: rgba(0,0,0,0.025);
  --glass-bg: rgba(255,255,255,0.7);
  --glass-border: rgba(0,0,0,0.07);
  --glass-shadow: 0 2px 12px rgba(0,0,0,0.06);
  --glass-glow: none;
  --text: #1A1A2E;
  --muted: #6B7280;
  --gold: #B8896A;
  --accent: #6B7BC0;
  --teal: #4A9488;
  --coral: #DC4E4E;
  --oracle-particle: rgba(167,112,73,.98);
  --oracle-particle-shadow: 0 0 12px rgba(167,112,73,.35), 0 0 22px rgba(107,123,192,.16);
  --nav-bg: rgba(250,246,240,0.94);
  --input-bg: rgba(0,0,0,0.04);
  --overlay-bg: rgba(250,246,240,0.97);
  --detail-hd-bg: rgba(250,246,240,0.92);
  --body-bg: linear-gradient(180deg, #FAF6F0 0%, #F0EBE3 100%);
}

/* ── Reset ── */
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
html, body, #root { height: 100%; background: var(--bg); color: var(--text); overflow-x: hidden; font-family: var(--sans); }
body { overscroll-behavior: none; -webkit-overflow-scrolling: touch; background: var(--body-bg); }
button { font-family: var(--sans); border: 0; cursor: pointer; background: none; color: inherit; }
input { font-family: var(--sans); }
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
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-glow), var(--glass-shadow);
}

/* ── Animations ── */
@keyframes fadeIn { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
@keyframes staggerIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
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

.fade-in { animation: fadeIn .3s cubic-bezier(.4,0,.2,1) both; }
.stagger { animation: staggerIn .35s cubic-bezier(.4,0,.2,1) both; }
.bar-anim { transform-origin: left; animation: barScale .7s cubic-bezier(.22,1,.36,1) both; }

[data-motion="reduce"] *,
[data-motion="reduce"] *::before,
[data-motion="reduce"] *::after {
  animation-duration: .01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: .01ms !important;
  scroll-behavior: auto !important;
}

/* ── Screen base ── */
.screen { display:flex; flex-direction:column; min-height:100vh; min-height:100dvh; padding:var(--safe-top) 28px 0; position:relative; }

/* ── Splash ── */
.splash { align-items:center; justify-content:center; background: var(--body-bg); overflow:hidden; }
.splash-bg { position:absolute; inset:0; pointer-events:none; }
.bg-star { position:absolute; border-radius:50%; background:var(--gold); animation:drift 4s ease-in-out infinite; }
.constellation { width:180px; height:180px; margin-bottom:24px; position:relative; z-index:1; }
.star-dot { animation:starPulse 3.5s ease-in-out infinite; transform-origin:center; transform-box:fill-box; }
.cline { stroke-dasharray:200; stroke-dashoffset:200; animation:drawLine 1.8s ease forwards; }
.splash-orb {
  width:80px; height:80px; border-radius:50%; position:relative; z-index:1;
  background:radial-gradient(circle, rgba(212,165,116,.3), rgba(212,165,116,.05));
  animation:orbPulse 4s ease-in-out infinite; margin-bottom:32px;
}
.splash-text { text-align:center; margin-bottom:48px; position:relative; z-index:1; }
.splash-text h1 { font-family:var(--serif); font-size:2.2rem; font-weight:700; color:var(--gold); margin-bottom:10px; }
.splash-text p { color:var(--muted); font-size:1rem; letter-spacing:.02em; }
.splash-actions { position:absolute; bottom:max(env(safe-area-inset-bottom,28px),28px); left:28px; right:28px; display:flex; flex-direction:column; align-items:center; gap:16px; z-index:1; }
.splash-actions .btn-gold { max-width:320px; }
.splash-link { color:var(--muted); font-size:.88rem; font-weight:500; min-height:48px; display:flex; align-items:center; }
.splash-link:active { color:var(--gold); }

/* ── Buttons ── */
.btn-gold {
  display:block; width:100%; min-height:54px; border-radius:16px;
  background:linear-gradient(135deg, #D4A574, #c4956a);
  color:#0B1121; font-size:1.05rem; font-weight:700; letter-spacing:.02em;
  transition:transform 120ms, box-shadow 120ms;
  box-shadow:0 4px 20px rgba(212,165,116,.25);
}
.btn-gold:active { transform:scale(.97); box-shadow:0 2px 12px rgba(212,165,116,.15); }
.btn-gold:disabled { opacity:.5; cursor:wait; }
.btn-ghost { min-height:48px; padding:0 20px; border-radius:14px; color:var(--muted); font-size:.95rem; font-weight:600; }
.btn-danger { display:block; width:100%; min-height:48px; border-radius:14px; color:#ef4444; font-size:.95rem; font-weight:600; margin-top:12px; background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.15); }

/* ── Onboarding ── */
.ob-screen { justify-content:center; background:var(--bg); padding-top:28px; padding-bottom:28px; }
.ob-dots { display:flex; gap:8px; justify-content:center; padding:20px 0 12px; position:absolute; top:0; left:0; right:0; }
.ob-dot { width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,.1); transition:all .3s; }
[data-theme="light"] .ob-dot { background:rgba(0,0,0,.1); }
.ob-dot--active { background:var(--gold); }
.ob-dot--current { width:24px; border-radius:4px; }
.ob-body { flex:1; display:flex; flex-direction:column; justify-content:center; gap:20px; animation:fadeIn .3s ease; }
.ob-q { font-size:1.6rem; font-weight:700; line-height:1.3; text-align:center; }
.ob-inp {
  width:100%; min-height:52px; background:var(--input-bg); color:var(--text);
  border:1px solid var(--glass-border); border-radius:14px; padding:14px 16px;
  font-size:1.05rem; outline:none; backdrop-filter:blur(12px);
}
.ob-inp:focus { border-color:var(--gold); box-shadow:0 0 0 3px rgba(212,165,116,.12); }
.ob-inp--sm { min-height:48px; font-size:.95rem; }
.ob-sublabel { color:var(--muted); font-size:.88rem; margin-top:2px; }
.ob-foot { display:flex; gap:12px; padding:16px 0 max(env(safe-area-inset-bottom,16px),16px); }
.ob-foot .btn-gold { flex:1; }
.ob-err { padding:12px 16px; border-radius:12px; background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.18); color:#fca5a5; font-size:.93rem; text-align:center; }

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
.loading-ov { position:fixed; inset:0; z-index:200; background:var(--overlay-bg); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:28px; }
.ld-orb {
  width:64px; height:64px; border-radius:50%;
  background:radial-gradient(circle, rgba(212,165,116,.35), rgba(212,165,116,.08));
  animation:orbPulse 2.5s ease-in-out infinite;
}
.ld-msg { color:var(--muted); font-size:1rem; font-family:var(--serif); font-style:italic; animation:msgFade .25s ease both; text-align:center; }
.ld-progress { width:160px; height:2px; border-radius:1px; background:rgba(255,255,255,.06); overflow:hidden; }
[data-theme="light"] .ld-progress { background:rgba(0,0,0,.06); }
.ld-progress-fill { height:100%; background:linear-gradient(90deg, var(--gold), var(--accent)); border-radius:1px; transition:width .3s ease; }

/* ── Main shell ── */
.shell { height:100vh; height:100dvh; display:flex; flex-direction:column; }
.scroll-area { flex:1; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; padding-bottom:var(--nav-h); scroll-behavior:smooth; }

/* ── Page ── */
.page { padding:var(--page-top-pad) 20px 32px; }
.pg-title { font-size:1.6rem; font-weight:700; margin-bottom:20px; }
.empty-msg { color:var(--muted); text-align:center; margin-top:48px; font-style:italic; }
.section-hd { font-size:1.05rem; font-weight:700; color:var(--text); margin-bottom:10px; }

/* ── Home ── */
.home-top { margin-bottom:20px; }
.home-greeting { font-size:1.75rem; font-weight:700; color:var(--text); }
.home-date { color:var(--muted); font-size:.88rem; margin-top:6px; letter-spacing:.03em; }

/* ── Cosmic message ── */
.cosmic-msg {
  position:relative; border-radius:18px; padding:20px; margin-bottom:24px;
  background:var(--glass-bg); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
  box-shadow:var(--glass-shadow);
}
.cosmic-msg::before {
  content:''; position:absolute; inset:0; border-radius:inherit; padding:1px;
  background:linear-gradient(135deg, var(--gold), var(--accent));
  background-size:200% 200%;
  animation:gradientRotate 6s ease infinite;
  -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite:exclude; pointer-events:none;
}
.cosmic-msg p { color:var(--text); font-size:.95rem; line-height:1.65; font-style:italic; font-family:var(--serif); }

/* ── Home score cards ── */
.home-scores { display:flex; flex-direction:column; gap:10px; margin-bottom:24px; }
.hsc {
  border-radius:16px; padding:14px 18px; cursor:pointer;
  transition:transform 150ms, box-shadow 150ms;
}
.hsc:active { transform:scale(.98); }
.hsc-top { display:flex; align-items:center; gap:8px; }
.hsc-icon { font-size:1.1rem; width:24px; text-align:center; }
.hsc-label { font-size:.92rem; font-weight:600; color:var(--muted); flex:1; }
.hsc-pct { font-size:1.6rem; font-weight:700; }
.hsc-bar { width:100%; height:3px; border-radius:2px; background:rgba(255,255,255,.04); margin-top:8px; overflow:hidden; }
[data-theme="light"] .hsc-bar { background:rgba(0,0,0,.06); }
.hsc-bar-fill { height:100%; border-radius:2px; }
.hsc-expand { margin-top:14px; padding-top:14px; border-top:1px solid var(--glass-border); display:flex; flex-direction:column; gap:10px; }
.hsc-explain { color:var(--muted); font-size:.88rem; line-height:1.6; }
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
.dodont { border-radius:18px; padding:20px; margin-bottom:24px; }
.dodont-title { font-size:1.1rem; font-weight:700; color:var(--gold); margin-bottom:16px; }
.dodont-note { color:var(--muted); font-size:.78rem; line-height:1.5; margin-top:-8px; margin-bottom:16px; }
.dodont-cols { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.dodont-col { display:flex; flex-direction:column; gap:10px; }
.dodont-hd { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.12em; padding-bottom:8px; border-bottom:2px solid; }
.dodont-hd--do { color:var(--teal); border-color:var(--teal); }
.dodont-hd--dont { color:var(--coral); border-color:var(--coral); }
.dodont-item { font-size:.82rem; line-height:1.5; color:var(--muted); }
.dodont-item--do::before { content:'+ '; color:var(--teal); font-weight:700; }
.dodont-item--dont::before { content:'- '; color:var(--coral); font-weight:700; }

/* ── Cosmic DNA ── */
.dna-section { margin-bottom:24px; }
.dna-scroll { display:flex; gap:8px; overflow-x:auto; padding-bottom:4px; scrollbar-width:none; -ms-overflow-style:none; }
.dna-scroll::-webkit-scrollbar { display:none; }
.dna-pill { border-radius:20px; padding:8px 14px; display:flex; align-items:center; gap:6px; white-space:nowrap; flex-shrink:0; }
.dna-sym { font-size:.95rem; }
.dna-val { font-size:.82rem; font-weight:600; }

/* ── Oracle Screen ── */
.oracle-screen {
  min-height:calc(100vh - var(--nav-h));
  min-height:calc(100dvh - var(--nav-h));
  display:flex; flex-direction:column; align-items:stretch; justify-content:flex-start;
  padding:var(--page-top-pad) 24px 36px; position:relative; overflow:hidden;
}
.oracle-screen::before {
  content:''; position:absolute; inset:-10% -20% auto; height:320px; pointer-events:none;
  background:
    radial-gradient(circle at 50% 30%, rgba(212,165,116,.14), transparent 48%),
    radial-gradient(circle at 20% 20%, rgba(123,140,222,.12), transparent 34%);
  filter:blur(10px);
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
  gap:24px;
}
.oracle-header {
  display:flex;
  flex-direction:row;
  align-items:center;
  justify-content:space-between;
  gap:6px;
}
.oracle-settings-btn {
  width:40px; height:40px; display:flex; align-items:center; justify-content:center;
  color:var(--muted); border-radius:50%;
  background:var(--glass-bg); border:1px solid var(--glass-border);
  transition:color .2s, background .2s;
}
.oracle-settings-btn:active { color:var(--gold); background:rgba(212,165,116,.08); }
.oracle-kicker {
  color:var(--gold);
  font-size:.72rem;
  text-transform:uppercase;
  letter-spacing:.18em;
  font-weight:700;
}
.oracle-greeting { font-size:1.9rem; font-weight:700; line-height:1.1; }
.oracle-stage {
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:20px;
}
.oracle-orb {
  width:74px; height:74px; border-radius:50%; position:relative; z-index:1; margin-bottom:0;
  background:
    radial-gradient(circle at 35% 35%, rgba(255,255,255,.16), transparent 20%),
    radial-gradient(circle, rgba(212,165,116,.18), rgba(123,140,222,.06));
  animation:orbPulse 5s ease-in-out infinite;
  transition:all .5s ease;
}
.oracle-orb::after {
  content:''; position:absolute; inset:-14px; border-radius:50%;
  border:1px solid rgba(212,165,116,.18);
}
.oracle-orb--active {
  width:108px; height:108px;
  background:
    radial-gradient(circle at 35% 35%, rgba(255,255,255,.24), transparent 22%),
    radial-gradient(circle, rgba(212,165,116,.34), rgba(123,140,222,.12));
  animation:orbPulse 1.2s ease-in-out infinite;
}
.oracle-input-area {
  display:flex; flex-direction:column; align-items:center; gap:20px; width:100%;
  max-width:380px; position:relative; z-index:1; transition:opacity .4s ease;
}
.oracle-input-area--loading { opacity:.55; pointer-events:none; }
.oracle-prompt { color:var(--muted); font-size:1.2rem; text-align:center; line-height:1.5; max-width:14ch; }
.oracle-input-wrap {
  width:100%; position:relative; border-radius:18px; padding:1px;
  background:linear-gradient(135deg, var(--gold), var(--accent));
  box-shadow:0 12px 28px rgba(11,17,33,.18);
}
.oracle-input {
  width:100%; min-height:56px; background:rgba(8,13,26,.78); color:var(--text);
  border:none; border-radius:17px; padding:14px 18px; font-size:1.02rem; outline:none;
  text-align:center; font-family:var(--sans); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
}
[data-theme="light"] .oracle-input { background:rgba(250,246,240,.88); }
.oracle-input::placeholder { color:var(--muted); text-align:center; }
.oracle-input-meta {
  width:100%;
  display:flex;
  justify-content:flex-end;
  align-items:center;
  gap:12px;
  margin-top:-8px;
}
.oracle-charcount { color:var(--muted); font-size:.76rem; font-variant-numeric:tabular-nums; }
.oracle-charcount--warn { color:var(--gold); }
.oracle-clear {
  padding:0 14px;
  min-height:40px;
}
.oracle-suggestions {
  width:100%;
  display:flex;
  flex-direction:column;
  gap:10px;
}
.oracle-suggestions-label {
  color:var(--muted);
  font-size:.78rem;
  text-transform:uppercase;
  letter-spacing:.12em;
}
.oracle-suggestions-row {
  display:flex;
  gap:8px;
  flex-wrap:wrap;
  justify-content:center;
}
.oracle-chip {
  min-height:38px;
  padding:8px 12px;
  border-radius:999px;
  font-size:.8rem;
  line-height:1.3;
}
.oracle-chip:active { transform:scale(.98); }
.oracle-cta { max-width:280px; }
.oracle-revealing { display:flex; align-items:center; justify-content:center; position:relative; z-index:1; min-height:120px; }
.oracle-reveal-text { color:var(--muted); font-size:1.1rem; font-style:italic; animation:msgFade .5s ease both; }
.oracle-answer-area { display:flex; flex-direction:column; gap:20px; width:100%; max-width:none; position:relative; z-index:1; border-radius:24px; padding:24px 22px; }
.oracle-q-echo { color:var(--muted); font-size:.84rem; text-align:center; font-style:italic; }
.oracle-answer-text { color:var(--text); font-size:1rem; line-height:1.8; text-align:center; font-family:var(--serif); }
.oracle-sentence { display:inline; opacity:0; animation:sentenceReveal .4s ease both; }
.oracle-actions { display:flex; gap:12px; width:100%; flex-wrap:wrap; }
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
  font-size: .82rem;
  text-align: center;
  margin-top: -6px;
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
.oracle-daily { display:flex; flex-direction:column; gap:12px; margin-bottom:0; }
.oracle-daily-title { font-size:1.1rem; font-weight:700; color:var(--gold); }
.oracle-daily-message { color:var(--text); font-size:1rem; line-height:1.7; margin-top:-2px; margin-bottom:12px; }
.oracle-daily-note { color:var(--muted); font-size:.78rem; line-height:1.5; }
.oracle-summary-pills { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:12px; }
.oracle-summary-pill {
  min-width:132px;
  padding:10px 12px;
  border-radius:14px;
  display:flex;
  flex-direction:column;
  gap:4px;
  border:1px solid var(--glass-border);
}
.oracle-summary-pill--focus { background:rgba(91,168,157,.12); }
.oracle-summary-pill--caution { background:rgba(248,113,113,.09); }
.oracle-summary-pill-label {
  font-size:.68rem;
  text-transform:uppercase;
  letter-spacing:.12em;
  font-weight:700;
  color:var(--muted);
}
.oracle-summary-pill-value { font-size:.9rem; font-weight:700; color:var(--text); }
.oracle-dodont-box { margin-bottom:0; }
.oracle-dodont-title { font-size:1rem; font-weight:700; color:var(--text); margin-bottom:16px; }

/* ── System grid ── */
.sys-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
.sys-tile {
  border-radius:16px; padding:20px 14px;
  display:flex; flex-direction:column; align-items:center; gap:6px;
  min-height:48px; transition:transform 150ms, box-shadow 150ms;
  position:relative; overflow:hidden;
}
.sys-tile::after {
  content:''; position:absolute; inset:0; border-radius:inherit; pointer-events:none; opacity:.6;
  background-image:
    radial-gradient(1.2px 1.2px at 18% 22%, rgba(212,165,116,.15), transparent),
    radial-gradient(1px 1px at 72% 15%, rgba(123,140,222,.12), transparent),
    radial-gradient(.8px .8px at 45% 75%, rgba(212,165,116,.1), transparent),
    radial-gradient(1px 1px at 82% 58%, rgba(123,140,222,.1), transparent),
    radial-gradient(.6px .6px at 28% 52%, rgba(255,255,255,.06), transparent),
    radial-gradient(.6px .6px at 60% 88%, rgba(212,165,116,.08), transparent);
}
.sys-tile:active { transform:scale(.95); box-shadow:0 0 20px rgba(212,165,116,.1); }
.sys-tile-icon { font-size:2rem; position:relative; z-index:1; animation:iconBreathe 3s ease-in-out infinite; }
.sys-tile:nth-child(odd) .sys-tile-icon { animation-delay:.5s; }
.sys-tile:nth-child(even) .sys-tile-icon { animation-delay:1.2s; }
.sys-tile::after { animation:twinkle 4s ease-in-out infinite; }
.sys-tile:nth-child(2)::after { animation-delay:.7s; }
.sys-tile:nth-child(3)::after { animation-delay:1.4s; }
.sys-tile:nth-child(4)::after { animation-delay:.3s; }
.sys-tile:nth-child(5)::after { animation-delay:1.8s; }
.sys-tile:nth-child(6)::after { animation-delay:.9s; }
.sys-tile:nth-child(7)::after { animation-delay:1.6s; }
.sys-tile:nth-child(8)::after { animation-delay:.5s; }
.sys-tile-name { font-weight:700; font-size:.88rem; position:relative; z-index:1; }
.sys-tile-desc { color:var(--muted); font-size:.72rem; position:relative; z-index:1; }
.sys-tile-avg { font-family:var(--serif); font-size:.85rem; font-weight:700; position:relative; z-index:1; margin-top:2px; }

/* ── Detail ── */
.detail { display:flex; flex-direction:column; min-height:100%; }
.detail-hd {
  position:sticky; top:0; z-index:50;
  background:var(--detail-hd-bg); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
  display:flex; align-items:center; gap:12px; padding:calc(12px + var(--safe-top)) 16px 12px; min-height:calc(52px + var(--safe-top));
  border-bottom:1px solid var(--glass-border);
}
.detail-hd h2 { font-size:1.1rem; font-weight:700; }
.back-btn { width:44px; height:44px; display:flex; align-items:center; justify-content:center; border-radius:12px; min-height:48px; }
.back-btn:active { background:rgba(255,255,255,.05); }
.detail-bd { padding:20px 20px 32px; display:flex; flex-direction:column; gap:20px; }
.detail-hl { font-size:1.25rem; font-weight:700; line-height:1.4; color:var(--gold); }

/* ── Detail scores ── */
.d-scores { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
.mscore { border-radius:14px; padding:14px; display:flex; flex-direction:column; gap:6px; }
.mscore-top { display:flex; align-items:center; gap:6px; font-size:.85rem; font-weight:600; }
.mscore-icon { font-size:.95rem; }
.mscore-pct { font-size:1.3rem; font-weight:700; margin-left:auto; }
.mscore-bar { height:3px; border-radius:2px; background:rgba(255,255,255,.04); overflow:hidden; }
[data-theme="light"] .mscore-bar { background:rgba(0,0,0,.06); }
.mscore-bar div { height:100%; border-radius:2px; }
.mscore-lbl { color:var(--muted); font-size:.78rem; }

/* ── Summary ── */
.d-summary { display:flex; flex-direction:column; gap:10px; }
.d-summary p { color:var(--muted); line-height:1.7; font-size:.93rem; }

/* ── Pills ── */
.pills { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
.pill { border-radius:12px; padding:10px 12px; display:flex; flex-direction:column; gap:3px; }
.pill-l { color:var(--gold); font-size:.68rem; text-transform:uppercase; letter-spacing:.1em; font-weight:600; }
.pill-v { font-weight:600; font-size:.9rem; line-height:1.35; }

/* ── Accordion ── */
.accordion { border-radius:14px; overflow:hidden; background:var(--bg2); border:1px solid var(--glass-border); }
.accordion + .accordion { margin-top:6px; }
.accordion-hd {
  width:100%; display:flex; justify-content:space-between; align-items:center;
  padding:14px 16px; min-height:52px; font-size:.93rem; font-weight:600; text-align:left;
}
.accordion-hd:active { background:rgba(255,255,255,.02); }
[data-theme="light"] .accordion-hd:active { background:rgba(0,0,0,.02); }
.accordion-bd { max-height:0; overflow:hidden; transition:max-height .3s cubic-bezier(.4,0,.2,1); }
.accordion-bd--open { max-height:4000px; transition:max-height .5s cubic-bezier(.4,0,.2,1); }
.accordion-inner { padding:0 16px 16px; display:flex; flex-direction:column; gap:10px; }
.ins-text { color:var(--muted); line-height:1.7; font-size:.9rem; }
.insights-list { display:flex; flex-direction:column; gap:6px; }
.adv-block { display:flex; flex-direction:column; gap:10px; }

/* ── Data cards ── */
.dcards-section { display:flex; flex-direction:column; gap:8px; }
.dcards-title { font-size:.9rem; font-weight:700; color:var(--gold); margin-bottom:2px; }
.dcard { border-radius:12px; padding:12px 14px; display:flex; flex-direction:column; gap:6px; }
.dcard-field { display:flex; flex-direction:column; gap:1px; }
.dcard-label { color:var(--gold); font-size:.68rem; text-transform:uppercase; letter-spacing:.1em; font-weight:600; }
.dcard-value { font-size:.88rem; color:var(--muted); line-height:1.4; }

/* ── Combined ── */
.comb-hl { color:var(--gold); font-size:1.1rem; line-height:1.45; margin-bottom:6px; }
.comb-sum { color:var(--muted); font-size:.93rem; line-height:1.7; margin-bottom:16px; }
.comb-scores { display:flex; flex-direction:column; gap:10px; margin-bottom:20px; }
.csc { border-radius:16px; padding:14px 18px; display:flex; flex-direction:column; gap:6px; }
.csc-top { display:flex; align-items:center; gap:8px; }
.csc-icon { font-size:1rem; width:22px; text-align:center; }
.csc-label { font-size:.92rem; font-weight:600; color:var(--muted); flex:1; }
.csc-pct { font-size:1.5rem; font-weight:700; }
.csc-bar { height:3px; border-radius:2px; background:rgba(255,255,255,.04); overflow:hidden; }
[data-theme="light"] .csc-bar { background:rgba(0,0,0,.06); }
.csc-bar div { height:100%; border-radius:2px; }
.csc-conf { color:var(--accent); font-size:.82rem; font-weight:500; }
.csc-sys { color:var(--muted); font-size:.72rem; line-height:1.4; opacity:.7; }

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
.prof-card { border-radius:20px; padding:28px; display:flex; flex-direction:column; align-items:center; gap:8px; margin-bottom:20px; }
.prof-av {
  width:72px; height:72px; border-radius:50%;
  background:linear-gradient(135deg, var(--gold), #b8896a);
  display:flex; align-items:center; justify-content:center;
  font-size:1.8rem; font-weight:700; color:#0B1121;
  box-shadow:0 4px 24px rgba(212,165,116,.3);
}
.prof-name { font-size:1.3rem; font-weight:700; margin-top:4px; }
.prof-heb { color:var(--muted); font-size:1rem; }
.prof-group { margin-bottom:16px; }
.prof-group-title { font-size:.78rem; text-transform:uppercase; letter-spacing:.12em; color:var(--gold); font-weight:600; margin-bottom:8px; padding-left:4px; }
.prof-signs { border-radius:16px; overflow:hidden; }
.sign-row { display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid var(--glass-border); min-height:48px; }
.sign-row:last-child { border-bottom:0; }
.sign-sym { font-size:1.1rem; width:24px; text-align:center; }
.sign-label { flex:1; color:var(--muted); font-size:.9rem; }
.sign-value { font-weight:600; font-size:.93rem; }
.prof-rows { border-radius:16px; overflow:hidden; }
.prow { display:flex; justify-content:space-between; align-items:center; padding:13px 16px; border-bottom:1px solid var(--glass-border); min-height:48px; font-size:.93rem; }
.prow:last-child { border-bottom:0; }
.prow-l { color:var(--muted); }
.prow--btn { width:100%; text-align:left; cursor:pointer; }
.prow--btn:active { background:rgba(255,255,255,.02); }
[data-theme="light"] .prow--btn:active { background:rgba(0,0,0,.02); }
.prow-about { padding:0 16px 14px; color:var(--muted); font-size:.88rem; line-height:1.65; }
.prow-theme { display:flex; gap:4px; }
.prow-theme-btn { padding:6px 14px; border-radius:8px; font-size:.82rem; font-weight:600; color:var(--muted); background:var(--bg2); border:1px solid var(--glass-border); transition:all .2s; }
.prow-theme-btn--on { color:var(--gold); border-color:var(--gold); background:rgba(212,165,116,.08); }
.segmented { display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; }
.segmented-btn { padding:6px 12px; border-radius:999px; font-size:.8rem; font-weight:600; color:var(--muted); background:var(--bg2); border:1px solid var(--glass-border); }
.segmented-btn--on { color:var(--gold); border-color:var(--gold); background:rgba(212,165,116,.08); }
.prof-edit { margin-top:4px; }
.profile-panel-body { padding:20px 20px 32px; display:flex; flex-direction:column; gap:14px; }
.legal-stack { display:flex; flex-direction:column; gap:12px; }
.legal-card { border-radius:18px; padding:18px; }
.legal-title { font-size:1rem; font-weight:700; margin-bottom:8px; }
.legal-copy { color:var(--muted); font-size:.9rem; line-height:1.7; }
.subscription-status { border-radius:20px; padding:20px; }
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
  background:var(--nav-bg); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
  border-top:1px solid var(--glass-border);
  display:flex; justify-content:space-around; align-items:center;
  padding-bottom:env(safe-area-inset-bottom,0);
}
.bnav-tab {
  display:flex; flex-direction:column; align-items:center; gap:3px;
  flex:1; min-width:0; min-height:48px; padding:6px 0;
  font-size:.65rem; color:var(--muted); transition:color .2s; letter-spacing:.03em;
}
.bnav-tab--on { color:var(--gold); }
.bnav-tab span { font-weight:600; }

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
  background: var(--detail-hd-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  display: flex; align-items: center; gap: 12px;
  padding: calc(12px + var(--safe-top)) 16px 12px;
  min-height: calc(52px + var(--safe-top));
  border-bottom: 1px solid var(--glass-border);
}
.sysapp-header-icon { font-size: 1.5rem; }
.sysapp-header-text { display: flex; flex-direction: column; gap: 1px; }
.sysapp-header-name { font-size: 1.1rem; font-weight: 700; line-height: 1.2; }
.sysapp-header-page { font-size: .72rem; color: var(--sys-color, var(--gold)); font-weight: 600; text-transform: uppercase; letter-spacing: .1em; }

/* ── Page indicator tabs ── */
.sysapp-pages-indicator {
  display: flex; justify-content: center; gap: 4px; padding: 12px 16px 8px;
  background: var(--bg); position: sticky; top: calc(52px + var(--safe-top)); z-index: 40;
}
.sysapp-page-dot {
  flex: 1; max-width: 90px; min-height: 36px; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg2); border: 1px solid var(--glass-border);
  transition: all .25s cubic-bezier(.4,0,.2,1);
}
.sysapp-page-dot--active {
  background: rgba(212,165,116,.12); border-color: var(--sys-color, var(--gold));
  box-shadow: 0 0 12px color-mix(in srgb, var(--sys-color) 25%, transparent);
}
.sysapp-page-dot-label {
  font-size: .7rem; font-weight: 600; color: var(--muted);
  letter-spacing: .04em; transition: color .25s;
}
.sysapp-page-dot--active .sysapp-page-dot-label { color: var(--sys-color, var(--gold)); }

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

/* ══════════════════════════════════════════════════════════
   READINGS TAB
   ══════════════════════════════════════════════════════════ */
.rdg-page { padding:var(--page-top-pad) 16px 0; }
.rdg-section { margin-bottom:28px; }
.rdg-section-title { font-size:1.15rem; color:var(--text); margin:0 0 2px; }
.rdg-section-sub { font-size:.76rem; color:var(--muted); margin:0 0 14px; }

/* ── Back button (reused in quiz + quick read) ── */
.rdg-back { display:inline-flex; align-items:center; gap:4px; background:none; border:none; color:var(--gold); font-size:.85rem; padding:0 0 12px; cursor:pointer; font-family:var(--sans); }

/* ── Quiz Hero Cards ── */
.rdg-quiz-stack { display:flex; flex-direction:column; gap:12px; }
.rdg-quiz-card {
  position:relative; overflow:hidden; display:flex; align-items:center;
  background:var(--q-grad); border:none; border-radius:16px;
  padding:18px 16px; cursor:pointer; text-align:left;
  animation: rdg-slideUp .5s ease both;
  transition: transform .15s ease, box-shadow .15s ease;
}
.rdg-quiz-card:active { transform:scale(.97); }
.rdg-quiz-card--done { opacity:.88; }

/* Shimmer overlay */
.rdg-quiz-shimmer {
  position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(110deg, transparent 30%, rgba(255,255,255,.15) 50%, transparent 70%);
  background-size:200% 100%;
  animation: rdg-shimmer 3s ease-in-out infinite;
}
@keyframes rdg-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

.rdg-quiz-content { position:relative; display:flex; align-items:center; gap:14px; width:100%; z-index:1; }
.rdg-quiz-icon { font-size:1.7rem; flex-shrink:0; filter:drop-shadow(0 0 6px rgba(255,255,255,.3)); }
.rdg-quiz-text { flex:1; display:flex; flex-direction:column; gap:2px; }
.rdg-quiz-title { font-size:.95rem; color:#fff; font-weight:700; text-shadow:0 1px 4px rgba(0,0,0,.3); }
.rdg-quiz-sub { font-size:.72rem; color:rgba(255,255,255,.8); }
.rdg-quiz-meta { display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0; }
.rdg-quiz-dur { font-size:.62rem; color:rgba(255,255,255,.7); }
.rdg-quiz-cta {
  font-size:.7rem; font-weight:700; color:#fff;
  background:rgba(255,255,255,.2); border-radius:20px; padding:4px 14px;
  backdrop-filter:blur(4px);
}

@keyframes rdg-slideUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }

/* ── Quick Reads ── */
.rdg-qr-row { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
.rdg-qr-card {
  position:relative; display:flex; flex-direction:column; align-items:center;
  background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:14px;
  padding:16px 10px 14px; cursor:pointer; text-align:center;
  animation: rdg-slideUp .5s ease both;
  transition: transform .15s ease;
}
.rdg-qr-card:active { transform:scale(.96); }
.rdg-qr-badge {
  position:absolute; top:8px; right:8px;
  font-size:.52rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px;
  color:var(--gold); background:rgba(212,165,116,.12);
  padding:2px 7px; border-radius:8px;
}
.rdg-qr-icon { font-size:1.5rem; margin-bottom:6px; filter:drop-shadow(0 0 4px var(--gold)); }
.rdg-qr-title { font-size:.8rem; color:var(--text); font-weight:600; }
.rdg-qr-sub { font-size:.65rem; color:var(--muted); margin-top:2px; }

/* ── Fortune Tools Grid (3-col like reference app) ── */
.rdg-tools-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
.rdg-tool-card {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  background:var(--glass-bg); border:2px solid var(--gold); border-radius:16px;
  padding:22px 8px 16px; cursor:pointer; text-align:center; aspect-ratio:1;
  animation: rdg-slideUp .5s ease both;
  transition: transform .15s ease, box-shadow .15s ease;
}
.rdg-tool-card:active { transform:scale(.95); box-shadow:0 0 20px rgba(212,165,116,.2); }
.rdg-tool-glyph { font-size:2rem; margin-bottom:10px; opacity:.7; }
.rdg-tool-title { font-size:.76rem; color:var(--text); font-weight:600; line-height:1.3; }

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
`;
