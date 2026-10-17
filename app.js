// Kush Human v2 — motion-designer redesign.
// Static, dependency-free. Media paths point at the assets/ folder.
import toolIcons from './tool-icons.js';
import { KH_DARK, KH_LIGHT } from './logo-anim.js';
// the animated KH logo (Lottie); the static bird stays in place until the player loads, or if it can't
const lottieReady = new Promise(res => {
  const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js';
  sc.onload = () => res(window.lottie || null); sc.onerror = () => res(null); document.head.append(sc);
});
function mountLogo(img, dark = true) {
  if (!img) return Promise.resolve(null);
  return lottieReady.then(L => {
    if (!L || !img.isConnected) return null;
    const box = document.createElement('span'); box.className = img.className + ' kh-lottie'; box.setAttribute('aria-hidden', 'true');
    img.replaceWith(box);
    return L.loadAnimation({ container: box, renderer: 'svg', loop: true, autoplay: true, animationData: JSON.parse(JSON.stringify(dark ? KH_DARK : KH_LIGHT)) });
  });
}
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const A = 'assets/';
// KH_MEDIA (optional) maps a media path to a hosted URL; otherwise use assets/.
const media = p => (window.KH_MEDIA || {})[p] || A + encodeURI(p);
// High-bitrate masters (from the Website folder) for clips, previews and most films.
const clip = n => media('videos/hq/Section 01/' + n + '.mp4');
const HQ_FILMS = new Set(['01', '02', '03', '04', '05', '07', '08', '10', '12']); // the rest exceed the 20 MB hosting cap, so they stay WebM
const filmPath = n => HQ_FILMS.has(n) ? `videos/hq/Video Showreel/${n}.mp4` : `videos/Video Showreel/WEBm/${n}.webm`;
const reelClip = n => media('videos/Section 01/webm/' + n + '.webm');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(pointer: fine)');
const isPhone = () => innerWidth <= 650;
const verticalReel = () => innerWidth <= 650 || innerHeight > innerWidth;
// Original uploads, byte-for-byte (same files the live site uses).
const reelFile = v => reelClip(v ? 'SHowreel 2026 Vertical' : 'SHowreel 2026');
const conn = navigator.connection || {};
const constrained = !!conn.saveData || /^(slow-)?2g$/.test(conn.effectiveType || '');

/* ---------------- kinetic letter split ---------------- */
for (const el of $$('[data-split]')) {
  const text = el.textContent;
  const heading = el.closest('h1,h2');
  if (heading && !heading.hasAttribute('aria-label')) heading.setAttribute('aria-label', heading.textContent.replace(/\s+/g, ' ').trim());
  el.textContent = '';
  el.setAttribute('aria-hidden', 'true');
  [...text].forEach((c, i) => {
    if (c === ' ') { const s = document.createElement('span'); s.className = 'sp'; el.append(s); return; }
    const ch = document.createElement('span'); ch.className = 'ch';
    const inner = document.createElement('i'); inner.textContent = c; inner.style.setProperty('--i', i);
    ch.append(inner); el.append(ch);
  });
}
const revealIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });
$$('[data-split]').forEach(el => { if (!el.closest('.hero')) revealIO.observe(el); });

/* ---------------- loader ---------------- */
const questions = ['Chicken or egg?', 'Do fish get thirsty?', 'Who named the fly?', 'Is cereal a soup?', 'Do robots need coffee?', 'Can Wi-Fi get tired?', 'Do pixels dream?', 'Is Monday a bug?', 'Where do socks go?', 'Can a cursor get lost?'];
$('#loader-question').textContent = questions[Math.floor(Math.random() * questions.length)];
const tc = (sec, fps = 25) => { const f = Math.floor(sec * fps); const p = n => String(n).padStart(2, '0'); return `${p(Math.floor(f / (fps * 3600)))}:${p(Math.floor(f / (fps * 60)) % 60)}:${p(Math.floor(f / fps) % 60)}:${p(f % fps)}`; };
const t0 = performance.now();
(function tick(now) { const s = (now - t0) / 1000; $('#loader-tc').textContent = tc(s); if (s < 2) requestAnimationFrame(tick); })(t0);
setTimeout(() => {
  $('#loader').classList.add('out');
  document.body.classList.remove('is-loading');
  setTimeout(() => $$('.hero [data-split]').forEach(el => el.classList.add('in')), reduced.matches ? 0 : 250);
  setTimeout(() => $('#loader').remove(), 1200);
}, reduced.matches ? 300 : 1900);

/* ---------------- header: clock + render progress ---------------- */
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true });


/* ---------------- showreel ----------------
   One reel. It tries to start with sound; browsers that block unmuted autoplay
   start it muted and turn the sound on at the visitor's first tap or key press.
   Away from the reel it keeps playing underneath at 30% volume. */
const reel = $('#reel'), soundBtn = $('#sound');
let soundOn = false, userMuted = false, reelVol = 1, reelTarget = 1;
function loadReel() {
  const src = reelFile(verticalReel());
  document.documentElement.classList.toggle('vertical', verticalReel());
  if (reel.getAttribute('src') !== src) { const t = reel.currentTime; reel.src = src; reel.currentTime = t || 0; reel.play().catch(() => {}); }
}
function setSound(on, byUser) {
  soundOn = on; if (byUser) userMuted = !on;
  reel.muted = !on;
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.setAttribute('aria-label', on ? 'Mute showreel' : 'Turn showreel sound on');
  document.body.classList.toggle('reel-on', on);
}
const soundButtons = '#sound';
function armFirstGesture() {
  const evs = ['pointerdown', 'keydown', 'touchend'];
  const go = e => {
    evs.forEach(n => removeEventListener(n, go, true));
    if (userMuted || soundOn || e.target.closest?.(soundButtons)) return;
    setSound(true); reel.play().catch(() => {});
  };
  evs.forEach(n => addEventListener(n, go, true));
}
async function startReel() {
  loadReel(); reel.volume = reelVol;
  reel.muted = false;
  try { await reel.play(); setSound(true); }
  catch { reel.muted = true; setSound(false); reel.play().catch(() => {}); armFirstGesture(); }
}
startReel();
const toggleSound = () => { setSound(!soundOn, true); if (soundOn) reel.play().catch(() => {}); };
soundBtn.onclick = toggleSound;
// ease the volume between 100% (reel on screen) and 30% (reading the rest of the page)
(function volLoop() { reelVol += (reelTarget - reelVol) * .06; if (Math.abs(reelVol - reel.volume) > .005) reel.volume = Math.min(1, Math.max(0, reelVol)); requestAnimationFrame(volLoop); })();
const visibleShare = el => { const r = el.getBoundingClientRect(); const v = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)); return v / Math.max(1, Math.min(r.height, innerHeight)); };
let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { loadReel(); layoutWork(); }, 200); });

