// The existing hero film is the entrance. No duplicate video or blocking loader.
(() => {
  const html = document.documentElement;
  const hero = document.querySelector('.intro-landing');
  const stage = document.querySelector('#navigation-stage');
  const skip = document.querySelector('.intro-skip');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!hero || !stage) return;
  if (!html.classList.contains('intro-cinematic')) return;
  if (html.classList.contains('intro-return')) {
    html.classList.add('intro-gliding');
    // Skip the timed entrance for return visits without removing the film.
    const target = Math.max(0, stage.getBoundingClientRect().top + window.scrollY - document.querySelector('.shared-navigation').getBoundingClientRect().height);
    window.scrollTo(0, target);
    requestAnimationFrame(() => html.classList.remove('intro-gliding'));
    skip.addEventListener('click', () => stage.scrollIntoView({behavior: motion.matches ? 'instant' : 'smooth'}));
    return;
  }

  const start = performance.now();
  let timer;
  let frame;
  let finished = false;
  let scrolling = false;
  function markSeen() { try {localStorage.setItem('portfolio-film-seen', String(Date.now()));} catch {} }
  function clearEntrance() {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    html.classList.remove('intro-arriving');
  }
  function cancel() {
    if (finished) return;
    finished = true;
    clearEntrance();
    markSeen();
    removeListeners();
  }
  function glide() {
    if (finished) return;
    finished = true;
    clearEntrance();
    markSeen();
    removeListeners();
    scrolling = true;
    const target = Math.max(0, stage.getBoundingClientRect().top + window.scrollY - document.querySelector('.shared-navigation').getBoundingClientRect().height);
    const from = window.scrollY;
    const began = performance.now();
    const duration = motion.matches ? 0 : 1150;
    // Override CSS smooth scrolling while drawing a single continuous eased glide.
    html.classList.add('intro-gliding');
    function end() {html.classList.remove('intro-gliding'); scrolling = false; cleanupGlide();}
    function abort() {cancelAnimationFrame(frame); end();}
    function cleanupGlide() {
      window.removeEventListener('wheel', abort);
      window.removeEventListener('touchstart', abort);
      window.removeEventListener('keydown', abortKey);
    }
    function abortKey(event) { if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) abort(); }
    window.addEventListener('wheel', abort, {passive: true, once: true});
    window.addEventListener('touchstart', abort, {passive: true, once: true});
    window.addEventListener('keydown', abortKey);
    function tick(now) {
      const progress = duration ? Math.min(1, (now - began) / duration) : 1;
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      window.scrollTo(0, from + (target - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else end();
    }
    frame = requestAnimationFrame(tick);
  }
  function onScroll() {if (!scrolling && window.scrollY > 24) cancel();}
  function onKey(event) {if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) cancel();}
  function onVisibility() {if (document.hidden) cancel();}
  function onLink(event) {if (event.target.closest('a')) cancel();}
  function onAnnotate(event) {if (event.target.closest('#annotate-feedback')) cancel();}
  function onMotion() {if (motion.matches) cancel();}
  function removeListeners() {
    window.removeEventListener('wheel', cancel);
    window.removeEventListener('touchstart', cancel);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVisibility);
    hero.removeEventListener('click', onLink);
    document.removeEventListener('click', onAnnotate, true);
    motion.removeEventListener('change', onMotion);
  }
  skip.addEventListener('click', () => {
    if (!finished) glide();
    else stage.scrollIntoView({behavior: motion.matches ? 'instant' : 'smooth'});
  });
  window.addEventListener('wheel', cancel, {passive: true});
  window.addEventListener('touchstart', cancel, {passive: true});
  window.addEventListener('scroll', onScroll, {passive: true});
  window.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility);
  hero.addEventListener('click', onLink);
  document.addEventListener('click', onAnnotate, true);
  motion.addEventListener('change', onMotion);
  timer = setTimeout(glide, Math.max(0, 3100 - (performance.now() - start)));
})();
