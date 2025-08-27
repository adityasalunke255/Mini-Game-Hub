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

document.getElementById('viewLB').addEventListener('click', ()=> openDrawer("Cartographer's Echo", getScores('cartographers')));

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
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('board').classList.remove('hidden');
  gsap.from('#board', { opacity: 0, y: prefersReduced?0:8, duration: prefersReduced?0.01:0.25 });
  init();
}, 400);

const W=720,H=480; let canvas, ctx;
let pings=[]; // {x,y,r,alive}
let islands=[]; // {x,y,r,seen}
let beacons=[]; // {x,y,found}
let pingsCount=0; let found=0; let running=true;

function init(){
  canvas=document.getElementById('board'); ctx=canvas.getContext('2d');
  resetWorld();
  canvas.addEventListener('click', onPing);
  document.getElementById('reset').addEventListener('click', ()=> { resetWorld(); });
  loop();
}

function resetWorld(){
  pings=[]; pingsCount=0; found=0; running=true;
  islands = genIslands(7);
  beacons = genBeacons(5);
  updateHUD();
}

function genIslands(n){
  const arr=[]; for(let i=0;i<n;i++){ arr.push({ x: 80+Math.random()*(W-160), y: 80+Math.random()*(H-160), r: 30+Math.random()*40, seen:false }); } return arr;
}
function genBeacons(n){
  const arr=[]; for(let i=0;i<n;i++){ arr.push({ x: 80+Math.random()*(W-160), y: 80+Math.random()*(H-160), found:false }); } return arr;
}

function onPing(e){ if(!running) return; const pos=toCanvas(e); pings.push({x:pos.x,y:pos.y,r:0,alive:true}); pingsCount++; updateHUD(); if (!prefersReduced) pulse(); }
function toCanvas(e){ const r=canvas.getBoundingClientRect(); const sx=canvas.width/r.width, sy=canvas.height/r.height; return { x:(e.clientX-r.left)*sx, y:(e.clientY-r.top)*sy } }

function loop(){ update(); draw(); requestAnimationFrame(loop); }

function update(){
  // expand pings
  for(const p of pings){ if(!p.alive) continue; p.r += 3; if (p.r>Math.hypot(W,H)) p.alive=false; }
  // reveal islands when within ring thickness
  for(const isl of islands){ if (isl.seen) continue; for(const p of pings){ if(!p.alive) continue; const d=Math.hypot(isl.x-p.x, isl.y-p.y); if (Math.abs(d - p.r) < 8){ isl.seen=true; break; } } }
  // beacons become found when ring center gets near
  for(const b of beacons){ if (b.found) continue; for(const p of pings){ if(Math.hypot(b.x-p.x, b.y-p.y) < 16){ b.found=true; found++; updateHUD(); highlight(b.x,b.y); if (found===beacons.length) end(true); break; } } }
}

function draw(){
  ctx.clearRect(0,0,W,H);
  // ocean
  ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(0,0,W,H);
  // islands (faint if unseen)
  for(const isl of islands){ ctx.beginPath(); ctx.arc(isl.x, isl.y, isl.r, 0, Math.PI*2); ctx.fillStyle = isl.seen? 'rgba(100,220,160,0.85)' : 'rgba(100,220,160,0.15)'; ctx.fill(); }
  // beacons
  for(const b of beacons){ ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI*2); ctx.fillStyle = b.found? '#ffd166' : 'rgba(255, 209, 102, 0.15)'; ctx.fill(); }
  // pings
  ctx.strokeStyle='rgba(107,231,255,0.8)'; ctx.lineWidth=2; ctx.shadowColor='rgba(167,139,250,0.6)'; ctx.shadowBlur=8;
  for(const p of pings){ if(!p.alive) continue; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.stroke(); }
  ctx.shadowBlur=0;
}

function updateHUD(){ document.getElementById('pings').textContent=pingsCount; document.getElementById('found').textContent=found; }
function pulse(){ gsap.fromTo('#board',{filter:'brightness(1)'},{filter:'brightness(1.2)', duration:0.1, yoyo:true, repeat:1, clearProps:'filter'}); }
function highlight(x,y){ if(prefersReduced) return; gsap.fromTo('#board',{},{duration:0.12}); }

function end(won){
  running=false;
  const efficiency = Math.max(1, 2000 - pingsCount*50 + found*200);
  const name = prompt(won? 'All beacons mapped! Enter your name:' : 'Session over. Enter your name:', 'Player');
  if (name) addScore('cartographers', name, efficiency);
  celebrate();
  setTimeout(()=> openDrawer("Cartographer's Echo", getScores('cartographers')), 200);
}

setTimeout(()=>{ if (running) end(false); }, 60000); // 60s session

function celebrate(){
  const count = 120; const defaults = { origin: { y: 0.7 } };
  function fire(particleRatio, opts) { confetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(count * particleRatio) })); }
  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#6be7ff','#a78bfa','#ffd166'] });
}

const dur = prefersReduced?0.01:0.4; const y= prefersReduced?0:8;
gsap.fromTo('main, header', { opacity: 0, y }, { opacity: 1, y: 0, duration: dur, ease:'power1.out' });

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]'); if (!a) return;
  const url = a.getAttribute('href'); if (url.startsWith('#')) return;
  e.preventDefault(); const overlay = document.getElementById('pageFade');
  gsap.to(overlay, { opacity: 1, duration: prefersReduced?0.01:0.25, onComplete: ()=> { window.location.href = url; } });
}, true);