/* ---------------- scroll-driven bits ---------------- */
const hero = $('.hero'), heroSticky = $('.hero-sticky'), statement = $('.statement');
let words = [];
// Wrap each word of the statement so it can light up with scroll.
(function splitWords() {
  const walk = n => {
    for (const node of [...n.childNodes]) {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.append(' '); return; }
          const s = document.createElement('span'); s.className = 'w'; s.textContent = w; frag.append(s);
        });
        node.replaceWith(frag);
      }
    }
  };
  walk(statement);
  words = $$('.w, .pill', statement);
})();
let lastY = scrollY, velocity = 0;
function onScroll() {
  const y = scrollY, vh = innerHeight;
  velocity = y - lastY; lastY = y;
  const max = document.documentElement.scrollHeight - vh;
  $('#rendering').textContent = 'Rendering… ' + Math.round(100 * clamp(y / Math.max(1, max))) + '%';
  if (!isPhone()) heroSticky.style.setProperty('--p', clamp(y / Math.max(1, hero.offsetHeight - vh)).toFixed(4));
  else heroSticky.style.setProperty('--p', 0);
  // statement: light words progressively while the paragraph crosses the viewport
  const r = statement.getBoundingClientRect();
  const prog = reduced.matches ? 1 : clamp((vh * .85 - r.top) / (r.height + vh * .35));
  const lit = Math.round(prog * words.length);
  words.forEach((w, i) => w.classList.toggle('lit', i < lit));
  $$('.sticker').forEach(st => st.style.setProperty('--spin', (y * .06).toFixed(1)));
  reelTarget = (visibleShare($('.reel-frame')) > .35 || visibleShare($('.contact-reel')) > .35) ? 1 : .3; // full volume whenever either showreel is on screen
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------------- lazy / in-view video helper ---------------- */
const vidIO = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting) { if (v.dataset.src && !v.getAttribute('src')) v.src = v.dataset.src; if (!document.hidden) v.play().catch(() => {}); }
  else v.pause();
}), { rootMargin: constrained ? '0px' : '200px' });
// the bird bobs over any video that is still loading
const BIRD = A + 'v2/bird.png';
// animated favicon: the KH logo Lottie is drawn off-screen and each frame is pushed to the tab icon
lottieReady.then(L => {
  if (!L) return;
  const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:-200px;top:0;width:64px;height:64px;pointer-events:none'; box.setAttribute('aria-hidden', 'true');
  document.body.append(box);
  L.loadAnimation({ container: box, renderer: 'svg', loop: true, autoplay: true, animationData: JSON.parse(JSON.stringify(KH_LIGHT)) });
  let icon = document.querySelector('link[rel~="icon"]'); if (!icon) { icon = document.createElement('link'); icon.rel = 'icon'; document.head.append(icon); }
  icon.type = 'image/svg+xml';
  setInterval(() => { const svg = box.querySelector('svg'); if (svg) icon.href = 'data:image/svg+xml,' + encodeURIComponent(new XMLSerializer().serializeToString(svg)); }, 90);
});
mountLogo($('.logo img')); mountLogo($('.loader-bird'));
function birdify(v) {
  const host = v.parentElement; if (!host || host.querySelector(':scope > .vload')) return;
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  const b = document.createElement('span'); b.className = 'vload'; b.setAttribute('aria-hidden', 'true'); b.innerHTML = `<img src="${BIRD}" alt="">`;
  host.append(b);
  let anim = null; mountLogo($('img', b)).then(a => { anim = a; if (a && b.classList.contains('done')) a.pause(); });
  const off = () => { b.classList.add('done'); anim?.pause(); }, on = () => { if (v.getAttribute('src')) { b.classList.remove('done'); anim?.play(); } };
  if (v.readyState >= 2) off();
  v.addEventListener('loadeddata', off); v.addEventListener('playing', off); v.addEventListener('canplay', off);
  v.addEventListener('waiting', on); v.addEventListener('emptied', on);
}
const watch = v => { birdify(v); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none'; vidIO.observe(v); };


// service cards carry a small loop each
for (const v of $$('.art video[data-media]')) { v.dataset.src = media(v.dataset.media); watch(v); }
// inline pills inside the statement
for (const p of $$('.pill')) { const v = document.createElement('video'); v.dataset.src = media(p.dataset.media); v.setAttribute('aria-hidden', 'true'); p.append(v); watch(v); }

/* ---------------- marquees (speed reacts to scroll velocity) ---------------- */
const featured = ['Max Fashion', 'Great Place to Work', 'Axiom', 'European Union', 'KPMG', 'Perfios'];
const others = ['WearIt', 'Snappy AI', 'Cre8 Finance', 'Beachday', 'Duffle AI', 'St’ Lukes', 'Collidge Effect', 'Blueprint Strategy Partners', 'Sara AI', 'UnAImyText', 'Foxtexia', 'AgentPowered', 'Batch Send', 'Kaching', 'PixelSurf AI', 'Lumigo', 'The Racing Line Draft', 'DataSci.Pro', 'Dacy AI', 'NextPet', 'Ninja Payment', 'Haxiom', 'Tumi Africa', 'Voodoochilli', 'Ahsk AI', 'AskEdger', 'Midl Hyperlane', 'Travelgram', 'Coinfella', 'FindAINow', 'Clear Workspace', 'Maxillofacial', 'Amantra AI', 'Nyvo', 'Yann Jewellery', 'Chima'];
const row1 = [];
others.forEach((n, i) => { row1.push([n]); if (i % 6 === 2) row1.push([featured[(i / 6 | 0) % 6], 1]); });
$('#m1').innerHTML = row1.map(([n, f]) => `<span class="${f ? 'feat' : ''}">${n}</span>`).join('');

const marquees = $$('[data-marquee]').map(track => {
  track.innerHTML += track.innerHTML; // seamless loop
  return { track, dir: +track.dataset.marquee, x: 0, visible: true };
});
const mIO = new IntersectionObserver(es => es.forEach(e => { const m = marquees.find(m => m.track === e.target); if (m) m.visible = e.isIntersecting; }));
marquees.forEach(m => mIO.observe(m.track));
let boost = 0;
function marqueeLoop() {
  boost += (Math.min(40, Math.abs(velocity)) - boost) * .08; velocity *= .9;
  for (const m of marquees) {
    if (!m.visible || reduced.matches) continue;
    const w = m.track.scrollWidth / 2;
    m.x -= m.dir * (0.6 + boost * .25);
    if (m.x <= -w) m.x += w; if (m.x > 0) m.x -= w;
    m.track.style.transform = `translate3d(${m.x}px,0,0)`;
  }
  requestAnimationFrame(marqueeLoop);
}
requestAnimationFrame(marqueeLoop);

/* ---------------- playground desk: springs, attraction, drag, shake ---------------- */
const desk = $('#desk');
// x,y are % of stage; w in px (desktop), rot in degrees. m:1 = also on phone.
// objects orbit the footer wordmark: a band above it and a band below, nothing over the letters
const items = [
  { win: 'Merch Big Launch', label: 'Merch Big Launch.mov', x: 4, y: 5, w: 84, r: 238 / 428, rot: -6, m: 1 },
  { win: 'not your regular mario', label: 'not your regular mario.mov', x: 20, y: 8, w: 200, r: 16 / 9, rot: 3, m: 1 },
  { img: 'desktop-imgHelloSticker.svg', x: 46, y: 12, w: 140, rot: 8, m: 1 },
  { win: 'Merry Happy', label: 'Merry Happy.gif', x: 68, y: 5, w: 110, r: 1, rot: -6, m: 1 },
  { img: 'desktop-imgMFlowerAvif.png', x: 88, y: 12, w: 64, rot: 0, spin: 1 },
  { img: 'desktop-imgSysicon1Avif.png', x: 5, y: 77, w: 78, rot: 0, m: 1 },
  { win: 'motivation crisis', label: 'motivation crisis.mp4', x: 18, y: 70, w: 190, r: 400 / 268, rot: -3 },
  { img: 'desktop-imgCdGif1.png', x: 40, y: 78, w: 78, rot: 0, spin: 1, m: 1 },
  { win: 'work in progress', label: 'work-in-progress.mp4', x: 52, y: 72, w: 200, r: 16 / 9, rot: -2 },
  { img: 'v2/bird.png', x: 73, y: 77, w: 68, rot: -10, m: 1 },
  { win: 'off-the-clock', label: 'off-the-clock.mov', x: 87, y: 66, w: 84, r: 238 / 428, rot: 5, m: 1 }
];
const bodies = [];
function buildDesk() {
  $$('.body', desk).forEach(b => b.remove()); bodies.length = 0;
  const phone = isPhone(), W = desk.clientWidth, H = desk.clientHeight;
  const k = phone ? .54 : clamp(W / 1440, .7, 1.25) * .82; // smaller objects, more air around them
  items.filter(it => !phone || it.m).forEach((it, idx) => {
    const el = document.createElement(it.win ? 'figure' : 'div');
    el.className = 'body' + (it.win ? ' win' : '');
    const w = it.w * k, h = it.win ? (w - 10) / it.r + 27 : w * (it.img.includes('Casette') ? 136 / 200 : it.img.includes('Screenshot') ? 180 / 322 : it.img.includes('Hello') ? .62 : 1);
    el.style.width = w + 'px'; el.style.height = h + 'px'; el.style.margin = '0';
    if (it.win) {
      const v = document.createElement('video'); v.dataset.src = clip(it.win); el.append(v); watch(v);
      const cap = document.createElement('figcaption'); cap.setAttribute('aria-hidden', 'true'); el.append(cap); // window bar only, no filename
      el.setAttribute('aria-label', it.label);
    } else {
      const im = document.createElement('img'); im.src = A + it.img; im.alt = ''; im.draggable = false; el.append(im);
    }
    el.setAttribute('role', 'img'); el.tabIndex = 0;
    let px = it.x, py = it.y;
    if (phone) { // reflow into a tidy phone layout
      const slots = [[3, 3], [28, 11], [66, 3], [76, 21], [4, 74], [30, 81], [54, 72], [82, 66]];
      [px, py] = slots[bodies.length % slots.length];
    }
    const hx = clamp(px / 100 * W, 0, W - w), hy = clamp(py / 100 * H, 0, H - h);
    const b = { el, w, h, hx, hy, x: 0, y: 0, vx: 0, vy: 0, rot: it.rot, spin: it.spin, drag: false, phase: idx * 1.7, wob: 0 };
    bodies.push(b); desk.append(el);
    let sx, sy, bx, by, lastT;
    el.addEventListener('pointerdown', e => { b.drag = true; el.classList.add('dragging'); el.setPointerCapture(e.pointerId); sx = e.clientX; sy = e.clientY; bx = b.x; by = b.y; b.vx = b.vy = 0; lastT = performance.now(); e.preventDefault(); });
    el.addEventListener('pointermove', e => { if (!b.drag) return; const nx = bx + e.clientX - sx, ny = by + e.clientY - sy; const now = performance.now(), dt = Math.max(8, now - lastT) / 16.67; lastT = now; b.vx = (nx - b.x) / dt; b.vy = (ny - b.y) / dt; b.x = nx; b.y = ny; });
    const up = () => { b.drag = false; el.classList.remove('dragging'); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('keydown', e => { const d = { ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] }[e.key]; if (d) { e.preventDefault(); b.vx += d[0] / 4; b.vy += d[1] / 4; } });
  });
}
buildDesk();
let deskW = desk.clientWidth; addEventListener('resize', () => { if (Math.abs(desk.clientWidth - deskW) > 40) { deskW = desk.clientWidth; buildDesk(); } });
const ptr = { on: false, x: 0, y: 0 };
desk.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = desk.getBoundingClientRect(); ptr.on = true; ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; });
desk.addEventListener('pointerleave', () => ptr.on = false);
let deskVisible = false;
new IntersectionObserver(es => deskVisible = es[0].isIntersecting).observe(desk);
let lastF = performance.now();
function physics(now) {
  const dt = Math.min(2.5, (now - lastF) / 16.67); lastF = now;
  if (deskVisible) {
    const W = desk.clientWidth, H = desk.clientHeight, phone = isPhone();
    for (const b of bodies) {
      if (!b.drag) {
        let tx = 0, ty = 0;
        if (!reduced.matches && ptr.on) {
          const cx = b.hx + b.w / 2, cy = b.hy + b.h / 2, dx = ptr.x - cx, dy = ptr.y - cy;
          const prox = clamp(1 - Math.hypot(dx, dy) / (phone ? 260 : 520)), inf = prox * prox * (3 - 2 * prox);
          const mob = clamp(90 / Math.sqrt(b.w * b.h), .45, 1.7);
          tx = dx * .28 * inf * mob; ty = dy * .28 * inf * mob;
        }
        if (!reduced.matches) ty += Math.sin(now / 900 + b.phase) * 4; // idle float
        const spring = .03 * clamp(90 / Math.sqrt(b.w * b.h), .45, 1.7) + .012, damp = Math.pow(.86, dt);
        b.vx = (b.vx + (tx - b.x) * spring * dt) * damp;
        b.vy = (b.vy + (ty - b.y) * spring * dt) * damp;
        b.x += b.vx * dt; b.y += b.vy * dt;
      }
      // keep inside the stage, bounce off edges (restitution .3)
      const minX = -b.hx, maxX = W - b.w - b.hx, minY = -b.hy, maxY = H - b.h - b.hy;
      if (b.x < minX || b.x > maxX) { b.x = clamp(b.x, minX, maxX); b.vx *= -.3; }
      if (b.y < minY || b.y > maxY) { b.y = clamp(b.y, minY, maxY); b.vy *= -.3; }
      b.wob *= Math.pow(.965, dt);
      const rot = b.rot + clamp(b.vx * 1.2, -25, 25) + b.wob * Math.sin(now / 55 + b.phase) + (b.spin && !reduced.matches ? now / 40 % 360 : 0);
      b.el.style.transform = `translate3d(${b.hx + b.x}px,${b.hy + b.y}px,0) rotate(${rot}deg)`;
    }
  }
  requestAnimationFrame(physics);
}
requestAnimationFrame(physics);
// Shake: everything jumps, wobbles and springs home. Phones shake the device;
// on a computer, clicking an empty spot on the desk does the same.
function shakeDesk(power = 1) {
  if (reduced.matches) return;
  for (const b of bodies) { if (b.drag) continue; const m = clamp(90 / Math.sqrt(b.w * b.h), .5, 1.6); b.vx += (Math.random() * 2 - 1) * 22 * power * m; b.vy += (Math.random() * 2 - 1) * 18 * power * m - 8 * power; b.wob = Math.min(28, b.wob + 18 * power); }
}
desk.addEventListener('click', e => { if (!e.target.closest('.body')) shakeDesk(1); });
let lastShake = 0, motionOn = false;
function onMotion(e) {
  const a = e.acceleration?.x != null ? e.acceleration : e.accelerationIncludingGravity; if (!a) return;
  const g = e.acceleration?.x != null ? 0 : 9.8, mag = Math.abs(Math.hypot(a.x || 0, a.y || 0, a.z || 0) - g);
  const now = performance.now();
  if (mag > 13 && now - lastShake > 450 && deskVisible) { lastShake = now; shakeDesk(clamp(mag / 20, .7, 1.6)); }
}
function listenMotion() { if (motionOn) return; motionOn = true; addEventListener('devicemotion', onMotion); }
if ('DeviceMotionEvent' in window) {
  // iOS asks once; we ask on the visitor's first touch of the desk, no extra button.
  if (typeof DeviceMotionEvent.requestPermission === 'function') desk.addEventListener('touchend', () => DeviceMotionEvent.requestPermission().then(r => r === 'granted' && listenMotion()).catch(() => {}), { once: true });
  else listenMotion();
}

