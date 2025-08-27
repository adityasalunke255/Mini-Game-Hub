import '../../assets/js/particles.js';
import { addScore, getScores, openDrawer, attachDrawerClose } from '../../assets/js/leaderboard.js';
import { enableRipples } from '../../assets/js/ripple.js';

const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Theme
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

document.getElementById('viewLB').addEventListener('click', ()=> openDrawer('Reaction Test', getScores('react')));

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

// Loader -> arena
setTimeout(()=>{
  document.getElementById('loader').classList.add('hidden');
  document.getElementById('arena').classList.remove('hidden');
  gsap.from('#arena', { opacity: 0, y: prefersReduced?0:8, duration: prefersReduced?0.01:0.25 });
}, 400);

const arena = document.getElementById('arena');
const promptEl = document.getElementById('prompt');
const timeEl = document.getElementById('time');
const startBtn = document.getElementById('start');
const resetBtn = document.getElementById('reset');

let state = 'idle'; // idle -> waiting -> go
let timer = null;
let startTs = 0;

function toIdle(){
  state = 'idle';
  arena.classList.remove('ready','go');
  promptEl.textContent = 'Tap to start';
  timeEl.textContent = '0 ms';
}

function start(){
  if (state !== 'idle') return;
  state = 'waiting';
  arena.classList.remove('go');
  arena.classList.add('ready');
  promptEl.textContent = 'Wait for green...';
  timeEl.textContent = '0 ms';
  const delay = 1000 + Math.random()*2000; // 1-3s
  clearTimeout(timer);
  timer = setTimeout(()=>{ go(); }, delay);
}

function go(){
  if (state !== 'waiting') return;
  state = 'go';
  arena.classList.remove('ready');
  arena.classList.add('go');
  promptEl.textContent = 'NOW! Tap!';
  startTs = performance.now();
}

function early(){
  if (state === 'waiting'){
    clearTimeout(timer);
    promptEl.textContent = 'Too soon! Tap start to try again';
    state = 'idle';
    arena.classList.remove('ready','go');
  }
}

function record(){
  if (state !== 'go') { early(); return; }
  const t = Math.round(performance.now() - startTs);
  timeEl.textContent = `${t} ms`;
  promptEl.textContent = 'Nice! Save your score?';
  celebrate();
  const name = prompt('Fast! Enter your name for the leaderboard:', 'Player');
  // Convert lower-is-better to higher-is-better score (cap at 1000)
  const score = Math.max(1, 1000 - t);
  if (name) addScore('react', name, score);
  setTimeout(()=> openDrawer('Reaction Test', getScores('react')), 200);
  state = 'idle';
  arena.classList.remove('ready','go');
}

arena.addEventListener('click', ()=>{ if (state==='idle') start(); else record(); });
arena.addEventListener('keydown', (e)=>{
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (state==='idle') start(); else record(); }
});
startBtn.addEventListener('click', start);
resetBtn.addEventListener('click', toIdle);

function celebrate(){
  const count = 120; const defaults = { origin: { y: 0.7 } };
  function fire(particleRatio, opts) {
    confetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(count * particleRatio) }));
  }
  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#6be7ff','#a78bfa','#ff9f6b'] });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
}

// Page transitions
const dur = prefersReduced?0.01:0.4; const y= prefersReduced?0:8;
gsap.fromTo('main, header', { opacity: 0, y }, { opacity: 1, y: 0, duration: dur, ease:'power1.out' });

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]'); if (!a) return;
  const url = a.getAttribute('href'); if (url.startsWith('#')) return;
  e.preventDefault(); const overlay = document.getElementById('pageFade');
  gsap.to(overlay, { opacity: 1, duration: prefersReduced?0.01:0.25, onComplete: ()=> { window.location.href = url; } });
}, true);
