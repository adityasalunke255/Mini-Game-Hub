import { getScores, openDrawer, attachDrawerClose } from './leaderboard.js';
import { enableRipples } from './ripple.js';
const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Games metadata (25)
const games = [
  { id:'tictactoe', title:'Tic Tac Toe', cat:'Classic', icon:'❌⭕', desc:'Beat your friend or AI', href:'games/tictactoe/index.html' },
  { id:'snake', title:'Snake', cat:'Classic', icon:'🐍', desc:'Eat, grow, survive', href:'#' },
  { id:'memory', title:'Memory Flip', cat:'Classic', icon:'🧠', desc:'Match the pairs', href:'games/memory/index.html' },
  { id:'typing', title:'Typing Speed', cat:'Classic', icon:'⌨️', desc:'Type fast!', href:'#' },
  { id:'rps', title:'Rock Paper Scissors', cat:'Classic', icon:'🪨📄✂️', desc:'Best of 5', href:'#' },
  { id:'hangman', title:'Hangman', cat:'Classic', icon:'🔤', desc:'Guess the word', href:'#' },
  { id:'simon', title:'Simon Says', cat:'Classic', icon:'🔴🟢🟡🔵', desc:'Follow sequence', href:'#' },
  { id:'connect4', title:'Connect Four', cat:'Classic', icon:'🟡🔴', desc:'4-in-a-row', href:'#' },
  { id:'slider', title:'Puzzle Slider', cat:'Classic', icon:'🧩', desc:'Slide to solve', href:'#' },
  { id:'wam', title:'Whack-a-Mole', cat:'Classic', icon:'🐹', desc:'Bonk the mole', href:'#' },

  { id:'flappy', title:'Flappy Clone', cat:'Arcade', icon:'🐤', desc:'Tap to fly', href:'#' },
  { id:'shooter', title:'Space Shooter', cat:'Arcade', icon:'🚀', desc:'Blast asteroids', href:'#' },
  { id:'balloon', title:'Balloon Popper', cat:'Arcade', icon:'🎈', desc:'Pop them all', href:'#' },
  { id:'pong', title:'Ping Pong', cat:'Arcade', icon:'🏓', desc:'1v1 classic', href:'#' },
  { id:'runner', title:'Runner', cat:'Arcade', icon:'🏃', desc:'Dodge obstacles', href:'#' },

  { id:'mines', title:'Minesweeper', cat:'Brain', icon:'💣', desc:'Avoid the bombs', href:'#' },
  { id:'sudoku4', title:'Sudoku 4x4', cat:'Brain', icon:'🔢', desc:'Mini Sudoku', href:'#' },
  { id:'2048', title:'2048', cat:'Brain', icon:'2️⃣0️⃣4️⃣8️⃣', desc:'Merge to 2048', href:'#' },
  { id:'chessp', title:'Chess Puzzle', cat:'Brain', icon:'♟️', desc:'Mate in 2', href:'#' },
  { id:'math', title:'Math Speedrun', cat:'Brain', icon:'➕➖✖️➗', desc:'Quick math', href:'#' },

  { id:'color', title:'Color Picker', cat:'Fun', icon:'🎨', desc:'Find the shade', href:'#' },
  { id:'react', title:'Reaction Test', cat:'Fun', icon:'⚡', desc:'Tap fast!', href:'games/reaction/index.html' },
  { id:'emoji', title:'Emoji Catcher', cat:'Fun', icon:'😄', desc:'Catch them all', href:'#' },
  { id:'story', title:'Typing Story', cat:'Fun', icon:'📖', desc:'Type a tale', href:'#' },
  { id:'draw', title:'Quick Draw', cat:'Fun', icon:'✏️', desc:'Sketch quickly', href:'#' },
  // Originals
  { id:'timethreader', title:'Time-Threader', cat:'Originals', icon:'🧵⏱️', desc:'Weave events on a timeline', href:'games/time-threader/index.html' },
  { id:'echoarchitect', title:'Echo Architect', cat:'Originals', icon:'📡', desc:'Phase-align echoes to light targets', href:'games/echo-architect/index.html' },
  { id:'memorymosaic', title:'Memory Mosaic', cat:'Originals', icon:'🧩', desc:'Assemble morphing silhouettes', href:'games/memory-mosaic/index.html' },
  { id:'lightcourier', title:'Light Courier', cat:'Originals', icon:'🔦', desc:'Deliver photons through mirrors', href:'games/light-courier/index.html' },
  { id:'ambientgardener', title:'Ambient Gardener', cat:'Originals', icon:'🌿🎵', desc:'Grow sound-plants harmonically', href:'games/ambient-gardener/index.html' },
  { id:'glitchheist', title:'Glitch Heist', cat:'Originals', icon:'🖥️⚡', desc:'Exploit UI glitches to steal data', href:'games/glitch-heist/index.html' },
  { id:'cartographers', title:"Cartographer's Echo", cat:'Originals', icon:'🗺️', desc:'Probe islands with sonar', href:'games/cartographers-echo/index.html' },
  { id:'perspectiveshift', title:'Perspective Shift', cat:'Originals', icon:'🪞', desc:'Toggle layers to align paths', href:'games/perspective-shift/index.html' },
];

function getTheme(){ return localStorage.getItem('theme') || 'dark'; }
function applyTheme(t){ document.documentElement.setAttribute('data-theme', t); }
function toggleTheme(){ const t = getTheme()==='dark'?'light':'dark'; localStorage.setItem('theme', t); applyTheme(t); }