/* ---------------- work grid ---------------- */
// [preview file, width, height] — aspect from the actual _IN clips.
const projects = [['1_IN', 852, 480], ['02_IN', 640, 360], ['03_IN', 360, 640], ['04_IN', 450, 250], ['05_IN', 360, 640], ['06_IN', 640, 360], ['07_IN', 640, 360], ['08_IN', 360, 642], ['09_IN', 360, 450], ['10_IN', 640, 360], ['11_IN', 640, 360], ['12_IN', 240, 240], ['13_IN', 640, 360]];
// brand behind each film (read from the films themselves)
// project notes, written from Kushagra's brief sheet
const P = {
  '01': ['Ahsk', 'A homepage film, built with the founder.', 'Made hand in hand with Ahsk’s CEO, from storyboard to final frame. A bouncy, dimensional piece that lands the app’s whole idea in seconds: select anything, get an answer.', 'Website and social', '6 days', 'After Effects, Photoshop, Illustrator', 'Freelance', 'https://www.ahsk.app/'],
  '02': ['PixelSurf AI', 'Game design, in plain words.', 'An immersive 3D promo with custom sound design, showing how PixelSurf AI turns a typed idea into a playable game world.', 'Promotional film', '4 days', 'After Effects, Photoshop', 'Freelance', ''],
  '03': ['KStore × Coca‑Cola', 'A Gen-Z drop, made in a day.', 'A social-first spot for Coca-Cola on KStore, also live on Blinkit. Generated with Kling and Seedream, then cut, typeset and finished in After Effects, start to post in 24 hours.', 'Social media', '1 day', 'Higgsfield, After Effects', 'In-house at KGeN', 'https://www.instagram.com/reel/DYgmpWsJYYk/'],
  '04': ['KGeN', 'A chapter of the new website’s master film.', 'A data-led story for KGeN’s new website: where its data comes from and where the company is heading. Shaped over three review rounds into one chapter of the homepage’s master film.', 'Website', '12 days', 'After Effects, Photoshop, Illustrator, Figma', 'In-house at KGeN', ''],
  '05': ['URBE Optics', 'Eyewear, built from scratch in 3D.', 'Every frame of the glasses modelled, lit and rendered in Blender, then composited in After Effects, so each angle, material and reflection was art-directed.', 'Promotional film', '10 days', 'Blender, After Effects, Photoshop', 'Freelance', ''],
  '06': ['Great Place to Work', 'Non-stop motion, in the brand’s own language.', 'An internal film with flowing, never-still transitions, built around Great Place to Work’s bold design system so every frame feels on-brand.', 'Internal communication', '', 'After Effects, Illustrator', 'Freelance', ''],
  '07': ['KGeN', 'Retention, explained in seconds.', 'A launch video for a KGeN product, built around one sharp idea: losing users hurts. Storyboarded and animated in-house, refined over three review rounds.', 'Social media', '8 days', 'After Effects, Photoshop, Illustrator, Figma', 'In-house at KGeN', 'https://x.com/StormingWeb3/status/1963259379584573859/video/1'],
  '08': ['Fotexia', 'One feature, one card, one day.', 'A crisp feature-update loop for Fotexia’s homepage: snap a product, lose the background, get studio shots. Turned around in a single day.', 'Website', '1 day', 'After Effects', 'Freelance', 'https://fotexia.com/'],
  '09': ['KGeN', 'A year in review, in three days.', 'KGeN’s year-end recap: members, partners, launches and listings, turned from the marketing team’s data into a punchy social film in three days.', 'Social media', '3 days', 'After Effects, Photoshop, Illustrator', 'In-house at KGeN', 'https://x.com/KGeN_IO/status/2003843269499961694/video/1'],
  '10': ['Haxiom', 'A launch film for an intelligence layer.', 'A custom product-launch film mixing animation, workflow storytelling and sound design, showing how teams bring their scattered knowledge into one place.', 'Product launch', '', 'After Effects, Illustrator', 'Freelance', 'https://youtu.be/J8U33fzXGQc'],
  '11': ['KPMG × St Luke’s', 'Kinetic type that needs no voiceover.', 'An internal collaboration film between KPMG and St Luke’s. Kinetic typography and stomp-style edits carry the whole story, without a single word spoken.', 'Internal communication', '6 days', 'After Effects, Photoshop', 'Freelance', ''],
  '12': ['KGeN', 'An icon system that moves.', 'A family of animated icons for KGeN’s content intros, drawn to read instantly at any size and loop without a seam.', 'Brand IP', '2 days', 'After Effects', 'In-house at KGeN', 'https://x.com/KGeN_IO/status/1945495255157252313/video/1'],
  '13': ['Heardstone', 'Software for funeral directors, told with care.', 'A website film for Heardstone, with scripting, sound design and UI flows animated straight from Figma, showing a sensitive product calmly and clearly.', 'Website', '', 'After Effects', 'Freelance', 'https://heardstone.com/']
};
// every kind of film opens in its own setting: a browser, a social post, a cinema screen, a team deck, a design board
const kindOf = made => /website/i.test(made) ? 'web' : /social/i.test(made) ? 'social' : /internal/i.test(made) ? 'internal' : /brand ip/i.test(made) ? 'ip' : 'promo';
const KIND_LABEL = { web: 'Website film', social: 'Social film', promo: 'Launch film', internal: 'Internal film', ip: 'Brand system' };
const esc = t => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function dressPlayer(n, brand, made, link, r) {
  player.className = player.className.replace(/\bkind-\w+/g, '').trim(); player.classList.add('kind-web');
  const slug = brand.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const own = link && /^https?:\/\/(?!(x\.com|www\.instagram|youtu))/.test(link);
  const url = own ? new URL(link).hostname.replace(/^www\./, '') : 'kushhuman.com/work/' + slug;
  $('#pm-top').innerHTML = `<span class="pm-dots"><i></i><i></i><i></i></span><span class="pm-url">🔒 ${esc(url)}</span><span class="pm-tab">${esc(brand)}</span>`;
  $('#pm-bottom').innerHTML = '';
}
const brandOf = Object.fromEntries(Object.entries(P).map(([k, v]) => [k, v[0]]));
const ratioName = r => r > 1.5 ? '16:9' : r > 1.1 ? 'Landscape' : r > .95 ? '1:1' : r > .7 ? '4:5' : '9:16';
const grid = $('#work-grid');
const tileIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); tileIO.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
const HIDDEN = new Set(['04']); // KGeN website film: back once the site is live
projects.forEach(([f, w, h], i) => {
  const n = String(i + 1).padStart(2, '0'), r = w / h;
  if (HIDDEN.has(n)) return; // not live yet
  const b = document.createElement('button');
  b.className = 'tile'; b.type = 'button'; b.dataset.n = n; b.dataset.r = r;
  b.setAttribute('aria-label', `Watch ${brandOf[n]} (project ${n})`);
  b.style.transitionDelay = (i % 4) * 70 + 'ms';
  b.innerHTML = `<video data-src="${media('videos/hq/Video Showreel/' + f + '.mp4')}" aria-hidden="true"></video><span class="tile-meta"><span class="tile-txt"><span class="tile-brand">${brandOf[n]}</span></span><span class="tile-go" aria-hidden="true"><svg class="go-arrow" viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg><svg class="go-play" viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg></span></span>`;
  grid.append(b); watch($('video', b)); tileIO.observe(b);
  { const tv = $('video', b), ready = () => b.classList.add('ready'); // the play button waits for the film's first frame
    tv.addEventListener('loadeddata', ready, { once: true }); if (tv.readyState >= 2) ready(); }
  b.onclick = () => openProject(n);
});
// phones have no hover: the tile crossing the middle of the screen shows its play button
if (matchMedia('(hover: none)').matches) {
  const midIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('active', e.isIntersecting)), { rootMargin: '-40% 0px -40% 0px' });
  $$('.tile', grid).forEach(t => midIO.observe(t));
}
// bento: justified rows that always fill the full width, every film at its true ratio.
// A seeded search tries many orderings (01 stays first) and keeps the one whose rows sit
// closest to the target height, so tall verticals pair up with wide films instead of leaving holes.
let bentoKey = '';
function layoutWork() {
  const tiles = [...grid.children], pl = parseFloat(getComputedStyle(grid).paddingLeft), W = grid.clientWidth - pl * 2;
  const phone = innerWidth <= 650, gap = phone ? 8 : 12;
  const target = phone ? 230 : Math.max(220, Math.min(380, W / 3.6));
  const maxPer = phone ? 2 : 5;
  const R = new Map(tiles.map(t => [t, +t.dataset.r]));
  const rowsFor = seq => { // optimal contiguous breaks (linear partition) for one ordering
    const n = seq.length, best = Array(n + 1).fill(Infinity), cut = Array(n + 1).fill(0); best[0] = 0;
    for (let e = 1; e <= n; e++) for (let b = Math.max(0, e - maxPer); b < e; b++) {
      let sr = 0; for (let k = b; k < e; k++) sr += R.get(seq[k]);
      const h = (W - gap * (e - b - 1)) / sr, c = ((h - target) / target) ** 2 + (e - b === 1 && n > 1 ? .6 : 0);
      if (best[b] + c < best[e]) { best[e] = best[b] + c; cut[e] = b; }
    }
    const rows = []; for (let e = n; e > 0; e = cut[e]) rows.unshift(seq.slice(cut[e], e));
    return [best[n], rows];
  };
  const key = W + '|' + tiles.length;
  if (key !== bentoKey) {
    bentoKey = key;
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const first = tiles.find(t => t.dataset.n === '01') || tiles[0], rest = tiles.filter(t => t !== first);
    rest.sort((a, b) => a.dataset.n.localeCompare(b.dataset.n));
    let [bc, br] = rowsFor([first, ...rest]);
    for (let it = 0; it < 600; it++) {
      const s = rest.slice(); for (let k = s.length - 1; k > 0; k--) { const m = Math.floor(rnd() * (k + 1)); [s[k], s[m]] = [s[m], s[k]]; }
      const [c, r] = rowsFor([first, ...s]); if (c < bc - 1e-9) { bc = c; br = r; }
    }
    grid._rows = br;
  }
  let y = 0;
  for (const row of grid._rows) {
    const sr = row.reduce((a, t) => a + R.get(t), 0), h = (W - gap * (row.length - 1)) / sr;
    let x = 0;
    row.forEach((t, k) => {
      const w = k === row.length - 1 ? W - x : h * R.get(t);
      Object.assign(t.style, { position: 'absolute', left: pl + x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', gridColumn: '', gridRow: '', margin: '0' });
      t.classList.toggle('narrow', w < 170); grid.append(t); x += w + gap;
    });
    y += h + gap;
  }
  grid.style.height = (y - gap) + 'px';
  // the player's prev / next follows the bento's reading order
  try { order.splice(0, order.length, ...grid._rows.flat().map(t => t.dataset.n)); } catch (e) { /* player not set up yet */ }
}
layoutWork();

/* ---------------- project player ---------------- */
const player = $('#player'), pv = $('#player-video');
let lastFocus = null, soundBefore = false;
const order = projects.map((_, i) => String(i + 1).padStart(2, '0')).filter(n => !HIDDEN.has(n));
if (grid._rows) order.splice(0, order.length, ...grid._rows.flat().map(t => t.dataset.n)); // bento reading order
let current = '01';
function showProject(n) {
  current = n;
  const k = order.indexOf(n), [, w, h] = projects[+n - 1], r = w / h;
  const prev = order[(k - 1 + order.length) % order.length], next = order[(k + 1) % order.length];
  const [brand, hook, about, made, time, tools, type, link] = P[n];
  $('#player-title').textContent = brand; $('#player-hook').textContent = hook; $('#player-about').textContent = about;
  $('#pf-for').textContent = made; $('#pf-time').textContent = time || 'Not recorded'; $('#pf-time').parentElement.hidden = !time;
  $('#pf-tools').textContent = tools; $('#pf-type').textContent = type;
  const live = $('#player-live'); live.hidden = !link; if (link) live.href = link;
  pv.style.aspectRatio = w + ' / ' + h; player.style.setProperty('--ar', (w / h).toFixed(4)); // frame keeps its shape before the film loads
  dressPlayer(n, brand, made, link, r);
  if ($('#pn-count')) $('#pn-count').textContent = n + ' / ' + String(order.length).padStart(2, '0');
  $('#pn-prev-name').textContent = brandOf[prev]; $('#pn-next-name').textContent = brandOf[next];
  player.classList.toggle('portrait', r < 1);
  pv.src = media(filmPath(n)); pv.muted = true; pv.play().catch(() => {});
  $('.player-panel').scrollTop = 0;
}
const step = d => { const k = order.indexOf(current); showProject(order[(k + d + order.length) % order.length]); };
$('#pn-prev').onclick = () => step(-1);
$('#pn-next').onclick = () => step(1);
player.addEventListener('keydown', e => { if (e.target.closest('video')) return; if (e.key === 'ArrowRight') { e.preventDefault(); step(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); } });
// swipe on phones
let sx = null;
// phones: swipe left/right to change project, pull the sheet down to close it
let sy = null, pulling = false;
const panel = $('.player-panel');
player.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; pulling = false; }, { passive: true });
player.addEventListener('touchmove', e => {
  if (sy == null || !isPhone() || e.target.closest('video')) return;
  const dy = e.touches[0].clientY - sy, dx = e.touches[0].clientX - sx;
  if (!pulling && dy > 12 && dy > Math.abs(dx) && panel.scrollTop <= 0) pulling = true;
  if (pulling) { player.style.transition = 'none'; player.style.transform = `translateY(${Math.max(0, dy)}px)`; }
}, { passive: true });
player.addEventListener('touchend', e => {
  if (sx == null) return;
  const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = sy = null;
  if (pulling) { pulling = false; player.style.transition = ''; player.style.transform = ''; if (dy > 110) closeProject(); return; }
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
});
function openProject(n) {
  lastFocus = document.activeElement; soundBefore = soundOn; setSound(false);
  showProject(n);
  const cur = $('#cursor'); if (cur) player.append(cur); // keep the custom cursor visible inside the modal's top layer
  player.showModal(); document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => player.classList.add('open'));
  $('.player-close').focus();
}
function closeProject() {
  if (!player.open) return;
  player.classList.remove('open'); pv.pause();
  setTimeout(() => { const cur = $('#cursor'); if (cur) document.body.prepend(cur); player.close(); pv.removeAttribute('src'); pv.load(); document.body.style.overflow = ''; if (soundBefore) setSound(true); lastFocus?.focus({ preventScroll: true }); }, reduced.matches ? 0 : 600);
}
$('.player-close').onclick = closeProject;
birdify(pv); birdify(reel);
player.addEventListener('cancel', e => { e.preventDefault(); closeProject(); });
player.addEventListener('click', e => { if (e.target === player) { const r = player.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeProject(); } });
pv.addEventListener('loadedmetadata', () => { player.classList.toggle('portrait', pv.videoWidth < pv.videoHeight); pv.style.aspectRatio = pv.videoWidth + ' / ' + pv.videoHeight; player.style.setProperty('--ar', (pv.videoWidth / pv.videoHeight).toFixed(4)); });

