// Trial fonts are available only in the local preview.
if (['localhost', '127.0.0.1'].includes(location.hostname)) {
  const fonts = document.createElement('link');
  fonts.rel = 'stylesheet';
  fonts.href = './local-fonts/fonts.css';
  document.head.append(fonts);
}
// Replace null destinations with your own URLs. Relative paths work on GitHub Pages.
const destinations = {
  Craft: null, Gallery: null, Resume: 'https://drive.google.com/file/d/11beu2HB285avA1R1cZX8E9XF8QlEzJ4y/view?usp=sharing',
  'Internal tooling case study': null,
  'AI mental health case study': null,
  'Course scheduling case study': null,
  'ColorStack community case study': null,
};
const dialog = document.querySelector('#notice');
document.querySelectorAll('[data-missing]').forEach(button => {
  button.addEventListener('click', () => {
    const label = button.dataset.missing;
    const url = destinations[label];
    if (url) { window.location.href = url; return; }
    document.querySelector('#notice-title').textContent = label;
    document.querySelector('#notice-body').textContent = label.includes('case study')
      ? 'This case study has not been added to the portfolio yet.'
      : label === 'Craft' ? 'The craft page is coming soon.'
      : label === 'Gallery' ? 'The gallery has not been added yet.'
      : 'This destination has not been connected yet.';
    dialog.showModal();
  });
});
dialog.addEventListener('click', event => { if(event.target === dialog) dialog.close(); });
function sizeArtwork() {
  const art = document.querySelector('.artboard');
  if (!art) return;
  art.style.transform = 'scale(' + art.parentElement.clientWidth / 478.5 + ')';
}
new ResizeObserver(sizeArtwork).observe(document.querySelector('.internal .media'));
sizeArtwork();

const heroVideo = document.querySelector('.hero-video');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function updateHeroPlayback() {
  if (reducedMotion.matches) {
    heroVideo.pause();
    heroVideo.removeAttribute('autoplay');
    heroVideo.load();
  } else {
    heroVideo.setAttribute('autoplay', '');
    heroVideo.play().catch(() => { /* The poster remains if autoplay is unavailable. */ });
  }
}
reducedMotion.addEventListener('change', updateHeroPlayback);
updateHeroPlayback();

// Use a city-level network estimate rather than requesting precise GPS coordinates.
const weatherLabel = document.querySelector('#viewer-weather');
function weatherDescription(code) {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mostly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if ([45,48].includes(code)) return 'Fog';
  if ([51,53,55,56,57].includes(code)) return 'Drizzle';
  if ([61,63,65,66,67,80,81,82].includes(code)) return 'Rain';
  if ([71,73,75,77,85,86].includes(code)) return 'Snow';
  if ([95,96,99].includes(code)) return 'Thunderstorms';
  return 'Current weather';
}
async function fetchJSON(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000), credentials: 'omit', referrerPolicy: 'no-referrer'
  });
  if (!response.ok) throw new Error('Lookup unavailable');
  return response.json();
}
async function updateViewerWeather() {
  try {
    let location;
    for (const url of ['https://ipinfo.io/json', 'https://ipwho.is/', 'https://ipapi.co/json/']) {
      try {
        const result = await fetchJSON(url);
        if (typeof result.loc === 'string') {
          [result.latitude, result.longitude] = result.loc.split(',').map(Number);
          result.country_code = result.country;
        }
        if (Number.isFinite(result.latitude) && Number.isFinite(result.longitude)) {
          location = result; break;
        }
      } catch (error) { console.warn('City lookup:', error.message); }
    }
    if (!location) throw new Error('Location unavailable');
    if (typeof location.city === 'string' && location.city.trim()) {
      document.querySelector('#viewer-location').textContent = location.city.trim() + '.';
    }
    const fahrenheit = location.country_code === 'US';
    const params = new URLSearchParams({
      latitude: location.latitude.toFixed(1), longitude: location.longitude.toFixed(1),
      current: 'temperature_2m,weather_code', temperature_unit: fahrenheit ? 'fahrenheit' : 'celsius',
      timezone: 'auto'
    });
    const data = await fetchJSON('https://api.open-meteo.com/v1/forecast?' + params);
    if (!Number.isFinite(data.current?.temperature_2m)) throw new Error('Weather unavailable');
    weatherLabel.textContent = Math.round(data.current.temperature_2m) + '°' +
      (fahrenheit ? 'F' : 'C') + ' · ' + weatherDescription(data.current.weather_code);
  } catch {
    weatherLabel.textContent = 'Weather unavailable';
  }
}
updateViewerWeather();
setInterval(updateViewerWeather, 15 * 60 * 1000);

const copyEmailButton = document.querySelector('#copy-email');
let emailResetTimer;
copyEmailButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('ehigoko1@gmail.com');
    document.dispatchEvent(new Event('email-copied'));
    clearTimeout(emailResetTimer);
    copyEmailButton.querySelector('.email-label').textContent = 'COPIED!';
    copyEmailButton.classList.add('is-copied');
    emailResetTimer = setTimeout(() => {
      copyEmailButton.querySelector('.email-label').textContent = '05. Email';
      copyEmailButton.classList.remove('is-copied');
    }, 2000);
  } catch {
    document.querySelector('#notice-title').textContent = '05. Email';
    document.querySelector('#notice-body').textContent = 'Copy this address: ehigoko1@gmail.com';
    dialog.showModal();
  }
});

const descriptionButton = document.querySelector('#scramble-description');
const descriptions = ['DESIGNED AND CODED WITH ♥︎','ALWAYS BUILDING','DESIGNING FOR HUMANS','TRAVELING THE WORLD','TYPOGRAPHY ENTHUSIAST','SPARKING DELIGHT'];
let descriptionIndex = 0;
let scrambleFrame;
function scrambleDescription() {
  cancelAnimationFrame(scrambleFrame);
  descriptionIndex = (descriptionIndex + 1) % descriptions.length;
  const target = descriptions[descriptionIndex];
  descriptionButton.setAttribute('aria-label', target + '. Show another description');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { descriptionButton.textContent = target; return; }
  const start = performance.now();
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:%$#*&@^?!';
  function animate(now) {
    const progress = Math.min((now - start) / 650, 1);
    const resolved = Math.floor(progress * target.length);
    descriptionButton.textContent = Array.from(target, (character, index) => character === ' ' || index < resolved ? character : characters[Math.floor(Math.random() * characters.length)]).join('');
    if (progress < 1) scrambleFrame = requestAnimationFrame(animate);
    else descriptionButton.textContent = target;
  }
  scrambleFrame = requestAnimationFrame(animate);
}
descriptionButton.addEventListener('pointerenter', scrambleDescription);
descriptionButton.addEventListener('focus', scrambleDescription);
descriptionButton.addEventListener('click', scrambleDescription);

