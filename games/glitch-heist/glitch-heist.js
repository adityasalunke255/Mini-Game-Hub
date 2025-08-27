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

document.getElementById('viewLB').addEventListener('click', ()=> openDrawer('Glitch Heist', getScores('glitchheist')));

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
let player={x:60,y:H-60,size:16,speed:2.2};
let goal={x:W-60,y:60,size:16};
let sweeps=[]; let score=0; let chain=0; let running=true; let lastT=0; let glitchTimer=0;

function init(){
  canvas=document.getElementById('board'); ctx=canvas.getContext('2d');
  score=0; chain=0; running=true; lastT=performance.now();
  sweeps = createSweeps();
  updateHUD();
  window.addEventListener('keydown', onKey);
  loop();
  document.getElementById('reset').addEventListener('click', ()=> { reset(); });
}

function createSweeps(){
  const arr=[];
  // vertical and horizontal bars sweeping with phase; difficulty moderate
  for(let i=0;i<3;i++) arr.push({ type:'h', y: 120+i*100, w: 360, speed: 120 + i*20, phase: Math.random()*Math.PI*2 });
  for(let i=0;i<2;i++) arr.push({ type:'v', x: 200+i*180, h: 280, speed: 100 + i*30, phase: Math.random()*Math.PI*2 });
  return arr;
}

function reset(){ player.x=60; player.y=H-60; chain=0; score=0; sweeps=createSweeps(); running=true; updateHUD(); }

function updateHUD(){ document.getElementById('score').textContent=score; document.getElementById('chain').textContent=chain; }

function onKey(e){
  if (!running) return;
  const k=e.key.toLowerCase();
  if (k==='arrowleft'||k==='a') player.x-=player.speed*6;
  if (k==='arrowright'||k==='d') player.x+=player.speed*6;
  if (k==='arrowup'||k==='w') player.y-=player.speed*6;
  if (k==='arrowdown'||k==='s') player.y+=player.speed*6;
  player.x=Math.max(20,Math.min(W-20,player.x));
  player.y=Math.max(20,Math.min(H-20,player.y));
}

function loop(){
  const now=performance.now(); const dt=Math.min(0.033,(now-lastT)/1000); lastT=now; if (!running){ draw(); return; }
  update(dt, now/1000);
  draw();
  requestAnimationFrame(loop);
}

function update(dt, t){
  // sweeps positions via sin for glitchable phase
  for (const s of sweeps){
    if (s.type==='h') s.x = 60 + (Math.sin(t + s.phase)*0.5+0.5) * (W - 120 - s.w);
    else s.y = 60 + (Math.sin(t + s.phase)*0.5+0.5) * (H - 120 - s.h);
  }
  // collision
  for (const s of sweeps){ if (hitSweep(player, s)){ chain=0; score=Math.max(0, score-25); flash(); respawnPlayer(); break; } }
  // goal
  if (Math.hypot(player.x-goal.x, player.y-goal.y) < (player.size+goal.size)) { chain++; score += 100*chain; celebrate(); respawnGoal(); }
  // occasional glitch: shift phases
  glitchTimer += dt; if (glitchTimer>4){ glitchTimer=0; doGlitch(); }
  updateHUD();
}

function doGlitch(){ if(prefersReduced) return; sweeps.forEach(s=> s.phase += (Math.random()-0.5)*1.2); gsap.fromTo('#board',{filter:'contrast(1) saturate(1)'},{filter:'contrast(1.4) saturate(1.3)', duration:0.12, yoyo:true, repeat:1, clearProps:'filter'}); }
function flash(){ if(prefersReduced) return; gsap.fromTo('#board',{filter:'brightness(1)'},{filter:'brightness(1.4)', duration:0.08, yoyo:true, repeat:1, clearProps:'filter'}); }
function celebrate(){ if(prefersReduced) return; gsap.fromTo('#board',{filter:'blur(0px)'},{filter:'blur(1px)', duration:0.12, yoyo:true, repeat:1, clearProps:'filter'}); }

function respawnPlayer(){ player.x=60; player.y=H-60; }
function respawnGoal(){ goal.x = W-60 - Math.random()*60; goal.y = 60 + Math.random()*120; }

function hitSweep(p, s){
  if (s.type==='h'){
    const x1=s.x, x2=s.x+s.w, y=s.y;
    return p.x+p.size> x1 && p.x-p.size < x2 && Math.abs(p.y-y) < 10;
  } else {
    const y1=s.y, y2=s.y+s.h, x=s.x;
    return p.y+p.size> y1 && p.y-p.size < y2 && Math.abs(p.x-x) < 10;
  }
}

function draw(){
  ctx.clearRect(0,0,W,H);
  // background lines
  ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1; for(let x=60;x<W-60;x+=40){ ctx.beginPath(); ctx.moveTo(x,60); ctx.lineTo(x,H-60); ctx.stroke(); } for(let y=60;y<H-60;y+=40){ ctx.beginPath(); ctx.moveTo(60,y); ctx.lineTo(W-60,y); ctx.stroke(); }
  // border
  ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.strokeRect(60,60,W-120,H-120);
  // goal
  ctx.fillStyle='#4ade80'; ctx.beginPath(); ctx.arc(goal.x, goal.y, goal.size, 0, Math.PI*2); ctx.fill();
  // player
  ctx.fillStyle='#a78bfa'; ctx.fillRect(player.x-player.size, player.y-player.size, player.size*2, player.size*2);
  // sweeps
  for (const s of sweeps){
    ctx.save();
    ctx.strokeStyle='rgba(255,159,107,0.9)'; ctx.lineWidth=6;
    if (s.type==='h'){ ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x+s.w, s.y); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x, s.y+s.h); ctx.stroke(); }
    ctx.restore();
  }
}

function end(){
  running=false;
  const name = prompt('Run over. Enter your name to save score:', 'Player');
  if (name) addScore('glitchheist', name, Math.max(1, score));
  setTimeout(()=> openDrawer('Glitch Heist', getScores('glitchheist')), 200);
}

setTimeout(()=>{ end(); }, 60000); // 60s session

const dur = prefersReduced?0.01:0.4; const y= prefersReduced?0:8;
gsap.fromTo('main, header', { opacity: 0, y }, { opacity: 1, y: 0, duration: dur, ease:'power1.out' });

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]'); if (!a) return;
  const url = a.getAttribute('href'); if (url.startsWith('#')) return;
  e.preventDefault(); const overlay = document.getElementById('pageFade');
  gsap.to(overlay, { opacity: 1, duration: prefersReduced?0.01:0.25, onComplete: ()=> { window.location.href = url; } });
}, true);