/* ---------------- toolkit ---------------- */
// Four calm cards, one per craft. Icons reuse the exact Figma layers from the current site.
const toolGroups = [
  ['Motion & edit', 'var(--pink)', ['After Effects', 'Premiere Pro', 'Davinci Resolve', 'Higgsfield']],
  ['3D', 'var(--blue)', ['Cinema4D', 'Blender 3D', 'Maya', 'Houdini', 'Zbrush', 'Substance Painter', 'Gaea', 'Marvelous Designer']],
  ['Design & AI', 'var(--yellow)', ['Photoshop', 'Illustrator', 'Figma', 'Sketchup']],
  ['Real-time', 'var(--green)', ['Unreal Engine', 'Unity', 'Touch Designer']]
];
const extraIcons = { 'Marvelous Designer': ['#e8457a', '<svg viewBox="0 0 24 24"><rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="#1d1d22"/><path d="M5.5 17V7.5l3.25 5 3.25-5V17" fill="none" stroke="#e8457a" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M14.5 7.5h1.8a4.1 4.75 0 0 1 0 9.5h-1.8z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>'], 'Unity': ['#8a8a8a', '<svg viewBox="0 0 24 24"><path d=\"m12.9288 4.2939 3.7997 2.1929c.1366.077.1415.2905 0 .3675l-4.515 2.6076a.4192.4192 0 0 1-.4246 0L7.274 6.8543c-.139-.0745-.1415-.293 0-.3675l3.7972-2.193V0L1.3758 5.5977V16.793l3.7177-2.1456v-4.3858c-.0025-.1565.1813-.2682.318-.1838l4.5148 2.6076a.4252.4252 0 0 1 .2136.3676v5.2127c.0025.1565-.1813.2682-.3179.1838l-3.7996-2.1929-3.7178 2.1457L12 24l9.6954-5.5977-3.7178-2.1457-3.7996 2.1929c-.1341.082-.3229-.0248-.3179-.1838V13.053c0-.1565.087-.2956.2136-.3676l4.5149-2.6076c.134-.082.3228.0224.3179.1838v4.3858l3.7177 2.1456V5.5977L12.9288 0Z\"/></svg>'] };
const toolName = { 'Cinema4D': 'Cinema 4D', 'Blender 3D': 'Blender', 'Zbrush': 'ZBrush', 'Davinci Resolve': 'DaVinci Resolve', 'Touch Designer': 'TouchDesigner', 'Sketchup': 'SketchUp' };
$('#kit').innerHTML = toolGroups.map(([label, c, names], gi) => `<section class="kit-card" style="--kc:${c}"><header><h3>${label}</h3></header><ul class="kit-tools">${names.map(n => {
  const ic = toolIcons.find(t => t[0] === n);
  if (!ic) return `<li class="tool" tabindex="0" style="--glow:${extraIcons[n][0]}"><span class="tool-icon tool-svg" aria-hidden="true">${extraIcons[n][1]}</span><span class="tool-name">${n}</span></li>`;
  const [, glow, w, html] = ic;
  return `<li class="tool" tabindex="0" style="--glow:${glow};--s:${(64 / (w * .59)).toFixed(4)};--o:${(-w * .2).toFixed(2)}px"><span class="tool-icon" aria-hidden="true"><span class="tool-layers">${html}</span></span><span class="tool-name">${toolName[n] || n}</span></li>`;
}).join('')}</ul></section>`).join('');
// every card gets two rows of tools; the last tool stretches across any spare cells so no box has a gap
$$('.kit-card').forEach(card => {
  const tools = $$('.tool', card), cols = Math.ceil(tools.length / 2);
  card.style.setProperty('--cols', cols);
  const spare = cols * 2 - tools.length;
  if (spare) tools[tools.length - 1].style.gridColumn = `span ${spare + 1}`;
});
$('#kit').style.gridTemplateColumns = $$('.kit-card').map(c => c.style.getPropertyValue('--cols') + 'fr').join(' ');

