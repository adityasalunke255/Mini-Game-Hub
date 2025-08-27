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

document.getElementById('viewLB').addEventListener('click', ()=> openDrawer('Echo Architect', getScores('echoarchitect')));

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

// Loader -> show HUD + board
setTimeout(()=>{
  document.getElementById('loader').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('boardWrap').classList.remove('hidden');
  gsap.from('#board', { opacity: 0, y: prefersReduced?0:8, duration: prefersReduced?0.01:0.25 });
  init();
}, 400);

const W = 720, H = 540;
let canvas, ctx;
let nodes = [];
let targets = [];
let litCount = 0;
let nodeLimit = 5;
let timeLeft = 60;
let running = false;
let lastT = 0;

function init(){
  canvas = document.getElementById('board');
  ctx = canvas.getContext('2d');
  resetState();
  bindUI();
  loop();
  tickTimer();
}

function resetState(){
  nodes = [];
  targets = randomTargets(3);
  litCount = 0; timeLeft = 60; running = true; lastT = performance.now();
  document.getElementById('lit').textContent = litCount;
  document.getElementById('ncount').textContent = nodes.length;
  document.getElementById('time').textContent = timeLeft;
}

function bindUI(){
  document.getElementById('place').addEventListener('click', ()=> pendingPlace = true);
  document.getElementById('reset').addEventListener('click', ()=> { running=false; resetState(); });
  canvas.addEventListener('click', (e)=>{
    if (!running) return;
    if (!pendingPlace) return;
    if (nodes.length >= nodeLimit) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width/rect.width);
    const y = (e.clientY - rect.top) * (canvas.height/rect.height);
    const phase = parseFloat(document.getElementById('phase').value);
    const freq = parseFloat(document.getElementById('freq').value);
    nodes.push({ x, y, phase, freq });
    document.getElementById('ncount').textContent = nodes.length;
    pendingPlace = false;
  });
}

let pendingPlace = false;

function randomTargets(n){
  const arr = [];
  for (let i=0;i<n;i++){
    const x = 80 + Math.random()*(W-160);
    const y = 80 + Math.random()*(H-160);
    arr.push({ x, y, r: 12, lit: false, stable: 0 });
  }
  return arr;
}

function tickTimer(){
  const id = setInterval(()=>{
    if (!running) return clearInterval(id);
    timeLeft--; document.getElementById('time').textContent = timeLeft;
    if (timeLeft <= 0){ running=false; endRun(false); clearInterval(id); }
  }, 1000);
}

function loop(){
  const now = performance.now();
  const dt = Math.min(0.033, (now - lastT)/1000);
  lastT = now;
  update(dt, now/1000);
  draw(now/1000);
  if (running) requestAnimationFrame(loop);
  else draw(now/1000);
}

function update(dt, t){
  // Compute intensity at targets from nodes
  targets.forEach(trg => {
    let sum = 0;
    for (const n of nodes){
      const dx = trg.x - n.x, dy = trg.y - n.y; const d = Math.hypot(dx,dy)+1e-6;
      const k = 0.02 * n.freq; // spatial frequency
      const w = 2*Math.PI*n.freq; // temporal frequency
      sum += Math.sin(n.phase + d*k - w*t);
    }
    const intensity = Math.abs(sum);
    // Lit if intensity above threshold; require stability for a moment
    if (intensity > 1.8) { trg.stable += dt; if (trg.stable > 0.6) trg.lit = true; }
    else { trg.stable = Math.max(0, trg.stable - dt*0.5); if (!prefersReduced) glowBeat = 0.5 + 0.5*Math.sin(t*2); }
  });

  const prevLit = litCount;
  litCount = targets.filter(t => t.lit).length;
  if (litCount !== prevLit){ document.getElementById('lit').textContent = litCount; if (litCount===targets.length){ running=false; endRun(true); } }
}

let glowBeat = 1;

function draw(t){
  ctx.clearRect(0,0,W,H);
  // room grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth=1;
  for (let x=60; x<W; x+=60){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y=60; y<H; y+=60){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // targets
  targets.forEach(trg => {
    ctx.beginPath();
    ctx.fillStyle = trg.lit ? '#4ade80' : 'rgba(255,255,255,0.15)';
    ctx.strokeStyle = trg.lit ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.arc(trg.x, trg.y, trg.r + (trg.lit? 2*Math.sin(t*8):0), 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
  });

  // nodes + wave rings
  nodes.forEach(n => {
    // node
    ctx.beginPath(); ctx.fillStyle='#a78bfa'; ctx.strokeStyle='rgba(167,139,250,0.4)'; ctx.lineWidth=2;
    ctx.arc(n.x, n.y, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    if (!prefersReduced){
      // animated rings based on phase and time
      const w = 2*Math.PI*n.freq; const base = (t + n.phase)*50;
      for (let i=0;i<4;i++){
        const r = (base + i*24) % 320;
        ctx.beginPath(); ctx.strokeStyle='rgba(167,139,250,0.25)'; ctx.lineWidth=1;
        ctx.arc(n.x, n.y, r, 0, Math.PI*2); ctx.stroke();
      }
    }
  });
}

function endRun(won){
  const nodesUsed = nodes.length;
  const timeUsed = 60 - timeLeft;
  let score = won ? Math.max(1, 1000 - timeUsed*10 - nodesUsed*20) : Math.max(1, 200 - timeUsed*2 - nodesUsed*10);
  const name = prompt(won? 'Brilliant resonance! Enter your name:' : 'Run ended. Enter your name to save:', 'Player');
  if (name) addScore('echoarchitect', name, score);
  celebrate();
  setTimeout(()=> openDrawer('Echo Architect', getScores('echoarchitect')), 200);
}

function celebrate(){
  const count = 120; const defaults = { origin: { y: 0.7 } };
  function fire(particleRatio, opts) { confetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(count * particleRatio) })); }
  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#6be7ff','#a78bfa','#ff9f6b'] });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
}

// Transitions
const dur = prefersReduced?0.01:0.4; const y= prefersReduced?0:8;
gsap.fromTo('main, header', { opacity: 0, y }, { opacity: 1, y: 0, duration: dur, ease:'power1.out' });

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]'); if (!a) return;
  const url = a.getAttribute('href'); if (url.startsWith('#')) return;
  e.preventDefault(); const overlay = document.getElementById('pageFade');
  gsap.to(overlay, { opacity: 1, duration: prefersReduced?0.01:0.25, onComplete: ()=> { window.location.href = url; } });
}, true);
