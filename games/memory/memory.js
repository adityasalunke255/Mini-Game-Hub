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

document.getElementById('viewLB').addEventListener('click', ()=> openDrawer('Memory Flip', getScores('memory')));

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

// Loader -> board
setTimeout(()=>{
  document.getElementById('loader').classList.add('hidden');
  document.getElementById('board').classList.remove('hidden');
  gsap.from('#board .cardc', { opacity: 0, y: prefersReduced?0:8, stagger: prefersReduced?0:0.03, duration: prefersReduced?0.01:0.25 });
}, 400);

const EMOJIS = ['🍎','🍌','🍇','🍓','🍒','🍉','🍋','🍍'];
const deck = shuffle([...EMOJIS, ...EMOJIS]);
const board = document.getElementById('board');
let first = null, second = null, lock = false, matched = 0, moves = 0;
const movesEl = document.getElementById('moves');

// Build grid
for (let i=0; i<deck.length; i++) {
  const card = document.createElement('div');
  card.className = 'cardc';
  card.role = 'gridcell';
  card.tabIndex = 0;
  card.dataset.val = deck[i];
  card.innerHTML = `<div class="flipper"><div class="face front">🧠</div><div class="face back">${deck[i]}</div></div>`;
  board.appendChild(card);
}

function onCardClick(card){
  if (lock || card.classList.contains('matched') || card.classList.contains('reveal')) return;
  card.classList.add('reveal');
  if (!first) { first = card; return; }
  second = card; lock = true; moves++; movesEl.textContent = moves;
  const a = first.dataset.val, b = second.dataset.val;
  if (a === b) {
    first.classList.add('matched'); second.classList.add('matched');
    first = second = null; lock = false; matched += 2;
    if (matched === deck.length) endGame();
  } else {
    setTimeout(()=>{ first.classList.remove('reveal'); second.classList.remove('reveal'); first=second=null; lock=false; }, prefersReduced?100:600);
  }
}

board.addEventListener('click', (e)=>{
  const c = e.target.closest('.cardc'); if (!c) return; onCardClick(c);
});
board.addEventListener('keydown', (e)=>{
  if (e.key === 'Enter' || e.key === ' ') {
    const c = e.target.closest('.cardc'); if (!c) return; e.preventDefault(); onCardClick(c);
  }
});

document.getElementById('reset').addEventListener('click', ()=> window.location.reload());

function endGame(){
  celebrate();
  const name = prompt('Nice! Enter your name for the leaderboard:', 'Player');
  // Higher is better for leaderboard -> compute a score from moves (fewer moves => higher score)
  const base = 100 - moves; const score = Math.max(1, base);
  if (name) addScore('memory', name, score);
  setTimeout(()=> openDrawer('Memory Flip', getScores('memory')), 200);
}

function shuffle(arr){
  for (let i=arr.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr;
}

function celebrate(){
  const count = 150; const defaults = { origin: { y: 0.7 } };
  function fire(particleRatio, opts) {
    confetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(count * particleRatio) }));
  }
  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#6be7ff','#a78bfa','#ff9f6b'] });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
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
