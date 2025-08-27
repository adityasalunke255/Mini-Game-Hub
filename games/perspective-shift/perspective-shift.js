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

document.getElementById('viewLB').addEventListener('click', ()=> openDrawer('Perspective Shift', getScores('perspectiveshift')));

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

const W=720,H=480,CELL=40,COLS=W/CELL,ROWS=H/CELL;
let canvas, ctx;
let layer='A'; let shifts=0; let running=true; let startTime=0; let finishTime=0;
let player={x:1,y:ROWS-2, size:0.35, speed:6}; // grid coords
let goal={x:COLS-2,y:1};

// 0 empty, 1 wall
const mapA = Array.from({length:ROWS},()=>Array.from({length:COLS},()=>0));
const mapB = Array.from({length:ROWS},()=>Array.from({length:COLS},()=>0));

function carveMaps(){
  // border walls alternate in layers
  for(let x=0;x<COLS;x++){ mapA[0][x]=1; mapA[ROWS-1][x]=1; }
  for(let y=0;y<ROWS;y++){ mapB[y][0]=1; mapB[y][COLS-1]=1; }
  // internal alternating barriers
  for(let y=2;y<ROWS-2;y+=3){ for(let x=2;x<COLS-2;x++){ if ((x+y)%3===0) mapA[y][x]=1; }}
  for(let x=3;x<COLS-3;x+=3){ for(let y=2;y<ROWS-2;y++){ if ((x*y)%4===0) mapB[y][x]=1; }}
  // ensure start/goal cells open in both
  mapA[player.y][player.x]=0; mapB[player.y][player.x]=0; mapA[goal.y][goal.x]=0; mapB[goal.y][goal.x]=0;
}

function init(){
  canvas=document.getElementById('board'); ctx=canvas.getContext('2d');
  carveMaps();
  layer='A'; shifts=0; running=true; startTime=performance.now(); finishTime=0;
  updateHUD();
  window.addEventListener('keydown', onKey);
  draw();
}

function onKey(e){
  if (!running) return;
  const k=e.key.toLowerCase();
  if (k===' '){ doShift(); return; }
  let dx=0, dy=0;
  if (k==='arrowleft'||k==='a') dx=-1;
  else if (k==='arrowright'||k==='d') dx=1;
  else if (k==='arrowup'||k==='w') dy=-1;
  else if (k==='arrowdown'||k==='s') dy=1;
  if (dx||dy) move(dx,dy);
}

document.getElementById('shiftBtn').addEventListener('click', doShift);
document.getElementById('reset').addEventListener('click', ()=> window.location.reload());

function doShift(){ layer = (layer==='A')?'B':'A'; shifts++; updateHUD(); if(!prefersReduced) gsap.fromTo('#board',{filter:'hue-rotate(0deg)'},{filter:'hue-rotate(25deg)', duration:0.12, yoyo:true, repeat:1, clearProps:'filter'}); }

function move(dx,dy){
  const nx = player.x + dx, ny = player.y + dy;
  if (nx<0||nx>=COLS||ny<0||ny>=ROWS) return;
  const cell = (layer==='A'?mapA:mapB)[ny][nx];
  if (cell===1) return; // blocked by current layer
  player.x = nx; player.y = ny;
  if (player.x===goal.x && player.y===goal.y) end(true);
  draw();
}

function updateHUD(){ document.getElementById('layer').textContent=layer; document.getElementById('shifts').textContent=shifts; }

function draw(){
  ctx.clearRect(0,0,W,H);
  // draw grid faint
  ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1; for(let x=0;x<=COLS;x++){ ctx.beginPath(); ctx.moveTo(x*CELL,0); ctx.lineTo(x*CELL,H); ctx.stroke(); } for(let y=0;y<=ROWS;y++){ ctx.beginPath(); ctx.moveTo(0,y*CELL); ctx.lineTo(W,y*CELL); ctx.stroke(); }
  // draw walls for active layer bright, other layer faint
  drawLayer(mapA, layer==='A'?'rgba(167,139,250,0.85)':'rgba(167,139,250,0.18)');
  drawLayer(mapB, layer==='B'?'rgba(107,231,255,0.85)':'rgba(107,231,255,0.18)');
  // goal
  ctx.fillStyle='#4ade80'; ctx.beginPath(); ctx.arc(goal.x*CELL+CELL/2, goal.y*CELL+CELL/2, CELL*0.25, 0, Math.PI*2); ctx.fill();
  // player
  ctx.fillStyle='#ffd166'; ctx.beginPath(); ctx.arc(player.x*CELL+CELL/2, player.y*CELL+CELL/2, CELL*player.size, 0, Math.PI*2); ctx.fill();
}

function drawLayer(map, color){
  ctx.fillStyle=color;
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) if(map[y][x]===1){ ctx.fillRect(x*CELL+6, y*CELL+6, CELL-12, CELL-12); }
}

function end(won){
  running=false; finishTime=performance.now();
  const timeSec = Math.max(1, Math.round((finishTime-startTime)/100)/10); // 0.1s
  const score = won ? Math.max(1, 2000 - timeSec*50 - shifts*40) : 1;
  const name = prompt(won? 'Path aligned! Enter your name:' : 'Run ended. Enter your name:', 'Player');
  if (name) addScore('perspectiveshift', name, score);
  celebrate();
  setTimeout(()=> openDrawer('Perspective Shift', getScores('perspectiveshift')), 200);
}

function celebrate(){ if(prefersReduced) return; const count=100; const defaults={origin:{y:0.7}}; function fire(r,opts){ confetti(Object.assign({},defaults,opts,{particleCount:Math.floor(count*r)})); } fire(0.25,{spread:26,startVelocity:55,colors:['#6be7ff','#a78bfa','#ffd166']}); }

const dur = prefersReduced?0.01:0.4; const y= prefersReduced?0:8;
gsap.fromTo('main, header', { opacity: 0, y }, { opacity: 1, y: 0, duration: dur, ease:'power1.out' });

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]'); if (!a) return;
  const url = a.getAttribute('href'); if (url.startsWith('#')) return;
  e.preventDefault(); const overlay = document.getElementById('pageFade');
  gsap.to(overlay, { opacity: 1, duration: prefersReduced?0.01:0.25, onComplete: ()=> { window.location.href = url; } });
}, true);