// Keep native selection and copying, and paint a rounded ink layer behind it.
(() => {
  const layer = document.createElement('div');
  layer.className = 'selection-ink';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  let frame;
  function paint() {
    layer.replaceChildren();
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount || matchMedia('(forced-colors: active)').matches) return;
    const range = selection.getRangeAt(0);
    const host=selection.anchorNode?.parentElement?.closest("dialog[open]")||document.body;
    if(layer.parentElement!==host)host.append(layer);
    if (selection.anchorNode?.parentElement?.closest('input,textarea,[contenteditable]')) return;
    const lines = [];
    for (const rect of range.getClientRects()) {
      if (rect.width < 1 || rect.height < 1) continue;
      const sameLine = lines.find(line => Math.abs(line.top - rect.top) < 2 && Math.abs(line.height - rect.height) < 2 && rect.left <= line.right + 3 && rect.right >= line.left - 3);
      if (sameLine) { sameLine.left = Math.min(sameLine.left, rect.left); sameLine.right = Math.max(sameLine.right, rect.right); }
      else lines.push({left:rect.left,right:rect.right,top:rect.top,height:rect.height});
    }
    for (const rect of lines) {
      const ink = document.createElement('div');
      ink.style.cssText = `left:${rect.left-2}px;top:${rect.top+rect.height*.1}px;width:${rect.right-rect.left+4}px;height:${rect.height*.8}px`;
      layer.append(ink);
    }
    frame = requestAnimationFrame(paint);
  }
  function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(paint); }
  document.addEventListener('selectionchange', schedule);
  window.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule);
  document.fonts.ready.then(schedule);
  document.documentElement.classList.add('custom-selection');
})();

(() => {
  const palette = document.querySelector('#command-palette');
  const query = document.querySelector('#command-query');
  const results = document.querySelector('#command-results');
  const empty = palette.querySelector('.command-empty');
  const trigger = document.querySelector('#open-search');
  const closeButton = document.querySelector('#close-search');
  const closeLabel = closeButton.textContent;
  let copiedTimer;
  function resetCopied(){clearTimeout(copiedTimer);closeButton.textContent=closeLabel;}
  document.addEventListener('email-copied',()=>{
    if(!palette.open)return;
    resetCopied();closeButton.textContent='COPIED!';
    copiedTimer=setTimeout(resetCopied,2000);
  });
  palette.addEventListener('close',resetCopied);
  const items = [
    {name:'Work',key:'w',modifier:true,shortcut:'[⌘W]',group:'Pages',detail:'/WORK',run:()=>location.hash='work'},
    {name:'Craft',shortcut:'',group:'Pages',detail:'SOON',run:()=>document.querySelector('[data-missing="Craft"]').click()},
    {name:'Gallery',key:'g',modifier:true,shortcut:'[⌘G]',group:'Pages',detail:'SOON',run:()=>document.querySelector('[data-missing="Gallery"]').click()},
    {name:'Story',aliases:'about bio biography',key:'s',modifier:true,shortcut:'[⌘S]',group:'Pages',detail:'/STORY',run:()=>document.dispatchEvent(new Event('open-story'))},
    {name:'Download résumé',aliases:'resume cv curriculum vitae download',key:'r',modifier:true,shortcut:'[⌘R]',group:'Commands',detail:'↗',run:()=>document.querySelector('#resume-link').click()},
    {name:'Copy email',keepOpen:true,aliases:'contact mail ehigoko1@gmail.com',key:'e',modifier:true,shortcut:'[⌘E]',group:'Commands',detail:'COMMAND',run:()=>document.querySelector('#copy-email').click()},
    {name:'Leave feedback',aliases:'comment suggestion critique review',shortcut:'',group:'Commands',detail:'COMMAND',run:()=>document.querySelector('#leave-feedback').click()},
    {name:'LinkedIn',aliases:'https://www.linkedin.com/in/ehi-oko social',shortcut:'',group:'Links',detail:'↗',run:()=>window.open('https://www.linkedin.com/in/ehi-oko','_blank','noopener')},
    {name:'X/Twitter',aliases:'https://www.x.com/ehigoko social twitter',shortcut:'',group:'Links',detail:'↗',run:()=>window.open('https://www.x.com/ehigoko','_blank','noopener')},
  ];
  function contentItems() {
    const jump = element => () => element.scrollIntoView({block:'start',behavior:'smooth'});
    const content = [...document.querySelectorAll('.project')].map(project => ({
      name:project.querySelector('h2').textContent,
      group:'Content',shortcut:'',detail:'/WORK',
      aliases:[project.textContent,...[...project.querySelectorAll('img')].map(image=>image.alt),project.classList.contains('mental')?'Thrive Thribe':''].join(' '),
      run:()=>project.querySelector('[data-case]').click()
    }));
    const extra = [
      [document.querySelector('#intro'),'Introduction','/HOME'],
      [document.querySelector('.current'),'Previous experience','/HOME'],
      [document.querySelector('#story p:nth-child(2)'),'About Ehi Oko','/STORY'],
      [document.querySelector('#story p:nth-child(3)'),'Education and experience','/STORY'],
      [document.querySelector('.utility p'),'Location and weather','/WORK'],
      [document.querySelector('#scramble-description'),'Designed and coded with ♥︎','/WORK']
    ];
    extra.forEach(([element,name,detail])=>{
      if(element)content.push({name,group:'Content',shortcut:'',detail,aliases:element.textContent+(element.id==='scramble-description'?' '+descriptions.join(' '):''),run:jump(element)});
    });
    return content;
  }
  let filtered = [], active = 0;
  function highlight() {
    [...results.querySelectorAll('button')].forEach((button,index)=>button.classList.toggle('active',index===active));
  }
  function choose(index) { const item=filtered[index]; if (!item) return; if(!item.keepOpen)palette.close(); item.run(); }
  const normalizeSearch = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/⌘/g,' cmd command ctrl control ').replace(/[\[\]]/g,' ').trim();
  function render() {
    const terms=normalizeSearch(query.value).split(/\s+/).filter(Boolean);
    filtered=[...items,...(terms.length?contentItems():[])].filter(item=>{
      const searchable=normalizeSearch([item.name,item.group,item.detail,item.shortcut,item.key||'',item.aliases||''].join(' '));
      return terms.every(term=>searchable.includes(term));
    });active=0;results.replaceChildren();
    let group='';
    filtered.forEach((item,index)=>{
      if(item.group!==group){const title=document.createElement('h2');title.className='command-group';title.textContent=item.group;results.append(title);group=item.group;}
      const button=document.createElement('button');button.className='command-result';
      const name=document.createElement('span');name.textContent=item.name+' ';const shortcut=document.createElement('span');shortcut.className='command-shortcut';shortcut.textContent=item.shortcut;name.append(shortcut);
      const detail=document.createElement('small');detail.textContent=item.detail;
      button.append(name,detail);button.addEventListener('click',()=>choose(index));
      button.addEventListener('pointerenter',()=>{active=index;highlight();});results.append(button);
    });
    empty.hidden=filtered.length!==0;highlight();
  }
  function open() { if(palette.open)return;query.value='';render();palette.showModal();if(matchMedia('(max-width:700px)').matches)palette.focus({preventScroll:true});else query.focus(); }
  trigger.addEventListener('click',open);
  document.querySelector('#mobile-menu').addEventListener('click',open);
  document.querySelector('#close-search').addEventListener('click',()=>palette.close());
  palette.addEventListener('click',event=>{if(event.target===palette){const r=palette.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)palette.close();}});
  query.addEventListener('input',render);
  palette.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();if(!filtered.length)return;active=(active+(event.key==='ArrowDown'?1:-1)+filtered.length)%filtered.length;highlight();results.querySelectorAll('button')[active].scrollIntoView({block:'nearest'});}
    if(event.key==='Enter'&&(event.target===query||event.target.classList.contains('command-result'))){event.preventDefault();choose(active);}
  });
  document.addEventListener('keydown',event=>{
    const key=event.key.toLowerCase();
    if((event.metaKey||event.ctrlKey)&&key==='k'){event.preventDefault();palette.open?palette.close():open();return;}
    if(!palette.open||event.altKey||event.shiftKey||event.isComposing||event.repeat)return;
    const modifier=event.metaKey||event.ctrlKey;
    const item=items.find(item=>item.key===key&&Boolean(item.modifier)===Boolean(modifier));
    if(item&&modifier){event.preventDefault();if(!item.keepOpen)palette.close();item.run();}
  });
})();

