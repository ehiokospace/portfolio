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