/* ---------------- experience film + encore ---------------- */


// the contact form keeps the vertical reel playing beside it, mirrored to the hero reel
// horizontal cut on desktops and as the phone mini-player; vertical on in-between widths
const creelHoriz = () => false; // vertical reel everywhere, sized to the brief card's height
const creel = $('#contact-reel'); let creelNear = false;
function syncCreel() {
  if (!creelNear) return;
  const hz = creelHoriz(); if ($('.contact-grid').classList.contains('horiz') !== hz) { $('.contact-grid').classList.toggle('horiz', hz); fitContactRow(); }
  const s = reelFile(!hz); if (creel.getAttribute('src') !== s) creel.src = s;
  if (creel.readyState > 0 && Math.abs(creel.currentTime - reel.currentTime) > .3 && Math.abs(creel.duration - reel.duration) < .5) creel.currentTime = reel.currentTime;
  creel.play().catch(() => {});
}
creel.muted = true; creel.loop = true; birdify(creel);
// the reel card matches the form's height exactly
new ResizeObserver(([e]) => $('.contact-grid').style.setProperty('--fh', e.target.offsetHeight + 'px')).observe($('#enquiry-form'));
// desktop row: the reel keeps its true 16:9 shape; its height (shared by form and links) is whatever leaves room for both
function fitContactRow() {
  const g = $('.contact-grid'), f = $('#enquiry-form');
  if (!g.classList.contains('horiz') || innerWidth <= 1100) return;
  return; // 50/50 layout: the reel sizes itself from its column width now
  const gap = parseFloat(getComputedStyle(g).columnGap) || 30;
  let rh = Math.max(300, Math.min(520, (g.clientWidth - 440 - gap * 2) * 9 / 16));
  for (let k = 0; k < 4; k++) { // grow until the form's content fits, keeping the reel at 16:9
    g.style.setProperty('--rh', rh.toFixed(1) + 'px');
    const need = f.scrollHeight; if (need <= f.clientHeight + 1 || need > 600) break; rh = need;
  }
}
new ResizeObserver(fitContactRow).observe($('.contact-grid'));
// 50/50 row: the form takes the reel's exact height (when its content fits) so the two read as a pair
new ResizeObserver(() => {
  const g = $('.contact-grid'), f = $('#enquiry-form'), r = $('.contact-reel');
  if (!g.classList.contains('horiz') || innerWidth <= 1100) { f.style.height = ''; return; }
  f.style.height = r.offsetHeight + 'px';
  if (f.scrollHeight > f.clientHeight + 1) f.style.height = '';
}).observe($('.contact-reel'));
creel.addEventListener('loadedmetadata', syncCreel);
new IntersectionObserver(es => { creelNear = es[0].isIntersecting; document.body.classList.toggle('at-contact', creelNear); if (creelNear) syncCreel(); else creel.pause(); }, { threshold: .15 }).observe($('#contact'));
setInterval(syncCreel, 1000);

