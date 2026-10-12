/* ==========================================================================
   script.js
   0. Hero typing intro
   1. Fade-in on scroll        4. Flip cards (How I use AI)
   2. Mobile menu              5. Button text scramble on hover
   3. Draggable stickers       6. Click ripple             7. Nav underline that follows the section
   7b. Live Philippine-time clock (Availability)
   7c. Projects carousel + details window
   7d. Scroll-progress line
   7e. Contact globe (canvas)
   8. Mouse-only: card light, soft glow, hero parallax, title letters (hover outline + drag)
   ========================================================================== */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

  /* Splits text into words and letters: <span.word><span.ch>A</span>...</span>. Used by the intro and the title hover effect. */
  const wrapLetters = (el) => {
    [...el.childNodes].forEach((node) => {
      if (node.nodeType !== 3 || !node.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(' '); return; }
        const word = document.createElement('span');
        word.className = 'word';
        word.setAttribute('aria-hidden', 'true');
        [...part].forEach((char) => {
          const ch = document.createElement('span');
          ch.className = 'ch';
          ch.textContent = char;
          word.append(ch);
        });
        frag.append(word);
      });
      node.replaceWith(frag);
    });
  };

  /* If a .webp is missing, drop the <source> so the PNG shows instead. */
  const fixPictures = (scope) => scope.querySelectorAll('picture img').forEach((img) => {
    const drop = () => img.closest('picture').querySelectorAll('source').forEach((s) => s.remove());
    if (img.complete && img.currentSrc && !img.naturalWidth) drop();
    else img.addEventListener('error', drop, { once: true });
  });
  fixPictures(document);

  /* ---------- 0. Hero typing intro ----------
     index.html adds the "typing" class before the page paints; this types the headline out letter by letter,
     then removes the class so the rest of the hero fades in. Types once, no erasing, no loop. */
  const heroTitle = document.querySelector('.hero__title');
  if (root.classList.contains('typing') && heroTitle) {
    heroTitle.setAttribute('aria-label', heroTitle.textContent.replace(/\s+/g, ' ').trim());   // screen readers get the whole headline
    heroTitle.querySelectorAll('.hero__title-role, .hero__title-focus').forEach(wrapLetters);
    const typed = [...heroTitle.querySelectorAll('.ch')];
    const caret = document.createElement('span');
    caret.className = 'type-caret';
    caret.setAttribute('aria-hidden', 'true');
    root.classList.add('type-ready');

    let i = 0;
    const step = () => {
      if (i >= typed.length) {
        setTimeout(() => root.classList.remove('typing', 'type-ready'), 250);   // the rest of the hero fades in
        setTimeout(() => caret.remove(), 1400);                                 // caret blinks a little longer
        return;
      }
      const ch = typed[i];
      ch.classList.add('is-typed');
      ch.after(caret);
      const next = typed[++i];
      let delay = 35 + Math.random() * 30;
      if (next && next.closest('.hero__title-focus') && !ch.closest('.hero__title-focus')) delay += 200;   // pause between the two lines
      else if (next && next.closest('.word') !== ch.closest('.word')) delay += 50;                          // small pause between words
      setTimeout(step, delay);
    };
    typed[0].before(caret);
    setTimeout(step, 300);
  }


  /* ---------- 1. Fade-in on scroll (add class "reveal" to anything) ---------- */
  const items = document.querySelectorAll('.reveal');
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach((el) => {
      el.style.setProperty('--d', `${([...el.parentElement.children].indexOf(el) % 6) * 70}ms`);
      io.observe(el);
    });
  } else {
    items.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- 2. Mobile menu ---------- */
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    const label = toggle.querySelector('.nav__toggle-label');
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      label.textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
  }

  /* ---------- 3. Draggable stickers and chips (class "sticker" or attribute data-drag). They spring back when released. ---------- */
  document.querySelectorAll('.sticker, [data-drag]').forEach((el) => {
    let x = 0, y = 0, startX = 0, startY = 0;
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      startX = e.clientX - x; startY = e.clientY - y;
      el.classList.add('is-dragging');
    });
    el.addEventListener('pointermove', (e) => {
      if (!el.hasPointerCapture(e.pointerId)) return;
      x = e.clientX - startX; y = e.clientY - startY;
      el.style.translate = `${x}px ${y}px`;
    });
    const drop = () => {                 // let go: spring back to the starting spot
      el.classList.remove('is-dragging');
      x = 0; y = 0;
      el.style.translate = '0px 0px';
    };
    el.addEventListener('pointerup', drop);
    el.addEventListener('pointercancel', drop);
  });

  /* ---------- 4. Flip cards ----------
     Mouse: hover flips. Touch: tap flips. Keyboard: Enter or Space flips. */
  const hoverFlip = mouse && !reduce;
  document.querySelectorAll('.flip').forEach((card) => {
    const front = card.querySelector('.flip__front');
    const back = card.querySelector('.flip__back');
    const host = card.parentElement;          // hover is tracked on the <li>, which never tilts (no flicker)
    let pointer = '';
    const set = (on) => {
      card.classList.toggle('is-flipped', on);
      card.setAttribute('aria-pressed', String(on));
      front.setAttribute('aria-hidden', String(on));
      back.setAttribute('aria-hidden', String(!on));
    };
    if (hoverFlip) {
      front.querySelectorAll('.flip__hint').forEach((h) => { h.textContent = 'Hover to flip'; });
      host.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') set(true); });
      host.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') set(false); });
    }
    host.addEventListener('pointerdown', (e) => { pointer = e.pointerType; });
    card.addEventListener('click', (e) => {
      if (hoverFlip && pointer === 'mouse' && e.detail > 0) return;   // hover already handled a mouse click
      set(!card.classList.contains('is-flipped'));
    });
  });

  /* ---------- 5. Button text scramble (add data-scramble to a button or link) ---------- */
  if (!reduce) {
    document.querySelectorAll('[data-scramble]').forEach((el) => {
      const original = el.textContent.trim();
      let timer;
      el.setAttribute('aria-label', original);   // screen readers always hear the real text
      el.textContent = original;                 // one text node; we only change its data, never replace it
      const node = el.firstChild;                // (replacing it mid-click made Safari drop the first click)
      const settle = () => { clearInterval(timer); node.data = original; el.style.width = ''; };
      const run = () => {
        clearInterval(timer);
        el.style.width = `${el.getBoundingClientRect().width}px`;  // lock the size so nothing around it jumps
        let frame = 0;
        const total = 14;
        timer = setInterval(() => {
          frame += 1;
          const settled = Math.floor((original.length * frame) / total);
          const letters = [...original];
          const open = letters.map((_, i) => i).filter((i) => i >= settled && /[a-z0-9]/i.test(letters[i]));
          const pool = open.map((i) => letters[i]);          // same letters, shuffled: the width never changes
          for (let k = pool.length - 1; k > 0; k--) {
            const r = Math.floor(Math.random() * (k + 1));
            [pool[k], pool[r]] = [pool[r], pool[k]];
          }
          open.forEach((i, k) => { letters[i] = pool[k]; });
          node.data = letters.join('');
          if (frame >= total) settle();
        }, 35);
      };
      el.addEventListener('pointerdown', settle);   // pressing a button always shows its real label at once
      el.addEventListener('pointerenter', run);
      el.addEventListener('focus', run);
    });
  }

  /* ---------- 6. Click ripple (skipped on buttons, links, stickers and title letters) ---------- */
  if (!reduce) {
    document.addEventListener('pointerdown', (e) => {
      if (e.button > 0 || e.target.closest('a, button, input, textarea, select, label, .sticker, .ch, .flip')) return;
      const ripple = document.createElement('div');
      ripple.className = `ripple${e.target.closest('.lane--light') ? ' is-light' : ''}`;
      ripple.setAttribute('aria-hidden', 'true');
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      ripple.innerHTML = '<i></i><i></i><i></i>';
      document.body.append(ripple);
      setTimeout(() => ripple.remove(), 1700);
    });
  }

  /* ---------- 7. Nav: the underline glides to the section you are in ---------- */
  const navLinks = [...document.querySelectorAll('.nav__link')];
  if (menu && navLinks.length) {
    const bar = document.createElement('li');
    bar.className = 'nav__indicator';
    bar.setAttribute('aria-hidden', 'true');
    menu.prepend(bar);
    // Sections without their own nav link count under the nearest one
    const group = { about: 'about', services: 'services', ai: 'services', projects: 'projects', skills: 'projects', availability: 'availability' };
    let active = null;
    const place = () => {
      const link = navLinks.find((a) => a.getAttribute('href') === `#${active}`);
      navLinks.forEach((a) => (a === link ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
      if (!link) { bar.style.opacity = '0'; return; }
      const cs = getComputedStyle(link);
      const padL = parseFloat(cs.paddingLeft);
      const padR = parseFloat(cs.paddingRight);
      bar.style.left = `${link.offsetLeft + padL}px`;
      bar.style.width = `${link.offsetWidth - padL - padR}px`;
      bar.style.top = `${link.offsetTop + link.offsetHeight - 8}px`;
      bar.style.opacity = '1';
      requestAnimationFrame(() => bar.classList.add('is-ready'));   // animate only after the first placement
    };
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { active = group[e.target.id] || null; place(); } });
    }, { rootMargin: '-45% 0px -54% 0px' });   // a thin band near the middle of the screen
    ['top', 'about', 'services', 'ai', 'projects', 'skills', 'availability', 'contact']
      .map((id) => document.getElementById(id)).filter(Boolean).forEach((s) => spy.observe(s));
    addEventListener('resize', place);
    if (document.fonts) document.fonts.ready.then(place);
  }

  /* ---------- 7c. Projects carousel (coverflow) + details window ----------
     Works for any number of slides. Click a side card to bring it forward, click the front card to open its details.
     Also: arrows, dots, left/right arrow keys, swipe or drag. */
  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const track = root.querySelector('.carousel__track');
    const slides = [...track.querySelectorAll('.slide')];
    if (!slides.length) return;
    const dialog = document.getElementById('project-dialog');
    const dialogBody = document.getElementById('project-dialog-body');
    let active = 0;

    // Controls (built here so adding a project never needs extra HTML)
    const ui = document.createElement('div');
    ui.className = 'carousel__ui';
    const prev = document.createElement('button');
    const next = document.createElement('button');
    [prev, next].forEach((b, k) => {
      b.type = 'button';
      b.className = 'btn btn--outline btn--small';
      b.textContent = k ? '→' : '←';
      b.setAttribute('aria-label', k ? 'Next project' : 'Previous project');
    });
    const dots = document.createElement('div');
    dots.className = 'carousel__dots';
    const dotButtons = slides.map((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'carousel__dot';
      d.setAttribute('aria-label', `Go to project ${i + 1}`);
      d.addEventListener('click', () => go(i));
      dots.append(d);
      return d;
    });
    const status = document.createElement('p');
    status.className = 'visually-hidden';
    status.setAttribute('aria-live', 'polite');
    ui.append(prev, dots, next, status);
    if (slides.length > 1) root.append(ui);

    const layout = () => {
      slides.forEach((slide, i) => {
        const d = i - active;
        const a = Math.abs(d);
        const cardEl = slide.querySelector('.slide__card');
        slide.style.transform = `translateX(${-50 + d * 62}%) translateZ(${-a * 90}px) rotateY(${-Math.sign(d) * Math.min(a, 1) * 35}deg) scale(${1 - Math.min(a, 3) * 0.07})`;
        slide.style.opacity = a === 0 ? 1 : a === 1 ? 0.85 : a === 2 ? 0.45 : 0;
        slide.style.zIndex = 10 - a;
        slide.style.visibility = a > 2 ? 'hidden' : '';
        slide.style.pointerEvents = a > 2 ? 'none' : '';
        slide.classList.toggle('is-active', d === 0);
        slide.setAttribute('aria-roledescription', 'slide');
        slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
        slide.setAttribute('aria-hidden', String(d !== 0));
        cardEl.tabIndex = d === 0 ? 0 : -1;
      });
      dotButtons.forEach((d, i) => (i === active ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
      prev.disabled = active === 0;
      next.disabled = active === slides.length - 1;
      status.textContent = `Project ${active + 1} of ${slides.length}: ${slides[active].querySelector('.slide__title').textContent.trim()}`;
    };
    const go = (n) => { active = Math.max(0, Math.min(slides.length - 1, n)); layout(); };

    prev.addEventListener('click', () => go(active - 1));
    next.addEventListener('click', () => go(active + 1));
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') go(active - 1);
      if (e.key === 'ArrowRight') go(active + 1);
    });

    // Details window
    const openDetails = (slide) => {
      if (!dialog || !dialog.showModal) return;
      dialogBody.innerHTML = slide.querySelector('.slide__details').innerHTML;
      fixPictures(dialogBody);
      dialog.setAttribute('aria-label', slide.querySelector('.slide__title').textContent.trim());
      dialog.showModal();
      dialog.scrollTop = 0;
    };
    slides.forEach((slide, i) => {
      slide.querySelector('.slide__card').addEventListener('click', () => (i === active ? openDetails(slide) : go(i)));
    });
    if (dialog) {
      dialog.querySelector('.project-dialog__close').addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });   // click outside closes
    }

    // Swipe or drag sideways to move
    let startX = null, moved = false, suppress = false;
    track.addEventListener('pointerdown', (e) => { startX = e.clientX; moved = false; });
    track.addEventListener('pointermove', (e) => { if (startX !== null && Math.abs(e.clientX - startX) > 8) moved = true; });
    track.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (moved && Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
      if (moved) { suppress = true; setTimeout(() => { suppress = false; }, 60); }   // a drag is not a click
    });
    track.addEventListener('pointercancel', () => { startX = null; });
    track.addEventListener('click', (e) => { if (suppress) { e.stopPropagation(); e.preventDefault(); } }, true);

    layout();
    requestAnimationFrame(() => root.classList.add('is-ready'));   // animate only after the first layout
  });

  /* ---------- 7b. Live Philippine-time clock ---------- */
  const clock = document.getElementById('clock');
  if (clock) {
    const phTime = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true });
    const phHour = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', hour12: false });
    const phDay = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', weekday: 'short' });
    const localTime = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' });
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const update = () => {
      const now = new Date();
      const hour = Number(phHour.format(now)) % 24;
      const day = DAYS.indexOf(phDay.format(now));          // 0 = Sunday, in Philippine time
      const workDay = day >= 1 && day <= 5;                 // Monday to Friday
      const lateDay = day >= 2 && day <= 6;                 // the 12 AM to 1 AM hour belongs to the evening before
      const online = (hour >= 21 && workDay) || (hour < 1 && lateDay);   // 9 PM to 1 AM Philippine time
      document.getElementById('ph-time').textContent = phTime.format(now);
      document.getElementById('ph-status').textContent = online ? 'Online now' : (workDay && hour < 21 ? 'Offline, back at 9 PM' : 'Offline, back Monday at 9 PM');
      document.getElementById('local-time').textContent = localTime.format(now);
      clock.classList.toggle('is-online', online);
    };
    update();
    clock.hidden = false;
    setInterval(update, 15000);
  }

  /* ---------- 7d. Scroll-progress line ---------- */
  const progress = document.querySelector('.scroll-progress');
  if (progress) {
    let queued = false;
    const update = () => {
      const max = root.scrollHeight - innerHeight;
      progress.style.setProperty('--p', max > 0 ? Math.min(1, Math.max(0, scrollY / max)).toFixed(4) : '0');
      queued = false;
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    update();
  }

  /* ---------- 7e. Contact globe: dotted land, rotating, with animated arcs from Manila ----------
     Drag sideways to spin it. Pauses off-screen and in hidden tabs. With reduced motion it is a still picture.
     Built to be cheap: dots are drawn in a few batches, buffers are reused, the ball is painted once,
     and a slow device automatically gets fewer dots, 1x sharpness and 30 frames per second. */
  const globeCanvas = document.querySelector('.globe canvas');
  if (globeCanvas && globeCanvas.getContext) {
    // Land map: 288 x 144 grid, one bit per cell (1 = land), base64. Source: Natural Earth (public domain).
    const LAND_W = 288, LAND_H = 144;
    const LAND_B64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//4AA///AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB///7/////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////////AAAAPwAAeAAAAAPgAAAAAAAAAAAAAAAAAAAAgP//g//////4AAAH/4AAAAAAAAH0AAAAAAAAAAAAAAAAAABwdz/+P//////wAAAD5gAAAAAAAAAPAAAAAAAAAAAAAAAAAB4ICe/4D//////4AAAAwAAAAABgAAAH2AAAAAAAAAAAAAAAAAP+Pb/wAA/////wAAAAAAAAAD8AAB///gAAP2AAAAAAAAAAAHxAAf/wAAP////wAAAAAAAAAPAAAH//+AAABAAAAAAAAAAAAP+DHe/8AAH////gAAAAAAAAA8AQD//////gDgAAAAAAAAAAAf//H4//gAH////AAAAAAAAAB4A9///////gH/AAAAgAP/AAAAP/we//+AD////AAAAAB/gAAcB9///////////wAAAAf//5//v/7/H3/gD///+AAA//3/A///h////////////wH4P/////////////////////////gAAf+QAhAAAAAAAAAAAAAAD////////////////////////+AAAOQAAGAAAAAAAAAAAAAA4////////////////////////8BwD4AAAAAAAAAAAAAAAAAADB3/////////3n/wA/8AA/gAAf+////////////////////+AQ/////////+FgPwAf4AAAAAB/5////////////////////+AB/////////4BPwAAPwAAAAAD/x//////////////////9/wAB/////////4AD+AAHwAAAAAD/5/////////////////+P+AAAP5AP/////4AH+YAAAAAAAAD/4f////////////////8OAAAAA8AB/////8AD/8AAAAAAAcBnwf//////////////+AA8AAAABsAAf/////gB/+AAAAAAAcAbh///////////////4AB+AAAAOAAAP/////8D//AAAAAAAeA3B///////////////gAD8AAAAAAAAD//////P//wAAAAABnAef///////////////0AD4AAAAAAAAL//////n//8AAAAADvj//////////////////gBwAAAAAAAAB//////n//8AAAAADPn//////////////////gBgAAAAAAAAB/////////oAAAAAAPf//////////////////gAAAAAAAAAAAf///////0eAAAAAAD//////////////////9gAAAAAAAAAAAP///////w/AAAAAAP//////////////////9AAAAAAAAAAAAP///////4BAAAAAAD//////////////////5gAAAAAAAAAAAH////////AAAAAAAB////O/w///////////wAAAAAAAAAAAAH///////YAAAAAAAB/8/+E/x///////////hgAAAAAAAAAAAP//////8AAAAAAAB/+OP+APx///////////DwAAAAAAAAAAAP//////8AAAAAAAB/wXn+OH4f/////////wCAAAAAAAAAAAAP//////wAAAAAAAB/gx////8f/////////wDAAAAAAAAAAAAH//////gAAAAAAAD/AQzn//4f///////+TADAAAAAAAAAAAAH//////AAAAAAAAB/ADhn//4f///////+DgGAAAAAAAAAAAAD/////+AAAAAAAAB+f5Bj//+/////////xweAAAAAAAAAAAAB//////AAAAAAAAAZ/4AYJ///////////Bz+AAAAAAAAAAAAA/////8AAAAAAAAA//4AAD///////////BH4AAAAAAAAAAAAAP////4AAAAAAAAB//8AAD///////////gOAAAAAAAAAAAAAAP////gAAAAAAAAD///j4D///////////wIAAAAAAAAAAAAAAF////gAAAAAAAAD/////////////////gAAAAAAAAAAAAAAAC//zhgAAAAAAAAD///////7/////////wAAAAAAAAAAAAAAADf/gAwAAAAAAAAP///////5/////////gAAAAAAAAAAAAAAADv/AAwAAAAAAAAf/////5/8/////////AAAAAAAAAAAAAAAAAv/AAQAAAAAAAA//////9//L////////AAAAAAAAAAAAAAAAAT/AAEAAAAAAAA//////+//8B//////+wAAAAAAAAAAAAAAAAB/ABwAAAAAAAB//////+f//Af/////8gAAAAAAAAAAAAAAAAB/ACcAAAAAAAD///////f//Af//f//gAAAAAAAAAAAAAAAAAB/h4HAAAAAAAD///////P/+AL/8P/yAAAAAAAAAAAAQAAAAAA/hwAeAAAAAAB///////H/8AD/wH/mAAAAAAAAAAAAAAAAAAAf/wGegAAAAAB///////n/4AD/gH/gAwAAAAAAAAAAAAAAAAAH/wAAAAAAAAB///////j/wAD/AH/wAwAAAAAAAAAAAAAAAAAAn+AAAAAAAAB///////z/AAB+AA/4AwAAAAAAAAAAAAAAAAAAD/AAAAAAAAD///////74AAB8AA/4AwAAAAAAAAAAAAAAAAAAAeAAAAAAAAD////////gAAA8AA/8AsAAAAAAAAAAAAAAAAAAAGAIAAAAAAB///////+CAAA8AAT4AGAAAAAAAAAAAAAAAAAAAGA/uAAAAAA////////+AAAcAARwBMAAAAAAAAAAAAAAAAAAADN/+AAAAAAf///////+AAAaAAQgCKAAAAAAAAAAAAAAAAAAAB3//gAAAAAf///////8AAACAAQAAOAAAAAAAAAAAAAAAAAAAAD//wAAAAAP///////8AAADAAIAEGAAAAAAAAAAAAAAAAAAAAD///AAAAAD/j/////4AAAAAAMAOAAAAAAAAAAAAAAAAAAAAAD///gAAAABADf////wAAAAABuAeAAAAAAAAAAAAAAAAAAAAAD///gAAAAAAAP////wAAAAAB2B8AAAAAAAAAAAAAAAAAAAAAH///wAAAAAAAf////AAAAAAA/D+AgAAAAAAAAAAAAAAAAAAAP///wAAAAAAAf///+AAAAAAAeH+8gAAAAAAAAAAAAAAAAAAAf///8AAAAAAAf///8AAAAAAAOH9AGAAAAAAAAAAAAAAAAAAAf////AAAAAAAf///4AAAAAAAPD5wHYAAAAAAAAAAAAAAAAAAP////+AAAAAAP///wAAAAAAAHj5xb/AQAAAAAAAAAAAAAAAAf/////AAAAAAH///wAAAAAAADgB4A/wYAAAAAAAAAAAAAAAAf/////wAAAAAH///gAAAAAAABgBIBP5wAAAAAAAAAAAAAAAAP/////wAAAAAD///wAAAAAAAAfAAAH8CAAAAAAAAAAAAAAAAP/////wAAAAAD///wAAAAAAAADyBAPmAAAAAAAAAAAAAAAAAH/////wAAAAAD///wAAAAAAAAABmABHAIAAAAAAAAAAAAAAAD/////gAAAAAB///wAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAD/////AAAAAAB///4AAAAAAAAAAAHBgAAAAAAAAAAAAAAAAAB////+AAAAAAD///4EAAAAAAAAAAPhgAAAAAAAAAAAAAAAAAB////+AAAAAAD///4MAAAAAAAAAD/hwAAAAAAAAAAAAAAAAAA////+AAAAAAH///weAAAAAAAAAH/xwAAQAAAAAAAAAAAAAAAP///+AAAAAAH///x8AAAAAAAAAP//4AAACAAAAAAAAAAAAAAH///+AAAAAAH///B8AAAAAAAAAP//4AAACAAAAAAAAAAAAAAD///8AAAAAAD//8B4AAAAAAAAAf//8AAAAAAAAAAAAAAAAAAD///8AAAAAAD//8B4AAAAAAAAH///+ABAAAAAAAAAAAAAAAAD///4AAAAAAB//+D4AAAAAAAAf////AAgAAAAAAAAAAAAAAAH///wAAAAAAB//+BwAAAAAAAAf////gAAAAAAAAAAAAAAAAAH//+AAAAAAAB//8BwAAAAAAAAf////wAAAAAAAAAAAAAAAAAH//8AAAAAAAA//4AAAAAAAAAAf////4AAAAAAAAAAAAAAAAAH//4AAAAAAAA//wAAAAAAAAAAf////4AAAAAAAAAAAAAAAAAH//4AAAAAAAA//wAAAAAAAAAAf////4AAAAAAAAAAAAAAAAAH//4AAAAAAAAf/gAAAAAAAAAAP////4AAAAAAAAAAAAAAAAAH//wAAAAAAAAP/AAAAAAAAAAAP////4AAAAAAAAAAAAAAAAAH//gAAAAAAAAP/AAAAAAAAAAAP/3//wAAAAAAAAAAAAAAAAAH//AAAAAAAAAP8AAAAAAAAAAAP8B//wAAAAAAAAAAAAAAAAAP/+AAAAAAAAAGAAAAAAAAAAAAPAAv/gAAAAAAAAAAAAAAAAAP/wAAAAAAAAAAAAAAAAAAAAAAAAAH/gAAQAAAAAAAAAAAAAAf/4AAAAAAAAAAAAAAAAAAAAAAAAAD/AAAYAAAAAAAAAAAAAAf/wAAAAAAAAAAAAAAAAAAAAAAAAAB8AAAOAAAAAAAAAAAAAAf+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAf8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAf4AAAAAAAAAAAAAAAAAAAAAAAAAAAOAABwAAAAAAAAAAAAAAf4AAAAAAAAAAAAAAAAAAAAAAAAAAAMAADgAAAAAAAAAAAAAAfwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAA/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAAAAAAAAAAAAAAA/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/AAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAQAAAAACAAAAgAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAH+AAAHEP/+f//wAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAB///gH////////+AAAAAAAAAAAAAAAAAAF8AAAAAAAAAAAAPP///wf//////////gAAAAAAAAAAAAAAAAP+AAAAAAAAH////////j////////////wAAAAAAAAAAAPgAA++AAAAAAH//////////n////////////+AAAAAAAAAAAfH8AP+AAAAAA////////////////////////8AAAAAAB///AP////+AAAAAB////////////////////////wAAAAAH//////////wAAAAAf////////////////////////AAAAAA//////////8AAAAA/////////////////////////+AAAAI///////////gAAHAf//////////////////////////gAAAOP/////////8AAAfgf/////////////////////////+AAAAAAP/////////4fB/AP/////////////////////////wAAAAAP///////////+Af///////////////////////////8AAAAAH//////////////////////////////////////////4AB4AB///////////////////////////////////////////AAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const bits = Uint8Array.from(atob(LAND_B64), (c) => c.charCodeAt(0));
    const isLand = (lat, lon) => {
      const x = Math.min(LAND_W - 1, Math.floor(((lon + 180) / 360) * LAND_W));
      const y = Math.min(LAND_H - 1, Math.floor(((90 - lat) / 180) * LAND_H));
      const i = y * LAND_W + x;
      return (bits[i >> 3] >> (7 - (i & 7))) & 1;
    };
    const RAD = Math.PI / 180, TAU = Math.PI * 2;
    const unit = (lat, lon) => [Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD), Math.cos(lat * RAD) * Math.cos(lon * RAD)];

    // Dots: an even spread of points over the sphere, keeping only land (flat x,y,z list)
    const GOLDEN = Math.PI * (3 - Math.sqrt(5));
    let dots = new Float32Array(0), dotsFor = 0;
    const buildDots = (n) => {
      if (n === dotsFor) return;
      dotsFor = n;
      const keep = [];
      for (let i = 0; i < n; i++) {
        const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), th = i * GOLDEN;
        const x = r * Math.sin(th), z = r * Math.cos(th);
        if (isLand(Math.asin(y) / RAD, Math.atan2(x, z) / RAD)) keep.push(x, y, z);
      }
      dots = Float32Array.from(keep);
    };

    // Arcs from Manila to places a Philippine assistant might work with
    const STEPS = 56;
    const HOME = unit(14.6, 121.0);
    const PLACES = [[37.8, -122.4], [40.7, -74.0], [51.5, -0.1], [-33.9, 151.2], [25.2, 55.3], [43.7, -79.4]];
    const arcs = PLACES.map(([lat, lon], k) => {
      const b = unit(lat, lon);
      const omega = Math.acos(Math.max(-1, Math.min(1, HOME[0] * b[0] + HOME[1] * b[1] + HOME[2] * b[2])));
      const lift = Math.min(0.3, 0.08 + 0.28 * (omega / Math.PI));
      const pts = new Float32Array((STEPS + 1) * 3);
      for (let s = 0; s <= STEPS; s++) {
        const t = s / STEPS;
        const wa = Math.sin((1 - t) * omega) / Math.sin(omega), wb = Math.sin(t * omega) / Math.sin(omega);
        const r = 1 + lift * Math.sin(Math.PI * t);
        for (let a = 0; a < 3; a++) pts[s * 3 + a] = (wa * HOME[a] + wb * b[a]) * r;
      }
      return { pts, end: b, phase: k * 0.37 };
    });
    const SX = new Float32Array(STEPS + 1), SY = new Float32Array(STEPS + 1), SV = new Uint8Array(STEPS + 1);

    // Colors come from the site's CSS variables; every color string is made once, not per frame
    const cs = getComputedStyle(document.documentElement);
    const hex = (name, fallback) => {
      const v = (cs.getPropertyValue(name).trim() || fallback).replace('#', '');
      return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
    };
    const TINT = hex('--blue-tint', '#8FA6FF'), LIGHT = hex('--text-on-dark', '#F4F5F7');
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    const BINS = 7;                                       // dots are drawn in 7 depth batches (far = dim and small)
    const DOT_FILL = [], DOT_SIZE = [];
    for (let b = 0; b < BINS; b++) { const z = (b + 0.5) / BINS; DOT_FILL.push(rgba(LIGHT, (0.14 + 0.62 * Math.pow(z, 0.8)).toFixed(3))); DOT_SIZE.push(0.55 + 0.45 * z); }
    const PULSE = Array.from({ length: 8 }, (_, k) => rgba(TINT, (0.15 + 0.85 * (k / 7)).toFixed(3)));
    const ARC_FAINT = rgba(TINT, 0.42), WHITE = rgba(LIGHT, 1), TINT_STRONG = rgba(TINT, 0.9);

    const ctx = globeCanvas.getContext('2d');
    const BALL = 0.37;                                    // ball radius as a share of the canvas (arcs rise above it)
    const TILT = 18 * RAD, CT = Math.cos(TILT), ST = Math.sin(TILT);
    let lon0 = 121 * RAD;                                 // start centered on the Philippines
    let size = 0, vel = 0, dragging = false, lowPower = false, clockT = 0, bg = null;

    // The glow and dark ball never change, so paint them once per size
    const makeBg = () => {
      bg = document.createElement('canvas'); bg.width = bg.height = size;
      const g = bg.getContext('2d'), c = size / 2, R = size * BALL;
      const glow = g.createRadialGradient(c, c, R * 0.9, c, c, R * 1.3);
      glow.addColorStop(0, rgba(TINT, 0.16)); glow.addColorStop(1, rgba(TINT, 0));
      g.fillStyle = glow; g.beginPath(); g.arc(c, c, R * 1.3, 0, TAU); g.fill();
      const ball = g.createRadialGradient(c - R * 0.35, c - R * 0.4, R * 0.1, c, c, R);
      ball.addColorStop(0, '#171923'); ball.addColorStop(1, '#07080B');
      g.fillStyle = ball; g.beginPath(); g.arc(c, c, R, 0, TAU); g.fill();
    };

    let px = 0, py = 0, pz = 0;                           // scratch result of place()
    const draw = (time) => {
      if (!size) return;
      const cl = Math.cos(lon0), sl = Math.sin(lon0), c = size / 2, R = size * BALL;
      // rotate a point, then drop it onto the screen: sets px, py and pz (pz > 0 means facing us)
      const place = (x, y, z) => {
        const z1 = x * sl + z * cl;
        px = c + (x * cl - z * sl) * R; py = c - (y * CT - z1 * ST) * R; pz = y * ST + z1 * CT;
      };
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(bg, 0, 0);

      // land dots: front half only, collected into one path per depth batch
      const base = Math.max(1, R * 0.0085), batch = [];
      for (let b = 0; b < BINS; b++) batch.push(new Path2D());
      for (let i = 0, n = dots.length; i < n; i += 3) {
        const x = dots[i], y = dots[i + 1], z = dots[i + 2];
        const z1 = x * sl + z * cl, z2 = y * ST + z1 * CT;
        if (z2 <= 0.02) continue;
        const b = Math.min(BINS - 1, (z2 * BINS) | 0), d = base * DOT_SIZE[b];
        batch[b].rect(c + (x * cl - z * sl) * R - d / 2, c - (y * CT - z1 * ST) * R - d / 2, d, d);
      }
      for (let b = 0; b < BINS; b++) { ctx.fillStyle = DOT_FILL[b]; ctx.fill(batch[b]); }

      // arcs: a thin path always, plus a bright pulse that travels along it
      ctx.lineCap = 'round';
      const thin = Math.max(1, size / 480), thick = Math.max(1.6, size / 260), pip = Math.max(1.6, size / 240), end = Math.max(1.5, size / 300);
      for (let a = 0; a < arcs.length; a++) {
        const arc = arcs[a], pts = arc.pts;
        for (let k = 0; k <= STEPS; k++) {
          place(pts[k * 3], pts[k * 3 + 1], pts[k * 3 + 2]);
          SX[k] = px; SY[k] = py;
          SV[k] = (pz > 0 || (px - c) * (px - c) + (py - c) * (py - c) > R * R) ? 1 : 0;   // in front, or past the ball's edge
        }
        ctx.strokeStyle = ARC_FAINT; ctx.lineWidth = thin; ctx.beginPath();
        let pen = false;
        for (let k = 0; k <= STEPS; k++) { if (SV[k]) { if (pen) ctx.lineTo(SX[k], SY[k]); else ctx.moveTo(SX[k], SY[k]); pen = true; } else pen = false; }
        ctx.stroke();

        const u = (time * 0.16 + arc.phase) % 1.5;       // 0..1 travelling, 1..1.5 resting
        const head = Math.min(1, u), tail = Math.max(0, head - 0.3);
        const i0 = Math.floor(tail * STEPS), i1 = Math.ceil(head * STEPS), span = Math.max(1, i1 - i0);
        ctx.lineWidth = thick;
        for (let k = i0; k < i1; k++) {
          if (!SV[k] || !SV[k + 1]) continue;
          ctx.strokeStyle = PULSE[Math.min(7, Math.floor(((k - i0) / span) * 8))];
          ctx.beginPath(); ctx.moveTo(SX[k], SY[k]); ctx.lineTo(SX[k + 1], SY[k + 1]); ctx.stroke();
        }
        if (u < 1 && SV[i1]) { ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(SX[i1], SY[i1], pip, 0, TAU); ctx.fill(); }
        place(arc.end[0], arc.end[1], arc.end[2]);       // small marker where the arc lands
        if (pz > 0) { ctx.fillStyle = TINT_STRONG; ctx.beginPath(); ctx.arc(px, py, end, 0, TAU); ctx.fill(); }
      }
      place(HOME[0], HOME[1], HOME[2]);                  // Manila marker
      if (pz > 0) { ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(px, py, Math.max(2, size / 200), 0, TAU); ctx.fill(); }
    };

    // Size the canvas to its box (sharp on retina, capped at 2x). A slow device gets 1x and fewer dots.
    const resize = () => {
      const w = globeCanvas.clientWidth;
      if (!w) return;
      size = Math.round(w * (lowPower ? 1 : Math.min(window.devicePixelRatio || 1, 2)));
      globeCanvas.width = size; globeCanvas.height = size;
      makeBg();
      buildDots(lowPower ? 6000 : (w < 400 ? 9000 : 15000));
      draw(clockT);
    };
    if (window.ResizeObserver) new ResizeObserver(resize).observe(globeCanvas); else addEventListener('resize', resize);

    // Drag sideways to spin; it keeps a little momentum, then drifts again
    let lastX = 0, lastMove = 0;
    globeCanvas.addEventListener('pointerdown', (e) => { dragging = true; vel = 0; lastX = e.clientX; lastMove = performance.now(); globeCanvas.setPointerCapture(e.pointerId); });
    globeCanvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const now = performance.now(), dx = e.clientX - lastX, dt = Math.max(1, now - lastMove);
      const R = globeCanvas.clientWidth * BALL;
      lon0 -= dx / R;
      vel = -(dx / R) / (dt / 1000);
      lastX = e.clientX; lastMove = now;
      if (reduce) draw(clockT);
    });
    const release = () => { dragging = false; if (performance.now() - lastMove > 120) vel = 0; vel = Math.max(-3, Math.min(3, vel)); };
    globeCanvas.addEventListener('pointerup', release);
    globeCanvas.addEventListener('pointercancel', release);

    // Animation loop: only while on screen and the tab is visible. If drawing is slow, switch to the light mode.
    let raf = 0, last = 0, onScreen = false, avgCost = 0, slowRun = 0, tick = 0;
    const AUTO = -0.09;                                   // rad per second (slow drift)
    const frame = (t) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      clockT = t / 1000;
      if (!dragging) { lon0 += (AUTO + vel) * dt; vel *= Math.pow(0.05, dt); }
      if (lowPower && (tick++ & 1)) return;               // light mode: every other frame (30 fps)
      const t0 = performance.now();
      draw(clockT);
      avgCost = avgCost * 0.9 + (performance.now() - t0) * 0.1;
      slowRun = avgCost > 9 ? slowRun + 1 : 0;
      if (!lowPower && slowRun > 60) { lowPower = true; resize(); }
    };
    const sync = () => {
      const run = onScreen && !document.hidden && !reduce;
      if (run && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
      if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
    };
    if ('IntersectionObserver' in window) new IntersectionObserver((en) => { onScreen = en[0].isIntersecting; sync(); }).observe(globeCanvas);
    else onScreen = true;
    document.addEventListener('visibilitychange', sync);
    sync();
    resize();
  }

  /* ---------- 8. Mouse-only extras ---------- */
  if (!mouse || reduce) return;

  // Cards: a light follows the cursor along the border, and the card floats a few pixels toward it
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - (r.left - (card._fx || 0));      // measure without the card's own float
      const y = e.clientY - (r.top - (card._fy || 0));
      card.style.setProperty('--sx', `${x}px`);
      card.style.setProperty('--sy', `${y}px`);
      card._fx = (x / r.width - 0.5) * 10;
      card._fy = (y / r.height - 0.5) * 8 - 4;               // the -4 lifts the card slightly
      card.style.setProperty('--fx', `${card._fx}px`);
      card.style.setProperty('--fy', `${card._fy}px`);
    });
    card.addEventListener('pointerleave', () => {
      card._fx = 0;
      card._fy = 0;
      card.style.setProperty('--fx', '0px');
      card.style.setProperty('--fy', '0px');
    });
  });

  // Flip cards: tilt toward the cursor and a border light that follows it
  document.querySelectorAll('.grid--4 > li').forEach((li) => {
    const flip = li.querySelector('.flip');
    if (!flip) return;
    li.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = li.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      flip.style.setProperty('--sx', `${x}px`);
      flip.style.setProperty('--sy', `${y}px`);
      flip.style.setProperty('--tx', `${((0.5 - y / r.height) * 8).toFixed(2)}deg`);
      flip.style.setProperty('--ty', `${((x / r.width - 0.5) * 8).toFixed(2)}deg`);
    });
    li.addEventListener('pointerleave', () => { flip.style.setProperty('--tx', '0deg'); flip.style.setProperty('--ty', '0deg'); });
  });

  // Skills chips drift away from the cursor and settle back
  const skills = document.getElementById('skills');
  const skillChips = skills ? [...skills.querySelectorAll('.chip')] : [];
  if (skills && skillChips.length) {
    const list = skills.querySelector('.chips');
    skills.addEventListener('pointermove', (e) => {
      const base = list.getBoundingClientRect();
      skillChips.forEach((chip) => {
        const dx = base.left + chip.offsetLeft + chip.offsetWidth / 2 - e.clientX;
        const dy = base.top + chip.offsetTop + chip.offsetHeight / 2 - e.clientY;
        const dist = Math.hypot(dx, dy) || 1;
        const push = dist < 130 ? (1 - dist / 130) ** 2 * 28 : 0;
        chip.style.transform = push ? `translate(${(dx / dist) * push}px, ${(dy / dist) * push}px)` : '';
      });
    });
    skills.addEventListener('pointerleave', () => skillChips.forEach((chip) => { chip.style.transform = ''; }));
  }

  // Soft blue glow in dark sections (add data-glow) + hero parallax
  const hero = document.querySelector('.hero');
  document.addEventListener('pointermove', (e) => {
    document.querySelectorAll('[data-glow]').forEach((s) => {
      const r = s.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      s.style.setProperty('--gx', `${e.clientX - r.left}px`);
      s.style.setProperty('--gy', `${e.clientY - r.top}px`);
    });
    if (hero) {
      hero.style.setProperty('--px', ((e.clientX / innerWidth - 0.5) * 2).toFixed(3));
      hero.style.setProperty('--py', ((e.clientY / innerHeight - 0.5) * 2).toFixed(3));
    }
  });

  // Title letters: hover turns a letter into a dashed outline with a selection frame;
  // drag it and it springs back. Real text stays in the page for screen readers.
  const measure = document.createElement('canvas').getContext('2d');
  const sign = (n) => (n > 0 ? `+${Math.round(n)}` : n < 0 ? `−${Math.round(-n)}` : '0');

  // Measures where the letter's ink really is (not the taller text line box)
  const ink = (ch) => {
    const cs = getComputedStyle(ch);
    const r = ch.getBoundingClientRect();
    measure.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = measure.measureText(ch.textContent.toUpperCase());
    if (m.fontBoundingBoxAscent === undefined) return { x1: r.left, x2: r.right, y1: r.top, y2: r.bottom };
    const lh = parseFloat(cs.lineHeight) || r.height;
    const base = r.top + (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
    return { x1: r.left - m.actualBoundingBoxLeft, x2: r.left + m.actualBoundingBoxRight, y1: base - m.actualBoundingBoxAscent, y2: base + m.actualBoundingBoxDescent };
  };

  document.querySelectorAll('.title, .hero__title').forEach((host) => {
    host.setAttribute('aria-label', host.textContent.replace(/\s+/g, ' ').trim());
    const parts = host.classList.contains('hero__title') ? host.querySelectorAll('.hero__title-role, .hero__title-focus') : [host];
    parts.forEach(wrapLetters);
    const letters = host.querySelectorAll('.ch');

    const frame = document.createElement('div');
    frame.className = 'glyph-frame';
    frame.setAttribute('aria-hidden', 'true');
    const tag = document.createElement('span');
    tag.className = 'glyph-frame__label';
    frame.append(tag);
    host.append(frame);

    const show = (ch, offset) => {
      const b = ink(ch);
      const h = host.getBoundingClientRect();
      const pad = 6;
      Object.assign(frame.style, {
        left: `${b.x1 - h.left - pad}px`, top: `${b.y1 - h.top - pad}px`,
        width: `${b.x2 - b.x1 + pad * 2}px`, height: `${b.y2 - b.y1 + pad * 2}px`, opacity: 1,
      });
      tag.textContent = offset
        ? `${sign(offset.x)}, ${sign(-offset.y)}`
        : `${ch.textContent.toUpperCase()}  ${Math.round(b.x2 - b.x1)} × ${Math.round(b.y2 - b.y1)}`;
    };

    let current = null;
    let drag = null;
    letters.forEach((ch) => {
      ch.addEventListener('pointerenter', () => {
        if (drag) return;
        current = ch;
        ch.classList.add('is-outline');
        show(ch);
      });
      ch.addEventListener('pointerleave', () => {
        if (drag) return;
        ch.classList.remove('is-outline');
        if (current === ch) {
          current = null;
          requestAnimationFrame(() => { if (!current) frame.style.opacity = 0; });  // stays visible if the next letter takes over
        }
      });
      ch.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        ch.setPointerCapture(e.pointerId);
        drag = { ch, startX: e.clientX, startY: e.clientY };
        ch.classList.add('is-dragging');
      });
      ch.addEventListener('pointermove', (e) => {
        if (!drag || drag.ch !== ch) return;
        const x = e.clientX - drag.startX;
        const y = e.clientY - drag.startY;
        ch.style.translate = `${x}px ${y}px`;
        show(ch, { x, y });
      });
      const release = () => {
        if (!drag || drag.ch !== ch) return;
        drag = null;
        current = null;
        ch.classList.remove('is-dragging', 'is-outline');
        ch.style.translate = '0px 0px';        // springs back
        frame.style.opacity = 0;
      };
      ch.addEventListener('pointerup', release);
      ch.addEventListener('pointercancel', release);
    });
  });
})();