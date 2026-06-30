/* ============================================================
   ATHARVA OS v3.0 — FULL SCRIPT
   Login → BIOS → OS Shell + Interactive Terminal + Scroll Logic
============================================================ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const isTouch = window.matchMedia('(hover:none)').matches;

  /* ── CUSTOM CURSOR (reticle) ─────────────── */
  const ring = document.getElementById('cursor-ring');
  const dot = document.getElementById('cursor-dot');
  ['t', 'r', 'b', 'l'].forEach(pos => {
    const s = document.createElement('span');
    s.className = 'tick tick-' + pos;
    ring.appendChild(s);
  });
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  const root = document.documentElement;
  let glowTicking = false;

  if (!isTouch) {
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
      if (!glowTicking) {
        glowTicking = true;
        requestAnimationFrame(() => {
          root.style.setProperty('--mx-glow', mx + 'px');
          root.style.setProperty('--my-glow', my + 'px');
          glowTicking = false;
        });
      }
    }, { passive: true });
  }

  /* ── MAGNETIC STICKY CURSOR + BUTTON PULL ────────── */
  const MAGNET_SELECTOR = '.btn-terminal,.nav-pill-link,.nav-soc,.nav-search-btn,.nav-brand,.login-btn,.hamburger,.footer-top';
  let magnetEl = null;
  let ringSize = 30;

  if (!isTouch) {
    document.addEventListener('mouseover', e => {
      const t = e.target.closest(MAGNET_SELECTOR);
      if (t) magnetEl = t;
    });
    document.addEventListener('mouseout', e => {
      const t = e.target.closest(MAGNET_SELECTOR);
      if (t && magnetEl === t && (!e.relatedTarget || !t.contains(e.relatedTarget))) {
        magnetEl = null;
        t.style.transform = '';
      }
    });
    document.addEventListener('mousemove', e => {
      if (!magnetEl) return;
      const r = magnetEl.getBoundingClientRect();
      const relX = e.clientX - (r.left + r.width / 2);
      const relY = e.clientY - (r.top + r.height / 2);
      magnetEl.style.transform = `translate(${relX * 0.22}px, ${relY * 0.22}px)`;
    }, { passive: true });
  }

  if (!isTouch) (function animCursor() {
    let tx = mx, ty = my, targetSize = null;
    if (magnetEl) {
      const r = magnetEl.getBoundingClientRect();
      tx = r.left + r.width / 2;
      ty = r.top + r.height / 2;
      targetSize = Math.max(r.height * 1.65, 76);
    }
    const pull = magnetEl ? 0.24 : 0.16;
    rx += (tx - rx) * pull;
    ry += (ty - ry) * pull;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';

    if (targetSize !== null) {
      ringSize += (targetSize - ringSize) * 0.22;
      ring.style.width = ringSize + 'px';
      ring.style.height = ringSize + 'px';
      ring.classList.add('magnet');
      dot.style.opacity = '0';
    } else if (ringSize !== 30) {
      ringSize += (30 - ringSize) * 0.28;
      if (Math.abs(ringSize - 30) < 0.5) {
        ringSize = 30;
        ring.style.width = '';
        ring.style.height = '';
      } else {
        ring.style.width = ringSize + 'px';
        ring.style.height = ringSize + 'px';
      }
      ring.classList.remove('magnet');
      dot.style.opacity = '';
    } else {
      ring.classList.remove('magnet');
      dot.style.opacity = '';
    }
    requestAnimationFrame(animCursor);
  })();

  /* ── CORNER-BRACKET INJECTION ────────────── */
  document.querySelectorAll('.bracket').forEach(el => {
    ['tl', 'tr', 'bl', 'br'].forEach(pos => {
      const s = document.createElement('span');
      s.className = 'br-corner br-' + pos;
      el.appendChild(s);
    });
  });

  /* ── CURSOR TRAIL CANVAS ──────────────── */
  const canvas = document.getElementById('trailCanvas');
  const ctx = canvas.getContext('2d');
  let W, H;
  function resizeCanvas() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
  resizeCanvas();
  addEventListener('resize', resizeCanvas, { passive: true });

  const TRAIL_LEN = 24;
  const trail = Array.from({ length: TRAIL_LEN }, () => ({ x: 0, y: 0, alpha: 0 }));
  let trailIdx = 0;

  if (!isTouch) {
    document.addEventListener('mousemove', e => {
      trail[trailIdx] = { x: e.clientX, y: e.clientY, alpha: 1 };
      trailIdx = (trailIdx + 1) % TRAIL_LEN;
    }, { passive: true });
  }

  function drawTrail() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < TRAIL_LEN; i++) {
      const t = trail[(trailIdx - i + TRAIL_LEN) % TRAIL_LEN];
      if (!t.alpha) continue;
      const a = t.alpha * (1 - i / TRAIL_LEN) * 0.35;
      const r = 3 * (1 - i / TRAIL_LEN);
      ctx.beginPath();
      ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(184,255,0,${a})`;
      ctx.fill();
      t.alpha = Math.max(0, t.alpha - 0.04);
    }
    requestAnimationFrame(drawTrail);
  }
  if (!isTouch) drawTrail();

  /* ── LOGIN → BIOS FLOW ────────────────── */
  const enterBtn = document.getElementById('enterBtn');
  if (enterBtn) enterBtn.addEventListener('click', startBios);

  function startBios() {
    const ls = document.getElementById('loginScreen');
    ls.classList.add('hidden');
    setTimeout(() => {
      ls.style.display = 'none';
      const biosEl = document.getElementById('biosScreen');
      biosEl.style.display = 'flex';
      runBios();
    }, 800);
  }

  function runBios() {
    const biosFill = document.getElementById('biosProgress');
    const biosPct = document.getElementById('biosPct');
    const BOOT_DUR = reduceMotion ? 400 : 3000;
    const t0 = performance.now();

    (function animBios(now) {
      const p = Math.min((now - t0) / BOOT_DUR, 1);
      const e = 1 - Math.pow(1 - p, 2);
      const pct = Math.round(e * 100);
      if (biosFill) biosFill.style.width = pct + '%';
      if (biosPct) biosPct.textContent = pct + '%';
      if (p < 1) requestAnimationFrame(animBios);
      else {
        setTimeout(() => {
          document.getElementById('biosScreen').classList.add('hidden');
          document.getElementById('osShell').classList.add('visible');
          initShell();
        }, 350);
      }
    })(t0);
  }

  /* ── HERO DATE ─────────────────────────── */
  const heroDate = document.getElementById('heroDate');
  if (heroDate) {
    heroDate.textContent = new Date().toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }).toUpperCase();
  }

  /* ── CLICK SOUND EFFECTS (synthesized, no audio files needed) ── */
  (function setupClickSounds() {
    if (reduceMotion) return; // respect users who've asked for less stimulation
    let actx;
    function getCtx() {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      return actx;
    }
    function blip() {
      try {
        const ac = getCtx();
        const t0 = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1180, t0);
        osc.frequency.exponentialRampToValueAtTime(380, t0 + 0.07);
        gain.gain.setValueAtTime(0.05, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
        osc.connect(gain).connect(ac.destination);
        osc.start(t0);
        osc.stop(t0 + 0.1);
      } catch (e) { /* audio unsupported — fail silently */ }
    }
    const CLICK_SELECTOR = [
      'a', 'button', '.mob-link', '.nav-pill-link', '.nav-soc', '.nav-search-btn',
      '.nav-brand', '.hamburger', '.btn-terminal', '.footer-top', '.lc-link',
      '.c-link', '.ext-link', '.project-file', '.pf-github', '.login-btn',
      '.term-mobile-tab', '.term-mobile-close', '.visitor-floater', '.lc-card',
      '.palette-list li', '[data-cmd]'
    ].join(',');
    document.addEventListener('click', e => {
      if (e.target.closest(CLICK_SELECTOR)) blip();
    }, { passive: true });
  })();

  /* ── HAMBURGER ──────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('.mob-link').forEach(l => {
      l.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── SMOOTH SCROLL ──────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      const offset = document.getElementById('nav') ? document.getElementById('nav').offsetHeight : 0;
      const top = t.getBoundingClientRect().top + scrollY - offset - 40;
      scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── REVEAL ON SCROLL ─────────────────── */
  function setupReveal() {
    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if (!elements.length) return;
    if (!('IntersectionObserver' in window)) {
        elements.forEach(el => el.classList.add('in'));
        return;
    }
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    elements.forEach(el => observer.observe(el));
  }

  /* ── COUNTER ANIMATION ──────────────────── */
  function animateCounter(el) {
    if (el._animated) return;
    el._animated = true;
    const target = parseFloat(el.getAttribute('data-target'));
    const dec = parseInt(el.getAttribute('data-decimal') || '0', 10);
    const dur = reduceMotion ? 200 : 1800;
    const t0c = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0c) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(dec);
    })(t0c);
  }
  function setupCounters() {
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) animateCounter(e.target); });
      }, { threshold: .3 });
      document.querySelectorAll('.metric-num[data-target]').forEach(c => obs.observe(c));
    } else {
      document.querySelectorAll('.metric-num[data-target]').forEach(animateCounter);
    }
  }

  /* ── CARD GLOW + TILT HOVER ─────────────── */
  function setupCardEffects() {
    if (isTouch) return;
    document.querySelectorAll('.metric-card,.career-item').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    document.querySelectorAll('.metric-card,.lc-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) translateY(-2px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ── GLITCH ON HERO NAME ────────────────── */
  function setupGlitch() {
    const nameSub = document.querySelector('.name-sub');
    if (nameSub && !reduceMotion) {
      setInterval(() => {
        if (Math.random() > .85) {
          nameSub.style.transform = `translate(${(Math.random() - .5) * 4}px,0) skewX(${(Math.random() - .5) * 2}deg)`;
          setTimeout(() => { nameSub.style.transform = ''; }, 80);
        }
      }, 1200);
    }
  }

  /* ── INTERACTIVE TERMINAL ───────────────── */
  function initTerminal() {
    const body = document.getElementById('termBody');
    const input = document.getElementById('termInput');
    if (!body || !input) return;

    const history = [];
    let histPos = -1;

    const CMDS = {
      help() {
        return `<span class="t-output">Available commands:
  <span style="color:var(--accent)">skills</span>    — list all technical skills
  <span style="color:var(--accent)">whoami</span>    — about Atharva
  <span style="color:var(--accent)">projects</span>  — view project list
  <span style="color:var(--accent)">leetcode</span>  — submission stats
  <span style="color:var(--accent)">contact</span>   — get contact info
  <span style="color:var(--accent)">clear</span>     — clear terminal
  <span style="color:var(--accent)">date</span>      — current date</span>`;
      },
      whoami() {
        return `<span class="t-output">Atharva Hinge — Frontend & Python Developer
B.E. Electronics & Telecom @ Pillai College of Engineering
CGPA: 8.45 | Navi Mumbai, India
Expanding into AI/ML & agentic systems.</span>`;
      },
      skills() {
        return `<span class="t-output"><span style="color:var(--accent)">FRONTEND:</span> React.js · JavaScript · HTML/CSS · Tailwind · Figma
<span style="color:var(--accent)">AI/ML:    </span> Python · TensorFlow · PyTorch · OpenCV · LangChain
<span style="color:var(--accent)">BACKEND:  </span> FastAPI · Node.js · REST APIs · AWS · Docker
<span style="color:var(--accent)">TOOLS:    </span> Git · VS Code · Postman · Linux</span>`;
      },
      projects() {
        return `<span class="t-output">[001] ISL → Text & Speech Converter (TensorFlow, OpenCV)
[002] Traffic Control System (8051 MCU, Embedded C)
[003] AI Agent Pipeline [CLASSIFIED] — coming soon</span>`;
      },
      contact() {
        return `<span class="t-output">Email:    atharvahinge1005@gmail.com
Phone:    +91 70216 10509
GitHub:   github.com/athar7a-H
LinkedIn: linkedin.com/in/atharva-hinge-9ab646384</span>`;
      },
      leetcode() {
        const t = document.getElementById('lcTotal'), a = document.getElementById('lcActive'), s = document.getElementById('lcStreak');
        return `<span class="t-output">LeetCode: leetcode.com/u/Athar7a
Submissions (1yr): ${t ? t.textContent : '—'}
Active days:       ${a ? a.textContent : '—'}
Max streak:        ${s ? s.textContent : '—'}</span>`;
      },
      date() {
        return `<span class="t-output">${new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'medium' })}</span>`;
      },
      clear() { body.innerHTML = ''; return null; }
    };

    function appendLine(html) {
      const d = document.createElement('div');
      d.innerHTML = html;
      body.appendChild(d);
      body.scrollTop = body.scrollHeight;
    }

    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp') {
        if (history.length && histPos < history.length - 1) {
          histPos++;
          input.value = history[history.length - 1 - histPos];
        }
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowDown') {
        if (histPos > 0) { histPos--; input.value = history[history.length - 1 - histPos]; }
        else { histPos = -1; input.value = ''; }
        e.preventDefault();
        return;
      }
      if (e.key !== 'Enter') return;
      const cmd = input.value.trim().toLowerCase();
      input.value = '';
      if (!cmd) return;
      history.push(cmd);
      histPos = -1;
      appendLine(`<div class="t-line"><span class="t-prompt">$</span>${cmd}</div>`);
      if (CMDS[cmd]) {
        const out = CMDS[cmd]();
        if (out !== null) appendLine(out);
      } else {
        appendLine(`<span class="t-error">command not found: ${cmd} — type 'help'</span>`);
      }
    });
  }

  /* ── NAV PILL: Hide on scroll down, show on scroll up (desktop only) ── */
  function setupNavPill() {
    const nav = document.getElementById('nav');
    const links = [...document.querySelectorAll('.nav-pill-link')];
    let lastY = window.scrollY;

    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 20);

      // ignore tiny scroll jitter
      if (Math.abs(y - lastY) > 6) {
        // hide when scrolling DOWN past the top region, reveal when scrolling UP
        // applies on both desktop (non-responsive) and mobile (responsive)
        if (y > lastY && y > 120) {
          nav.classList.add('nav-hidden');
        } else {
          nav.classList.remove('nav-hidden');
        }
        lastY = y;
      }
    }, { passive: true });

    // Active link highlighting
    const sections = links.map(l => document.querySelector('#' + l.dataset.section)).filter(Boolean);
    if ('IntersectionObserver' in window && sections.length) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            links.forEach(l => l.classList.toggle('active', l.dataset.section === en.target.id));
          }
        });
      }, { threshold: 0.35, rootMargin: '-20% 0px -40% 0px' });
      sections.forEach(s => io.observe(s));
    }
  }

  /* ── COMMAND PALETTE ── */
  function setupPalette() {
    const btn = document.getElementById('navSearchBtn');
    const palette = document.getElementById('palette');
    const backdrop = document.getElementById('paletteBackdrop');
    const input = document.getElementById('paletteInput');
    const list = document.getElementById('paletteList');
    if (!btn || !palette) return;

    const ITEMS = [
      { label: 'Home',        kind: 'section', action: () => jump('#hero') },
      { label: 'About',       kind: 'section', action: () => jump('#about') },
      { label: 'Career',      kind: 'section', action: () => jump('#experience') },
      { label: 'Projects',    kind: 'section', action: () => jump('#work') },
      { label: 'LeetCode',    kind: 'section', action: () => jump('#leetcode') },
      { label: 'Contact',     kind: 'section', action: () => jump('#contact') },
      { label: 'Email me',       kind: 'action',  action: () => location.href = 'mailto:atharvahinge1005@gmail.com' },
      { label: 'GitHub profile', kind: 'link',    action: () => open('https://github.com/athar7a-H', '_blank') },
      { label: 'LinkedIn',       kind: 'link',    action: () => open('https://www.linkedin.com/in/atharva-hinge-9ab646384', '_blank') },
      { label: 'LeetCode profile', kind: 'link',  action: () => open('https://leetcode.com/u/Athar7a_10', '_blank') },
    ];

    let sel = 0;
    function jump(id){ const t = document.querySelector(id); if (t) scrollTo({top:t.getBoundingClientRect().top + scrollY - 90, behavior:'smooth'}); close(); }
    function open_() {
      palette.classList.add('open'); backdrop.classList.add('open');
      input.value = ''; render(''); setTimeout(()=>input.focus(),50);
    }
    function close() {
      palette.classList.remove('open'); backdrop.classList.remove('open');
    }
    function render(q) {
      const f = ITEMS.filter(i => i.label.toLowerCase().includes(q.toLowerCase()));
      sel = 0;
      if (!f.length) { list.innerHTML = '<li class="palette-empty">No matches.</li>'; return; }
      list.innerHTML = f.map((it,i)=>`<li class="palette-item${i===0?' sel':''}" data-i="${i}"><span>${it.label}</span><span class="pi-kind">${it.kind}</span></li>`).join('');
      [...list.querySelectorAll('.palette-item')].forEach(el=>{
        el.addEventListener('click', ()=> f[parseInt(el.dataset.i,10)].action());
        el.addEventListener('mouseenter', ()=>{
          list.querySelectorAll('.palette-item').forEach(x=>x.classList.remove('sel'));
          el.classList.add('sel'); sel = parseInt(el.dataset.i,10);
        });
      });
    }

    btn.addEventListener('click', open_);
    backdrop.addEventListener('click', close);
    input.addEventListener('input', e => render(e.target.value));
    input.addEventListener('keydown', e => {
      const items = [...list.querySelectorAll('.palette-item')];
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowDown') { sel = Math.min(sel+1, items.length-1); items.forEach((x,i)=>x.classList.toggle('sel', i===sel)); items[sel]?.scrollIntoView({block:'nearest'}); e.preventDefault(); }
      else if (e.key === 'ArrowUp')   { sel = Math.max(sel-1, 0); items.forEach((x,i)=>x.classList.toggle('sel', i===sel)); items[sel]?.scrollIntoView({block:'nearest'}); e.preventDefault(); }
      else if (e.key === 'Enter') { items[sel]?.click(); }
    });

    addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open_(); }
    });
  }

  /* ── LEETCODE HEATMAP ────────────────────── */
  function initLeetcodeHeatmap() {
    const card = document.querySelector('.lc-card');
    if (card) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', e => {
        if (e.target.closest('a')) return; // explicit links keep their own behavior
        window.open('https://leetcode.com/u/Athar7a_10', '_blank', 'noopener');
      });
    }
    const grid = document.getElementById('lcGrid');
    const monthsEl = document.getElementById('lcMonths');
    if (!grid || !monthsEl) return;
    const USERNAME = 'Athar7a';
    const TODAY = new Date();

    function buildSnapshot() {
      const m = {};
      const offsets = [ [-1, 2], [-2, 1], [-3, 3], [-4, 1], [-6, 2], [-7, 1], [-8, 4], [-9, 2], [-11, 1], [-13, 2], [-15, 1], [-17, 3], [-19, 1], [-21, 2], [-23, 1], [-25, 2], [-27, 1], [-29, 3], [-32, 1], [-35, 2] ];
      offsets.forEach(([off, count]) => {
        const d = new Date(TODAY); d.setDate(d.getDate() + off);
        m[d.toISOString().slice(0, 10)] = count;
      });
      return m;
    }

    function levelClass(c) {
      if (c <= 0) return 'l0';
      if (c === 1) return 'l1';
      if (c === 2) return 'l2';
      if (c <= 4) return 'l3';
      return 'l4';
    }

    function render(map) {
      const start = new Date(TODAY); start.setDate(start.getDate() - 364);
      start.setDate(start.getDate() - start.getDay());
      const cells = []; const cursor = new Date(start);
      while (cursor <= TODAY) {
        const key = cursor.toISOString().slice(0, 10);
        cells.push({ date: new Date(cursor), count: map[key] || 0 });
        cursor.setDate(cursor.getDate() + 1);
      }
      let total = 0, active = 0, maxStreak = 0, curStreak = 0;
      cells.forEach(c => {
        if (c.count > 0) { total += c.count; active++; curStreak++; maxStreak = Math.max(maxStreak, curStreak); }
        else curStreak = 0;
      });

      grid.innerHTML = '';
      const weeks = Math.ceil(cells.length / 7);
      const frag = document.createDocumentFragment();
      for (let w = 0; w < weeks; w++) {
        const col = document.createElement('div');
        col.className = 'lc-col';
        for (let d = 0; d < 7; d++) {
          const cell = cells[w * 7 + d];
          const div = document.createElement('div');
          div.className = 'lc-cell ' + (cell ? levelClass(cell.count) : 'l0');
          if (cell) div.title = cell.date.toDateString() + ' — ' + cell.count + ' submission' + (cell.count === 1 ? '' : 's');
          col.appendChild(div);
        }
        frag.appendChild(col);
      }
      grid.appendChild(frag);

      monthsEl.innerHTML = '';
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      let lastMonth = -1;
      for (let w = 0; w < weeks; w++) {
        const cellDate = cells[w * 7] ? cells[w * 7].date : null;
        const span = document.createElement('span');
        if (cellDate && cellDate.getMonth() !== lastMonth && cellDate.getDate() <= 7) {
          span.textContent = monthNames[cellDate.getMonth()];
          lastMonth = cellDate.getMonth();
        }
        monthsEl.appendChild(span);
      }

      const totalEl = document.getElementById('lcTotal');
      const activeEl = document.getElementById('lcActive');
      const streakEl = document.getElementById('lcStreak');
      if (totalEl) totalEl.textContent = total;
      if (activeEl) activeEl.textContent = active;
      if (streakEl) streakEl.textContent = maxStreak;
    }

    render(buildSnapshot());

    fetch('https://leetcode-stats-api.herokuapp.com/' + USERNAME)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (!data || !data.submissionCalendar) return;
        let cal = data.submissionCalendar;
        if (typeof cal === 'string') { try { cal = JSON.parse(cal); } catch (e) { return; } }
        const map = {};
        Object.keys(cal).forEach(ts => {
          const d = new Date(parseInt(ts, 10) * 1000);
          map[d.toISOString().slice(0, 10)] = cal[ts];
        });
        render(map);
      })
      .catch(() => { /* offline fallback */ });
  }

  /* ── DRAGGABLE FLOATING TERMINAL ────────────────── */
  function setupDraggableTerminal() {
    const termPanel = document.getElementById('termPanel');
    if (!termPanel) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    const STORAGE_KEY = 'terminal:position:v3';

    // Load saved position
    function loadTerminalPosition() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return parsed;
          }
        }
      } catch (err) {}
      return { x: 0, y: 0 };
    }

    function saveTerminalPosition() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: currentX, y: currentY })); } 
      catch (err) {}
    }

    function clampPosition(x, y) {
      const rect = termPanel.getBoundingClientRect();
      const baseLeft = rect.left - x, baseTop = rect.top - y;
      const minX = -baseLeft + 8;
      const maxX = window.innerWidth - rect.width - baseLeft - 8;
      const minY = -baseTop + 8;
      const maxY = window.innerHeight - rect.height - baseTop - 8;
      return {
        x: Math.min(Math.max(x, Math.min(minX, maxX)), Math.max(minX, maxX)),
        y: Math.min(Math.max(y, Math.min(minY, maxY)), Math.max(minY, maxY))
      };
    }

    const pos = clampPosition(loadTerminalPosition().x, loadTerminalPosition().y);
    currentX = pos.x;
    currentY = pos.y;
    updateTerminalTransform();

    const termBar = termPanel.querySelector('.terminal-bar');
    if (termBar) {
      termBar.addEventListener('mousedown', startDrag);
    }

    function startDrag(e) {
      isDragging = true;
      startX = e.clientX - currentX;
      startY = e.clientY - currentY;
      termBar.style.cursor = 'grabbing';
      playSound('grab');
    }

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      currentX = e.clientX - startX;
      currentY = e.clientY - startY;
      updateTerminalTransform();
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        termBar.style.cursor = 'grab';
        playSound('release');
        const clamped = clampPosition(currentX, currentY);
        currentX = clamped.x; currentY = clamped.y;
        updateTerminalTransform();
        saveTerminalPosition();
      }
    });

    function updateTerminalTransform() {
      termPanel.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }

    // Audio effects for terminal dragging
    function playSound(type) {
      if (isTouch) return;
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const frequency = type === 'grab' ? 300 : 200;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.1);
      } catch (err) {}
    }
  }

  /* ── VISITOR ANALYTICS (floating widget, local telemetry) ── */
  function setupVisitorAnalytics() {
    const elVisits = document.getElementById('vfVisits');
    const elMaxTime = document.getElementById('vfMaxTime');
    if (!elVisits || !elMaxTime) return;

    const KEY = 'siteAnalytics:v2';
    let data;
    try { data = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (err) { data = {}; }
    data.visits = (data.visits || 0) + 1;
    data.maxSeconds = data.maxSeconds || 0;

    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (err) {}
    }
    save();

    function fmtTime(s) {
      if (s < 60) return `${s}s`;
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    elVisits.textContent = data.visits;
    elMaxTime.textContent = fmtTime(data.maxSeconds);

    const sessionStart = Date.now();
    function updateMax() {
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
      if (elapsed > data.maxSeconds) {
        data.maxSeconds = elapsed;
        elMaxTime.textContent = fmtTime(data.maxSeconds);
        save();
      }
    }
    const interval = setInterval(updateMax, 5000);
    window.addEventListener('beforeunload', updateMax);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') updateMax();
    });
  }

  /* ── BUTTERY SMOOTH SCROLL (desktop wheel only) ──── */
  function setupSmoothScroll() {
    if (isTouch) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let current = window.scrollY;
    let target = window.scrollY;
    const ease = 0.09;
    let ticking = false;

    function maxScroll() {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }

    function raf() {
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.5) current = target;
      window.scrollTo(0, current);
      if (current !== target) {
        requestAnimationFrame(raf);
      } else {
        ticking = false;
      }
    }

    window.addEventListener('wheel', (e) => {
      if (e.target.closest('.terminal-body, .palette-list, .lc-cal-wrap, .t-input-row, #termInput')) return;
      e.preventDefault();
      target = Math.min(Math.max(target + e.deltaY, 0), maxScroll());
      if (!ticking) { ticking = true; requestAnimationFrame(raf); }
    }, { passive: false });

    window.addEventListener('scroll', () => {
      if (!ticking) { current = window.scrollY; target = window.scrollY; }
    }, { passive: true });

    window.addEventListener('resize', () => { target = Math.min(target, maxScroll()); });
  }

  /* ── ACID GREEN SCROLL GLOW LINE ─────────────────── */
  function setupScrollGlowLine() {
    const line = document.getElementById('scrollGlowLine');
    if (!line) return;
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      const trackWidth = window.innerWidth - 220;
      const x = progress * trackWidth;
      line.style.setProperty('--glow-x', `${x}px`);
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ── TOP STATUS BAR (WiFi, Battery, Time) ────────── */
  function setupStatusBar() {
    const statusBar = document.getElementById('statusBar');
    if (!statusBar) return;

    // SVG WiFi Icon
    const wifiSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`;

    function updateTime() {
      const now = new Date();
      const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const date = now.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
      const battery = Math.floor(Math.random() * 20 + 80); // Simulate 80-100%
      
      statusBar.innerHTML = `
        <span class="status-item">${wifiSvg} AthAr-7a</span>
        <span class="status-item">⚡ ${battery}%</span>
        <span class="status-item">${time} &nbsp;|&nbsp; ${date}</span>
      `;
    }

    updateTime();
    setInterval(updateTime, 60000);
  }

  /* ── EXPERIENCE SECTION PROGRESS GLOW LINE ───────── */
  function setupExperienceProgress() {
    const section = document.getElementById('experience');
    const fill = document.getElementById('expTimelineFill');
    if (!section || !fill) return;

    function update() {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      
      // Calculate how far down the section we've scrolled
      // Start filling when the top of the track hits halfway down the screen
      const track = fill.parentElement;
      const trackRect = track.getBoundingClientRect();
      const startPoint = vh / 2;
      
      let progress = (startPoint - trackRect.top) / trackRect.height;
      progress = Math.max(0, Math.min(1, progress));
      
      // Animates the height (glow dot rides at the bottom of the fill)
      fill.style.height = `${progress * 100}%`;
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ── INITIALIZE ALL FEATURES ─────────────── */
  let shellInitialized = false;
  /* ── MOBILE TERMINAL DRAWER (tap tab to reveal, tap backdrop/✕ to close) ── */
  function setupMobileTerminal() {
    const termPanel = document.getElementById('termPanel');
    const tab = document.getElementById('termMobileTab');
    const backdrop = document.getElementById('termMobileBackdrop');
    const closeBtn = document.getElementById('termMobileClose');
    if (!termPanel || !tab || !backdrop) return;

    const mq = window.matchMedia('(max-width:900px)');

    function openDrawer() {
      termPanel.classList.add('mobile-open');
      backdrop.classList.add('show');
      tab.classList.add('hide');
    }
    function closeDrawer() {
      termPanel.classList.remove('mobile-open');
      backdrop.classList.remove('show');
      tab.classList.remove('hide');
    }

    tab.addEventListener('click', openDrawer);
    backdrop.addEventListener('click', closeDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    // If the viewport grows past mobile breakpoint, reset drawer state
    mq.addEventListener ? mq.addEventListener('change', closeDrawer) : mq.addListener(closeDrawer);
  }

  function initShell() {
    if (shellInitialized) return;
    shellInitialized = true;

    setupReveal();
    setupCounters();
    setupCardEffects();
    setupGlitch();

    setupNavPill();
    setupPalette();

    initTerminal();
    initLeetcodeHeatmap();
    
    // New Initializations
    setupDraggableTerminal();
    setupMobileTerminal();
    setupStatusBar();
    setupExperienceProgress();
    setupScrollGlowLine();
    setupVisitorAnalytics();
    setupSmoothScroll();
  }
})();