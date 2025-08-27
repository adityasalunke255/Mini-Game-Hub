// Simple localStorage leaderboard utilities
const LB_KEY = "mini_game_hub_leaderboards";

function readAllLeaderboards() {
  try { return JSON.parse(localStorage.getItem(LB_KEY) || "{}"); } catch { return {}; }
}
function writeAllLeaderboards(data) { localStorage.setItem(LB_KEY, JSON.stringify(data)); }

export function addScore(gameId, name, score) {
  const data = readAllLeaderboards();
  data[gameId] = data[gameId] || [];
  const idx = data[gameId].findIndex(s => s.name.toLowerCase() === name.toLowerCase());
  if (idx >= 0) {
    if (score > data[gameId][idx].score) {
      data[gameId][idx] = { name, score, ts: Date.now() };
    }
  } else {
    data[gameId].push({ name, score, ts: Date.now() });
  }
  data[gameId].sort((a,b) => b.score - a.score);
  data[gameId] = data[gameId].slice(0, 10);
  writeAllLeaderboards(data);
}

export function getScores(gameId) {
  const data = readAllLeaderboards();
  return (data[gameId] || []).slice(0, 10);
}

export function animateCount(el, to, dur=0.8) {
  const obj = { val: 0 };
  gsap.to(obj, { val: to, duration: dur, onUpdate: () => {
    el.textContent = Math.floor(obj.val);
  }});
}

export function openDrawer(title, scores) {
  const drawer = document.getElementById('leaderboardDrawer');
  const list = document.getElementById('drawerList');
  const ttl = document.getElementById('drawerTitle');
  ttl.textContent = `${title} • Leaderboard`;
  list.innerHTML = '';
  scores.forEach((s, i) => {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = `#${i+1} ${s.name}`;
    const strong = document.createElement('strong');
    strong.textContent = '0';
    li.appendChild(label);
    li.appendChild(strong);
    list.appendChild(li);
    // animate counter after appended for smoothness
    requestAnimationFrame(()=> animateCount(strong, s.score));
  });
  // Accessibility: show drawer and trap focus
  drawer.setAttribute('aria-hidden', 'false');
  const prev = document.activeElement;
  drawer.dataset.prevFocus = (prev && prev instanceof HTMLElement) ? '1' : '';
  gsap.to(drawer, { right: 0, duration: .45, ease: 'power3.out' });
  trapFocus(drawer);
}

export function closeDrawer() {
  const drawer = document.getElementById('leaderboardDrawer');
  gsap.to(drawer, { right: -400, duration: .4, ease: 'power3.in', onComplete: ()=>{
    drawer.setAttribute('aria-hidden', 'true');
    releaseFocus(drawer);
  }});
}

export function attachDrawerClose() {
  document.querySelector('#leaderboardDrawer .close-drawer')?.addEventListener('click', closeDrawer);
}

// Focus trap helpers
let keydownHandler = null;
function trapFocus(panel){
  const focusables = panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  (first instanceof HTMLElement ? first : panel).focus();
  keydownHandler = (e)=>{
    if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
    if (e.key !== 'Tab') return;
    if (focusables.length === 0) { e.preventDefault(); return; }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', keydownHandler);
}

function releaseFocus(panel){
  document.removeEventListener('keydown', keydownHandler);
  keydownHandler = null;
}
