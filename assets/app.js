(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const store = {
    get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
    set(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const track = (name, title) => { try { window.siteTrack && window.siteTrack(name, title); } catch (e) {} };
  let musicOn = false;
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- Kid mode ---------- */
  const toggle = $('#modeToggle');
  const isKid = () => document.body.classList.contains('kidmode');
  function setMode(kid, announce){
    document.body.classList.toggle('kidmode', kid);
    toggle.setAttribute('aria-checked', String(kid));
    store.set('kidmode', kid ? '1' : '0');
    renderChips(); resetLab(); renderLevel(current);
    if (typeof refreshMusic === 'function' && musicBtn) refreshMusic();
    if (announce) say(kid ? "Kid mode ON! Everything is explained in kid words now." : "Grown-up mode. Same robot, fancier words.");
  }
  toggle.addEventListener('click', () => { setMode(!isKid(), true); track(isKid() ? 'kid-mode/on' : 'kid-mode/off', 'Kid mode toggled'); if (isKid()) burst(40); });

  /* ---------- Bolt the robot ---------- */
  const bubble = $('#bubble');
  let bubbleTimer;
  const portraitEl = document.querySelector('.portrait');
  if (store.get('boltChatted') === '1') portraitEl.classList.add('chatted');
  function say(text){
    bubble.textContent = text; bubble.classList.add('show'); portraitEl.classList.add('talking');
    clearTimeout(bubbleTimer); bubbleTimer = setTimeout(() => { bubble.classList.remove('show'); portraitEl.classList.remove('talking'); }, 4200);
  }
  const lines = {
    pro: ["Hi, I'm Bolt. I route requests so the big model doesn't have to.",
          "Fun fact: the cheapest token is the one you never generate.",
          "Madhav's rule: guardrails are a feature, not a tax.",
          "Try the Brain Lab below. I'm the fast part.",
          "Flip the switch up top. I speak kid too."],
    kid: ["Beep boop! I'm Bolt. Madhav built me to help!",
          "Did you know? Computers only understand 1s and 0s. That's it!",
          "My antenna lights up when I'm thinking really hard.",
          "Can you beat Madhav's score in Bug Hunt?",
          "Robots should always be kind and tell the truth. That's the rule!"]
  };
  let li = 0;
  $('#bot').addEventListener('click', () => {
    track('bolt/chat', 'Chatted with Bolt');
    portraitEl.classList.add('chatted'); store.set('boltChatted', '1');
    const set = isKid() ? lines.kid : lines.pro;
    say(set[li++ % set.length]);
    const m = $('#mouth'); m.setAttribute('d','M68 90 q12 14 24 0');
    $('#antenna').setAttribute('fill','#FFC53D');
    setTimeout(() => { m.setAttribute('d','M68 92 q12 9 24 0'); $('#antenna').setAttribute('fill','#FF6B5B'); }, 600);
  });
  // eyes follow pointer
  const pupils = [...document.querySelectorAll('.pupil')];
  const botEl = $('#bot');
  window.addEventListener('pointermove', e => {
    const r = botEl.getBoundingClientRect();
    if (!r.width) return;
    const scale = r.width / 160;
    pupils.forEach(p => {
      const bx = +p.getAttribute('cx') === 62 ? 62 : 98;
      const ex = r.left + bx * scale, ey = r.top + 72 * scale;
      const a = Math.atan2(e.clientY - ey, e.clientX - ex);
      const d = Math.min(5, Math.hypot(e.clientX - ex, e.clientY - ey) / 30);
      p.setAttribute('transform', `translate(${Math.cos(a)*d} ${Math.sin(a)*d})`);
    });
  }, { passive:true });
  setTimeout(() => say(isKid() ? "Hi friend! Tap me!" : "Hi there. Click me, I have opinions."), 1200);

  /* ---------- Say my name ---------- */
  $('#sayName').addEventListener('click', () => {
    track('say-name', 'Played name pronunciation');
    say("It's MAA-dhuv.");
    try {
      const u = new SpeechSynthesisUtterance('Maadhav');
      u.rate = .8; u.lang = 'en-IN';
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch(e){}
  });

  /* ---------- Brain Lab ---------- */
  const LAB = {
    pro: {
      lanes: [{id:'billing',label:'Billing agent'},{id:'complaint',label:'Care agent'},{id:'account',label:'Account agent'}],
      qs: [
        {q:"I was charged twice for my order", route:'billing', tools:['payments.lookup','refunds.create'], a:"Sorry about that. I found the duplicate charge from yesterday and started a refund. You'll see it back on your card in 3 to 5 business days."},
        {q:"What's my current balance?", route:'account', tools:['accounts.read'], a:"Your available balance is shown in the app under Accounts. I can also text it to the number on file if that's easier."},
        {q:"I want to file a complaint", route:'complaint', tools:['cases.create','sentiment'], a:"I'm sorry it came to this. I've opened a case and flagged it for a specialist who will follow up within one business day. Want to tell me what happened?"},
        {q:"Why was my card declined?", route:'billing', tools:['auth.decisions','fraud.signals'], a:"It looks like a security check paused that purchase. If it was you, confirm in the app and you can retry right away."}
      ],
      rules: [[/charg|refund|pay|bill|declin|fee|card/i,'billing'],[/complain|angry|upset|unhappy|bad|terrible/i,'complaint']],
      fallback: {route:'account', tools:['accounts.read'], a:"Happy to help with that. Let me pull up your account details first so I get it right."}
    },
    kid: {
      lanes: [{id:'joke',label:'Joke helper'},{id:'math',label:'Math helper'},{id:'science',label:'Science helper'}],
      qs: [
        {q:"Tell me a joke!", route:'joke', tools:['joke-book'], a:"Why did the robot go on vacation? To recharge its batteries!"},
        {q:"What is 8 + 5?", route:'math', tools:['calculator'], a:"8 + 5 = 13. Count 5 more after 8: nine, ten, eleven, twelve, thirteen!"},
        {q:"Why is the sky blue?", route:'science', tools:['science-book'], a:"Sunlight has every color in it. Air bounces blue light around the most, so blue fills the whole sky!"},
        {q:"How do robots think?", route:'science', tools:['robot-facts'], a:"Robots follow instructions called code. A speedy part decides what to do, and a careful part does the talking, just like me!"}
      ],
      rules: [[/joke|funny|laugh|silly/i,'joke'],[/\d|plus|minus|math|count|times|add/i,'math']],
      fallback: {route:'science', tools:['science-book'], a:"Ooh, great question! I'd look that up in my science book. Keep asking questions, that's how scientists start!"}
    }
  };
  const cfg = () => LAB[isKid() ? 'kid' : 'pro'];
  let runId = 0;
  function renderChips(){
    const c = $('#chips'); c.innerHTML = '';
    cfg().qs.forEach((item, i) => {
      const b = document.createElement('button');
      b.className = 'chip'; b.textContent = item.q; b.setAttribute('aria-pressed','false');
      b.addEventListener('click', () => {
        c.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed','false'));
        b.setAttribute('aria-pressed','true'); run(item);
      });
      c.appendChild(b);
    });
    const lanes = $('#lanes'); lanes.innerHTML = '';
    cfg().lanes.forEach(l => { const d = document.createElement('div'); d.className='lane'; d.dataset.id=l.id; d.textContent=l.label; lanes.appendChild(d); });
  }
  function resetLab(){
    runId++;
    $('#thought').textContent = isKid() ? 'waiting for a question...' : 'idle: awaiting input';
    $('#answer').textContent = '...'; $('#answer').classList.remove('caret');
    $('#st1').classList.remove('on'); $('#st2').classList.remove('on');
  }
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  async function typeInto(el, text, id, speed=22){
    el.textContent = ''; el.classList.add('caret');
    if (reduce) { el.textContent = text; el.classList.remove('caret'); return; }
    for (const ch of text){ if (id !== runId) return; el.textContent += ch; await wait(speed); }
    el.classList.remove('caret');
  }
  async function run(item){
    const id = ++runId;
    track('brain-lab/ask', 'Brain Lab question');
    const lanes = [...document.querySelectorAll('.lane')];
    lanes.forEach(l => l.classList.remove('pick'));
    $('#st2').classList.remove('on'); $('#answer').textContent = '...';
    $('#st1').classList.add('on');
    const th = $('#thought');
    await typeInto(th, isKid() ? 'hmm... thinking quietly...' : 'classifying intent...', id, 28);
    await wait(350); if (id !== runId) return;
    lanes.forEach(l => l.classList.toggle('pick', l.dataset.id === item.route));
    const conf = (0.86 + Math.random()*0.12).toFixed(2);
    await typeInto(th, `{ route: "${item.route}", tools: [${item.tools.map(t=>`"${t}"`).join(', ')}], confidence: ${conf} }`, id, 12);
    await wait(400); if (id !== runId) return;
    $('#st1').classList.remove('on'); $('#st2').classList.add('on');
    await typeInto($('#answer'), item.a, id, 18);
  }
  $('#askForm').addEventListener('submit', e => {
    e.preventDefault();
    const q = $('#askInput').value.trim(); if (!q) return;
    const c = cfg();
    let route = null;
    for (const [re, r] of c.rules) if (re.test(q)) { route = r; break; }
    const hit = route && c.qs.find(x => x.route === route);
    const item = hit ? {...hit} : {...c.fallback};
    if (route && isKid() && route === 'math'){
      const m = q.match(/(\d+)\s*([+\-x*])\s*(\d+)/);
      if (m){ const a=+m[1], b=+m[3]; const v = m[2]==='+'?a+b:m[2]==='-'?a-b:a*b; item.a = `${a} ${m[2]} ${b} = ${v}. You're a math whiz!`; }
    }
    document.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed','false'));
    run(item); $('#askInput').value='';
  });

  /* ---------- Bug Hunt ---------- */
  const arena = $('#arena'), overlay = $('#overlay');
  let score = 0, playing = false, spawnT, tickT, endAt;
  let best = +(store.get('bugBest') || 0); $('#best').textContent = best;
  function spawn(){
    if (!playing) return;
    const live = arena.querySelectorAll('.bug:not(.squash)').length;
    if (live < 5){
      const b = document.createElement('button');
      b.className = 'bug'; b.setAttribute('aria-label','Squash bug');
      b.innerHTML = '<svg aria-hidden="true"><use href="#i-bug"/></svg>';
      const W = arena.clientWidth - 56, H = arena.clientHeight - 56;
      const place = () => { b.style.left = Math.random()*W + 'px'; b.style.top = Math.random()*H + 'px'; b.style.transform = `rotate(${Math.random()*360}deg)`; };
      place(); arena.appendChild(b);
      const mv = setInterval(() => b.isConnected ? place() : clearInterval(mv), 1300 - Math.min(700, score*30));
      const ttl = setTimeout(() => { clearInterval(mv); b.remove(); }, 4200);
      b.addEventListener('pointerdown', e => {
        if (!playing || b.classList.contains('squash')) return;
        e.preventDefault(); clearInterval(mv); clearTimeout(ttl);
        b.classList.add('squash'); score++; $('#score').textContent = score; sfx('squash');
        const p = document.createElement('span'); p.className='pop'; p.textContent = isKid() ? 'Squish! +1' : 'fixed +1';
        p.style.left = b.style.left; p.style.top = b.style.top; arena.appendChild(p);
        setTimeout(() => { b.remove(); p.remove(); }, 800);
      });
      b.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' '){ b.dispatchEvent(new PointerEvent('pointerdown')); }});
    }
    spawnT = setTimeout(spawn, Math.max(350, 900 - score*25));
  }
  function start(){
    score = 0; $('#score').textContent = 0; playing = true; sfx('start'); gameMusic(true);
    track('bug-hunt/start', 'Bug Hunt started');
    overlay.style.display = 'none';
    arena.querySelectorAll('.bug,.pop').forEach(n => n.remove());
    endAt = performance.now() + 20000;
    const bar = $('#timerBar');
    const tick = () => {
      const left = Math.max(0, endAt - performance.now());
      $('#time').textContent = Math.ceil(left/1000) + 's';
      bar.style.transform = `scaleX(${left/20000})`;
      if (left <= 0) return end();
      tickT = requestAnimationFrame(tick);
    };
    tick(); spawn();
  }
  function end(){
    playing = false; clearTimeout(spawnT); cancelAnimationFrame(tickT); gameMusic(false); sfx('end');
    arena.querySelectorAll('.bug').forEach(n => n.remove());
    const newBest = score > best;
    track('bug-hunt/finish-' + (score >= 25 ? '25+' : score >= 15 ? '15-24' : score >= 6 ? '6-14' : '0-5'), 'Bug Hunt finished');
    if (newBest){ best = score; store.set('bugBest', best); $('#best').textContent = best; }
    const kid = isKid();
    let msg;
    if (score >= 25) msg = kid ? "WOW! You're a super bug hunter!" : "Zero-defect release. Principal engineer energy.";
    else if (score >= 15) msg = kid ? "Amazing job! Those bugs didn't stand a chance." : "Clean build. Ship it.";
    else if (score >= 6) msg = kid ? "Nice squishing! Want to try again?" : "Solid. A few made it to prod, as they do.";
    else msg = kid ? "Bugs are sneaky! Try again, you've got this." : "The bugs won this sprint. Retro time.";
    $('#ovTitle').textContent = `${score} bug${score===1?'':'s'} fixed${newBest ? ' (new best!)' : ''}`;
    $('#ovText').textContent = msg;
    $('#startBtn').textContent = 'Play again';
    overlay.style.display = '';
    if (newBest && score > 0) burst(70);
  }
  $('#startBtn').addEventListener('click', start);

  /* ---------- Journey ---------- */
  const LEVELS = [
    { icon:'i-case', lv:'Level 1', name:{pro:'Consulting',kid:'Problem Solvers'},
      role:{pro:'Cognizant & Publicis Sapient · 2009 to 2021 · Chennai, Bengaluru, Chicago, Charlotte',kid:'Solved computer puzzles for lots of companies'},
      pro:['Cognizant (2009 to 2014): Java trainee to Associate, Projects; built the very first Comerica Portal for a banking client','Publicis Sapient (2014 to 2021): Senior Engineer to Architect, Experience Technology; frontend architecture, micro frontends, and performance on React and Node.js','Conference speaker and mentor; R&D with WebVR, Leap Motion, Raspberry Pi, and Google Cardboard'],
      kid:['Learned to code in a big class with 30 friends','Built my first real app, for a bank!','Played with virtual reality goggles and tiny Raspberry Pi computers'] },
    { icon:'i-tools', lv:'Level 2', name:{pro:"Lowe's",kid:'Hardware Store'},
      role:{pro:'Lead Software Engineer · 2019 to 2022 · Charlotte',kid:'Helped people find hammers, nails, and paint'},
      pro:['Led modernization of Lowes.com search and product listing platforms','Migrated large consumer apps from on-premise to Google Cloud','Scaled the team from 3 to 21 developers while keeping quality high'],
      kid:['Made the search box on a giant hardware store website work better','Moved the website from old computers to the cloud','Grew my team from 3 people to 21!'] },
    { icon:'i-sneaker', lv:'Level 3', name:{pro:'Nike',kid:'Sneaker World'},
      role:{pro:'Global Director of Engineering · 2022 to 2023',kid:'Leader of sneaker teams around the world'},
      pro:['Led global teams building experimentation and personalization platforms for launches and high-traffic events','Directed 10+ scrum teams on capabilities projected at $70M+ in incremental annual revenue','Built ML-based marketing automation with GDPR and regional privacy compliance'],
      kid:['Helped the website show each person the sneakers they might love','Led more than 10 teams in different countries','Made sure everyone\'s information stayed private'] },
    { icon:'i-heart', lv:'Level 4', name:{pro:'Ascension',kid:'Hospital Kingdom'},
      role:{pro:'Senior Director of Engineering · 2023 to 2026',kid:'Builder of a talking helper named GRACE'},
      pro:['Built GRACE, a 0-to-1 HIPAA-compliant agentic AI voice agent for appointment scheduling with safe escalation and human handoffs','Scaled the agentic AI squad from 2 staff engineers to 25 across voice and chat pods','Set up AI safety: golden datasets, rubrics, red-teaming, and production tracing; patient NPS up 25%'],
      kid:['Built GRACE, a robot voice that helps people book doctor visits','Grew the robot team from 2 people to 25','Taught the robot to ask a real person for help when it isn\'t sure'] },
    { icon:'i-bank', lv:'Level 5', name:{pro:'Capital One',kid:'Bank Castle'},
      role:{pro:'Director of Software Engineering, Risk Tech · April 2026 to now · New York',kid:'Current level!'},
      pro:['Leading Risk Tech engineering','Bringing agentic AI into engineering with governance built in','Also an Expert advisor to Primary Venture Partners founders (2024 to 2026)'],
      kid:['Builds computer helpers that keep a giant bank safe','Makes sure the helpers follow the rules','Still squashing bugs every day'], current:true },
    { icon:'i-q', lv:'Level 6', name:{pro:"What's next",kid:'Secret level'},
      role:{pro:'Loading...',kid:'Not unlocked yet!'},
      pro:['Voice agents that think before they talk','Privately trained models for regulated industries','Answering the question: if machines write the code, what are we all doing on this Zoom call?'],
      kid:['Smarter talking robots','Robots that help even more people','Maybe you can help build them someday!'] }
  ];
  let current = 4;
  const levelsEl = $('#levels');
  LEVELS.forEach((L, i) => {
    const b = document.createElement('button');
    b.className = 'level'; b.setAttribute('role','tab'); b.dataset.i = i;
    b.innerHTML = `<span class="node"><svg aria-hidden="true"><use href="#${L.icon}"/></svg>${L.current ? '<svg class="star" aria-hidden="true"><use href="#i-star"/></svg>' : ''}</span>
      <span><span class="lv">${L.lv}</span><br><span class="nm"></span></span>`;
    b.addEventListener('click', () => { current = i; renderLevel(i); });
    levelsEl.appendChild(b);
  });
  function renderLevel(i){
    const L = LEVELS[i], k = isKid() ? 'kid' : 'pro';
    levelsEl.querySelectorAll('.level').forEach((b, j) => {
      b.setAttribute('aria-selected', String(j === i));
      b.querySelector('.nm').textContent = LEVELS[j].name[k];
    });
    const xp = Math.round(((i+1) / LEVELS.length) * 100);
    $('#detail').innerHTML = `<div class="badge"><svg aria-hidden="true"><use href="#${L.icon}"/></svg></div>
      <div><span class="lv mono" style="color:var(--muted)">${L.lv}</span>
      <h3>${L.name[k]}</h3><div class="role">${L.role[k]}</div>
      <ul>${L[k].map(x => `<li>${x}</li>`).join('')}</ul>
      <div class="xp">XP <span class="bar"><i style="width:${xp}%"></i></span> ${xp}%</div></div>`;
  }

  /* ---------- Confetti + easter egg ---------- */
  function burst(n){
    if (reduce) return;
    const colors = ['#FF6B5B','#1FA39A','#FFC53D','#5B8DEF','#A88EEA'];
    for (let i=0;i<n;i++){
      const c = document.createElement('i'); c.className='confetti';
      c.style.left = Math.random()*100+'vw'; c.style.background = colors[i%colors.length];
      c.style.animationDuration = (1.8+Math.random()*1.8)+'s'; c.style.animationDelay = (Math.random()*.4)+'s';
      c.style.borderRadius = Math.random() > .5 ? '50%' : '2px';
      document.body.appendChild(c); setTimeout(() => c.remove(), 4200);
    }
  }
  let clicks = 0, clickT;
  $('#logo').addEventListener('click', () => {
    clearTimeout(clickT); clickT = setTimeout(() => clicks = 0, 1200);
    if (++clicks >= 5){ clicks = 0; burst(120); say(isKid() ? "You found the secret party button!" : "Easter egg unlocked. Ship the confetti."); }
    else window.scrollTo({ top:0, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold:.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));


  /* ---------- Space backdrop ---------- */
  const space = $('#space'), cv = $('#stars'), cx = cv.getContext('2d');
  let stars = [], W = 0, H = 0, dpr = 1;
  const darkQ = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => document.documentElement.dataset.theme === 'dark' || (document.documentElement.dataset.theme !== 'light' && darkQ.matches);
  function sizeStars(){
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W*dpr; cv.height = H*dpr; cx.setTransform(dpr,0,0,dpr,0,0);
    const n = Math.round(W*H/6500);
    stars = Array.from({length:n}, () => ({x:Math.random()*W, y:Math.random()*H*1.6, r:Math.random()*1.5+.4, p:Math.random()*6.28, s:.4+Math.random()*1.2, z:.15+Math.random()*.5, c:Math.random()<.15}));
  }
  const PAL = ['#FF6B5B','#1FA39A','#FFC53D','#5B8DEF','#A88EEA'];
  const PAL_D = ['#FF8F87','#45D9C3','#D6F075','#73BCFF','#B6A4F7'];
  function drawStars(t){
    cx.clearRect(0,0,W,H);
    const dark = isDark(), sy = scrollY;
    const boost = musicOn ? 1.8 : 1;
    for (const st of stars){
      const y = ((st.y - sy*st.z) % (H*1.6) + H*1.6) % (H*1.6) - H*.3;
      if (y < -4 || y > H+4) continue;
      const tw = .55 + .45*Math.sin(st.p + t/1000*st.s*boost);
      cx.globalAlpha = (dark ? 1 : .3) * tw;
      cx.fillStyle = (st.c || (dark && st.r > 1.4)) ? (dark ? PAL_D : PAL)[(st.r*10|0)%5] : (dark ? '#EEEAFF' : '#1C2541');
      cx.beginPath();
      if (st.r > 1.6){ // little sparkle
        const r = st.r*1.6;
        cx.moveTo(st.x, y-r); cx.lineTo(st.x+r*.3, y-r*.3); cx.lineTo(st.x+r, y); cx.lineTo(st.x+r*.3, y+r*.3);
        cx.lineTo(st.x, y+r); cx.lineTo(st.x-r*.3, y+r*.3); cx.lineTo(st.x-r, y); cx.lineTo(st.x-r*.3, y-r*.3);
      } else cx.arc(st.x, y, st.r, 0, 6.29);
      cx.fill();
    }
    cx.globalAlpha = 1;
  }
  const SVGS = {
    planet:'<svg viewBox="0 0 120 80"><ellipse cx="60" cy="44" rx="56" ry="14" fill="none" stroke="#8E6BD8" stroke-width="6" opacity=".5"/><circle cx="60" cy="40" r="26" fill="#FF6B5B" stroke="#1C2541" stroke-width="3"/><path d="M38 34c10 4 30 4 44-2M36 46c14 4 32 4 48-2" stroke="#1C2541" stroke-width="2.5" fill="none" opacity=".35"/><path d="M6 46c10 8 98 8 108 0" fill="none" stroke="#8E6BD8" stroke-width="6" stroke-linecap="round"/></svg>',
    rocket:'<svg viewBox="0 0 80 120"><path d="M40 6c16 14 22 36 18 62H22C18 42 24 20 40 6z" fill="#F3F0E8" stroke="#1C2541" stroke-width="3"/><circle cx="40" cy="40" r="9" fill="#5B8DEF" stroke="#1C2541" stroke-width="3"/><path d="M22 58l-12 18 14-2M58 58l12 18-14-2" fill="#FF6B5B" stroke="#1C2541" stroke-width="3" stroke-linejoin="round"/><path d="M30 70c2 16 8 26 10 34 2-8 8-18 10-34z" fill="#FFC53D" stroke="#1C2541" stroke-width="2.5"/></svg>',
    astro:'<svg viewBox="0 0 100 110"><rect x="26" y="52" width="48" height="42" rx="16" fill="#F3F0E8" stroke="#1C2541" stroke-width="3"/><rect x="10" y="58" width="18" height="12" rx="6" fill="#F3F0E8" stroke="#1C2541" stroke-width="3" transform="rotate(-30 19 64)"/><rect x="72" y="58" width="18" height="12" rx="6" fill="#F3F0E8" stroke="#1C2541" stroke-width="3" transform="rotate(30 81 64)"/><circle cx="50" cy="36" r="26" fill="#F3F0E8" stroke="#1C2541" stroke-width="3"/><rect x="32" y="24" width="36" height="24" rx="12" fill="#1FA39A" stroke="#1C2541" stroke-width="3"/><circle cx="43" cy="36" r="3.5" fill="#fff"/><circle cx="57" cy="36" r="3.5" fill="#fff"/><rect x="40" y="66" width="20" height="12" rx="3" fill="#FFC53D" stroke="#1C2541" stroke-width="2"/></svg>',
    sat:'<svg viewBox="0 0 140 70"><rect x="4" y="22" width="40" height="26" rx="3" fill="#5B8DEF" stroke="#1C2541" stroke-width="3"/><path d="M17 22v26M30 22v26M4 35h40" stroke="#1C2541" stroke-width="1.8"/><rect x="96" y="22" width="40" height="26" rx="3" fill="#5B8DEF" stroke="#1C2541" stroke-width="3"/><path d="M109 22v26M122 22v26M96 35h40" stroke="#1C2541" stroke-width="1.8"/><path d="M44 35h10M86 35h10" stroke="#1C2541" stroke-width="3"/><rect x="54" y="20" width="32" height="30" rx="8" fill="#FFC53D" stroke="#1C2541" stroke-width="3"/><path d="M70 20V8" stroke="#1C2541" stroke-width="3"/><circle cx="70" cy="7" r="4" fill="#FF6B5B" stroke="#1C2541" stroke-width="2"/></svg>',
    moon:'<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="32" fill="#E8E1D2" stroke="#1C2541" stroke-width="3"/><circle cx="28" cy="30" r="7" fill="#CFC5B2"/><circle cx="50" cy="50" r="9" fill="#CFC5B2"/><circle cx="52" cy="24" r="4" fill="#CFC5B2"/></svg>',
    ufo:'<svg viewBox="0 0 120 70"><path d="M40 30a20 18 0 0 1 40 0" fill="#9FE3DA" stroke="#1C2541" stroke-width="3"/><ellipse cx="60" cy="36" rx="52" ry="14" fill="#8E6BD8" stroke="#1C2541" stroke-width="3"/><circle cx="30" cy="38" r="4" fill="#FFC53D"/><circle cx="60" cy="42" r="4" fill="#FFC53D"/><circle cx="90" cy="38" r="4" fill="#FFC53D"/></svg>',
    rock:'<svg viewBox="0 0 80 70"><path d="M14 30l12-18 26-4 18 16 2 24-18 16-28-2L8 46z" fill="#B8A98F" stroke="#1C2541" stroke-width="3" stroke-linejoin="round"/><circle cx="34" cy="30" r="6" fill="#9C8C72"/><circle cx="52" cy="46" r="4" fill="#9C8C72"/></svg>',
    ring:'<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="24" fill="#1FA39A" stroke="#1C2541" stroke-width="3"/><path d="M24 30c10-6 26-6 34 6" stroke="#fff" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/></svg>'
  };
  const SPEC = [
    {k:'planet', w:150, y:.14, d:95,  dir:1},
    {k:'astro',  w:90,  y:.62, d:80,  dir:-1},
    {k:'rocket', w:56,  y:.38, d:46,  dir:1, rocket:true},
    {k:'sat',    w:130, y:.82, d:110, dir:-1},
    {k:'moon',   w:70,  y:.28, d:130, dir:-1},
    {k:'ufo',    w:100, y:.52, d:70,  dir:1},
    {k:'rock',   w:50,  y:.72, d:60,  dir:1},
    {k:'ring',   w:46,  y:.9,  d:120, dir:-1}
  ];
  const narrow = () => innerWidth < 700;
  const floaters = SPEC.map((f, i) => {
    const el = document.createElement('div'); el.className = 'floater'; el.innerHTML = SVGS[f.k];
    space.appendChild(el);
    return {...f, el, off: Math.random(), bob: Math.random()*6.28, spin: (Math.random()-.5)*30};
  });
  function sizeFloaters(){ floaters.forEach(f => { f.el.style.width = (narrow() ? f.w*.6 : f.w) + 'px'; f.el.style.display = (narrow() && f.w > 120 && f.k==='sat') ? 'none' : ''; }); }
  function drawFloaters(t){
    const s = t/1000;
    for (const f of floaters){
      const span = W + f.w*2;
      let prog = (f.off + s / f.d * (musicOn ? 1.4 : 1)) % 1;
      if (f.dir < 0) prog = 1 - prog;
      const x = prog*span - f.w;
      const y = f.y*H + Math.sin(s*.6 + f.bob)*18 - scrollY*.04*(f.w/100) % H;
      const rot = f.rocket ? (f.dir > 0 ? 70 : -70) + Math.sin(s+f.bob)*6 : f.spin*Math.sin(s*.2 + f.bob);
      f.el.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rot}deg)`;
    }
  }
  function shoot(){
    if (document.hidden) return;
    const el = document.createElement('div'); el.className = 'shoot';
    el.style.left = (30 + Math.random()*70) + 'vw'; el.style.top = (Math.random()*50) + 'vh';
    space.appendChild(el); setTimeout(() => el.remove(), 1500);
  }
  // The backdrop is decoration: start it only after the page is ready and the browser is idle
  function startBackdrop(){
    sizeStars(); sizeFloaters();
    addEventListener('resize', () => { sizeStars(); sizeFloaters(); });
    if (reduce){
      drawStars(0); drawFloaters(20000);
      addEventListener('scroll', () => drawStars(0), {passive:true});
    } else {
      const loop = t => { drawStars(t); drawFloaters(t); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
      setInterval(() => { if (Math.random() < (musicOn ? .7 : .35)) shoot(); }, 4000);
    }
    space.classList.add('on');
  }
  const whenIdle = fn => ('requestIdleCallback' in window) ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 600);
  const afterLoad = fn => document.readyState === 'complete' ? whenIdle(fn) : addEventListener('load', () => whenIdle(fn), { once: true });
  afterLoad(startBackdrop);

  /* ---------- Music engine (all generated live with Web Audio, no audio files) ---------- */
  const musicBtn = $('#musicBtn'), nextBtn = $('#nextTrack'), trackLbl = $('#trackName');
  const TRACKS = [
    { id:'nebula', name:'Nebula Drift', kid:'Sleepy Stars' },
    { id:'rocket', name:'Rocket Pop',   kid:'Rocket Pop' },
    { id:'moon',   name:'Moon Bounce',  kid:'Moon Bounce' }
  ];
  let actx, master, rev, noiseBuf, curTrack = null, spaceWanted = false, gameActive = false;
  let trackIdx = (+(store.get('track') || 0)) % TRACKS.length;
  let gamePref = store.get('gameMusic') !== '0';
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  function ensureAudio(){
    if (actx) return;
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain(); master.gain.value = .9; master.connect(actx.destination);
    const len = actx.sampleRate * 4, buf = actx.createBuffer(2, len, actx.sampleRate);
    for (let c = 0; c < 2; c++){ const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 2.6); }
    rev = actx.createConvolver(); rev.buffer = buf;
    const wet = actx.createGain(); wet.gain.value = .5; rev.connect(wet).connect(master);
    noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
    const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random()*2-1;
  }

  /* instruments */
  function tone(dest, f, t, d, o = {}){
    const osc = actx.createOscillator(), g = actx.createGain(), v = o.vol ?? .08;
    osc.type = o.type || 'triangle';
    osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + d);
    if (o.detune) osc.detune.value = o.detune;
    if (o.pluck){ g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); }
    else {
      const a = o.a ?? .01, r = o.r ?? .08;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a);
      g.gain.setValueAtTime(v, t + Math.max(a, d)); g.gain.linearRampToValueAtTime(0, t + d + r);
    }
    let node = osc.connect(g);
    if (o.lp){ const fl = actx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; node = node.connect(fl); }
    node.connect(dest); osc.start(t); osc.stop(t + d + (o.r ?? .08) + .05);
  }
  function noise(dest, t, d, o = {}){
    const src = actx.createBufferSource(), fl = actx.createBiquadFilter(), g = actx.createGain();
    src.buffer = noiseBuf; fl.type = o.ft || 'highpass'; fl.frequency.value = o.f || 6000;
    g.gain.setValueAtTime(o.vol || .05, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    src.connect(fl).connect(g).connect(dest); src.start(t, Math.random()*.5); src.stop(t + d + .02);
  }
  const kick  = (dst, t, v = .55) => tone(dst, 150, t, .22, { type:'sine', slide:42, vol:v, pluck:true });
  const snare = (dst, t, v = .14) => { noise(dst, t, .14, { f:1800, vol:v }); tone(dst, 190, t, .08, { vol:v*.5, pluck:true }); };
  const hat   = (dst, t, v = .035) => noise(dst, t, .035, { f:8000, vol:v });
  const clap  = (dst, t, v = .1) => [0, .012, .024].forEach(o => noise(dst, t + o, .09, { f:1300, ft:'bandpass', vol:v }));

  /* 16th-note scheduler */
  function sequencer(bpm, swing, onStep){
    const spb = 60 / bpm / 4; let step = 0, next = actx.currentTime + .08;
    const timer = setInterval(() => {
      while (next < actx.currentTime + .15){
        onStep(step, next + (step % 2 ? swing * spb : 0), spb);
        next += spb; step++;
      }
    }, 25);
    return () => clearInterval(timer);
  }
  const melAt = (mel, s) => mel.filter(n => n[0] === s);

  /* Track 1: Nebula Drift (soulful, ambient) */
  function nebula(dest){
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .6;
    const lfo = actx.createOscillator(), lfoG = actx.createGain(); lfo.frequency.value = .05; lfoG.gain.value = 500;
    lfo.connect(lfoG).connect(lp.frequency); lfo.start();
    const bus = actx.createGain(); bus.connect(lp); lp.connect(dest);
    const CH = [[48,55,62,64,71],[45,52,59,60,67],[41,48,55,57,64],[43,50,57,59,62]];
    const PENTA = [72,74,76,79,81,84,86,88];
    let alive = true, ci = 0, t1, t2;
    const chord = () => {
      if (!alive) return;
      const now = actx.currentTime, dur = 9;
      CH[ci++ % CH.length].forEach((m, i) => [-6, 6].forEach(det => {
        const o = actx.createOscillator(), g = actx.createGain(), v = i === 0 ? .07 : .028;
        o.type = i === 0 ? 'sine' : 'triangle'; o.frequency.value = hz(m); o.detune.value = det;
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(v, now + 3);
        g.gain.setValueAtTime(v, now + dur - 2); g.gain.linearRampToValueAtTime(0, now + dur + 2.5);
        o.connect(g).connect(bus); o.start(now); o.stop(now + dur + 3);
      }));
      t1 = setTimeout(chord, 9000);
    };
    const twinkle = () => {
      if (!alive) return;
      tone(dest, hz(PENTA[Math.random()*PENTA.length|0]), actx.currentTime, 2.6, { type:'sine', vol:.035, pluck:true });
      t2 = setTimeout(twinkle, 700 + Math.random()*2200);
    };
    chord(); t2 = setTimeout(twinkle, 1500);
    return () => { alive = false; clearTimeout(t1); clearTimeout(t2); try { lfo.stop(); } catch(e){} };
  }

  /* Track 2: Rocket Pop (peppy, C major, I-V-vi-IV) */
  const ROCKET = {
    ch:[[60,64,67],[55,59,62],[57,60,64],[53,57,60]], bass:[36,43,45,41],
    mel:[[0,76,2],[2,79,2],[4,84,3],[8,81,2],[10,79,2],[12,76,4],
         [16,74,2],[18,79,2],[20,83,3],[24,81,2],[26,79,2],[28,74,4],
         [32,76,2],[34,81,2],[36,84,3],[40,83,2],[42,81,2],[44,76,4],
         [48,77,2],[50,81,2],[52,84,2],[54,86,2],[56,84,4],[60,81,2],[62,79,2]]
  };
  function rocket(dest){
    return sequencer(118, 0, (s, t, spb) => {
      const st = s % 16, bar = (s >> 4) % 4, cyc = (s >> 6) % 4, ch = ROCKET.ch[bar];
      if (st === 0 || st === 8 || (st === 10 && bar === 3)) kick(dest, t, .5);
      if (st === 4 || st === 12) clap(dest, t, .09);
      if (st % 2 === 0) hat(dest, t, st % 4 ? .025 : .04);
      if (st % 2 === 0) tone(dest, hz(ROCKET.bass[bar] + (st % 4 ? 12 : 0)), t, spb*1.6, { type:'triangle', vol:.16, lp:900, r:.04 });
      tone(dest, hz(ch[[0,1,2,1][st % 4]] + 12), t, spb*.9, { type:'square', vol:.018, lp:2400, pluck:true });
      if (cyc !== 2) melAt(ROCKET.mel, s % 64).forEach(([, m, l]) => tone(dest, hz(m), t, spb*l*.95, { type:'triangle', vol:.075, r:.06 }));
      if (cyc === 2 && st % 4 === 0) tone(dest, hz(ch[2] + 24), t, spb*3, { type:'sine', vol:.04, pluck:true });
    });
  }

  /* Track 3: Moon Bounce (playful, swung marimba, F major) */
  const MOON = {
    ch:[[53,57,60],[50,53,57],[46,50,53],[48,52,55]], bass:[41,38,34,36],
    mel:[[0,69],[3,72],[6,74],[8,77],[11,74],[14,72],
         [16,69],[19,65],[22,67],[24,69],[28,62],
         [32,65],[35,70],[38,74],[40,77],[43,74],[46,70],
         [48,67],[51,72],[54,76],[56,79],[59,76],[62,72]]
  };
  function moon(dest){
    return sequencer(104, .33, (s, t, spb) => {
      const st = s % 16, bar = (s >> 4) % 4, cyc = (s >> 6) % 4, ch = MOON.ch[bar];
      if (st === 0 || st === 8 || st === 11) kick(dest, t, .42);
      if (st === 4 || st === 12) clap(dest, t, .08);
      if (st % 2 === 1) hat(dest, t, .02);
      if (st === 0 || st === 8) tone(dest, hz(MOON.bass[bar]), t, spb*3, { type:'sine', vol:.22, pluck:true });
      if (st === 14 && bar === 3) tone(dest, 180, t, .35, { type:'sine', slide:520, vol:.08, pluck:true }); // boing
      if (st % 4 === 2) ch.forEach(m => tone(dest, hz(m + 12), t, .18, { type:'triangle', vol:.025, pluck:true }));
      if (cyc !== 3) melAt(MOON.mel, s % 64).forEach(([, m]) => {
        tone(dest, hz(m), t, .45, { type:'sine', vol:.11, pluck:true });
        tone(dest, hz(m + 12), t, .2, { type:'sine', vol:.03, pluck:true });
      });
    });
  }

  /* Game track: Bug Blitz (fast chiptune, A minor) */
  const BLITZ = {
    ch:[[57,60,64],[53,57,60],[55,59,62],[52,56,59]], bass:[33,29,31,28],
    mel:[[0,69,2],[2,72,2],[4,76,2],[6,74,2],[8,72,2],[10,71,2],[12,69,4],
         [16,69,2],[18,72,2],[20,77,2],[22,76,2],[24,74,2],[26,72,2],[28,72,4],
         [32,71,2],[34,74,2],[36,79,2],[38,77,2],[40,76,2],[42,74,2],[44,71,4],
         [48,68,2],[50,71,2],[52,76,2],[54,74,2],[56,71,2],[58,68,2],[60,64,4]]
  };
  function blitz(dest){
    return sequencer(150, 0, (s, t, spb) => {
      const st = s % 16, bar = (s >> 4) % 4, ch = BLITZ.ch[bar];
      if (st % 4 === 0) kick(dest, t, .5);
      if (st === 4 || st === 12) snare(dest, t, .12);
      hat(dest, t, st % 2 ? .018 : .03);
      if (st % 2 === 0) tone(dest, hz(BLITZ.bass[bar] + 12 + (st % 4 ? 12 : 0)), t, spb*1.5, { type:'square', vol:.05, lp:700, r:.03 });
      tone(dest, hz(ch[st % 3] + 24), t, spb*.8, { type:'square', vol:.012, lp:3500, pluck:true });
      melAt(BLITZ.mel, s % 64).forEach(([, m, l]) => tone(dest, hz(m + 12), t, spb*l*.9, { type:'square', vol:.035, lp:3000, r:.04 }));
    });
  }

  const ENGINES = { nebula, rocket, moon, bugs: blitz };
  function startTrack(id){
    ensureAudio(); actx.resume();
    const tg = actx.createGain(); tg.gain.value = 0; tg.connect(master);
    const send = actx.createGain(); send.gain.value = id === 'nebula' ? .6 : .15; tg.connect(send); send.connect(rev);
    const stopFn = ENGINES[id](tg);
    tg.gain.setTargetAtTime(id === 'nebula' ? .9 : .7, actx.currentTime, id === 'nebula' ? 1 : .12);
    return { id, stop(){
      tg.gain.cancelScheduledValues(actx.currentTime);
      tg.gain.setTargetAtTime(0, actx.currentTime, .15);
      stopFn(); setTimeout(() => tg.disconnect(), 4000);
    } };
  }
  const wanted = () => (gameActive && gamePref) ? 'bugs' : (spaceWanted ? TRACKS[trackIdx].id : null);
  function refreshMusic(){
    const want = wanted();
    if ((curTrack && curTrack.id) !== want){
      if (curTrack){ curTrack.stop(); curTrack = null; }
      if (want){ try { curTrack = startTrack(want); } catch(e){ curTrack = null; } }
    }
    musicOn = !!curTrack;
    const tr = TRACKS[trackIdx], overridden = spaceWanted && gameActive && gamePref;
    musicBtn.setAttribute('aria-pressed', String(spaceWanted));
    musicBtn.setAttribute('aria-label', spaceWanted ? `Stop music (now: ${tr.name})` : `Play music: ${tr.name}`);
    trackLbl.textContent = overridden ? 'Paused for game' : (spaceWanted ? (isKid() ? tr.kid : tr.name) : 'Music');
    const gb = $('#gameMusicBtn');
    if (gb){ gb.setAttribute('aria-pressed', String(gamePref)); $('#gameMusicState').textContent = gamePref ? 'On' : 'Off'; }
  }
  musicBtn.addEventListener('click', () => {
    spaceWanted = !spaceWanted; refreshMusic();
    if (spaceWanted) track('music/' + TRACKS[trackIdx].id, 'Music: ' + TRACKS[trackIdx].name);
    if (spaceWanted && !(gameActive && gamePref)) say(isKid() ? `Blast off! Now playing ${TRACKS[trackIdx].kid}.` : `Now playing ${TRACKS[trackIdx].name}. Generated live in your browser.`);
  });
  nextBtn.addEventListener('click', () => {
    trackIdx = (trackIdx + 1) % TRACKS.length; store.set('track', trackIdx);
    track('music/' + TRACKS[trackIdx].id, 'Music: ' + TRACKS[trackIdx].name);
    spaceWanted = true; refreshMusic();
    if (!(gameActive && gamePref)) say(`Now playing: ${isKid() ? TRACKS[trackIdx].kid : TRACKS[trackIdx].name}`);
  });
  function sfx(kind){
    if (!gamePref) return;
    try {
      ensureAudio(); actx.resume();
      const t = actx.currentTime;
      if (kind === 'squash') tone(master, 520, t, .09, { type:'square', slide:1400, vol:.05, pluck:true });
      if (kind === 'start') [69,72,76,81].forEach((m, i) => tone(master, hz(m+12), t + i*.08, .1, { type:'square', vol:.04, lp:3000, pluck:true }));
      if (kind === 'end')   [81,76,72,69,81].forEach((m, i) => tone(master, hz(m+12), t + i*.11, i === 4 ? .5 : .12, { type:'square', vol:.04, lp:3000, pluck:true }));
    } catch(e){}
  }
  function gameMusic(active){ gameActive = active; refreshMusic(); }
  $('#gameMusicBtn').addEventListener('click', () => { gamePref = !gamePref; store.set('gameMusic', gamePref ? '1' : '0'); refreshMusic(); });
  document.addEventListener('visibilitychange', () => {
    if (!actx) return;
    if (document.hidden) actx.suspend(); else if (curTrack) actx.resume();
  });
  refreshMusic();

  /* ---------- Robot Maze (kid mode coding challenge) ---------- */
  const MAZES = [
    { start:[0,2,0], goal:[4,2], par:4,  rocks:[], tip:"Bolt is facing right. How many Forward steps to reach the star?" },
    { start:[0,4,0], goal:[3,1], par:8,  rocks:[[1,4],[2,4],[1,2],[2,2]], tip:"Rocks block the way! Turn Bolt first, then go Forward." },
    { start:[0,0,1], goal:[3,0], par:9,  rocks:[[1,0],[1,1],[2,0],[2,1],[4,0],[4,1],[0,4]], tip:"Bolt starts facing down. Turning left or right depends on which way Bolt faces!" },
    { start:[0,1,0], goal:[4,1], par:11, rocks:[[2,0],[2,1],[2,2],[4,0],[5,1]], tip:"Go around the wall. Plan the whole trip before you press Run." },
    { start:[0,5,3], goal:[4,0], par:13, rocks:[[1,4],[1,3],[1,2],[0,1],[3,0],[3,1],[3,2],[5,1],[4,4],[5,3]], tip:"Final level! Trace the path with your finger first." }
  ];
  const DIRV = [[1,0],[0,1],[-1,0],[0,-1]], MAXBLOCKS = 16, N = 6;
  const board = $('#mazeBoard'), progEl = $('#program'), mazeMsg = $('#mazeMsg');
  let mz = 0, prog = [], running = false, botPos;
  let unlocked = Math.min(MAZES.length - 1, +(store.get('mazeUnlocked') || 0));
  const mazeBest = (() => { try { return JSON.parse(store.get('mazeStars') || '{}'); } catch(e){ return {}; } })();
  const BLOCK = {
    F:{ label:'Forward',    icon:'<path d="M12 19V5M6 11l6-6 6 6"/>' },
    L:{ label:'Turn left',  icon:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-2"/>' },
    R:{ label:'Turn right', icon:'<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h2"/>' }
  };
  const blockSvg = k => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${BLOCK[k].icon}</svg>`;
  function drawMaze(){
    const M = MAZES[mz], rocks = new Set(M.rocks.map(r => r.join(',')));
    let html = '';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){
      const k = x + ',' + y, goal = M.goal[0] === x && M.goal[1] === y;
      html += `<div class="cell${rocks.has(k) ? ' rock' : ''}" data-xy="${k}">${rocks.has(k) ? '<svg viewBox="0 0 80 70"><path d="M14 30l12-18 26-4 18 16 2 24-18 16-28-2L8 46z" fill="#B8A98F" stroke="#1C2541" stroke-width="4" stroke-linejoin="round"/><circle cx="34" cy="30" r="6" fill="#9C8C72"/></svg>' : ''}${goal ? '<svg class="goal" viewBox="0 0 32 32"><use href="#i-star"/></svg>' : ''}</div>`;
    }
    html += `<div class="mbot" id="mbot"><div class="mbot-in"><svg viewBox="0 0 64 64"><rect x="10" y="14" width="44" height="38" rx="13" fill="#1FA39A" stroke="#1C2541" stroke-width="3"/><circle cx="25" cy="32" r="6" fill="#fff"/><circle cx="39" cy="32" r="6" fill="#fff"/><circle cx="27" cy="32" r="2.6" fill="#1C2541"/><circle cx="41" cy="32" r="2.6" fill="#1C2541"/><path d="M54 26l8 7-8 7z" fill="#FF6B5B" stroke="#1C2541" stroke-width="2.5" stroke-linejoin="round"/></svg></div></div>`;
    board.innerHTML = html;
    $('#mazeLevel').textContent = `Level ${mz + 1} of ${MAZES.length}`;
    $('#mazeTip').textContent = M.tip;
    $('#mazePar').textContent = `Best possible: ${M.par} blocks`;
    const dots = $('#mazeDots'); dots.innerHTML = '';
    MAZES.forEach((_, i) => {
      const b = document.createElement('button');
      b.className = 'mdot'; b.textContent = mazeBest[i] ? '★'.repeat(mazeBest[i]) : (i + 1);
      b.disabled = i > unlocked; b.setAttribute('aria-label', `Level ${i + 1}${i > unlocked ? ' (locked)' : ''}`);
      if (i === mz) b.setAttribute('aria-current', 'step');
      b.addEventListener('click', () => { if (running) return; mz = i; prog = []; drawMaze(); renderProg(); setMazeMsg(''); });
      dots.appendChild(b);
    });
    resetBot();
  }
  /* The board is a picture (role="img"): its label says where Bolt, the star and the rocks are, so
     the puzzle can be solved without seeing it. Columns and rows count from the top left. */
  const DIRNAME = ['right', 'down', 'left', 'up'];
  const sq = ([x, y]) => `column ${x + 1}, row ${y + 1}`;
  function describeBoard(pos){
    const M = MAZES[mz], [x, y, d] = pos ? [pos.x, pos.y, pos.d] : M.start;
    const rocks = M.rocks.length ? `Rocks at ${M.rocks.map(sq).join('; ')}.` : 'No rocks.';
    board.setAttribute('aria-label', `Maze board, ${N} by ${N} squares. Bolt is at ${sq([x, y])}, facing ${DIRNAME[d]}. The star is at ${sq(M.goal)}. ${rocks}`);
  }
  function placeBot(x, y, d){
    const b = $('#mbot'); if (!b) return;
    b.style.left = (x * 100 / N) + '%'; b.style.top = (y * 100 / N) + '%';
    b.firstElementChild.style.transform = `rotate(${d * 90}deg)`;
  }
  function resetBot(){
    const [x, y, d] = MAZES[mz].start; botPos = { x, y, d, turns: d };
    board.querySelectorAll('.trail').forEach(c => c.classList.remove('trail'));
    placeBot(x, y, d);
    describeBoard(botPos);
  }
  function renderProg(active = -1){
    if (!prog.length){ progEl.innerHTML = '<span class="prog-empty">Tap the blocks above to build Bolt\'s program.</span>'; }
    else progEl.innerHTML = prog.map((k, i) => `<button class="pblock pb-${k}${i === active ? ' active' : ''}" data-i="${i}" aria-label="Step ${i + 1}: ${BLOCK[k].label}. Tap to remove.">${blockSvg(k)}<span>${i + 1}</span></button>`).join('');
    $('#blockCount').textContent = `${prog.length}/${MAXBLOCKS}`;
    $('#runBtn').disabled = running || !prog.length;
  }
  progEl.addEventListener('click', e => {
    const b = e.target.closest('.pblock'); if (!b || running) return;
    prog.splice(+b.dataset.i, 1); renderProg();
  });
  document.querySelectorAll('.palette button').forEach(b => b.addEventListener('click', () => {
    if (running) return;
    if (prog.length >= MAXBLOCKS){ setMazeMsg(`Bolt can only remember ${MAXBLOCKS} blocks. Try a shorter path!`, 'warn'); return; }
    prog.push(b.dataset.k); renderProg(); setMazeMsg('');
    progEl.scrollLeft = progEl.scrollWidth;
  }));
  $('#undoBtn').addEventListener('click', () => { if (!running){ prog.pop(); renderProg(); } });
  $('#clearBtn').addEventListener('click', () => { if (!running){ prog = []; renderProg(); resetBot(); setMazeMsg(''); } });
  function setMazeMsg(t, kind = ''){ mazeMsg.textContent = t; mazeMsg.className = 'maze-msg ' + kind; }
  const pause = ms => new Promise(r => setTimeout(r, reduce ? 60 : ms));
  $('#runBtn').addEventListener('click', async () => {
    if (running || !prog.length) return;
    running = true; resetBot(); setMazeMsg('Running...'); renderProg();
    const M = MAZES[mz], rocks = new Set(M.rocks.map(r => r.join(',')));
    await pause(250);
    for (let i = 0; i < prog.length; i++){
      renderProg(i);
      const k = prog[i];
      if (k === 'L'){ botPos.d = (botPos.d + 3) % 4; botPos.turns -= 1; }
      if (k === 'R'){ botPos.d = (botPos.d + 1) % 4; botPos.turns += 1; }
      if (k === 'F'){
        const nx = botPos.x + DIRV[botPos.d][0], ny = botPos.y + DIRV[botPos.d][1];
        if (nx < 0 || ny < 0 || nx >= N || ny >= N || rocks.has(nx + ',' + ny)){
          const b = $('#mbot'); b.classList.add('bump'); setTimeout(() => b.classList.remove('bump'), 500);
          setMazeMsg(rocks.has(nx + ',' + ny) ? `Bonk! Block ${i + 1} walks Bolt into a rock. Fix that step and try again.` : `Whoops! Block ${i + 1} walks Bolt off the board.`, 'warn');
          await pause(900); running = false; renderProg(i); return;
        }
        const cell = board.querySelector(`[data-xy="${botPos.x},${botPos.y}"]`); if (cell) cell.classList.add('trail');
        botPos.x = nx; botPos.y = ny;
      }
      $('#mbot').firstElementChild.style.transform = `rotate(${botPos.turns * 90}deg)`;
      placeBotXY();
      await pause(430);
      if (botPos.x === M.goal[0] && botPos.y === M.goal[1]) return win(i + 1);
    }
    running = false; renderProg();
    setMazeMsg('So close! Bolt stopped before the star. Add more blocks and run again.', 'warn');
  });
  function placeBotXY(){ const b = $('#mbot'); b.style.left = (botPos.x * 100 / N) + '%'; b.style.top = (botPos.y * 100 / N) + '%'; describeBoard(botPos); }
  function win(used){
    running = false;
    const M = MAZES[mz], stars = used <= M.par ? 3 : used <= M.par + 2 ? 2 : 1;
    track('robot-maze/level-' + (mz + 1), 'Robot Maze level solved');
    mazeBest[mz] = Math.max(mazeBest[mz] || 0, stars); store.set('mazeStars', JSON.stringify(mazeBest));
    if (mz === unlocked && unlocked < MAZES.length - 1){ unlocked++; store.set('mazeUnlocked', unlocked); }
    renderProg();
    const last = mz === MAZES.length - 1;
    setMazeMsg(`${'★'.repeat(stars)} You did it in ${used} blocks!${stars < 3 ? ` Can you do it in ${M.par}?` : ' Perfect program!'}${last ? ' You finished every level. You think like a real coder!' : ''}`, 'win');
    burst(last ? 120 : 50); sfx('end');
    drawDotsOnly();
    if (!last){ const nb = $('#nextLevelBtn'); nb.hidden = false; nb.focus({ preventScroll:true }); }
  }
  function drawDotsOnly(){ const keep = { ...botPos }; drawMaze(); botPos = keep; placeBotXY(); $('#mbot').firstElementChild.style.transform = `rotate(${botPos.turns * 90}deg)`; }
  $('#nextLevelBtn').addEventListener('click', () => { $('#nextLevelBtn').hidden = true; mz = Math.min(mz + 1, MAZES.length - 1); prog = []; drawMaze(); renderProg(); setMazeMsg(''); });
  mz = unlocked; drawMaze(); renderProg();

  /* ---------- System Designer (grown-up critical thinking) ---------- */
  const METRICS = [ ['up','Stays up'], ['fast','Fast'], ['safe','Correct & safe'], ['trust','Fair & trusted'] ];
  const SCEN = [
    { id:'tickets', title:'The Ticket Drop', budget:10,
      brief:'Concert tickets go on sale at 10:00. A million fans hit the site in the first minute. The artist will tweet about whatever goes wrong.',
      goals:{ up:70, safe:70, trust:60 },
      cards:[
        { id:'queue', name:'Virtual waiting room', cost:2, desc:'Let fans in at a pace the system can handle.', fx:{up:35,trust:15}, note:'The waiting room absorbed the spike. Fans waited, but nobody saw an error page.', key:true, miss:'Without a waiting room, the spike hit your servers all at once.' },
        { id:'locks', name:'Seat locks during checkout', cost:2, desc:'Hold a seat for one buyer while they pay.', fx:{safe:45}, note:'Seat locks meant zero double-booked seats.', key:true, miss:'No seat locks: some seats were sold twice. That is the story that trends.' },
        { id:'bots', name:'Bot protection & rate limits', cost:2, desc:'Stop scalper bots from grabbing everything.', fx:{up:12,trust:30}, note:'Bots got throttled, so real fans actually got tickets.', key:true, miss:'Scalper bots bought the best seats in seconds.' },
        { id:'cdn', name:'CDN for pages & images', cost:2, desc:'Serve static content from servers near each fan.', fx:{fast:30,up:10}, note:'The CDN served static pages, so the core servers only handled real work.' },
        { id:'scale', name:'Autoscaling servers', cost:3, desc:'Add servers automatically when traffic rises.', fx:{up:18,fast:8}, note:'Autoscaling helped, but it takes minutes to kick in and the spike lasts seconds.' },
        { id:'cache', name:'Cache the seat map', cost:1, desc:'Show available seats without asking the database each time.', fx:{fast:22,safe:-8}, note:'The seat map cache was fast but showed some seats that were already gone.', synergy:{ with:'locks', fx:{safe:8}, note:'Seat locks caught the stale cache entries before anyone paid.' } },
        { id:'bigdb', name:'One giant database server', cost:4, desc:'Buy the biggest machine available.', fx:{up:10}, note:'The giant database bought a little headroom for a lot of budget.' },
        { id:'redesign', name:'Launch the new site design same day', cost:2, desc:'Marketing wants a fresh look for the big day.', fx:{up:-15,trust:-5}, note:'Shipping a redesign on launch day added risk exactly when you could least afford it.' }
      ] },
    { id:'voice', title:'The Bank Voice Agent', budget:10,
      brief:'Build a phone agent that answers card questions for a bank. It must never move money by mistake, and upset callers must reach a human fast.',
      goals:{ safe:75, trust:70, fast:50 },
      cards:[
        { id:'confirm', name:'Confirm before any money moves', cost:2, desc:'Read back the action and get a clear yes.', fx:{safe:40}, note:'Read-back confirmations stopped every accidental transfer.', key:true, miss:'Without confirmations, a misheard "fifteen" became "fifty".' },
        { id:'handoff', name:'Human handoff when unsure or upset', cost:2, desc:'Route low-confidence or frustrated callers to people.', fx:{trust:35,safe:10}, note:'Hard calls went to humans with a summary, so callers never repeated themselves.', key:true, miss:'Upset callers got stuck in a loop with the bot.' },
        { id:'router', name:'Fast router picks the specialist', cost:2, desc:'A small, quick model decides who handles the call.', fx:{fast:30,safe:5}, note:'The fast router kept replies snappy and cheap. Think first, then talk.', key:true, miss:'Every call went through the slowest path, so callers heard long pauses.' },
        { id:'evals', name:'Test set & red-teaming before launch', cost:2, desc:'Try to break it on purpose before customers do.', fx:{safe:20,trust:10}, note:'Red-teaming found the prompt-injection trick before a customer did.' },
        { id:'scoped', name:'Least-privilege data access', cost:2, desc:'The agent can read only what each call needs.', fx:{safe:15,trust:10}, note:'Scoped access meant a confused agent could not see what it did not need.' },
        { id:'voice', name:'Natural, low-latency voice', cost:2, desc:'Stream speech so replies start instantly.', fx:{fast:25,trust:10}, note:'Streaming voice made the agent feel like a conversation, not a menu.' },
        { id:'onebig', name:'One giant model does everything', cost:3, desc:'Skip the routing and specialists.', fx:{fast:-15,safe:-5}, note:'One giant model was slower and harder to test than focused specialists.' },
        { id:'keepall', name:'Keep every recording forever', cost:1, desc:'Just in case it is useful someday.', fx:{trust:-25}, note:'Keeping recordings forever created privacy risk with no clear purpose.' }
      ] },
    { id:'photos', title:'The App Went Viral', budget:9,
      brief:'Your photo-sharing app got featured. Sign-ups are 50x overnight. Uploads must keep working, the feed must stay quick, and nothing awful should get posted.',
      goals:{ up:70, fast:60, safe:60 },
      cards:[
        { id:'queue', name:'Process uploads in the background', cost:2, desc:'Accept the photo now, resize it a moment later.', fx:{up:32,fast:10}, note:'Background processing kept uploads instant even while resizing piled up.', key:true, miss:'Every upload waited on image resizing, so uploads timed out.' },
        { id:'storage', name:'Object storage + CDN for photos', cost:2, desc:'Store and serve images from cheap, global infrastructure.', fx:{fast:30,up:10}, note:'Photos loaded from a CDN close to each user.', key:true, miss:'Photos were served from your own servers and clogged them.' },
        { id:'monitor', name:'Monitoring, alerts & on-call', cost:1, desc:'Know something is wrong before users tell you.', fx:{up:15}, note:'Alerts caught the disk filling up at 3am before anyone noticed.', key:true, miss:'You learned about outages from angry posts.' },
        { id:'mod', name:'Automatic content moderation', cost:2, desc:'Screen uploads before they reach the feed.', fx:{safe:40,trust:10}, note:'Moderation kept the feed safe as strangers flooded in.', key:true, miss:'Without moderation, the feed filled with spam within hours.' },
        { id:'feedcache', name:'Cache the home feed', cost:2, desc:'Build feeds ahead of time instead of on every visit.', fx:{fast:25}, note:'Precomputed feeds stayed fast under load.' },
        { id:'replicas', name:'Database read replicas', cost:2, desc:'Copies of the database to share the reading load.', fx:{up:12,fast:10}, note:'Read replicas spread the load across machines.' },
        { id:'rewrite', name:'Rewrite the backend this week', cost:4, desc:'A new language would be faster, right?', fx:{up:-25,fast:5}, note:'A rewrite during a growth spike swapped known problems for unknown ones.' },
        { id:'pause', name:'Pause new sign-ups', cost:1, desc:'Stop the bleeding by closing the doors.', fx:{up:10,trust:-30}, note:'Pausing sign-ups turned a viral moment into a closed sign.' }
      ] }
  ];
  let sc = 0; const picks = new Set();
  const sdTabs = $('#sdTabs'), sdCards = $('#sdCards'), sdResult = $('#sdResult');
  SCEN.forEach((S, i) => {
    const b = document.createElement('button'); b.className = 'chip'; b.textContent = S.title;
    b.addEventListener('click', () => { sc = i; picks.clear(); drawScenario(); });
    sdTabs.appendChild(b);
  });
  function spent(){ return [...picks].reduce((a, id) => a + SCEN[sc].cards.find(c => c.id === id).cost, 0); }
  function drawScenario(){
    const S = SCEN[sc];
    sdTabs.querySelectorAll('.chip').forEach((b, i) => b.setAttribute('aria-pressed', String(i === sc)));
    $('#sdTitle').textContent = S.title; $('#sdBrief').textContent = S.brief;
    $('#sdGoals').innerHTML = Object.entries(S.goals).map(([k, v]) => `<li><b>${METRICS.find(m => m[0] === k)[1]}</b> at least ${v}</li>`).join('');
    drawCards(); idleResult();
  }
  function drawCards(){
    const S = SCEN[sc], used = spent();
    $('#sdSpent').textContent = used; $('#sdBudget').textContent = S.budget;
    $('#sdBar').style.width = Math.min(100, used / S.budget * 100) + '%';
    sdCards.innerHTML = S.cards.map(c => {
      const on = picks.has(c.id), over = !on && used + c.cost > S.budget;
      return `<button class="sdc${on ? ' on' : ''}" data-id="${c.id}" aria-pressed="${on}" ${over ? 'disabled' : ''}><span class="sdc-top"><b>${c.name}</b><span class="cost">${c.cost} cr</span></span><span class="sdc-desc">${c.desc}</span>${over ? '<span class="sdc-over">Over budget</span>' : ''}</button>`;
    }).join('');
    $('#sdLaunch').disabled = !picks.size;
  }
  sdCards.addEventListener('click', e => {
    const b = e.target.closest('.sdc'); if (!b || b.disabled) return;
    const id = b.dataset.id; picks.has(id) ? picks.delete(id) : picks.add(id); drawCards();
  });
  $('#sdReset').addEventListener('click', () => { picks.clear(); drawCards(); idleResult(); });
  function idleResult(){
    sdResult.innerHTML = `<div class="sd-idle"><svg viewBox="0 0 32 32" aria-hidden="true"><use href="#i-agent"/></svg><p>Pick your building blocks, stay within budget, then hit <b>Launch it</b>. The simulator throws real-world traffic at your design and writes the post-mortem.</p><p class="mono">No coding needed. Just judgment.</p></div>`;
  }
  $('#sdLaunch').addEventListener('click', async () => {
    const S = SCEN[sc];
    track('design-lab/' + S.id, 'Design Lab launch: ' + S.title);
    const m = { up:30, fast:30, safe:30, trust:40 }, notes = [];
    S.cards.filter(c => picks.has(c.id)).forEach(c => {
      Object.entries(c.fx).forEach(([k, v]) => m[k] += v);
      notes.push({ good: Object.values(c.fx).reduce((a, b) => a + b, 0) > 0, text: c.note });
      if (c.synergy && picks.has(c.synergy.with)){ Object.entries(c.synergy.fx).forEach(([k, v]) => m[k] += v); notes.push({ good:true, text:c.synergy.note }); }
    });
    S.cards.filter(c => c.key && !picks.has(c.id)).forEach(c => notes.push({ good:false, miss:true, text:c.miss }));
    Object.keys(m).forEach(k => m[k] = Math.max(0, Math.min(100, m[k])));
    const left = S.budget - spent();
    const goalsMet = Object.entries(S.goals).filter(([k, v]) => m[k] >= v).length, goalsAll = Object.keys(S.goals).length;
    const score = Math.round(METRICS.reduce((a, [k]) => a + m[k], 0) / 4 + left * 2 + (goalsMet === goalsAll ? 10 : 0));
    // simulate
    $('#sdLaunch').disabled = true;
    const logs = ['T+0s   traffic ramping...', 'T+10s  50x normal load', 'T+30s  checking for failures', 'T+60s  writing post-mortem'];
    sdResult.innerHTML = `<div class="sd-sim"><div class="sim-bar"><i></i></div><pre class="mono" id="simLog"></pre></div>`;
    for (const l of logs){ $('#simLog').textContent += l + '\n'; await pause(380); }
    const verdict = goalsMet === goalsAll ? (score >= 85 ? ['Flawless launch', 'Staff-engineer judgment. Every goal met with budget to spare.'] : ['Launch survived', 'All goals met. A few dollars or a few milliseconds left on the table.'])
                  : goalsMet >= goalsAll - 1 ? ['Rough launch', 'Mostly fine, but one goal missed and somebody is writing an apology post.'] : ['Incident declared', 'The launch went sideways. Read the post-mortem and try again.'];
    sdResult.innerHTML = `
      <div class="sd-head"><div><div class="k">Result</div><h3>${verdict[0]}</h3><p>${verdict[1]}</p></div><div class="sd-score"><span>${Math.min(score, 100)}</span><small>/100</small></div></div>
      <div class="sd-metrics">${METRICS.map(([k, label]) => { const g = S.goals[k]; const ok = g == null || m[k] >= g; return `<div class="sdm"><div class="sdm-top"><span>${label}</span><b class="${g == null ? '' : ok ? 'ok' : 'bad'}">${m[k]}${g != null ? (ok ? ' ✓' : ' ✗') : ''}</b></div><div class="sdm-bar"><i style="width:${m[k]}%"></i>${g != null ? `<em style="left:${g}%" title="Goal ${g}"></em>` : ''}</div></div>`; }).join('')}</div>
      <div class="k" style="margin-top:14px">Post-mortem</div>
      <ul class="pm">${notes.map(n => `<li class="${n.good ? 'good' : 'bad'}">${n.miss ? '<b>Missed:</b> ' : ''}${n.text}</li>`).join('')}${left > 0 ? `<li class="good">You kept ${left} credit${left > 1 ? 's' : ''} in reserve for surprises.</li>` : ''}</ul>`;
    $('#sdLaunch').disabled = false;
    if (goalsMet === goalsAll){ burst(score >= 85 ? 90 : 40); }
  });
  drawScenario();


  /* ---------- Color scheme toggle (system by default) ---------- */
  const root = document.documentElement, themeBtn = $('#themeBtn'), metaTheme = document.querySelector('meta[name="theme-color"]');
  const sysMQ = window.matchMedia('(prefers-color-scheme: dark)');
  const sysTheme = () => sysMQ.matches ? 'dark' : 'light';
  const effTheme = () => root.dataset.theme || sysTheme();
  function syncTheme(){
    const t = effTheme();
    metaTheme.setAttribute('content', t === 'dark' ? '#0A0B18' : '#FFF8EE');
    themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to Daybreak (light) scheme' : 'Switch to Deep Space (dark) scheme');
    themeBtn.title = themeBtn.getAttribute('aria-label') + (root.dataset.theme ? '' : ' (following your system)');
  }
  themeBtn.addEventListener('click', () => {
    const next = effTheme() === 'dark' ? 'light' : 'dark';
    track('theme/' + next, 'Color scheme switched');
    document.body.classList.add('theme-anim'); setTimeout(() => document.body.classList.remove('theme-anim'), 700);
    if (next === sysTheme()){ delete root.dataset.theme; store.set('theme',''); }   // back to matching system: follow system again
    else { root.dataset.theme = next; store.set('theme', next); }
    syncTheme();
    say(next === 'dark' ? (isKid() ? 'Whoa! We just blasted into deep space!' : 'Deep Space scheme. Same content, new orbit.') : (isKid() ? 'Good morning, sunshine!' : 'Daybreak scheme. Back on solid ground.'));
  });
  sysMQ.addEventListener ? sysMQ.addEventListener('change', syncTheme) : sysMQ.addListener(syncTheme);
  syncTheme();

  /* ---------- Offline support (PWA) ---------- */
  if ('serviceWorker' in navigator && location.protocol === 'https:'){
    afterLoad(() => startWorker().catch(() => {}));
  }
  /* sw.js has a kill switch (const KILL = true). While it is on, do not register the worker: it
     would install and retire itself on every visit. Remove a leftover registration and this
     site's caches instead, in case the browser has not picked up the killed worker yet. */
  async function startWorker(){
    const res = await fetch('sw.js', { cache: 'no-cache' });
    if (res.ok && /^const KILL = true;/m.test(await res.text())){
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
      if (window.caches){ const keys = await caches.keys(); await Promise.all(keys.filter(k => k.startsWith('madhav-')).map(k => caches.delete(k))); }
      return;
    }
    await navigator.serviceWorker.register('sw.js');
  }

  /* ---------- Init ---------- */
  const params = new URLSearchParams(location.search);
  const startKid = params.has('kid') || store.get('kidmode') === '1';
  setMode(startKid, false);
})();
