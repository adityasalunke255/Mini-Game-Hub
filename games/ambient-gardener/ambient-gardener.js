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

document.getElementById('viewLB').addEventListener('click', ()=> openDrawer('Ambient Gardener', getScores('ambientgardener')));

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
  const canvas = document.getElementById('garden');
  canvas.classList.remove('hidden');
  gsap.from('#garden', { opacity: 0, y: prefersReduced?0:8, duration: prefersReduced?0.01:0.25 });
  init();
}, 400);

let canvas, ctx, plants=[]; let taps=[]; let growth=0; let lastTap=0;
const W=720,H=480;

function init(){
  canvas = document.getElementById('garden');
  ctx = canvas.getContext('2d');
  plants = seedPlants(6);
  growth = 0; taps=[]; lastTap=0;
  draw();
  canvas.addEventListener('pointerdown', onTap);
  document.getElementById('reset').addEventListener('click', ()=> window.location.reload());
}

function seedPlants(n){
  const arr=[];
  for(let i=0;i<n;i++){
    arr.push({ x: 80+Math.random()*(W-160), y: 320+Math.random()*120, h: 20+Math.random()*20, target: 140+Math.random()*60 });
  }
  return arr;
}

function onTap(){
  const t = performance.now();
  taps.push(t);
  if (taps.length>6) taps.shift();
  if (taps.length>=3){
    const intervals = [];
    for(let i=1;i<taps.length;i++) intervals.push(taps[i]-taps[i-1]);
    const avg = intervals.reduce((a,b)=>a+b,0)/intervals.length;
    const variance = intervals.reduce((a,b)=> a + Math.pow(b-avg,2),0)/intervals.length;
    const steadiness = Math.max(0, 1 - Math.min(1, variance/(avg*avg*0.1 + 1))); // 0..1
    const delta = 4 + steadiness*12; // better rhythm -> faster growth
    plants.forEach(p=> p.h += delta*(0.5+Math.random()*0.5));
    growth += delta;
    if (!prefersReduced) pulse();
    if (plants.every(p=> p.h >= p.target)) end(true);
  }
}

function pulse(){ gsap.fromTo('#garden', { filter:'brightness(1.0)' }, { filter:'brightness(1.2)', duration:0.1, yoyo:true, repeat:1, clearProps:'filter' }); }

function draw(){
  ctx.clearRect(0,0,W,H);
  // soil
  ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(0,H-80,W,80);
  // plants
  for(const p of plants){
    // stem
    ctx.strokeStyle='#6be7ff'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(p.x-10, p.y-p.h*0.5, p.x, p.y-p.h); ctx.stroke();
    // leaves
    ctx.fillStyle='rgba(74,222,128,0.8)';
    ctx.beginPath(); ctx.ellipse(p.x-8, p.y-p.h*0.6, 10, 4, -0.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(p.x+8, p.y-p.h*0.8, 10, 4, 0.5, 0, Math.PI*2); ctx.fill();
    // bloom
    if (p.h > p.target-10){ ctx.fillStyle='#a78bfa'; ctx.beginPath(); ctx.arc(p.x, p.y-p.h-6, 5,0,Math.PI*2); ctx.fill(); }
  }
  requestAnimationFrame(draw);
}

function end(won){
  const harmony = Math.round(growth);
  const name = prompt(won? 'Your garden sings! Enter name:' : 'Session ended. Enter name:', 'Player');
  if (name) addScore('ambientgardener', name, Math.max(1,harmony));
  celebrate();
  setTimeout(()=> openDrawer('Ambient Gardener', getScores('ambientgardener')), 200);
}

function celebrate(){
  const count = 120; const defaults = { origin: { y: 0.7 } };
  function fire(particleRatio, opts) { confetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(count * particleRatio) })); }
  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#6be7ff','#a78bfa','#4ade80'] });
  fire(0.2, { spread: 60 });
}

const dur = prefersReduced?0.01:0.4; const y= prefersReduced?0:8;
gsap.fromTo('main, header', { opacity: 0, y }, { opacity: 1, y: 0, duration: dur, ease:'power1.out' });

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]'); if (!a) return;
  const url = a.getAttribute('href'); if (url.startsWith('#')) return;
  e.preventDefault(); const overlay = document.getElementById('pageFade');
  gsap.to(overlay, { opacity: 1, duration: prefersReduced?0.01:0.25, onComplete: ()=> { window.location.href = url; } });
}, true);
