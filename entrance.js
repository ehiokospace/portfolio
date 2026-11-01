// The intro stays in view until the visitor scrolls or chooses to see projects.
(() => {
 const html=document.documentElement,stage=document.querySelector('#navigation-stage'),skip=document.querySelector('.intro-skip');
 if(!stage||!skip)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 skip.addEventListener('click',()=>stage.scrollIntoView({behavior:reduced.matches?'instant':'smooth'}));
 if(!html.classList.contains('intro-cinematic'))return;
 html.classList.add('intro-gliding');window.scrollTo(0,0);
 requestAnimationFrame(()=>{window.scrollTo(0,0);html.classList.remove('intro-gliding');});
 window.addEventListener('pageshow',()=>{if(!location.hash&&!new URLSearchParams(location.search).has('case'))window.scrollTo({top:0,behavior:'instant'});});
})();

// Reveal the introduction once without changing its centered line widths.
(() => {
  const headline = document.querySelector('#intro-headline');
  if (!headline || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const letters = [];
  headline.setAttribute('aria-label', headline.textContent.trim());
  headline.querySelectorAll('.headline-line').forEach(line => {
    const text = line.textContent;
    line.setAttribute('aria-hidden', 'true');
    line.replaceChildren(...Array.from(text, char => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.visibility = 'hidden';
      letters.push(span);
      return span;
    }));
  });
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame, start;
  const finish = () => { cancelAnimationFrame(frame); letters.forEach(letter => { letter.style.visibility = ''; }); };
  motion.addEventListener('change', finish, {once: true});
  function type(now) {
    start ??= now;
    const count = Math.max(0, Math.floor((now - start - 300) / 38));
    letters.slice(0, count).forEach(letter => { letter.style.visibility = ''; });
    if (count < letters.length) frame = requestAnimationFrame(type);
  }
  frame = requestAnimationFrame(type);
})();
