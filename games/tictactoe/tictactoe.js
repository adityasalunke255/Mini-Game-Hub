import '../../assets/js/particles.js';
import { addScore, getScores, openDrawer, attachDrawerClose } from '../../assets/js/leaderboard.js';
import { enableRipples } from '../../assets/js/ripple.js';

// Theme persistence across pages
(function theme(){
  const t = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('themeToggle').addEventListener('click', ()=>{
    const next = (document.documentElement.getAttribute('data-theme')==='dark')?'light':'dark';
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  });
})();

// Show loader then board
setTimeout(()=>{
  document.getElementById('loader').classList.add('hidden');
  document.getElementById('board').classList.remove('hidden');
  gsap.from('#board .cell', { opacity:0, y:10, stagger:0.05, duration:.25 });
}, 400);

// Build board
const boardEl = document.getElementById('board');
const cells = Array.from({ length: 9 }, (_, i) => {
  const d = document.createElement('div'); d.className = 'cell'; d.dataset.idx = i; boardEl.appendChild(d); return d;
});

let turn = 'X';
let grid = Array(9).fill('');
let over = false;
const turnEl = document.getElementById('turn');

document.getElementById('reset').addEventListener('click', reset);

enableRipples();
attachDrawerClose();

document.getElementById('viewLB').addEventListener('click', ()=> openDrawer('Tic Tac Toe', getScores('tictactoe')));

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

cells.forEach(c => c.addEventListener('click', ()=>{
  if (over) return;
  const i = +c.dataset.idx;
  if (grid[i]) return;
  grid[i] = turn; c.textContent = turn;
  const winLine = getWinLine(grid);
  if (winLine) { onWin(winLine); return; }
  if (grid.every(Boolean)) { onDraw(); return; }
  turn = (turn === 'X') ? 'O' : 'X'; turnEl.textContent = turn;
}));

function getWinLine(g){
  const lines = [ [0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6] ];
  for (const L of lines){ const [a,b,c]=L; if (g[a] && g[a]===g[b] && g[a]===g[c]) return L; }
  return null;
}

function onWin(line){
  over = true;
  line.forEach(i => cells[i].classList.add('win'));
  celebrate();
  const name = prompt('You win! Enter your name for the leaderboard:', 'Player');
  if (name) { addScore('tictactoe', name, 1); }
  setTimeout(()=> openDrawer('Tic Tac Toe', getScores('tictactoe')), 200);
}

function onDraw(){
  over = true;
  alert('Draw!');
}

function reset(){
  grid.fill(''); over = false; turn = 'X'; turnEl.textContent = turn;
  cells.forEach(c => { c.textContent=''; c.classList.remove('win'); });
}

function celebrate(){
  const count = 120; const defaults = { origin: { y: 0.7 } };
  function fire(particleRatio, opts) {
    confetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(count * particleRatio) }));
  }
  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#6be7ff','#a78bfa','#ff9f6b'] });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

// Particles and transitions
gsap.fromTo('main, header', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .4, ease:'power1.out' });

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const url = a.getAttribute('href');
  if (url.startsWith('#')) return;
  e.preventDefault();
  const overlay = document.getElementById('pageFade');
  gsap.to(overlay, { opacity: 1, duration: .25, onComplete: ()=> { window.location.href = url; } });
}, true);