// Each study supports optional metadata and story sections as content is added.
(() => {
  const studies = {
    'internal-tooling': {title:'Sullivan Foundation',badge:'Product design',summary:'During my summer internship at Sullivan Foundation, I worked as part of the Sullivan Service Corps, a hands-on internship designed to foster empathy in action. I worked across AI consulting, engineering, and strategy to help nonprofits turn operational challenges into digital solutions.',category:'Product, internship',detailImage:'./assets/internal-tooling.png',detailAlt:'Eliada Homes internal tooling dashboard',image:'./assets/sullivan-service-corps.jpg',alt:'Sullivan Service Corps internship group outdoors',overview:'Turning nonprofit operational challenges into digital solutions.',metadata:[['Timeline','May 2026 – June 2026'],['Role','Design Engineer'],['Tools','Figma, Hugging Face'],['Team','Me!']],sections:[]},
    'thrive': {title:'Thrive',summary:'Leading design at an AI mental health startup',category:'Startup',status:'HBCU Pitch Competition winner',image:'./assets/mental-health.png',alt:'Focus Challenge interface on a phone',overview:'Leading design at an AI mental health startup.',metadata:[],sections:[]},
    'course-scheduling': {title:'Course scheduling',summary:'Smarter course scheduling for AAMU students',category:'Web app',status:'Concept',image:'./assets/7230c.png',alt:'Soft pink blossoms',overview:'A concept for a smarter course scheduling system for AAMU students.',metadata:[],sections:[]},
    'colorstack': {title:'ColorStack AAMU',summary:'Fostering a community of students in tech',category:'Brand, community',image:'./assets/community.png',alt:'ColorStack AAMU community artwork',overview:'Fostering a community of students in tech.',metadata:[],sections:[]}
  };
  const modal=document.querySelector('#case-study'),content=document.querySelector('#case-content'),expand=document.querySelector('#case-expand');
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let previousFocus=null;
  let soonFrame=0;
  function render(study){
    cancelAnimationFrame(soonFrame);
    content.innerHTML='<section class="project-soon"><div class="soon-wrap"><div class="soon-num" aria-label="404"><span class="soon-cell"><span>4</span></span><span class="soon-cell"><span>0</span></span><span class="soon-cell"><span>4</span></span></div><h2 id="case-title">'+escape(study.title)+' is still being written.</h2><p>The '+escape(study.title)+' case study is currently in the works. If you would like to hear about it before it is public, reach out at <a href="mailto:ehigoko1@gmail.com">ehigoko1@gmail.com</a>.</p><button class="soon-back">‹ <span>Back to home</span></button></div></section>';
    content.querySelector('.soon-back').addEventListener('click',()=>modal.close());
    const row=content.querySelector('.soon-num'),cells=[...row.children].map((cell,index)=>({cell,glyph:cell.firstElementChild,index,next:1+Math.random()*4,until:0,lit:false,color:Math.random()<.5?'#FD974F':'#E37280'}));
    const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;let lit=0,started=null;
    function tick(now){if(!modal.open)return;if(started===null)started=now;const t=(now-started)/1000,available=Math.min(960,content.clientWidth-80),size=Math.min(180,Math.max(80,content.clientWidth*.18)),base=size*.57+12,stretch=size*2.2;
      const widths=cells.map(c=>base+Math.pow(.5+.5*Math.sin(t*.23*Math.PI*2+c.index*.74*1.7),2)*stretch),total=widths.reduce((x,y)=>x+y,0),scale=Math.min(1,Math.max(0,available-base*3)/(total-base*3||1));
      for(const [i,c] of cells.entries()){c.cell.style.width=(base+(widths[i]-base)*scale).toFixed(1)+'px';c.glyph.style.fontSize=size+'px';if(!reduced){if(c.lit&&t>c.until){c.lit=false;lit--;c.next=t+4+Math.random()*10;}else if(!c.lit&&t>c.next){if(lit){c.next=t+1+Math.random()*3;}else{c.lit=true;lit++;c.until=t+.3+Math.random()*.9;}}}c.cell.style.background=c.lit?c.color:'transparent';c.glyph.style.color=c.lit?'#FAF9F7':'';}
      if(!reduced)soonFrame=requestAnimationFrame(tick);
    }
    soonFrame=requestAnimationFrame(tick);
  }
  function openCase(id,updateURL=true){
    if(!studies[id])return;
    if(!modal.open)previousFocus=document.activeElement;
    render(studies[id]);modal.classList.remove('expanded');expand.setAttribute('aria-pressed','false');expand.setAttribute('aria-label','Expand case study');
    if(!modal.open)modal.showModal();content.scrollTop=0;
    if(updateURL){const url=new URL(location.href);if(id==='internal-tooling'){url.pathname='/projects/sullivanfoundation';url.searchParams.delete('case');url.hash='';}else{url.pathname='/';url.searchParams.set('case',id);}history.pushState(null,'',url);}
  }
  document.querySelectorAll('[data-case]').forEach(button=>button.addEventListener('click',()=>openCase(button.dataset.case)));
  document.querySelector('#case-home').addEventListener('click',()=>modal.close());
  expand.addEventListener('click',()=>{const expanded=modal.classList.toggle('expanded');expand.setAttribute('aria-pressed',String(expanded));expand.setAttribute('aria-label',expanded?'Restore popup size':'Expand case study');});
  modal.addEventListener('click',event=>{if(event.target!==modal)return;const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close();});
  modal.addEventListener('close',()=>{cancelAnimationFrame(soonFrame);const url=new URL(location.href);if(url.pathname.replace(/\/$/,'')==='/projects/sullivanfoundation'){url.pathname='/';url.hash='work';history.replaceState(null,'',url);}if(url.searchParams.has('case')){url.searchParams.delete('case');history.replaceState(null,'',url);}previousFocus?.focus({preventScroll:true});});
  window.addEventListener('popstate',()=>{const id=location.pathname.replace(/\/$/,'')==='/projects/sullivanfoundation'?'internal-tooling':new URL(location.href).searchParams.get('case');if(studies[id])openCase(id,false);else if(modal.open)modal.close();});
  const initial=location.pathname.replace(/\/$/,'')==='/projects/sullivanfoundation'?'internal-tooling':new URL(location.href).searchParams.get('case');if(studies[initial])openCase(initial,initial==='internal-tooling'&&location.pathname==='/');
})();