/* ---------------- custom cursor ---------------- */
if (finePointer.matches) {
  document.documentElement.classList.add('has-cursor');
  const cur = $('#cursor'), label = $('.cursor-label', cur);
  let cx = -100, cy = -100, x = -100, y = -100;
  addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; x = e.clientX; y = e.clientY; const t = e.target.closest?.('[data-cursor]'); cur.classList.toggle('label', !!t); if (t) label.textContent = t.dataset.cursor; });
  document.documentElement.addEventListener('pointerleave', () => { x = y = -100; });
  (function follow() { cx += (x - cx) * .35; cy += (y - cy) * .35; cur.style.transform = `translate3d(${cx}px,${cy}px,0)`; requestAnimationFrame(follow); })();
}

/* ---------------- pause everything when the tab is hidden ---------------- */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) $$('video').forEach(v => v.pause());
  else { reel.play().catch(() => {}); $$('video[src]').forEach(v => { const r = v.getBoundingClientRect(); if (v !== pv && r.bottom > 0 && r.top < innerHeight && v.loop) v.play().catch(() => {}); }); }
});

/* ---------------- enquiry form (FormSubmit, unchanged recipient) ---------------- */
/* ---------------- "I need…" brief builder: spin a reel, hit next, then send ---------------- */
(function briefBuilder() {
  const band = $('#enquiry-form'); if (!band) return;
  const steps = $$('.cta-step:not(.cta-final)', band), fin = $('.cta-final', band), picked = {}, prog = $('#cta-progress');
  const summary = () => { const sm = $('#cta-summary'); sm.innerHTML = picked.need ? 'I need <b>' + picked.need + '</b>' + (picked.budget ? ', budget <b>' + picked.budget + '</b>' : '') + (picked.when ? ', delivered <b>' + picked.when + '</b>.' : '…') : ''; };
  steps.forEach(step => {
    const reel = $('.cta-reel', step), base = [...reel.children], n = base.length;
    for (let c = 0; c < 2; c++) base.forEach(li => { const cl = li.cloneNode(true); cl.setAttribute('aria-hidden', 'true'); $('button', cl).removeAttribute('role'); reel.append(cl); });
    const all = $$('.cta-pill', reel), win = $('.cta-window', step); let idx = n, spin = null;
    const rowH = () => all[0].parentElement.offsetHeight;
    const show = (i, anim = true) => {
      idx = i; reel.style.transition = anim ? '' : 'none';
      const vis = parseInt(getComputedStyle(win).getPropertyValue('--vis')) || 3;
      reel.style.transform = `translateY(${-(idx - Math.floor(vis / 2)) * rowH()}px)`;
      all.forEach((b, k) => b.toggleAttribute('data-selected', k === idx));
      base.forEach((li, k) => { const b = $('button', li), on = k === idx % n; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
      if (anim) setTimeout(() => { if (idx < n || idx >= 2 * n) show(n + (idx % n), false); }, 520);
    };
    const stop = () => { clearInterval(spin); spin = null; };
    const pick = i => { stop(); show(i); };
    all.forEach((b, k) => b.addEventListener('click', () => pick(k)));
    reel.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); pick(idx + 1); } if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); pick(idx - 1); } });
    let wheelT = 0, ty = null;
    win.addEventListener('wheel', e => { e.preventDefault(); const t = performance.now(); if (t - wheelT < 180) return; wheelT = t; pick(idx + (e.deltaY > 0 ? 1 : -1)); }, { passive: false });
    // a swipe inside the reel moves only the pills (the page stays put); swipes beside it still scroll the page
    win.addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive: true });
    win.addEventListener('touchmove', e => {
      if (ty == null) return; e.preventDefault();
      const y = e.touches[0].clientY, d = y - ty, rowH = Math.max(28, win.clientHeight / 5);
      if (Math.abs(d) >= rowH) { pick(idx + (d < 0 ? 1 : -1)); ty = y; }
    }, { passive: false });
    win.addEventListener('touchend', () => { ty = null; });
    requestAnimationFrame(() => show(n, false)); addEventListener('resize', () => show(idx, false));
    step.start = () => { if (!reduced.matches && !spin) spin = setInterval(() => show(idx + 1), 1600); };
    // three equal columns; label, pills and next each grow to the largest 8-px size their column allows
    const fit = () => {
      if (!step.classList.contains('is-on')) return;
      const colW = win.clientWidth, availH = isPhone() ? 380 : band.clientHeight - 16, LMAX = isPhone() ? 64 : 80, PMAX = isPhone() ? 40 : 72;
      const longest = all.slice(0, n).reduce((a, b) => b.textContent.length > a.textContent.length ? b : a);
      let pf = PMAX; step.style.setProperty('--pf', pf + 'px');
      while (pf > 16 && longest.offsetWidth > colW) { pf -= 8; step.style.setProperty('--pf', pf + 'px'); }
      let vis = 5; while (vis > 1 && vis * pf * 2.1 > availH) vis -= 2;
      if (vis * pf * 2.1 > availH) { while (pf > 16 && pf * 2.1 > availH) { pf -= 8; step.style.setProperty('--pf', pf + 'px'); } }
      step.style.setProperty('--vis', vis);
      // label: one line if it can stay big, otherwise wrap between words
      const lab = $('.cta-label', step); let lf = LMAX; lab.style.whiteSpace = 'nowrap'; lab.style.fontSize = lf + 'px';
      while (lf > 16 && lab.scrollWidth > lab.clientWidth + 1) { lf -= 8; lab.style.fontSize = lf + 'px'; }
      if (lf < 40) { lab.style.whiteSpace = 'normal'; lf = LMAX; lab.style.fontSize = lf + 'px';
        const longestWord = () => Math.max(...lab.textContent.split(' ').map(w => { const r = document.createRange(); const sp = document.createElement('span'); sp.textContent = w; sp.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:inherit'; lab.append(sp); const ww = sp.offsetWidth; sp.remove(); return ww; }));
        while (lf > 16 && (longestWord() > lab.clientWidth || lab.scrollHeight > availH)) { lf -= 8; lab.style.fontSize = lf + 'px'; } }
      const nb = $('.cta-next', step); let nf = isPhone() ? 32 : 56; nb.style.fontSize = nf + 'px';
      while (nf > 16 && nb.offsetWidth > colW) { nf -= 8; nb.style.fontSize = nf + 'px'; }
      show(idx, false);
    };
    step.stop = stop; step.refresh = () => { fit(); show(idx, false); };
    addEventListener('resize', () => requestAnimationFrame(fit));
    step.value = () => $('button', base[idx % n]).dataset.v;
    $('.cta-next', step).addEventListener('click', () => {
      stop(); picked[step.dataset.key] = step.value(); summary();
      const i = +step.dataset.step, nxt = steps[i + 1];
      step.classList.remove('is-on'); if (prog) prog.textContent = (i + 2) + ' / 4';
      if (nxt) { nxt.classList.add('is-on'); nxt.refresh(); nxt.start(); return; }
      $('#h-need').value = picked.need; $('#h-budget').value = picked.budget; $('#h-when').value = picked.when;
      fin.classList.add('is-on'); band.classList.add('at-final');
      setTimeout(() => $('#f-name').focus({ preventScroll: true }), 200);
    });
  });
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { steps[0].refresh(); steps[0].start(); o.disconnect(); } }), { threshold: .4 }).observe(band);
  if (document.fonts) document.fonts.ready.then(() => steps[0].refresh());
  $('#cta-summary').addEventListener('click', () => { for (const k in picked) delete picked[k]; summary(); band.classList.remove('at-final'); fin.classList.remove('is-on'); steps.forEach(st => { st.classList.remove('is-on'); st.stop(); }); steps[0].classList.add('is-on'); steps[0].refresh(); steps[0].start(); prog.textContent = '1 / 4'; });
  // the brief travels with the message even if they leave "Anything else?" empty
  band.addEventListener('submit', () => { const ta = $('#f-req'); const line = `I need ${picked.need}, with a budget of ${picked.budget}, delivered ${picked.when}.`; if (!ta.value.includes(line)) ta.value = (line + ' ' + ta.value).trim(); }, true);
})();
const form = $('#enquiry-form');
form.addEventListener('submit', async e => {
  e.preventDefault(); if (!form.reportValidity()) return;
  const btn = $('button[type=submit]', form), status = $('#enquiry-status');
  if (btn.disabled) return;
  const payload = Object.fromEntries(new FormData(form)); if (payload._honey) return;
  if (window.KH_PREVIEW) { status.dataset.error = 'true'; status.textContent = 'This is a preview link, so the form is switched off here. On kushhuman.com it sends to kushagra.kumar@kushhuman.com.'; return; }
  btn.disabled = true; status.dataset.error = 'false'; status.textContent = 'Sending your enquiry…';
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 25000);
  try {
    const res = await fetch('https://formsubmit.co/ajax/kushagra.kumar@kushhuman.com', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), signal: ctl.signal });
    const out = await res.json();
    if (!res.ok || !(out.success === true || out.success === 'true')) throw new Error('not accepted');
    status.textContent = 'Thanks! Your enquiry has been submitted. I’ll get back to you by email.'; form.reset();
  } catch (err) {
    status.dataset.error = 'true';
    status.textContent = (err.name === 'AbortError' ? 'The connection timed out.' : 'Could not send your enquiry.') + ' Your text is still here — please try again, or email kushagra.kumar@kushhuman.com.';
  } finally { clearTimeout(to); btn.disabled = false; }
});

