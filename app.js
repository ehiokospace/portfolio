// Trial fonts are available only in the local preview.
if (['localhost', '127.0.0.1'].includes(location.hostname)) {
  const fonts = document.createElement('link');
  fonts.rel = 'stylesheet';
  fonts.href = './local-fonts/fonts.css';
  document.head.append(fonts);
}
// Replace null destinations with your own URLs. Relative paths work on GitHub Pages.
const destinations = {
  Gallery: null, Resume: null,
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
    {name:'Download résumé',aliases:'resume cv curriculum vitae download',key:'r',modifier:true,shortcut:'[⌘R]',group:'Commands',detail:'NOT ADDED YET',run:()=>document.querySelector('[data-missing="Resume"]').click()},
    {name:'Copy email',aliases:'contact mail ehigoko1@gmail.com',key:'e',modifier:true,shortcut:'[⌘E]',group:'Commands',detail:'COMMAND',run:()=>document.querySelector('#copy-email').click()},
    {name:'LinkedIn',aliases:'https://www.linkedin.com/in/ehi-oko social',shortcut:'',group:'Links',detail:'↗',run:()=>window.open('https://www.linkedin.com/in/ehi-oko','_blank','noopener')},
    {name:'X/Twitter',aliases:'https://www.x.com/ehigoko social twitter',shortcut:'',group:'Links',detail:'↗',run:()=>window.open('https://www.x.com/ehigoko','_blank','noopener')},
  ];
  let filtered = [], active = 0;
  function highlight() {
    [...results.querySelectorAll('button')].forEach((button,index)=>button.classList.toggle('active',index===active));
  }
  function choose(index) { const item=filtered[index]; if (!item) return; palette.close(); item.run(); }
  const normalizeSearch = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/⌘/g,' cmd command ctrl control ').replace(/[\[\]]/g,' ').trim();
  function render() {
    const terms=normalizeSearch(query.value).split(/\s+/).filter(Boolean);
    filtered=items.filter(item=>{
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
  function open() { if(palette.open)return;query.value='';render();palette.showModal();query.focus(); }
  trigger.addEventListener('click',open);
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