// Keep the credit after all work on mobile, and in the sidebar on desktop.
(() => {const credit=document.querySelector(".sidebar-footer"),sidebar=document.querySelector(".layout aside"),main=document.querySelector("main"),mobile=matchMedia("(max-width:700px)");function placeCredit(){(mobile.matches?main:sidebar).append(credit);}mobile.addEventListener("change",placeCredit);placeCredit();})();

// Private, section-based portfolio feedback.
(() => {
  const endpoint='https://portfolio-feedback.ehigoko1.workers.dev/';
  const sitekey='0x4AAAAAAFPjn8y4ZI1OyhDS';
  const modal=document.querySelector('#feedback-dialog'),form=document.querySelector('#feedback-form');
  const floating=document.createElement('div');floating.id='feedback-floating';floating.hidden=true;document.body.append(floating);
  const section=document.querySelector('#feedback-section'),comments=document.querySelector('#feedback-comments');
  function placeFloating(){if(!selected||floating.hidden)return;const r=selected.getBoundingClientRect(),side=modal.getBoundingClientRect(),available=side.left>180?side.left:innerWidth;const width=Math.min(340,Math.max(220,available-32));floating.style.width=width+'px';floating.style.left=Math.max(16,Math.min(r.left,available-width-16))+'px';floating.style.top=Math.max(16,scrollY+r.top-floating.offsetHeight-12)+'px';}
  window.addEventListener('resize',placeFloating);new ResizeObserver(placeFloating).observe(floating);
  const bar=document.querySelector('#feedback-mode-bar'),status=document.querySelector('#feedback-status');
  const send=document.querySelector('#feedback-send'),message=document.querySelector('#feedback-message');
  let mode=false,selected=null,token='',widget=null,loading=null,previousFocus=null,submitting=false;
  const targets=[['.hero h1','Introduction'],['.hero .current','Previous experience'],['.bio p','Biography'],['nav h2','Navigation heading'],['nav a,nav button:not(#leave-feedback)','Navigation link'],['.utility p','Location and weather'],['.story-bio p','Story biography'],['.story-experience','Story experience'],['.story-particle-stage','Story image']];
  targets.forEach(([selector,label])=>document.querySelectorAll(selector).forEach(el=>el.dataset.feedbackSection=label));
  document.querySelectorAll('.project').forEach(card=>{const title=card.querySelector('h2').textContent;card.querySelectorAll('.media,.category,h2').forEach(el=>el.dataset.feedbackSection=title);});
  function markTargets(enabled){
    document.querySelectorAll('[data-feedback-section]').forEach(el=>{
      if(enabled){el.dataset.feedbackTabindex=el.getAttribute('tabindex')??'none';el.tabIndex=0;}
      else{const old=el.dataset.feedbackTabindex;if(old==='none')el.removeAttribute('tabindex');else if(old!==undefined)el.setAttribute('tabindex',old);delete el.dataset.feedbackTabindex;}
    });
  }
  function stop(){if(!mode)return;mode=false;bar.hidden=true;document.body.classList.remove('feedback-selecting');markTargets(false);}
  function start(){const story=document.querySelector('#story-overlay');const host=story.open?story:document.body;host.append(modal,floating);floating.hidden=true;modal.append(section,form);

    const caseModal=document.querySelector('#case-study');
    if(caseModal.open){compose('Case study: '+document.querySelector('#case-title').textContent,null);return;}
    if(mode)return;previousFocus=document.activeElement;mode=true;document.body.classList.add('feedback-selecting');markTargets(true);form.hidden=true;document.querySelector('#feedback-success').hidden=true;document.querySelector('#feedback-section').textContent='';document.querySelector('#feedback-prompt').hidden=false;modal.show();modal.focus({preventScroll:true});
  }
  function loadTurnstile(){
    if(window.turnstile)return Promise.resolve();
    if(loading)return loading;
    loading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=resolve;script.onerror=()=>{loading=null;script.remove();reject(new Error('unavailable'));};document.head.append(script);});
    return loading;
  }
  async function compose(label,element,type='p'){
    if(submitting)return;

    if(!modal.open)previousFocus=document.activeElement;selected?.classList.remove('feedback-selected');selected=element;selected?.classList.add('feedback-selected');document.querySelector('#feedback-prompt').hidden=true;
    form.reset();form.hidden=false;document.querySelector('#feedback-success').hidden=true;status.textContent='';token='';send.disabled=true;
    section.dataset.label=label;section.textContent=type;section.setAttribute('aria-label',type==='img'?'Selected image':'Selected text');if(!modal.open)modal.show();
    if(element){floating.append(section,form);floating.hidden=false;placeFloating();const top=parseFloat(floating.style.top);if(top<scrollY||top+floating.offsetHeight>scrollY+innerHeight)window.scrollTo({top:Math.max(0,top-24),behavior:'smooth'});message.focus({preventScroll:true});}
    else{floating.hidden=true;modal.append(section,form);modal.focus({preventScroll:true});}
    try{
      await loadTurnstile();if(!modal.open||selected!==element)return;
      if(widget!==null)window.turnstile.remove(widget);
      widget=window.turnstile.render('#feedback-verification',{sitekey,action:'feedback',theme:'light',appearance:'interaction-only',callback:value=>{token=value;send.disabled=submitting;},'expired-callback':()=>{token='';send.disabled=true;},'error-callback':()=>{token='';send.disabled=true;status.textContent='Spam check could not load. Close and try again.';}});placeFloating();
    }catch{status.textContent='Spam check could not load. Please close and try again.';}
  }
  document.querySelector('#leave-feedback').addEventListener('click',start);
  document.querySelector('#story-feedback').addEventListener('click',start);
  document.querySelector('#feedback-mobile').addEventListener('click',start);
  document.querySelector('#feedback-exit').addEventListener('click',stop);
  document.querySelector('#feedback-general').addEventListener('click',()=>compose('General feedback',null));
  document.querySelector('#feedback-close').addEventListener('click',()=>{if(!submitting)modal.close();});
  document.querySelector('#feedback-done').addEventListener('click',()=>modal.close());
  modal.addEventListener('cancel',event=>{if(submitting)event.preventDefault();});
  modal.addEventListener('close',()=>{floating.hidden=true;modal.append(section,form);stop();document.body.append(modal,floating);selected?.classList.remove('feedback-selected');selected=null;if(widget!==null&&window.turnstile){window.turnstile.remove(widget);widget=null;}token='';previousFocus?.focus({preventScroll:true});});
  document.addEventListener('click',event=>{
    if(!mode||event.target.closest('#feedback-dialog, #feedback-floating'))return;
    const element=event.target.closest('[data-feedback-section]');if(!element)return;
    event.preventDefault();event.stopImmediatePropagation();compose(element.dataset.feedbackSection,element,event.target.closest('img,.media')?'img':'p');
  },true);
  document.addEventListener('keydown',event=>{
    if(!modal.open)return;
    if(event.key==='Escape'){event.preventDefault();if(!submitting)modal.close();return;}
    if(!mode||event.target.closest('#feedback-dialog, #feedback-floating'))return;
    const element=event.target.closest('[data-feedback-section]');
    if(element&&(event.key==='Enter'||event.key===' ')){event.preventDefault();event.stopImmediatePropagation();compose(element.dataset.feedbackSection,element);}
  },true);
  // Include dynamically rendered case studies without changing their normal navigation.
  new MutationObserver(()=>{
    const content=document.querySelector('#case-content');if(!content.children.length||content.querySelector('.case-feedback'))return;
    const button=document.createElement('button');button.className='case-feedback';button.textContent='Leave feedback [+]';button.addEventListener('click',()=>compose('Case study: '+document.querySelector('#case-title').textContent,null));content.querySelector('.soon-wrap')?.append(button);
  }).observe(document.querySelector('#case-content'),{childList:true});
  message.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();form.requestSubmit();}});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(submitting||!form.reportValidity()||!token)return;
    submitting=true;send.disabled=true;send.textContent='Sending…';status.textContent='';
    const payload={message:message.value,page:location.href,section:section.dataset.label,category:document.querySelector('#feedback-category').value,website:form.elements.website.value,token,version:'feedback-55'};
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)});
      const result=await response.json();if(!response.ok||result.ok!==true)throw new Error(result.error||'Feedback could not be sent. Please try again.');
      const card=document.createElement('article');card.className='feedback-comment';const context=document.createElement('p');context.className='feedback-comment-context';context.textContent=payload.section+' · '+payload.category;const text=document.createElement('p');text.textContent=payload.message;const saved=document.createElement('small');saved.textContent='Sent privately ✓';card.append(context,text,saved);comments.prepend(card);floating.hidden=true;form.hidden=true;section.textContent='';selected?.classList.remove('feedback-selected');selected=null;document.querySelector('#feedback-prompt').hidden=false;comments.tabIndex=-1;comments.focus({preventScroll:true});
    }catch(error){status.textContent=error.name==='TimeoutError'?'The request timed out. Please check your connection and try again.':error.message==='Failed to fetch'?'Could not connect. Please try again.':error.message;}
    finally{submitting=false;send.textContent='→';token='';send.disabled=true;if(widget!==null&&window.turnstile)window.turnstile.reset(widget);}
  });
})();