function cardTemplate(g){
  const scores = getScores(g.id);
  const top = scores[0]?.score || 0;
  return `
  <article class="card" data-cat="${g.cat}">
    <div class="card-inner">
      <div class="card-face front">
        <div class="icon">${g.icon}</div>
        <div>
          <div class="title">${g.title}</div>
          <div class="subtitle">${g.desc}</div>
        </div>
        <div class="card-actions">
          <button class="btn view-lb" data-id="${g.id}" data-title="${g.title}">Leaderboard</button>
          <a class="btn play" href="${g.href}">Play</a>
        </div>
        <div class="score">High Score: <strong>${top}</strong></div>
      </div>
      <div class="card-face card-back">
        <h4 style="margin:0 0 6px 0;">Top Scores</h4>
        <ol class="leaderboard-mini" style="margin:0; padding-left:16px;">
          ${scores.slice(0,5).map((s,i)=>`<li>#${i+1} ${s.name} - ${s.score}</li>`).join('') || '<li>No scores yet</li>'}
        </ol>
        <div class="card-actions">
          <a class="btn play" href="${g.href}">Play</a>
          <button class="btn flip-back">Back</button>
        </div>
      </div>
    </div>
  </article>`;
}

function mountGrid(){
  const grid = document.getElementById('gameGrid');
  grid.innerHTML = games.map(cardTemplate).join('');
  // Staggered entry animation
  const dur = prefersReduced ? 0.01 : 0.35;
  const y = prefersReduced ? 0 : 8;
  gsap.from('#gameGrid .card', { opacity: 0, y, stagger: prefersReduced ? 0 : 0.03, duration: dur, ease: 'power1.out' });
  // Hover scale effect and flip handlers
  grid.querySelectorAll('.card').forEach(card => {
    if (!prefersReduced) {
      card.addEventListener('mouseenter', ()=> gsap.to(card.querySelector('.card-inner'), { scale: 1.02, duration:.2 }));
      card.addEventListener('mouseleave', ()=> gsap.to(card.querySelector('.card-inner'), { scale: 1.0, duration:.2 }));
    }

    // Tap to flip on mobile or View leaderboard on click
    card.addEventListener('click', (e)=>{
      const lbBtn = e.target.closest('.view-lb');
      const flipBack = e.target.closest('.flip-back');
      if (lbBtn) {
        const id = lbBtn.dataset.id; const title = lbBtn.dataset.title;
        openDrawer(title, getScores(id));
        e.stopPropagation(); return;
      }
      if (flipBack) { card.classList.remove('flipped'); e.stopPropagation(); return; }
      if (!e.target.closest('a, button')) { card.classList.toggle('flipped'); }
    });
  });
}

function setupFilters(){
  const chips = document.querySelectorAll('.chip');
  function applyFilter(filter){
    localStorage.setItem('hub_filter', filter);
    document.querySelectorAll('#gameGrid .card').forEach(card => {
      const matchesCat = (filter === 'all') || (card.dataset.cat === filter);
      const q = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
      const title = card.querySelector('.title')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('.subtitle')?.textContent.toLowerCase() || '';
      const matchesQuery = !q || title.includes(q) || desc.includes(q);
      card.style.display = (matchesCat && matchesQuery) ? '' : 'none';
    });
  }

  chips.forEach(c => {
    c.addEventListener('click', () => {
      chips.forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      applyFilter(c.dataset.filter);
    });
    c.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); }
    });
  });

  // Persisted filter
  const saved = localStorage.getItem('hub_filter') || 'all';
  const chip = Array.from(chips).find(x => x.dataset.filter === saved) || chips[0];
  chips.forEach(x => x.classList.remove('active'));
  chip.classList.add('active');
  applyFilter(saved);
}

function setupTheme(){
  applyTheme(getTheme());
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
}

function setupSearch(){
  const input = document.getElementById('searchInput');
  if (!input) return;
  const saved = localStorage.getItem('hub_search') || '';
  input.value = saved;
  const run = () => {
    localStorage.setItem('hub_search', input.value);
    // Re-apply current filter + query
    const active = document.querySelector('.chip.active')?.dataset.filter || 'all';
    document.querySelectorAll('#gameGrid .card').forEach(card => {
      const matchesCat = (active === 'all') || (card.dataset.cat === active);
      const q = input.value.trim().toLowerCase();
      const title = card.querySelector('.title')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('.subtitle')?.textContent.toLowerCase() || '';
      const matchesQuery = !q || title.includes(q) || desc.includes(q);
      card.style.display = (matchesCat && matchesQuery) ? '' : 'none';
    });
  };
  input.addEventListener('input', run);
  run();
}

function setupPageTransitions(){
  // Fade-in
  const dur = prefersReduced ? 0.01 : 0.4;
  const y = prefersReduced ? 0 : 8;
  gsap.fromTo('main, header', { opacity: 0, y }, { opacity: 1, y: 0, duration: dur, ease:'power1.out' });
  // Fade-out on navigation
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const url = a.getAttribute('href');
    if (url.startsWith('#')) return;
    e.preventDefault();
    const overlay = document.getElementById('pageFade');
    const d = prefersReduced ? 0.01 : 0.25;
    gsap.to(overlay, { opacity: 1, duration: d, onComplete: ()=> { window.location.href = url; } });
  }, true);
}

function setupDrawer(){ attachDrawerClose(); }

function init(){
  setupTheme();
  mountGrid();
  setupFilters();
  setupSearch();
  setupPageTransitions();
  setupDrawer();
  enableRipples();
}

document.addEventListener('DOMContentLoaded', init);
