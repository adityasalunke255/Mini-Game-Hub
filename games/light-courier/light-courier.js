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

document.getElementById('viewLB').addEventListener('click', ()=> openDrawer('Light Courier', getScores('lightcourier')));

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

const W=720,H=480, CELL=40, COLS=W/CELL, ROWS=H/CELL;
let canvas, ctx;
let grid=[]; // 0 empty, 1 mirror '/\', 2 mirror '\/'
let source={x:1,y:Math.floor(ROWS/2),dir:'E'};
let targets=[{x:COLS-3,y:Math.floor(ROWS/3),hit:false},{x:COLS-4,y:Math.floor(ROWS/2),hit:false},{x:COLS-5,y:Math.floor(2*ROWS/3),hit:false}];
let toggles=0, maxToggles=10; let delivered=0; let running=false;

function init(){
  canvas=document.getElementById('board'); ctx=canvas.getContext('2d');
  grid = Array.from({length:ROWS},()=>Array.from({length:COLS},()=>0));
  delivered=0; toggles=0; running=false;
  updateHUD();
  draw();
  canvas.addEventListener('click', onClick);
  document.getElementById('start').addEventListener('click', ()=>{ running=true; simulate(); });
  document.getElementById('reset').addEventListener('click', reset);
}

function reset(){ targets.forEach(t=>t.hit=false); delivered=0; toggles=0; grid.forEach(r=>r.fill(0)); running=false; updateHUD(); draw(); }

function updateHUD(){ document.getElementById('toggles').textContent=toggles; document.getElementById('del').textContent=delivered; }

function onClick(e){ if (running) return; if (toggles>=maxToggles) return; const c=toCell(e); const v=grid[c.y][c.x]; grid[c.y][c.x]=(v+1)%3; toggles++; updateHUD(); draw(); }

function toCell(e){ const r=canvas.getBoundingClientRect(); const x=Math.floor((e.clientX-r.left)/(CELL*(r.width/canvas.width))); const y=Math.floor((e.clientY-r.top)/(CELL*(r.height/canvas.height))); return {x:Math.max(0,Math.min(COLS-1,x)),y:Math.max(0,Math.min(ROWS-1,y))}; }

function simulate(){
  // trace beam
  targets.forEach(t=>t.hit=false); delivered=0; updateHUD();
  let ray={x:source.x+0.5,y:source.y+0.5,dir:source.dir};
  const segs=[]; let steps=0, maxSteps=2000; let alive=true;
  while(alive && steps++<maxSteps){
    const prev={x:ray.x,y:ray.y};
    if(ray.dir==='E') ray.x+=0.1; if(ray.dir==='W') ray.x-=0.1; if(ray.dir==='S') ray.y+=0.1; if(ray.dir==='N') ray.y-=0.1;
    // bounds
    if (ray.x<0||ray.x>COLS||ray.y<0||ray.y>ROWS){ segs.push({a:prev,b:ray}); break; }
    // target hit check
    for (const t of targets){ if (!t.hit && Math.hypot(ray.x-(t.x+0.5), ray.y-(t.y+0.5))<0.3){ t.hit=true; delivered++; updateHUD(); celebratePulse((t.x+0.5)*CELL,(t.y+0.5)*CELL); if (delivered===targets.length){ end(true); alive=false; } } }
    // cell reflect
    const cx=Math.floor(ray.x), cy=Math.floor(ray.y);
    const cell=grid[cy]?.[cx]??0;
    if (cell===1){ // '/' mirror
      if (ray.dir==='E') ray.dir='N'; else if (ray.dir==='W') ray.dir='S'; else if (ray.dir==='N') ray.dir='E'; else if (ray.dir==='S') ray.dir='W';
    } else if (cell===2){ // '\' mirror
      if (ray.dir==='E') ray.dir='S'; else if (ray.dir==='W') ray.dir='N'; else if (ray.dir==='N') ray.dir='W'; else if (ray.dir==='S') ray.dir='E';
    }
    if (Math.hypot(ray.x-prev.x, ray.y-prev.y)>0){ segs.push({a:prev,b:{x:ray.x,y:ray.y}}); }
  }
  draw(segs);
  if (alive) end(false);
}

function draw(segs=[]){
  ctx.clearRect(0,0,W,H);
  // grid
  ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1; for(let x=0;x<=COLS;x++){ ctx.beginPath(); ctx.moveTo(x*CELL,0); ctx.lineTo(x*CELL,H); ctx.stroke(); } for(let y=0;y<=ROWS;y++){ ctx.beginPath(); ctx.moveTo(0,y*CELL); ctx.lineTo(W,y*CELL); ctx.stroke(); }
  // source
  drawCell(source.x, source.y, '#6be7ff');
  // targets
  targets.forEach(t=> drawCell(t.x, t.y, t.hit?'#4ade80':'#ff9f6b'));
  // mirrors
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){ const v=grid[y][x]; if(!v) continue; ctx.save(); ctx.translate(x*CELL+CELL/2,y*CELL+CELL/2); ctx.strokeStyle=v===1?'#a78bfa':'#ff9f6b'; ctx.lineWidth=3; ctx.beginPath(); if(v===1){ ctx.moveTo(-CELL/3, CELL/3); ctx.lineTo(CELL/3, -CELL/3);} else { ctx.moveTo(-CELL/3,-CELL/3); ctx.lineTo(CELL/3, CELL/3);} ctx.stroke(); ctx.restore(); }
  // ray
  if (segs.length){ ctx.strokeStyle='rgba(255,255,255,0.85)'; const grad=ctx.createLinearGradient(0,0,W,0); grad.addColorStop(0,'#6be7ff'); grad.addColorStop(1,'#a78bfa'); ctx.strokeStyle=grad; ctx.lineWidth=2; ctx.shadowColor='rgba(167,139,250,0.6)'; ctx.shadowBlur=8; ctx.beginPath(); ctx.moveTo(segs[0].a.x*CELL, segs[0].a.y*CELL); for(const s of segs){ ctx.lineTo(s.b.x*CELL, s.b.y*CELL);} ctx.stroke(); ctx.shadowBlur=0; }
}

function drawCell(x,y,color){ ctx.fillStyle=color; ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.rect(x*CELL+6,y*CELL+6,CELL-12,CELL-12); ctx.fill(); ctx.stroke(); }

function celebratePulse(x,y){ if(prefersReduced) return; gsap.fromTo('#board',{},{duration:0.15, onStart:()=>{}, onComplete:()=>{}}); }

function end(won){
  running=false;
  let score = won? Math.max(1, 1000 - toggles*30) : Math.max(1, 200 - toggles*10);
  const name = prompt(won? 'Brilliant routing! Enter your name:' : 'Run finished. Enter your name:', 'Player');
  if (name) addScore('lightcourier', name, score);
  const count = 100; const defaults = { origin: { y: 0.7 } };
  function fire(particleRatio, opts) { confetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(count * particleRatio) })); }
  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#6be7ff','#a78bfa','#ff9f6b'] });
  setTimeout(()=> openDrawer('Light Courier', getScores('lightcourier')), 200);
}

const dur = prefersReduced?0.01:0.4; const y= prefersReduced?0:8;
gsap.fromTo('main, header', { opacity: 0, y }, { opacity: 1, y: 0, duration: dur, ease:'power1.out' });

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]'); if (!a) return;
  const url = a.getAttribute('href'); if (url.startsWith('#')) return;
  e.preventDefault(); const overlay = document.getElementById('pageFade');
  gsap.to(overlay, { opacity: 1, duration: prefersReduced?0.01:0.25, onComplete: ()=> { window.location.href = url; } });
}, true);
