(() => {
  const toggle = document.getElementById('navigation-toggle');
  const sidebar = document.getElementById('textbook-navigation');
  if (!toggle || !sidebar) return;
  document.body.classList.add('navigation-ready');
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    const closed = document.body.classList.toggle('navigation-closed');
    sidebar.hidden = closed;
    toggle.setAttribute('aria-expanded', String(!closed));
    toggle.querySelector('span').textContent = closed ? 'ナビを開く' : 'ナビを閉じる';
  });
  const sections = [...sidebar.querySelectorAll('nav a[href^="#"]')]
    .map(link => ({ link, section: document.getElementById(link.hash.slice(1)) }))
    .filter(item => item.section);
  let queued = false;
  function updateCurrentSection() {
    queued = false;
    let current = sections[0];
    for (const item of sections) {
      if (item.section.getBoundingClientRect().top <= window.innerHeight * 0.25) current = item;
    }
    for (const item of sections) {
      if (item === current) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    }
  }
  function scheduleUpdate() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(updateCurrentSection);
  }
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);
  toggle.addEventListener('click', scheduleUpdate);
  updateCurrentSection();
})();
