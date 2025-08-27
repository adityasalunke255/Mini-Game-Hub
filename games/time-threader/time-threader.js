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

document.getElementById('viewLB').addEventListener('click', ()=> openDrawer('Time-Threader', getScores('timethreader')));

// Loader -> show HUD + canvas
setTimeout(()=>{
  document.getElementById('loader').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  const board = document.getElementById('board');
  board.classList.remove('hidden');
  gsap.from('#board', { opacity: 0, y: prefersReduced?0:8, duration: prefersReduced?0.01:0.25 });
  startGame();
}, 400);

const W = 900, H = 420;
let ctx, canvas;
let events = []; // moving icons
let routed = 0, collide = 0;
let timeLeft = 20; // seconds
let running = false;
let pathPoints = []; // user path for this run
let drawing = false;
let lastT = 0;

function startGame(){
  canvas = document.getElementById('board');
  ctx = canvas.getContext('2d');
  routed = 0; collide = 0; timeLeft = 20; running = true; pathPoints = []; drawing=false; lastT=performance.now();
  events = spawnEvents(10);
  document.getElementById('routed').textContent = routed;
  document.getElementById('collide').textContent = collide;
  document.getElementById('time').textContent = timeLeft;
  // attach input listeners now that canvas exists
  attachInputListeners();
  loop();
  tickTimer();
}

function spawnEvents(n){
  const arr = [];
  for (let i=0;i<n;i++){
    const y = 60 + Math.random()*(H-120);
    const speed = 60 + Math.random()*120; // px/s
    const prio = 1 + Math.floor(Math.random()*3);
    arr.push({ x: 40, y, r: 10, vx: speed, prio, safe:false });
  }
  return arr;
}

function tickTimer(){
  const id = setInterval(()=>{
    if (!running) return clearInterval(id);
    timeLeft--; document.getElementById('time').textContent = timeLeft;
    if (timeLeft <= 0){ running=false; endRun(); clearInterval(id); }
  }, 1000);
}

function loop(){
  if (!running){ draw(); return; }
  const now = performance.now();
  const dt = Math.min(0.033, (now - lastT)/1000); // cap delta
  lastT = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt){
  // Move events
  events.forEach(e=>{
    e.x += e.vx*dt; // move right
  });
  // Remove offscreen, respawn
  for (let i=events.length-1;i>=0;i--){
    if (events[i].x - events[i].r > W){
      // if safely routed, count
      if (events[i].safe) routed++;
      events.splice(i,1);
      events.push(...spawnEvents(1));
    }
  }
  document.getElementById('routed').textContent = routed;

  // Check collisions between events (simple)
  for (let i=0;i<events.length;i++){
    for (let j=i+1;j<events.length;j++){
      const a=events[i], b=events[j];
      const dx=a.x-b.x, dy=a.y-b.y; const d= Math.hypot(dx,dy);
      if (d < a.r + b.r) { collide++; shakeNearMiss((a.x+b.x)/2,(a.y+b.y)/2); // push apart
        const overlap = (a.r+b.r)-d; const nx=dx/(d||1), ny=dy/(d||1);
        a.x += nx*overlap/2; a.y += ny*overlap/2; b.x -= nx*overlap/2; b.y -= ny*overlap/2;
      }
    }
  }
  document.getElementById('collide').textContent = collide;

  // Mark events safe if their path crosses user path without colliding others nearby
  events.forEach(e=>{
    e.safe = intersectsPath(e);
  });
}

function draw(){
  ctx.clearRect(0,0,W,H);
  // timeline lanes
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth=1;
  for (let y=80;y<H;y+=60){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // user path glow
  if (pathPoints.length>1){
    const g = ctx.createLinearGradient(0,0,W,0); g.addColorStop(0,'#6be7ff'); g.addColorStop(1,'#a78bfa');
    ctx.strokeStyle = g; ctx.lineWidth=6; ctx.lineJoin='round'; ctx.lineCap='round';
    ctx.shadowColor = 'rgba(167,139,250,0.7)'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i=1;i<pathPoints.length;i++) ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // events
  events.forEach(e=>{
    ctx.beginPath();
    ctx.fillStyle = e.safe ? '#4ade80' : '#ff9f6b';
    ctx.strokeStyle = e.safe ? 'rgba(74,222,128,0.4)' : 'rgba(255,159,107,0.35)';
    ctx.lineWidth = 2;
    ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
  });
}

function intersectsPath(e){
  if (pathPoints.length < 2) return false;
  // simple check: does any segment come within threshold of event center
  const thr = 12 + e.prio*2; // higher priority easier to route
  for (let i=0;i<pathPoints.length-1;i++){
    const p=pathPoints[i], q=pathPoints[i+1];
    const d = pointSegDist(e.x,e.y,p.x,p.y,q.x,q.y);
    if (d < thr) return true;
  }
  return false;
}

function pointSegDist(px,py,x1,y1,x2,y2){
  const vx=x2-x1, vy=y2-y1; const wx=px-x1, wy=py-y1;
  const c1 = vx*wx + vy*wy; if (c1<=0) return Math.hypot(px-x1,py-y1);
  const c2 = vx*vx + vy*vy; if (c2<=c1) return Math.hypot(px-x2,py-y2);
  const b = c1/c2; const bx=x1+b*vx, by=y1+b*vy; return Math.hypot(px-bx,py-by);
}

function shakeNearMiss(x,y){
  if (prefersReduced) return;
  gsap.fromTo(canvas, { x: 0, y:0 }, { x: (Math.random()-0.5)*2, y:(Math.random()-0.5)*2, duration: 0.08, clearProps:'x,y' });
}

// Input: draw path
function getPos(e){ const rect = canvas.getBoundingClientRect(); const x=(e.touches?e.touches[0].clientX:e.clientX)-rect.left; const y=(e.touches?e.touches[0].clientY:e.clientY)-rect.top; const sx=canvas.width/rect.width, sy=canvas.height/rect.height; return { x:x*sx, y:y*sy }; }

function startDraw(e){ if (!running) return; drawing=true; pathPoints=[getPos(e)]; }
function moveDraw(e){ if (!drawing) return; e.preventDefault(); const p=getPos(e); const last=pathPoints[pathPoints.length-1]; const dx=p.x-last.x, dy=p.y-last.y; if (dx*dx+dy*dy>9){ pathPoints.push(p); } }
function endDraw(){ drawing=false; }

function attachInputListeners(){
  ['mousedown','touchstart'].forEach(ev=> canvas.addEventListener(ev,startDraw));
  ['mousemove','touchmove'].forEach(ev=> canvas.addEventListener(ev,moveDraw,{ passive:false }));
  ['mouseup','mouseleave','touchend','touchcancel'].forEach(ev=> canvas.addEventListener(ev,endDraw));
}

document.getElementById('reset').addEventListener('click', ()=> { running=false; startGame(); });

// Help modal handlers
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

function endRun(){
  // Score: routed*100 - collisions*50, floor at 1
  const raw = routed*100 - collide*50; const score = Math.max(1, raw);
  const name = prompt('Run complete! Enter your name:', 'Player');
  if (name) addScore('timethreader', name, score);
  celebrate();
  setTimeout(()=> openDrawer('Time-Threader', getScores('timethreader')), 200);
}

function celebrate(){
  const count = 140; const defaults = { origin: { y: 0.7 } };
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
