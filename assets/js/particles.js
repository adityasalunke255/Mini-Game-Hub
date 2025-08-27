// Particles: subtle floating bubbles
(async () => {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const baseCount = width >= 1024 ? 40 : width >= 640 ? 28 : 18;
  const count = prefersReduced ? Math.max(8, Math.floor(baseCount * 0.4)) : baseCount;
  const hoverEnable = !prefersReduced;
  await tsParticles.load({ id: "particles", options: {
    fullScreen: { enable: false },
    background: { color: "transparent" },
    particles: {
      number: { value: count, density: { enable: true, area: 800 } },
      color: { value: ["#6be7ff", "#a78bfa", "#ff9f6b"] },
      opacity: { value: prefersReduced ? 0.2 : 0.25 },
      size: { value: { min: 1, max: 4 } },
      move: { enable: true, speed: prefersReduced ? 0.3 : 0.7, direction: "none", outModes: { default: "out" } },
      links: { enable: false },
      shape: { type: "circle" }
    },
    interactivity: {
      events: { onHover: { enable: hoverEnable, mode: "repulse" }, resize: true },
      modes: { repulse: { distance: 80, duration: 0.3 } }
    },
    detectRetina: true
  }});
})();
