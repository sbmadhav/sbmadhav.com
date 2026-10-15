/* Explore menu: one site-wide launcher for every page and section.
   To add a new page, add one entry to PAGES below (`repo` is its GitHub repo under sbmadhav; pages in this repo use 'sbmadhav.github.io'), then run `python3 site-build.py`.
   Each page needs a <button id="exploreBtn"> in its header and <script src="/assets/explore.js" defer>. */
(() => {
  const PAGES = [
    { href: '/', icon: 'home', repo: 'sbmadhav.github.io', pro: ['Home', 'Who I am, what I build, and the games'], kid: ['Home', 'Meet Madhav and Bolt'] },
    { href: '/state-of-voice-agents/', icon: 'voice', repo: 'state-of-voice-agents', pro: ['Voice agents at the front door', 'State of conversational voice AI in healthcare and banking, October 2026'], kid: ['Talking robots', 'How robot phone helpers learn to listen and help'] },
    { href: '/vedic-math/', icon: 'math', repo: 'vedic-math', pro: ['Vedic Math for Everyone', 'Speed tricks, counting to calculus, games and leaderboards'], kid: ['Vedic Math', 'Speed tricks, games, belts and races'] },
    { href: '/design-system/', icon: 'palette', repo: 'design-system', pro: ['Design system', 'Colors, type and components behind this site'], kid: ['Paint box', 'All the colors and shapes I use'] }
  ];
  const SECTIONS = [
    { href: '/#work', icon: 'agent', pro: 'About', kid: 'My jobs' },
    { href: '/#lab', icon: 'brain', pro: 'Brain Lab', kid: 'Robot brain' },
    { href: '/#bugs', icon: 'bug', pro: 'Bug Hunt', kid: 'Bug Hunt' },
    { href: '/#play', icon: 'maze', pro: 'Design Lab', kid: 'Robot Maze' },
    { href: '/#journey', icon: 'flag', pro: 'Journey', kid: 'Game levels' },
    { href: '/#hello', icon: 'wave', pro: 'Say hi', kid: 'Say hi' }
  ];
  const LINKS = [
    { href: 'https://www.linkedin.com/in/sbmadhav/', icon: 'in', label: 'LinkedIn' },
    { href: 'https://github.com/sbmadhav', icon: 'gh', label: 'GitHub' }
  ];

  const HOME_REPO = 'sbmadhav.github.io';
  const P = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const ICONS = {
    math: `<rect x="3.5" y="3.5" width="17" height="17" rx="4" ${P}/><path d="M7 9h4M9 7v4M13.5 9h4M7.5 14.5l3 3M10.5 14.5l-3 3M13.5 15h4M13.5 17.5h4" ${P}/>`,
    voice: `<rect x="9" y="3" width="6" height="11" rx="3" ${P}/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" ${P}/>`,
    home: `<path d="M4 11l8-7 8 7M6.5 9.5V20h11V9.5" ${P}/><path d="M10 20v-5h4v5" ${P}/>`,
    palette: `<path d="M12 3a9 9 0 1 0 0 18c1.3 0 2-.8 2-1.8 0-1.4-1.2-1.7-1.2-3 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.3 17 3 12 3z" ${P}/><circle cx="7.5" cy="11" r="1.3" fill="currentColor"/><circle cx="10" cy="7" r="1.3" fill="currentColor"/><circle cx="15" cy="7.2" r="1.3" fill="currentColor"/>`,
    agent: `<rect x="4" y="7" width="16" height="13" rx="4" ${P}/><path d="M12 7V4" ${P}/><circle cx="9" cy="13" r="1.4" fill="currentColor"/><circle cx="15" cy="13" r="1.4" fill="currentColor"/>`,
    brain: `<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3V4zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3V4z" ${P}/>`,
    bug: `<ellipse cx="12" cy="14" rx="5" ry="6" ${P}/><path d="M12 8v12M7 11L4 9M17 11l3-2M7 15H3.5M17 15h3.5M9 6l-1.5-2M15 6l1.5-2" ${P}/>`,
    maze: `<rect x="3.5" y="3.5" width="17" height="17" rx="3" ${P}/><path d="M8 3.5V12h4M16 20.5V12M12 8h4.5M8 16h4" ${P}/>`,
    flag: `<path d="M5 21V4M5 4h11l-2 4 2 4H5" ${P}/>`,
    wave: `<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V5a1.5 1.5 0 0 1 3 0v6M14 11V6.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.2 7-2.4 0-4-1.1-5.3-3.2L4 15a1.5 1.5 0 0 1 2.4-1.8L8 15" ${P}/>`,
    in: `<rect x="3" y="3" width="18" height="18" rx="4" ${P}/><path d="M8 10.5V16M8 7.5v.01M12 16v-3.2a2.3 2.3 0 0 1 4.6 0V16M12 10.5V16" ${P}/>`,
    gh: `<path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" ${P}/>`,
    install: `<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14" ${P}/>`,
    close: `<path d="M6 6l12 12M18 6L6 18" ${P}/>`
  };
  const icon = n => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">${ICONS[n]}</svg>`;
  // Easter egg: a faint source mark appears on hover, only on pages that live in their own repo
  const repoChip = r => r === HOME_REPO ? '' : `<a class="xp-repo" href="https://github.com/sbmadhav/${r}" target="_blank" rel="noopener" title="Lives in its own repo: sbmadhav/${r}" aria-label="Source code, separate repo sbmadhav/${r}">${icon('gh')}</a>`;
  const both = (pro, kid) => pro === kid ? pro : `<span class="pro">${pro}</span><span class="kid">${kid}</span>`;

  const css = `
dialog.xpm{position:fixed;inset:0 0 0 auto;margin:0;height:100dvh;max-height:100dvh;width:min(440px,100vw);max-width:100vw;padding:0;border:0;border-left:2px solid var(--edge);background:var(--bg);color:var(--ink);overflow:auto;font-family:"Nunito Sans",system-ui,sans-serif;box-shadow:-20px 0 60px -20px rgba(0,0,0,.35)}
dialog.xpm:not([open]){display:none!important}
dialog.xpm::backdrop{background:rgba(7,6,26,.45);backdrop-filter:blur(3px)}
dialog.xpm[open]{animation:xpIn .32s cubic-bezier(.2,.9,.3,1.15)}
@keyframes xpIn{from{transform:translateX(40px);opacity:0}}
@media (max-width:600px){dialog.xpm{inset:auto 0 0 0;width:100vw;height:auto;max-height:88dvh;border-left:0;border-top:2px solid var(--edge);border-radius:24px 24px 0 0}dialog.xpm[open]{animation-name:xpUp}@keyframes xpUp{from{transform:translateY(60px);opacity:0}}}
.xp-in{padding:20px 20px 28px;background:var(--page,var(--bg));min-height:100%}
.xp-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px}
.xp-head h2{margin:0;font:600 1.6rem/1.1 var(--display,Fredoka,sans-serif)}
.xp-head p{margin:2px 0 0;color:var(--ink-muted,var(--muted));font-size:14px}
.xp-x{width:40px;height:40px;border-radius:50%;border:2px solid var(--edge);background:var(--card,var(--bg));color:var(--ink);display:grid;place-items:center;cursor:pointer;flex:none}
.xp-k{margin:22px 0 10px;font:700 12px/1 "Nunito Sans",sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted,var(--muted))}
.xp-pages{display:grid;gap:10px}
.xp-page{position:relative;display:flex;gap:14px;align-items:center;padding:14px 16px;border:2px solid var(--edge);border-radius:18px;background:var(--card,var(--bg));color:var(--ink);text-decoration:none;box-shadow:0 3px 0 var(--ledge,var(--edge));transition:transform .15s,box-shadow .15s}
.xp-page:hover{transform:translateY(-2px) rotate(-.4deg);box-shadow:0 5px 0 var(--ledge,var(--edge))}
.xp-page .xp-ic{flex:none;width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:var(--sun);color:var(--on-accent,#1C2541)}
.xp-row{position:relative}
.xp-row:nth-child(2) .xp-ic{background:var(--plum)}.xp-row:nth-child(3) .xp-ic{background:var(--teal)}.xp-row:nth-child(4) .xp-ic{background:var(--sky)}
.xp-page b{display:block;font:600 1.1rem/1.2 var(--display,Fredoka,sans-serif)}
.xp-page small{display:block;color:var(--ink-muted,var(--muted));font-size:14px;line-height:1.35;margin-top:2px}
.xp-page[aria-current="page"]::after{content:"You are here";position:absolute;top:-9px;right:14px;background:var(--sun);color:var(--on-accent,#1C2541);font:700 11px/1 "Nunito Sans",sans-serif;padding:4px 8px;border-radius:99px;border:1.5px solid var(--edge)}
.xp-repo{position:absolute;top:8px;right:10px;width:22px;height:22px;display:grid;place-items:center;border-radius:50%;color:var(--ink-muted,var(--muted));opacity:0;transition:opacity .25s}
.xp-repo svg{width:13px;height:13px}
.xp-row:hover .xp-repo,.xp-repo:focus-visible{opacity:.5}.xp-row .xp-repo:hover{opacity:1;color:var(--coral)}
@media (hover:none){.xp-repo{opacity:.18}}
.xp-secs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.xp-sec{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px;border:1px solid var(--line);border-radius:16px;background:var(--card,var(--bg));color:var(--ink);text-decoration:none;font-weight:700;font-size:13.5px;text-align:center;transition:transform .15s,border-color .15s}
.xp-sec:hover{transform:translateY(-2px);border-color:var(--edge)}
.xp-sec svg{color:var(--coral)}
.xp-links{display:flex;gap:8px;flex-wrap:wrap}
.xp-link{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border:2px solid var(--edge);border-radius:999px;background:var(--card,var(--bg));color:var(--ink);text-decoration:none;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}
.xp-link svg{width:18px;height:18px}
dialog.xpm [hidden]{display:none!important}
.xp-help{margin:12px 0 0;padding:12px 14px;border:1.5px dashed var(--edge);border-radius:var(--radius-md,16px);background:var(--card,var(--bg));color:var(--ink);font-size:14px;line-height:1.45}
.xp-foot{margin-top:22px;color:var(--ink-muted,var(--muted));font-size:13px}
dialog.xpm :focus-visible{outline:3px solid var(--sky);outline-offset:3px}
@media (prefers-reduced-motion:reduce){dialog.xpm[open]{animation:none}.xp-page,.xp-sec,.xp-btn{transition:none}}`;

  function build() {
    const here = location.pathname.replace(/index\.html$/, '');
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const d = document.createElement('dialog');
    d.className = 'xpm'; d.setAttribute('aria-labelledby', 'xpTitle');
    d.innerHTML = `<div class="xp-in">
      <div class="xp-head"><div><h2 id="xpTitle">${both('Explore', 'Star map')}</h2><p>${both('Every page and corner of this site.', 'Pick a place to fly to!')}</p></div>
        <button class="xp-x" aria-label="Close menu">${icon('close')}</button></div>
      <div class="xp-k">${both('Pages', 'Planets')}</div>
      <nav class="xp-pages" aria-label="Pages">${PAGES.map(p => `<div class="xp-row"><a class="xp-page" href="${p.href}"${p.href === here ? ' aria-current="page"' : ''}><span class="xp-ic">${icon(p.icon)}</span><span><b>${both(p.pro[0], p.kid[0])}</b><small>${both(p.pro[1], p.kid[1])}</small></span></a>${repoChip(p.repo)}</div>`).join('')}</nav>
      <div class="xp-k">${both('On the home page', 'Fun stops')}</div>
      <nav class="xp-secs" aria-label="Home page sections">${SECTIONS.map(s => `<a class="xp-sec" href="${here === '/' ? s.href.slice(1) : s.href}">${icon(s.icon)}${both(s.pro, s.kid)}</a>`).join('')}</nav>
      <div class="xp-k">${both('Elsewhere', 'Say hi')}</div>
      <div class="xp-links">${LINKS.map(l => `<a class="xp-link" href="${l.href}" target="_blank" rel="noopener">${icon(l.icon)}${l.label}</a>`).join('')}<button class="xp-link" id="xpInstall" aria-expanded="false" aria-controls="xpInstallHelp"${installed() ? ' hidden' : ''}>${icon('install')}${both('Install app', 'Add to my screen')}</button></div>
      <p class="xp-help" id="xpInstallHelp" role="status" hidden></p>
      <p class="xp-foot">${both('Works offline once you have visited.', 'Bolt saves the site so it works even without internet!')}</p>
    </div>`;
    document.body.appendChild(d);
    const close = () => d.close();
    d.querySelector('.xp-x').addEventListener('click', close);
    d.addEventListener('click', e => {
      if (e.target === d) return close();
      const any = e.target.closest('a[href]');
      if (any && window.siteTrack) window.siteTrack('explore/go' + new URL(any.href, location.href).pathname.replace(/\/$/, '') + new URL(any.href, location.href).hash, 'Explore menu link');
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      // Same-page section: close first, then scroll, so the closing dialog does not swallow the jump
      e.preventDefault(); close();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) requestAnimationFrame(() => { target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); history.replaceState(null, '', a.getAttribute('href')); });
    });
    // Install: the browser's own prompt when it offers one, otherwise the steps for this browser
    const inst = d.querySelector('#xpInstall'), help = d.querySelector('#xpInstallHelp');
    const showHelp = open => { help.innerHTML = open ? installSteps() : ''; help.hidden = !open; inst.setAttribute('aria-expanded', String(open)); };
    inst.addEventListener('click', async () => {
      if (deferred) {
        const e = deferred; deferred = null; showHelp(false);
        if (window.siteTrack) window.siteTrack('explore/install-prompt', 'Install app: browser prompt');
        try { await e.prompt(); const choice = await e.userChoice; if (choice && choice.outcome === 'accepted') return syncInstall(true); } catch (err) { showHelp(true); }
        return;
      }
      if (window.siteTrack && help.hidden) window.siteTrack('explore/install-help', 'Install app: steps shown');
      showHelp(help.hidden);
    });
    return d;
  }

  /* Install. Listen from the start (this script runs before load) so an early beforeinstallprompt is not
     missed. Browsers without that event (Safari, Firefox, or Chrome once installed or dismissed) get
     short steps instead. The button hides when the site already runs as an installed app. */
  let deferred = null;
  const installed = () => ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'].some(m => matchMedia(`(display-mode: ${m})`).matches) || navigator.standalone === true;
  function syncInstall(done) {
    const inst = dlg && dlg.querySelector('#xpInstall'), help = dlg && dlg.querySelector('#xpInstallHelp');
    if (!inst) return;
    inst.hidden = done || installed();
    if (inst.hidden) { help.hidden = true; inst.setAttribute('aria-expanded', 'false'); }
  }
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; syncInstall(); });
  addEventListener('appinstalled', () => { deferred = null; syncInstall(true); });
  function installSteps() {
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const android = /Android/.test(ua);
    const firefox = /Firefox\/|FxiOS/.test(ua);
    const safari = /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|SamsungBrowser|Android/.test(ua);
    if (ios) return both('Tap the Share button, then <b>Add to Home Screen</b>.', 'Tap Share (the square with an arrow), then <b>Add to Home Screen</b>.');
    if (firefox && android) return both('Open the Firefox menu, then <b>Add to Home screen</b>.', 'Tap the Firefox menu, then <b>Add to Home screen</b>.');
    if (firefox) return both('Firefox on computers cannot install sites as apps. Open this page in Chrome, Edge or Safari to install it.', 'Firefox cannot do this one. Ask a grown-up to open this page in Chrome, Edge or Safari.');
    if (safari) return both('In Safari, choose <b>File</b>, then <b>Add to Dock</b>.', 'In Safari, click <b>File</b>, then <b>Add to Dock</b>.');
    return both('Open the browser menu (the three dots), then choose <b>Install</b> or <b>Add to Home screen</b>. If it is not there, the app may already be installed.', 'Open the browser menu (the three dots), then pick <b>Install</b> or <b>Add to Home screen</b>.');
  }

  let dlg = null;
  const btn = document.getElementById('exploreBtn');
  if (!btn) return;
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.addEventListener('click', () => {
    if (window.siteTrack) window.siteTrack('explore/open', 'Explore menu opened');
    dlg = dlg || build();
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  });
  // Build early (it is small) so the install prompt event is not missed
  const idle = window.requestIdleCallback || (f => setTimeout(f, 800));
  addEventListener('load', () => idle(() => { dlg = dlg || build(); }), { once: true });
})();
