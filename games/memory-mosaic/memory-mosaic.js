import '../../assets/js/particles.js';
import { addScore, getScores, openDrawer, attachDrawerClose } from '../../assets/js/leaderboard.js';
import { enableRipples } from '../../assets/js/ripple.js';

const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

(function theme(){
  const t = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('themeToggle').addEventListener('click', ()=>{
    const next = (document.documentElement.getAttribute('data-theme')==='dark')?'light':'dark';
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  });
})();

enableRipples();
attachDrawerClose();

document.getElementById('viewLB').addEventListener('click', ()=> openDrawer('Memory Mosaic', getScores('memorymosaic')));

// Help modal
function setupHelp(){
  const openBtn = document.getElementById('helpBtn');
  const modal = document.getElementById('helpModal');
  const backdrop = document.getElementById('helpBackdrop');
  if (!openBtn || !modal || !backdrop) return;
  const open = ()=> { modal.classList.add('show'); backdrop.style.display='block'; };
  const close = ()=> { modal.classList.remove('show'); backdrop.style.display='none'; };
  openBtn.addEventListener('click', open);
  modal.querySelectorAll('.close-help').forEach(b=> b.addEventListener('click', close));
  backdrop.addEventListener('click', close);
}
setupHelp();

setTimeout(()=>{
  document.getElementById('loader').classList.add('hidden');
  const stage = document.getElementById('stage');
  stage.classList.remove('hidden');
  buildSilhouette(stage);
  buildPieces(stage);
  gsap.from('#stage .piece', { opacity:0, y: prefersReduced?0:8, stagger: prefersReduced?0:0.02, duration: prefersReduced?0.01:0.25 });
}, 400);

const snappedEl = document.getElementById('snapped');
let snapped = 0;

function buildSilhouette(stage){
  const sh = document.createElement('div'); sh.className='silhouette';
  sh.innerHTML = '<svg width="100%" height="100%" viewBox="0 0 720 480" aria-hidden="true"><path d="M120 340 L220 200 L320 320 L420 180 L520 320 L600 220" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  stage.appendChild(sh);
}

const targets = [
  { x: 180, y: 320, rot: 0 },
  { x: 245, y: 245, rot: 0 },
  { x: 320, y: 300, rot: 0 },
  { x: 405, y: 220, rot: 0 },
  { x: 500, y: 300, rot: 0 },
  { x: 570, y: 240, rot: 0 },
];

function buildPieces(stage){
  targets.forEach((t, i)=>{
    const p = document.createElement('div');
    p.className='piece'; p.textContent = i+1; p.tabIndex = 0;
    const px = 40 + Math.random()* (stage.clientWidth-80);
    const py = 40 + Math.random()* (stage.clientHeight-80);
    p.style.left = px+'px'; p.style.top = py+'px';
    p.dataset.i = i;
    p.style.transform = `rotate(${(Math.random()<0.5?0:90)}deg)`;
    makeDraggable(p, stage);
    stage.appendChild(p);
  });
}

let active = null; let offsetX=0, offsetY=0; let rotDeg = 0;
function makeDraggable(el, stage){
  function onDown(e){
    const pt = getPoint(e, stage);
    active = el; el.classList.remove('snapped');
    const rect = el.getBoundingClientRect(); const st = stage.getBoundingClientRect();
    offsetX = pt.x - (rect.left - st.left); offsetY = pt.y - (rect.top - st.top);
    rotDeg = getRotation(el);
  }
  function onMove(e){
    if (!active) return; e.preventDefault();
    const pt = getPoint(e, stage);
    const x = pt.x - offsetX; const y = pt.y - offsetY;
    active.style.left = clamp(x, 0, stage.clientWidth - active.clientWidth) + 'px';
    active.style.top  = clamp(y, 0, stage.clientHeight - active.clientHeight) + 'px';
  }
  function onUp(){ if (!active) return; trySnap(active, stage); active = null; }

  el.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  el.addEventListener('touchstart', (e)=>{ onDown(e); }, { passive:true });
  window.addEventListener('touchmove', (e)=>{ onMove(e); }, { passive:false });
  window.addEventListener('touchend', onUp);

  el.addEventListener('keydown', (e)=>{
    if ((e.key==='r' || e.key==='R')) { rotatePiece(el); }
  });
}

function getRotation(el){
  const st = window.getComputedStyle(el).transform;
  if (st === 'none') return 0;
  const m = st.match(/matrix\(([^)]+)\)/);
  if (!m) return 0;
  const a = parseFloat(m[1].split(',')[0]); const b = parseFloat(m[1].split(',')[1]);
  let deg = Math.round(Math.atan2(b,a) * (180/Math.PI));
  return (deg%360+360)%360;
}

function rotatePiece(el){
  const r = (getRotation(el)+90)%360; el.style.transform = `rotate(${r}deg)`;
}

function trySnap(el, stage){
  const i = parseInt(el.dataset.i,10);
  const t = targets[i];
  const rect = el.getBoundingClientRect(); const st = stage.getBoundingClientRect();
  const cx = rect.left - st.left + rect.width/2; const cy = rect.top - st.top + rect.height/2;
  const d = Math.hypot(cx - t.x, cy - t.y);
  const okRot = Math.min(Math.abs(getRotation(el)-t.rot), 360 - Math.abs(getRotation(el)-t.rot)) < 10;
  if (d < 28 && okRot) {
    // snap
    el.style.left = (t.x - rect.width/2)+'px';
    el.style.top = (t.y - rect.height/2)+'px';
    el.classList.add('snapped');
    if (!el.dataset.snapped){ snapped++; snappedEl.textContent = snapped; el.dataset.snapped = '1'; bounce(el); }
    if (snapped === targets.length) endGame();
  }
}

function bounce(el){ if (prefersReduced) return; gsap.from(el, { y: -8, duration: .2, ease:'power1.out' }); }

function getPoint(e, stage){
  const rect = stage.getBoundingClientRect();
  const clientX = e.touches? e.touches[0].clientX : e.clientX;
  const clientY = e.touches? e.touches[0].clientY : e.clientY;
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

document.getElementById('reset').addEventListener('click', ()=> window.location.reload());

function endGame(){
  const timeUsed = performance.now();
  // basic score: higher is better with speed and low rotations: use snapped and speed
  const name = prompt('Great assembly! Enter your name:', 'Player');
  // simple score based on quick finish: use inverse of duration since page load
  const durSec = Math.max(1, Math.round((timeUsed - perfStart)/1000));
  const score = Math.max(1, 1000 - durSec*20);
  if (name) addScore('memorymosaic', name, score);
  celebrate();
  setTimeout(()=> openDrawer('Memory Mosaic', getScores('memorymosaic')), 200);
}

function celebrate(){
  const count = 120; const defaults = { origin: { y: 0.7 } };
  function fire(particleRatio, opts) { confetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(count * particleRatio) })); }
  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#6be7ff','#a78bfa','#ff9f6b'] });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
}

const perfStart = performance.now();
const dur = prefersReduced?0.01:0.4; const y= prefersReduced?0:8;
gsap.fromTo('main, header', { opacity: 0, y }, { opacity: 1, y: 0, duration: dur, ease:'power1.out' });

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]'); if (!a) return;
  const url = a.getAttribute('href'); if (url.startsWith('#')) return;
  e.preventDefault(); const overlay = document.getElementById('pageFade');
  gsap.to(overlay, { opacity: 1, duration: prefersReduced?0.01:0.25, onComplete: ()=> { window.location.href = url; } });
}, true);