/* ---------------- brands: the logo video, rebuilt in code ----------------
   Same order as "Main Brands" — cards drift left and swell as they pass the lens. */
const brands = [
  ['European Union', 'european-union', 'https://european-union.europa.eu'],
  ['Cholify', 'cholify'],
  ['KPMG', 'kpmg', 'https://kpmg.com'],
  ['Venticare', 'venticare'],
  ['Max Fashion', 'max', 'https://www.maxfashion.in'],
  ['Heardstone', 'heardstone', 'https://www.tukios.com/heardstone'],
  ['Great Place To Work', 'great-place-to-work', 'https://www.greatplacetowork.com', 1],
  ['Pursue', 'pursue'],
  ['Whatmore.ai', 'whatmore', 'https://www.whatmore.ai'],
  ['Miles Education', 'miles-education', 'https://mileseducation.com'],
  ['Tukios', 'tukios', 'https://www.tukios.com'],
  ['Beatoven.ai', 'beatoven', 'https://www.beatoven.ai'],
  ['Axiom', 'axiom'],
  ['Humyn Labs', 'humyn-labs', 'https://humynlabs.ai'],
  ['iContainers', 'icontainers', 'https://www.icontainers.com'],
  ['KGEN', 'kgen', null, 1],
  ['Perfios', 'perfios', 'https://www.perfios.com']
];
const wheel = $('#logo-wheel'), wtrack = $('#wheel-track');
const cards = brands.map(([name, file, url, tall]) => {
  const el = document.createElement(url ? 'a' : 'div');
  el.className = 'logo-card' + (tall ? ' tall' : '');
  if (url) { el.href = url; el.target = '_blank'; el.rel = 'noopener noreferrer'; el.setAttribute('aria-label', name + ' (opens their website)'); el.dataset.cursor = 'VISIT'; }
  else el.setAttribute('aria-label', name);
  el.draggable = false;
  el.innerHTML = `<img src="${A}v2/${file === 'humyn-labs' ? 'logos-svg/humyn-labs.svg' : 'logos-hq/' + file + '.png'}" alt="${name}" draggable="false">`;
  wtrack.append(el);
  return { el, w: 0, base: 0 };
});
let wOffset = 0, wVel = 0, wHover = false, wDrag = null, wVisible = false, wLen = 1;
function measureWheel() {
  const gap = isPhone() ? 26 : 46; let x = 0;
  for (const c of cards) { c.w = c.el.offsetWidth; c.base = x; x += c.w + gap; }
  wLen = x;
}
addEventListener('load', measureWheel); $$('img', wtrack).forEach(i => i.addEventListener('load', measureWheel)); measureWheel();
addEventListener('resize', measureWheel);
new IntersectionObserver(es => wVisible = es[0].isIntersecting).observe(wheel);
wheel.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') wHover = true; });
wheel.addEventListener('pointerleave', () => wHover = false);
wheel.addEventListener('pointerdown', e => { wDrag = { x: e.clientX, o: wOffset, moved: 0, t: performance.now() }; });
addEventListener('pointermove', e => { if (!wDrag) return; const dx = e.clientX - wDrag.x; wDrag.moved = Math.max(wDrag.moved, Math.abs(dx)); if (wDrag.moved > 6) { wheel.classList.add('drag'); const now = performance.now(); wVel = (wDrag.o + dx - wOffset) / Math.max(1, (now - wDrag.t) / 16.67); wDrag.t = now; wOffset = wDrag.o + dx; } });
addEventListener('pointerup', () => { if (wDrag && wDrag.moved > 6) { const stop = e => { e.preventDefault(); e.stopPropagation(); }; wheel.addEventListener('click', stop, { capture: true, once: true }); setTimeout(() => wheel.removeEventListener('click', stop, { capture: true }), 50); } wDrag = null; wheel.classList.remove('drag'); });
// Even gaps: cards swell near the centre, and every neighbour is re-laid out
// edge-to-edge with a fixed gap, so nothing overlaps or drifts apart.
const wGap = () => isPhone() ? 18 : 28;
const wScale = (cx, W) => { const d = (cx - W / 2) / (W / 2); return .74 + .4 * Math.exp(-((d * 1.6) ** 2)); };
function layoutFrom(order, k, W) {
  // place card k centred where its unscaled centre would be, then pack outwards
  const gap = wGap(), L = new Array(order.length), S = new Array(order.length);
  const c = order[k], cx = c.x + c.w / 2; S[k] = wScale(cx, W); L[k] = cx - c.w * S[k] / 2;
  for (let i = k + 1; i < order.length; i++) { const p = order[i - 1], q = order[i]; const right = L[i - 1] + p.w * S[i - 1] + gap; S[i] = wScale(right + q.w * .45, W); L[i] = right; }
  for (let i = k - 1; i >= 0; i--) { const q = order[i]; S[i] = wScale(L[i + 1] - gap - q.w * .45, W); L[i] = L[i + 1] - gap - q.w * S[i]; }
  return [L, S];
}
function wheelLoop() {
  if (wVisible && wLen > 1) {
    const W = wheel.clientWidth;
    if (!wDrag) { const target = reduced.matches ? 0 : (wHover ? -.25 : -1.1); wVel += (target - wVel) * .05; wOffset += wVel; }
    for (const c of cards) { let x = ((c.base + wOffset) % wLen + wLen) % wLen; if (x > W + 200) x -= wLen; c.x = x; }
    const order = [...cards].sort((a, b) => a.x - b.x);
    // the two cards either side of the centre line; blend their layouts so motion stays smooth
    let k = order.findIndex(c => c.x + c.w / 2 > W / 2); if (k < 1) k = 1;
    const a = order[k - 1], b = order[k], ca = a.x + a.w / 2, cb = b.x + b.w / 2;
    const t = clamp((W / 2 - ca) / Math.max(1, cb - ca));
    const [La, Sa] = layoutFrom(order, k - 1, W), [Lb, Sb] = layoutFrom(order, k, W);
    order.forEach((c, i) => {
      const x = La[i] + (Lb[i] - La[i]) * t, sc = Sa[i] + (Sb[i] - Sa[i]) * t;
      const d = (x + c.w * sc / 2 - W / 2) / (W / 2);
      c.el.style.transform = `translate3d(${x.toFixed(1)}px,-50%,0) scale(${sc.toFixed(3)})`;
      c.el.style.zIndex = Math.round(sc * 100);
      c.el.style.opacity = 1;
    });
  }
  requestAnimationFrame(wheelLoop);
}
requestAnimationFrame(wheelLoop);

/* ---------------- selection frames show their live size, like Figma ---------------- */
const selRO = new ResizeObserver(es => es.forEach(e => { const r = e.target.getBoundingClientRect(); e.target.dataset.dim = `${Math.round(r.width)} × ${Math.round(r.height)}`; }));
$$('.sel').forEach(s => selRO.observe(s));

/* ---------------- journey: durations + full-time total (inclusive months, like LinkedIn) ---------------- */
(function durations() {
  const now = new Date(), nowM = now.getFullYear() * 12 + now.getMonth();
  const m = s => s === 'now' ? nowM : (([y, mo]) => y * 12 + mo - 1)(s.split('-').map(Number));
  const fmt = n => { const y = Math.floor(n / 12), r = n % 12; return [y && `${y} yr${y > 1 ? 's' : ''}`, r && `${r} mo${r > 1 ? 's' : ''}`].filter(Boolean).join(' ') || '1 mo'; };
  const covered = new Set();
  for (const li of $$('.xp2 li[data-from]')) {
    const a = m(li.dataset.from), b = m(li.dataset.to);
    $('.t-dur', li).textContent = fmt(b - a + 1);
    if (li.dataset.type === 'ft') for (let k = m(li.dataset.ftFrom || li.dataset.from); k <= b; k++) covered.add(k); // overlaps count once
  }
  const total = () => {
    const d = new Date(), cur = d.getFullYear() * 12 + d.getMonth(), extra = Math.max(0, cur - nowM);
    if (!$('#ft-total')) return;
    $('#ft-total').textContent = fmt(covered.size + extra); // rolls into the next month on its own
    const start = new Date(d.getFullYear(), d.getMonth(), 1), s = Math.floor((d - start) / 1000);
    const dd = Math.floor(s / 86400), hh = Math.floor(s / 3600) % 24, mm = Math.floor(s / 60) % 60, ss = s % 60, p = n => String(n).padStart(2, '0');
    $('#ft-tick').textContent = `+ ${dd}d ${p(hh)}:${p(mm)}:${p(ss)}`;
  };
  total(); setInterval(total, 1000);
  // each card carries a tiny 2018 → today track showing where that role sits in the story
  const t0 = 2018 * 12, t1 = nowM + 1, pct = k => ((k - t0) / (t1 - t0) * 100).toFixed(3) + '%';
  // newest first, and each stop carries its start year for the spine
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  $$('.xp2').forEach(xpList => [...xpList.children].sort((a, b) => m(b.dataset.span.split(' ')[0]) - m(a.dataset.span.split(' ')[0])).forEach(li => xpList.append(li)));
  $$('.xp2 li').forEach(li => { const [y, mo] = li.dataset.span.split(' ')[0].split('-'); li.dataset.year = y; li.dataset.mon = MON[+mo - 1]; });
  $$('.xp2 li[data-span]').forEach((li, i) => {
    const [a, b] = li.dataset.span.split(' ').map(m);
    li.style.setProperty('--s', pct(a)); li.style.setProperty('--w', ((Math.min(b, nowM) - a + 1) / (t1 - t0) * 100).toFixed(3) + '%'); li.style.setProperty('--i', i);
  });
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { $('#journey').classList.add('lit'); o.disconnect(); } }), { threshold: .2 }).observe($('.xp-cols'));
})();

