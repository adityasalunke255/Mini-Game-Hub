// Simple ripple effect for buttons and chips
function createRipple(e){
  const btn = e.currentTarget;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  const x = e.clientX ? e.clientX - rect.left - size/2 : rect.width/2 - size/2;
  const y = e.clientY ? e.clientY - rect.top - size/2 : rect.height/2 - size/2;
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 650);
}

export function enableRipples(){
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.btn, .chip');
    if (!target) return;
    createRipple(e);
  });
}