/* Original renderer for the reference study. No libraries required.
 * Each point samples one photograph pixel. A damped spring restores its
 * position after cursor impulses; image changes blend colors while stirring.
 */
class StoryPortrait {
  static defaults = {
    gap: 4, size: 3, bleed: 100, stiffness: 170, damping: 9,
    radius: 120, strength: 12, entrySpread: 1200,
    entryStagger: 3000, entryFade: 250, swapDuration: 700,
    scatter: 150, swirl: 1400, chaos: 700, maxParticles: 60000,
    fit: 'cover', imageScale: 1, background: null, cornerRadius: 12,
  };

  constructor(canvas, sources, options = {}) {
    this.canvas = canvas;
    this.frame = canvas.parentElement;
    this.config = {...StoryPortrait.defaults, ...options};
    this.sources = sources;
    this.images = [];
    this.active = 0;
    this.requested = 0;
    this.paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.visible = true;
    this.pointer = {x:-10000, y:-10000, vx:0, vy:0, time:0};
    this.tick = this.tick.bind(this);
    this.gl = canvas.getContext('webgl', {alpha:true, antialias:false, premultipliedAlpha:true, preserveDrawingBuffer:true});
    if (this.gl) this.setupGL();
    else this.context = canvas.getContext('2d');
    this.ready = this.load();
    this.observer = new ResizeObserver(() => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        if (this.images[0] && (this.width !== this.frame.clientWidth || this.height !== this.frame.clientHeight)) this.resize(false);
      }, 100);
    });
    this.observer.observe(this.frame);
    window.addEventListener('pointermove', event => this.move(event), {passive:true});
    window.addEventListener('pointerdown', event => {
      const r=this.frame.getBoundingClientRect();
      if(event.clientX>=r.left && event.clientX<=r.right && event.clientY>=r.top && event.clientY<=r.bottom) this.impulse(event.clientX-r.left,event.clientY-r.top);
    }, {passive:true});
    window.addEventListener('blur', () => this.clearPointer());
    document.addEventListener('visibilitychange', () => {
      this.lastTime=0;
      if(!document.hidden) this.wake();
    });
    this.motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    this.motionQuery.addEventListener('change', e => this.setPaused(e.matches));
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); cancelAnimationFrame(this.raf);this.raf=0;
      this.frame.classList.remove('ready');
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this.setupGL();this.resize(false);
    });
  }

  async load() {
    this.images = await Promise.all(this.sources.map(src => new Promise(resolve => {
      const img = new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;
    })));
    if(!this.images[0]) return false;
    this.images=this.images.map(image=>image || this.images[0]);
    this.resize(true);
    if(this.requested) this.setImage(this.requested);
    return true;
  }

  setupGL() {
    const gl=this.gl;
    const compile=(type,source)=>{
      const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    const vertex=compile(gl.VERTEX_SHADER,`
      attribute vec3 aPosition;
      attribute vec4 aFrom;
      attribute vec4 aTo;
      uniform vec2 uResolution;
      uniform float uSize;
      uniform float uMix;
      varying vec4 vColor;
      varying float vAlpha;
      void main(){
        vec2 p = aPosition.xy/uResolution*2.0-1.0;
        gl_Position=vec4(p.x,-p.y,0.0,1.0);
        gl_PointSize=uSize;
        vColor=mix(aFrom,aTo,uMix);
        vAlpha=aPosition.z;
      }
    `);
    const fragment=compile(gl.FRAGMENT_SHADER,`
      precision mediump float;
      varying vec4 vColor;
      varying float vAlpha;
      void main(){
        float distance=length(gl_PointCoord-vec2(0.5));
        float alpha=1.0-smoothstep(0.42,0.5,distance);
        gl_FragColor=vec4(vColor.rgb,alpha*vAlpha*vColor.a);
      }
    `);
    this.program=gl.createProgram();gl.attachShader(this.program,vertex);gl.attachShader(this.program,fragment);gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.program));
    gl.useProgram(this.program);gl.deleteShader(vertex);gl.deleteShader(fragment);
    this.buffers={};
    for(const name of ['aPosition','aFrom','aTo']){
      this.buffers[name]=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,this.buffers[name]);
      const location=gl.getAttribLocation(this.program,name);
      gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,name==='aPosition'?3:4,gl.FLOAT,false,0,0);
    }
    this.uniforms={};
    for(const name of ['uResolution','uSize','uMix'])this.uniforms[name]=gl.getUniformLocation(this.program,name);
    gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0,0,0,0);
  }

  upload(name,data) {
    if(!this.gl)return;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.buffers[name]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER,data,this.gl.DYNAMIC_DRAW);
  }

  sample(image,index) {
    const options={...this.config,...this.config.imageOptions?.[index]};
    const sample=document.createElement('canvas');sample.width=this.width;sample.height=this.height;
    const ctx=sample.getContext('2d',{willReadFrequently:true});
    if(options.background){ctx.fillStyle=options.background;ctx.fillRect(0,0,this.width,this.height);}
    const fit=options.fit==='contain'?Math.min:Math.max;
    const scale=fit(this.width/image.naturalWidth,this.height/image.naturalHeight)*options.imageScale;
    const w=image.naturalWidth*scale,h=image.naturalHeight*scale;
    ctx.drawImage(image,(this.width-w)/2,(this.height-h)/2,w,h);
    const pixels=ctx.getImageData(0,0,this.width,this.height).data;
    const colors=new Float32Array(this.count*4);
    for(let i=0;i<this.count;i++){
      const x=Math.min(this.width-1,Math.floor(this.homeX[i]-this.config.bleed));
      const y=Math.min(this.height-1,Math.floor(this.homeY[i]-this.config.bleed));
      const p=(y*this.width+x)*4;
      colors[i*4]=pixels[p]/255;colors[i*4+1]=pixels[p+1]/255;colors[i*4+2]=pixels[p+2]/255;colors[i*4+3]=pixels[p+3]/255;
    }
    return colors;
  }

  resize(entrance=false) {
    const width=this.frame.clientWidth,height=this.frame.clientHeight;
    if(!width||!height)return;
    const c=this.config,b=c.bleed;
    this.width=width;this.height=height;
    this.stageWidth=width+b*2;this.stageHeight=height+b*2;
    this.dpr=Math.min(devicePixelRatio||1,2);
    this.canvas.width=Math.round(this.stageWidth*this.dpr);this.canvas.height=Math.round(this.stageHeight*this.dpr);
    Object.assign(this.canvas.style,{width:this.stageWidth+'px',height:this.stageHeight+'px',left:-b+'px',top:-b+'px'});
    let gap=c.gap;
    while(width*height/(gap*gap)>c.maxParticles)gap++;
    // Keep coverage consistent when the particle budget increases spacing.
    this.pointSize=Math.max(c.size,gap*(c.coverage||0));
    const homes=[];
    for(let y=gap/2;y<height;y+=gap)for(let x=gap/2;x<width;x+=gap){
      // Clip just the corners of the settled image, while allowing motion to bleed out.
      const radius=c.cornerRadius;
      const dx=Math.max(radius-x,0,x-(width-radius)),dy=Math.max(radius-y,0,y-(height-radius));
      if(dx*dx+dy*dy>radius*radius)continue;
      homes.push(x+b,y+b);
    }
    this.count=homes.length/2;
    for(const name of ['homeX','homeY','x','y','vx','vy','delay','spin'])this[name]=new Float32Array(this.count);
    this.positions=new Float32Array(this.count*3);
    for(let i=0;i<this.count;i++){
      this.homeX[i]=homes[i*2];this.homeY[i]=homes[i*2+1];
      this.spin[i]=(Math.random()<.5?-1:1)*(.4+Math.random()*.6);
    }
    this.colorSets=this.images.map((image,index)=>this.sample(image,index));
    this.from=this.colorSets[this.active].slice();this.to=this.colorSets[this.active];
    this.mix=1;this.swapping=false;
    this.upload('aFrom',this.from);this.upload('aTo',this.to);
    if(this.gl){this.gl.viewport(0,0,this.canvas.width,this.canvas.height);this.gl.uniform2f(this.uniforms.uResolution,this.stageWidth,this.stageHeight);this.gl.uniform1f(this.uniforms.uSize,this.pointSize*this.dpr);}
    this.frame.classList.add('ready');
    this.canvas.dataset.particles=this.count;
    this.reset(entrance&&!this.paused);
  }

  reset(entrance=true) {
    if(!this.count)return;
    const c=this.config;this.entryStart=performance.now();this.entering=entrance;this.clearPointer();
    for(let i=0;i<this.count;i++){
      this.x[i]=this.homeX[i]+(entrance?(Math.random()-.5)*c.entrySpread*.15:0);
      this.y[i]=this.homeY[i]-(entrance?c.entrySpread*(.5+Math.random()*.5):0);
      this.vx[i]=this.vy[i]=0;
      this.delay[i]=entrance?((this.homeY[i]-c.bleed)/this.height*.85+Math.random()*.15)*c.entryStagger:0;
    }
    this.lastTime=0;this.wake();
  }

  setImage(index) {
    this.requested=index;
    if(!this.colorSets || this.active===index)return;
    this.from=Float32Array.from(this.from,(value,i)=>value+(this.to[i]-value)*this.mix);
    this.to=this.colorSets[index]||this.colorSets[0];this.active=index;
    this.upload('aFrom',this.from);this.upload('aTo',this.to);
    this.swapStart=performance.now();this.mix=this.paused?1:0;this.swapping=!this.paused;
    for(let i=0;i<this.count;i++){
      const angle=Math.random()*Math.PI*2,speed=this.config.scatter*(.5+Math.random()*.5);
      if(!this.paused){this.vx[i]+=Math.cos(angle)*speed;this.vy[i]+=Math.sin(angle)*speed;}
    }
    this.canvas.dataset.image=String(index);this.wake();
  }

  move(event) {
    if(this.paused||!this.visible)return;
    const r=this.frame.getBoundingClientRect(),now=performance.now(),p=this.pointer;
    const x=event.clientX-r.left+this.config.bleed,y=event.clientY-r.top+this.config.bleed;
    const dt=(now-p.time)/1000;
    if(dt>0&&dt<.2){p.vx=p.vx*.5+Math.max(-3500,Math.min(3500,(x-p.x)/dt))*.5;p.vy=p.vy*.5+Math.max(-3500,Math.min(3500,(y-p.y)/dt))*.5;}
    p.x=x;p.y=y;p.time=now;
    if(x>0&&x<this.stageWidth&&y>0&&y<this.stageHeight)this.wake();
  }

  clearPointer(){this.pointer.vx=0;this.pointer.vy=0;this.pointer.time=0;}

  impulse(x,y) {
    if(this.paused||!this.count)return;
    x+=this.config.bleed;y+=this.config.bleed;
    for(let i=0;i<this.count;i++){
      const dx=this.x[i]-x,dy=this.y[i]-y,d=Math.hypot(dx,dy);
      if(d<this.config.radius){const f=(1-d/this.config.radius)*850;this.vx[i]+=dx/(d||1)*f;this.vy[i]+=dy/(d||1)*f;}
    }
    this.wake();
  }

  setPaused(paused) {
    this.paused=paused;
    if(paused){this.mix=1;this.swapping=false;this.reset(false);}
    else this.wake();
  }

  setVisible(visible){this.visible=visible;if(visible){this.lastTime=0;this.wake();}else{cancelAnimationFrame(this.raf);this.raf=0;}}
  wake(){if(!this.raf&&this.visible&&!document.hidden&&this.count)this.raf=requestAnimationFrame(this.tick);}

  tick(now) {
    this.raf=0;
    const dt=Math.min(this.lastTime?(now-this.lastTime)/1000:1/60,1/30);this.lastTime=now;
    const c=this.config,p=this.pointer,elapsed=now-this.entryStart;
    const progress=this.swapping?Math.min(1,(now-this.swapStart)/c.swapDuration):1;
    this.mix=1-Math.pow(1-progress,3);
    if(progress===1)this.swapping=false;
    const swapPower=this.swapping?(1-progress)**2:0;
    const decay=Math.exp(-5*dt);p.vx*=decay;p.vy*=decay;
    const stirring=!this.paused&&(Math.abs(p.vx)+Math.abs(p.vy)>1);
    let maxEnergy=0,pending=false;
    for(let i=0;i<this.count;i++){
      const age=elapsed-this.delay[i];
      if(this.entering&&age<0){this.positions[i*3+2]=0;pending=true;continue;}
      if(!this.paused){
        this.vx[i]+=(c.stiffness*(this.homeX[i]-this.x[i])-c.damping*this.vx[i])*dt;
        this.vy[i]+=(c.stiffness*(this.homeY[i]-this.y[i])-c.damping*this.vy[i])*dt;
        if(this.swapping){
          const dx=this.x[i]-this.stageWidth/2,dy=this.y[i]-this.stageHeight/2,r=Math.hypot(dx,dy)||1;
          const spin=c.swirl*swapPower*this.spin[i]*dt,noise=c.chaos*swapPower*dt;
          this.vx[i]+=-dy/r*spin+Math.sin(this.homeY[i]*.035+now*.004)*noise;
          this.vy[i]+=dx/r*spin+Math.cos(this.homeX[i]*.035+now*.004)*noise;
        }
        if(stirring){
          const dx=this.x[i]-p.x,dy=this.y[i]-p.y,squared=dx*dx+dy*dy;
          if(squared<c.radius*c.radius){
            const r=Math.sqrt(squared)||1,force=c.strength*(1-r/c.radius)*dt;
            const push=(Math.abs(p.vx)+Math.abs(p.vy))*force*.35;
            this.vx[i]+=p.vx*force+dx/r*push;this.vy[i]+=p.vy*force+dy/r*push;
          }
        }
        this.x[i]+=this.vx[i]*dt;this.y[i]+=this.vy[i]*dt;
      }
      const energy=Math.abs(this.vx[i])+Math.abs(this.vy[i])+Math.abs(this.homeX[i]-this.x[i])+Math.abs(this.homeY[i]-this.y[i]);
      maxEnergy=Math.max(maxEnergy,energy);
      this.positions[i*3]=this.x[i];this.positions[i*3+1]=this.y[i];
      this.positions[i*3+2]=this.entering?Math.min(1,Math.max(0,age/c.entryFade)):1;
      if(this.positions[i*3+2]<1)pending=true;
    }
    if(!pending)this.entering=false;
    this.draw();
    const moving=!this.paused&&(pending||maxEnergy>.3||stirring||this.swapping);
    this.canvas.dataset.state=this.paused?'paused':moving?'animating':'settled';
    if(moving)this.wake();else this.lastTime=0;
  }

  draw() {
    if(this.gl){
      const gl=this.gl;gl.clear(gl.COLOR_BUFFER_BIT);this.upload('aPosition',this.positions);
      gl.uniform1f(this.uniforms.uMix,this.mix);gl.drawArrays(gl.POINTS,0,this.count);
    }else if(this.context){
      const ctx=this.context;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,this.stageWidth,this.stageHeight);
      for(let i=0;i<this.count;i++){
        const k=i*4;ctx.globalAlpha=this.positions[i*3+2]*(this.from[k+3]+(this.to[k+3]-this.from[k+3])*this.mix);
        const r=(this.from[k]+(this.to[k]-this.from[k])*this.mix)*255;
        const g=(this.from[k+1]+(this.to[k+1]-this.from[k+1])*this.mix)*255;
        const b=(this.from[k+2]+(this.to[k+2]-this.from[k+2])*this.mix)*255;
        ctx.fillStyle=`rgb(${r|0},${g|0},${b|0})`;ctx.beginPath();ctx.arc(this.x[i],this.y[i],this.pointSize/2,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;
    }
  }
}

