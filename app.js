// Trial fonts are available only in the local preview.
if (['localhost', '127.0.0.1'].includes(location.hostname)) {
  const fonts = document.createElement('link');
  fonts.rel = 'stylesheet';
  fonts.href = './local-fonts/fonts.css';
  document.head.append(fonts);
}
// Replace null destinations with your own URLs. Relative paths work on GitHub Pages.
const destinations = {
  Gallery: null, Resume: 'https://drive.google.com/file/d/11beu2HB285avA1R1cZX8E9XF8QlEzJ4y/view?usp=sharing',
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
    clearTimeout(emailResetTimer);
    copyEmailButton.querySelector('.email-label').textContent = 'COPIED!';
    copyEmailButton.classList.add('is-copied');
    emailResetTimer = setTimeout(() => {
      copyEmailButton.querySelector('.email-label').textContent = '04. Email';
      copyEmailButton.classList.remove('is-copied');
    }, 2000);
  } catch {
    document.querySelector('#notice-title').textContent = '04. Email';
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
  const items = [
    {name:'Work',key:'w',shortcut:'[W]',group:'Pages',detail:'/WORK',run:()=>location.hash='work'},
    {name:'Story',aliases:'about bio biography',key:'s',shortcut:'[S]',group:'Pages',detail:'/STORY',run:()=>location.hash='story'},
    {name:'Gallery',key:'g',shortcut:'[G]',group:'Pages',detail:'SOON',run:()=>document.querySelector('[data-missing="Gallery"]').click()},
    {name:'Download résumé',aliases:'resume cv curriculum vitae download',key:'r',modifier:true,shortcut:'[⌘R]',group:'Commands',detail:'↗',run:()=>document.querySelector('#resume-link').click()},
    {name:'Copy email',aliases:'contact mail ehigoko1@gmail.com',key:'e',modifier:true,shortcut:'[⌘E]',group:'Commands',detail:'COMMAND',run:()=>document.querySelector('#copy-email').click()},
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
  function choose(index) { const item=filtered[index]; if (!item) return; palette.close(); item.run(); }
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
    if(!palette.open||event.altKey||event.isComposing)return;
    const modifier=event.metaKey||event.ctrlKey;
    const item=items.find(item=>item.key===key&&Boolean(item.modifier)===Boolean(modifier));
    if(item&&(modifier||!query.value)){event.preventDefault();palette.close();item.run();}
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
    content.innerHTML='<section class="project-soon"><div class="soon-wrap"><div class="soon-num" aria-label="404"><span class="soon-cell"><span>4</span></span><span class="soon-cell"><span>0</span></span><span class="soon-cell"><span>4</span></span></div><h2 id="case-title">'+escape(study.title)+' is still in the making.</h2><p>The '+escape(study.title)+' case study is being written up. If you would like to hear about it before it is public, reach out at <a href="mailto:ehigoko1@gmail.com">ehigoko1@gmail.com</a>.</p><button class="soon-back">‹ <span>Back to home</span></button></div></section>';
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
(() => {const credit=document.querySelector("#scramble-description"),sidebar=document.querySelector(".layout aside"),main=document.querySelector("main"),mobile=matchMedia("(max-width:700px)");function placeCredit(){(mobile.matches?main:sidebar).append(credit);}mobile.addEventListener("change",placeCredit);placeCredit();})();