/* ---------------- stats count up the first time they appear ---------------- */
const countIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; countIO.unobserve(e.target);
  const el = e.target, n = +el.dataset.count, t0 = performance.now(), dur = 1400 + n * 6;
  if (reduced.matches) { el.textContent = n; return; }
  (function step(t) { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(n * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(step); })(t0);
}), { threshold: .6 });
$$('[data-count]').forEach(el => countIO.observe(el));

/* contact toy box: drag the shapes anywhere inside their box; they tilt while carried */
for (const t of $$('.c-toys .toy')) {
  let sx, sy, ox = 0, oy = 0, rot = 0;
  t.addEventListener('pointerdown', e => {
    e.preventDefault(); t.setPointerCapture(e.pointerId); t.classList.add('drag', 'moved');
    sx = e.clientX - ox; sy = e.clientY - oy;
  });
  t.addEventListener('pointermove', e => {
    if (!t.classList.contains('drag')) return;
    const box = t.parentElement.getBoundingClientRect(), r0 = t.getBoundingClientRect();
    const nx = e.clientX - sx, ny = e.clientY - sy;
    rot = Math.max(-18, Math.min(18, (nx - ox) * 1.5));
    // keep each toy within the contact section's width
    const sec = t.closest('.contact').getBoundingClientRect();
    const dx = nx - ox, nl = r0.left + dx, nr = r0.right + dx;
    if (nl < sec.left + 4 || nr > sec.right - 4) return;
    ox = nx; oy = ny; t.style.transform = `translate(${ox}px,${oy}px) rotate(${rot}deg)`;
  });
  const drop = () => { if (!t.classList.contains('drag')) return; t.classList.remove('drag'); t.style.transform = `translate(${ox}px,${oy}px) rotate(${rot * .3}deg)`; t.style.transition = 'transform .5s var(--spring)'; setTimeout(() => t.style.transition = '', 500); };
  t.addEventListener('pointerup', drop); t.addEventListener('pointercancel', drop);
}

/* brands orb strip: shapes drift on their own and scatter away from the pointer, then spring home */
(() => {
  const strip = $('.b-orbs'); if (!strip) return;
  const orbs = $$('.orb', strip), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, px = -9999, py = -9999, on = false;
  const st = orbs.map((o, i) => ({ o, hx: 0, hy: 0, x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0, ph: i * 1.7, sp: .35 + (i % 5) * .08 }));
  const layout = () => {
    W = strip.clientWidth; H = strip.clientHeight;
    const vis = st.filter(s => s.o.offsetParent);
    vis.forEach((s, i) => { const sz = s.o.offsetWidth; s.hx = (i + .5) / vis.length * W - sz / 2 + Math.sin(i * 7.3) * 18; s.hy = H / 2 - s.o.offsetHeight / 2 + Math.cos(i * 3.1) * H * .22; if (!s.x) { s.x = s.hx; s.y = s.hy; } });
  };
  layout(); addEventListener('resize', layout);
  const pt = e => { const r = strip.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; };
  strip.addEventListener('pointermove', pt); strip.addEventListener('pointerdown', e => { pt(e); // a tap kicks the nearest shapes into a spin
    st.forEach(s => { const dx = s.x - px, dy = s.y - py, d = Math.hypot(dx, dy); if (d < 160) { s.vx += dx / (d + 1) * 14; s.vy += dy / (d + 1) * 14; s.vr += (Math.random() - .5) * 40; } }); });
  strip.addEventListener('pointerleave', () => { px = py = -9999; });
  new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) { layout(); requestAnimationFrame(tick); } }).observe(strip);
  let t0 = performance.now();
  function tick(now) {
    const t = (now - t0) / 1000;
    for (const s of st) {
      const tx = s.hx + (still ? 0 : Math.sin(t * s.sp + s.ph) * 26), ty = s.hy + (still ? 0 : Math.cos(t * s.sp * 1.3 + s.ph) * 12);
      s.vx += (tx - s.x) * .04; s.vy += (ty - s.y) * .04; // spring home
      const cx = s.x + s.o.offsetWidth / 2, cy = s.y + s.o.offsetHeight / 2, dx = cx - px, dy = cy - py, d = Math.hypot(dx, dy);
      if (d < 110) { const f = (110 - d) / 110 * 2.6; s.vx += dx / (d + 1) * f; s.vy += dy / (d + 1) * f; s.vr += f * (dx > 0 ? 1 : -1); }
      s.vx *= .86; s.vy *= .86; s.vr *= .9; s.x += s.vx; s.y += s.vy; s.r += s.vr + (still ? 0 : .15);
      s.o.style.transform = `translate(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px) rotate(${s.r.toFixed(1)}deg)`;
    }
    if (on) requestAnimationFrame(tick);
  }
})();

/* services stack: each card shrinks a step and tilts a little more every time another card lands on it */
(() => {
  const cards = $$('.services .svc'); if (!cards.length || reduced.matches) return;
  const run = () => {
    const prog = cards.map((c, i) => { // how far card i has slid over the card before it (0..1)
      if (!i) return 0; const a = cards[i - 1].getBoundingClientRect(), b = c.getBoundingClientRect();
      return Math.max(0, Math.min(1, 1 - (b.top - a.top) / a.height));
    });
    cards.forEach((c, i) => {
      let depth = 0; for (let k = i + 1; k < cards.length; k++) depth += prog[k]; // cards stacked on top of this one
      const tilt = (i % 2 ? 1 : -1) * Math.min(depth, 3) * 2;
      c.style.transform = depth ? `scale(${(1 - depth * .075).toFixed(4)}) rotate(${tilt.toFixed(2)}deg)` : '';
      c.style.filter = depth ? `brightness(${(1 - Math.min(depth, 3) * .07).toFixed(3)})` : '';
    });
  };
  addEventListener('scroll', () => requestAnimationFrame(run), { passive: true }); addEventListener('resize', run); run();
})();

/* Work & experiences: as you scroll, the entry nearest the reading line lights up pink, one at a time
   (one per column side by side on laptops, one overall when the lists stack on phones) */
(() => {
  const lists = $$('.xp2'); if (!lists.length) return;
  const run = () => {
    const line = innerHeight * .45, cols = new Map();
    lists.forEach(l => { const x = Math.round(l.getBoundingClientRect().left); if (!cols.has(x)) cols.set(x, []); cols.get(x).push(...l.children); });
    const all = lists.flatMap(l => [...l.children]), on = new Set();
    cols.forEach(items => {
      let best = null, bd = 1e9;
      items.forEach(li => { const r = li.getBoundingClientRect(); const d = Math.abs((r.top + r.bottom) / 2 - line); if (d < bd) { bd = d; best = li; } });
      if (best) { const r = best.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) on.add(best); }
    });
    all.forEach(li => li.classList.toggle('xp-on', on.has(li)));
  };
  addEventListener('scroll', () => requestAnimationFrame(run), { passive: true }); addEventListener('resize', run); run();
})();

/* focus rings only for keyboard navigation: a click or tap switches them off, Tab brings them back */
addEventListener('pointerdown', () => document.documentElement.classList.add('by-pointer'), true);
addEventListener('keydown', e => { if (e.key === 'Tab') document.documentElement.classList.remove('by-pointer'); }, true);
document.documentElement.classList.add('by-pointer');

/* plus buttons (Work & experiences, toolkit): open / close the panel inside their section */
$$('.xp-toggle').forEach(btn => {
  const sec = btn.closest('section'), what = btn.getAttribute('aria-label').replace(/^Show /, '');
  btn.addEventListener('click', () => {
    const open = sec.classList.toggle('xp-open');
    btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', (open ? 'Hide ' : 'Show ') + what);
    dispatchEvent(new Event('resize'));
  });
});