// Story is a modal layer; its image renderer is created only on first opening.
(()=>{
const overlay=document.querySelector('#story-overlay'),canvas=document.querySelector('#story-particles'),fallback=document.querySelector('#story-image-fallback');
const names=["Ehi Oko portrait","Notion","ColorStack AAMU","Sullivan Foundation","JPMorganChase","Thrive","Cornell Tech","IBM SkillsBuild","HBCU Game Jam","HBCU Business Pitch Competition"];
const sources=["story-portrait.jpg","story-notion.jpg","story-colorstack.jpg","story-sullivan-fixed.jpg","story-jpm.jpg","mental-health.png","story-cornell.jpg","story-ibm.jpg","story-game-jam.jpg","story-business-pitch.jpg"].map(file=>'./assets/'+file);
let portrait,clockTimer,opener;
const rows=[...overlay.querySelectorAll('.story-experience')];
function clock(){document.querySelector('#story-clock').textContent=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',hour:'numeric',minute:'2-digit',second:'2-digit'}).format(new Date());}
function select(index){fallback.src=sources[index];fallback.alt=names[index];canvas.setAttribute('aria-label','Interactive particle rendering: '+names[index]);canvas.dataset.image=index;portrait?.setImage(index);rows.forEach(row=>row.setAttribute('aria-pressed',String(Number(row.dataset.storyImage)===index)));}
function openStory(){if(overlay.open)return;opener=document.activeElement;document.querySelector('#command-palette').close();overlay.showModal();overlay.scrollTop=0;clock();clockTimer=setInterval(clock,1000);if(!portrait){portrait=new StoryPortrait(canvas,sources,{gap:3.1,size:2.65,bleed:0,coverage:0,fit:'cover',maxParticles:65000,entrySpread:500,entryStagger:850,entryFade:180,scatter:90,swirl:600,chaos:230,cornerRadius:0,background:'#1c1c1c'});}else{portrait.setVisible(true);select(0);portrait.reset(true);}document.querySelector('#story-close').focus({preventScroll:true});}
function closeStory(){document.querySelector('#feedback-dialog').close();overlay.close();}
document.querySelectorAll('a[href="#story"]').forEach(link=>link.addEventListener('click',event=>{if(document.body.classList.contains('feedback-selecting'))return;event.preventDefault();openStory();}));
document.addEventListener('open-story',openStory);
document.querySelector('#story-home').addEventListener('click',closeStory);document.querySelector('#story-close').addEventListener('click',closeStory);
overlay.addEventListener('close',()=>{document.querySelector('#feedback-dialog').close();clearInterval(clockTimer);portrait?.setVisible(false);rows.forEach(row=>row.setAttribute('aria-pressed','false'));opener?.focus({preventScroll:true});});
rows.forEach(row=>{const index=Number(row.dataset.storyImage);row.addEventListener('pointerenter',()=>select(index));row.addEventListener('pointerleave',()=>select(0));row.addEventListener('focus',()=>select(index));row.addEventListener('blur',()=>select(0));row.addEventListener('click',()=>select(index));});
})();
