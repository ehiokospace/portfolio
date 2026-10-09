document.querySelector('[aria-label="Back to top"]').addEventListener('click',event=>{event.preventDefault();returnToVideo();});
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

// Use Huntsville's local time, including daylight saving changes.
const homeClock = document.querySelector('#home-clock');
const homeTimeFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit', second: '2-digit'
});
function updateHomeClock() {
  const now = new Date();
  homeClock.textContent = homeTimeFormat.format(now);
  homeClock.dateTime = now.toISOString();
}
updateHomeClock();
setInterval(updateHomeClock, 1000);

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
    {name:'About',aliases:'story my story bio biography',key:'s',modifier:true,shortcut:'[⌘S]',group:'Pages',detail:'/ABOUT',run:()=>document.dispatchEvent(new Event('open-story'))},
    {name:'Craft',shortcut:'',group:'Pages',detail:'SOON',run:()=>document.querySelector('[data-missing="Craft"]').click()},
    {name:'Gallery',key:'g',modifier:true,shortcut:'[⌘G]',group:'Pages',detail:'SOON',run:()=>document.querySelector('[data-missing="Gallery"]').click()},
    {name:'Download résumé',aliases:'resume cv curriculum vitae download',key:'r',modifier:true,shortcut:'[⌘R]',group:'Commands',detail:'↗',run:()=>document.querySelector('#resume-link').click()},
    {name:'Copy email',keepOpen:true,aliases:'contact mail ehigoko1@gmail.com',key:'e',modifier:true,shortcut:'[⌘E]',group:'Commands',detail:'COMMAND',run:()=>document.querySelector('#copy-email').click()},
    {name:'Leave a note',aliases:'comment suggestion critique review',shortcut:'⌘N',group:'Commands',detail:'COMMAND',run:()=>document.querySelector('#leave-feedback').click()},
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

// Private notes stay attached to human-readable sections; drafts stay in this tab only.
(() => {
  const endpoint='https://portfolio-feedback.ehigoko1.workers.dev/';
  const sitekey='0x4AAAAAAFPjn8y4ZI1OyhDS';
  const modal=document.querySelector('#feedback-dialog'), form=document.querySelector('#feedback-form');
  const section=document.querySelector('#feedback-section'), context=document.querySelector('#feedback-context');
  const status=document.querySelector('#feedback-status'), send=document.querySelector('#feedback-send');
  const message=document.querySelector('#feedback-message'), category=document.querySelector('#feedback-category');
  const prompt=document.querySelector('#feedback-prompt'), success=document.querySelector('#feedback-success');
  const step=document.querySelector('#feedback-step'), close=document.querySelector('#feedback-close');
  const entries=[...document.querySelectorAll('#leave-feedback,#story-feedback,#feedback-mobile')];
  const highlight=document.createElement('div');highlight.id='note-highlight';highlight.hidden=true;highlight.setAttribute('aria-hidden','true');
  for(const corner of ['top-right','bottom-left']){const handle=document.createElement('span');handle.className='note-corner note-corner-'+corner;highlight.append(handle);}
  const hint=document.createElement('span');hint.id='note-highlight-label';highlight.append(hint);document.body.append(highlight);
  const drafts=new Map();
  let mode=false, selected=null, hovered=null, token='', widget=null, loading=null, previousFocus=null, submitting=false, revision=0, frame=0;
  const targets=[['.hero h1','Introduction'],['.hero .current','Previous experience'],['.bio p','Biography'],['nav h2','Navigation heading'],['nav a,nav button','Navigation link'],['.utility p','Huntsville local time'],['.story-bio p:nth-child(1)','About biography'],['.story-bio p:nth-child(2)','Outside of design'],['.story-bio p:nth-child(3)','Internship opportunities'],['.story-experience','Experience'],['.story-particle-stage','About portrait']];
  targets.forEach(([selector,label])=>document.querySelectorAll(selector).forEach(el=>el.dataset.feedbackSection=label==='Experience'?el.querySelector('.story-company')?.textContent.trim()||label:label));
  document.querySelectorAll('.project').forEach(card=>{const title=card.querySelector('h2').textContent;card.querySelectorAll('.media,.project-caption-heading,.project-description').forEach(el=>el.dataset.feedbackSection=title);});
  function activeHost(){const story=document.querySelector('#story-overlay'),caseStudy=document.querySelector('#case-study');return story.open?story:caseStudy.open?caseStudy:document.body;}
  function mount(){const host=activeHost();host.append(modal,highlight);modal.classList.toggle('note-dark',host.id==='story-overlay');}
  function saveDraft(){if(section.dataset.key&&!form.hidden)drafts.set(section.dataset.key,{message:message.value,category:category.value});}
  function setState(state){modal.dataset.state=state;step.textContent=state==='choose'?'01 / SELECT':state==='write'?'02 / WRITE':'03 / SENT';prompt.hidden=state!=='choose';form.hidden=state!=='write';context.hidden=state!=='write';success.hidden=state!=='sent';queuePosition();}
  function markTargets(enabled){document.querySelectorAll('[data-feedback-section]').forEach(el=>{if(enabled){el.dataset.feedbackTabindex=el.getAttribute('tabindex')??'none';el.tabIndex=0;}else{const old=el.dataset.feedbackTabindex;if(old==='none')el.removeAttribute('tabindex');else if(old!==undefined)el.setAttribute('tabindex',old);delete el.dataset.feedbackTabindex;}});}
  function begin(){if(mode)return;mode=true;document.body.classList.add('feedback-selecting');markTargets(true);entries.forEach(el=>el.setAttribute('aria-pressed','true'));}
  function releaseWidget(){revision++;token='';if(widget!==null&&window.turnstile)window.turnstile.remove(widget);widget=null;}
  function choose(){if(submitting)return;saveDraft();releaseWidget();selected=null;hovered=null;highlight.hidden=true;status.textContent='';begin();setState('choose');if(!modal.open)modal.show();modal.focus({preventScroll:true});}
  function start(){if(submitting)return;if(modal.open){modal.close();return;}previousFocus=document.activeElement;mount();choose();if(activeHost().id==='case-study')compose('Case study: '+document.querySelector('#case-title').textContent,document.querySelector('.case-intro'));}
  function feedbackBounds(element){
    const box=element.getBoundingClientRect(),range=document.createRange(),rects=[box];
    const textNodes=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
    for(let node=textNodes.nextNode();node;node=textNodes.nextNode()){
      if(!node.textContent.trim())continue;
      range.selectNodeContents(node);
      rects.push(...Array.from(range.getClientRects()).filter(r=>r.width&&r.height));
    }
    const left=Math.min(...rects.map(r=>r.left)),top=Math.min(...rects.map(r=>r.top)),right=Math.max(...rects.map(r=>r.right)),bottom=Math.max(...rects.map(r=>r.bottom));
    return {left,top,right,bottom,width:right-left,height:bottom-top};
  }
  function showHighlight(element){if(!mode||!element){highlight.hidden=true;return;}const r=feedbackBounds(element);highlight.hidden=r.bottom<0||r.top>innerHeight;highlight.style.left=(r.left-5)+'px';highlight.style.top=(r.top-5)+'px';highlight.style.width=(r.width+10)+'px';highlight.style.height=(r.height+10)+'px';const style=getComputedStyle(element),compact=r.height<=80;for(const corner of ['TopLeft','TopRight','BottomRight','BottomLeft']){const radius=parseFloat(style['border'+corner+'Radius'])||0;highlight.style['border'+corner+'Radius']=(compact?7:radius>0?radius+5:10)+'px';}highlight.classList.toggle('is-selected',element===selected);hint.textContent=element===selected?'Selected':element.dataset.feedbackSection;hint.hidden=element===selected;}
  function position(){frame=0;if(!modal.open)return;showHighlight(selected||hovered);modal.style.removeProperty('left');modal.style.removeProperty('top');if(innerWidth<=700||!selected||modal.dataset.state!=='write')return;const r=feedbackBounds(selected),w=modal.offsetWidth,h=modal.offsetHeight;let x=r.right+16,y=r.top;if(x+w>innerWidth-16){x=r.left-w-16;if(x<16){x=Math.min(Math.max(r.left,16),innerWidth-w-16);y=r.bottom+16;if(y+h>innerHeight-16)y=r.top-h-16;}}modal.style.left=Math.max(16,Math.min(x,innerWidth-w-16))+'px';modal.style.top=Math.max(16,Math.min(y,innerHeight-h-16))+'px';}
  function queuePosition(){if(!frame)frame=requestAnimationFrame(position);}
  new ResizeObserver(queuePosition).observe(modal);window.addEventListener('resize',queuePosition);document.addEventListener('scroll',queuePosition,true);window.visualViewport?.addEventListener('resize',queuePosition);
  function loadTurnstile(){if(window.turnstile)return Promise.resolve();if(loading)return loading;loading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=()=>window.turnstile?resolve():reject(new Error('unavailable'));script.onerror=()=>{loading=null;script.remove();reject(new Error('unavailable'));};document.head.append(script);});return loading;}
  function updateCount(){document.querySelector('#feedback-count').textContent=message.value.length.toLocaleString('en-US')+' / 2,000';saveDraft();}
  async function verify(){const current=revision;try{await loadTurnstile();if(current!==revision||!modal.open||form.hidden)return;widget=window.turnstile.render('#feedback-verification',{sitekey,action:'feedback',theme:modal.classList.contains('note-dark')?'dark':'light',appearance:'interaction-only',callback:value=>{if(current===revision){token=value;if(status.dataset.kind==='verification'){status.textContent='';delete status.dataset.kind;}}},'expired-callback':()=>{if(current===revision)token='';},'error-callback':()=>{if(current===revision){token='';status.dataset.kind='verification';status.textContent='The spam check couldn’t load. Use Retry to try again.';retry.hidden=false;}}});}catch{if(current===revision){status.dataset.kind='verification';status.textContent='The spam check couldn’t load. Use Retry to try again.';retry.hidden=false;}}}
  const retry=document.createElement('button');retry.type='button';retry.id='feedback-retry';retry.textContent='Retry';retry.hidden=true;status.after(retry);retry.addEventListener('click',()=>{releaseWidget();loading=null;retry.hidden=true;status.textContent='';verify();});
  function compose(label,element){if(submitting)return;saveDraft();releaseWidget();mount();begin();selected=element;hovered=null;section.dataset.label=label;section.dataset.key=element?label+':'+[...document.querySelectorAll('[data-feedback-section]')].indexOf(element):label;section.textContent=label;const draft=drafts.get(section.dataset.key);form.reset();message.value=draft?.message||'';category.value=draft?.category||'General';message.removeAttribute('aria-invalid');status.textContent='';delete status.dataset.kind;retry.hidden=true;send.disabled=false;setState('write');if(!modal.open)modal.show();updateCount();message.focus({preventScroll:true});verify();}
  document.querySelectorAll('#story-overlay,#case-study').forEach(parent=>parent.addEventListener('close',()=>{if(modal.open&&parent.contains(modal))modal.close();}));
  entries.forEach(el=>{el.title='Leave a note (⌘N)';el.setAttribute('aria-keyshortcuts','Meta+N');});
  document.addEventListener('keydown',event=>{if(!event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||event.isComposing||event.repeat||event.key.toLowerCase()!=='n')return;event.preventDefault();if(modal.open){if(!form.hidden)message.focus({preventScroll:true});return;}const palette=document.querySelector('#command-palette');if(palette?.open)palette.close();start();});
  entries.forEach(el=>el.addEventListener('click',start));close.addEventListener('click',()=>{if(!submitting)modal.close();});document.querySelector('#feedback-reselect').addEventListener('click',choose);document.querySelector('#feedback-another').addEventListener('click',choose);
  modal.addEventListener('cancel',event=>{if(submitting)event.preventDefault();});modal.addEventListener('close',()=>{saveDraft();releaseWidget();mode=false;selected=null;hovered=null;highlight.hidden=true;document.body.classList.remove('feedback-selecting');markTargets(false);entries.forEach(el=>el.setAttribute('aria-pressed','false'));document.body.append(modal,highlight);previousFocus?.focus({preventScroll:true});});
  function targetFor(event){return event.target.closest('[data-feedback-section]');}
  document.addEventListener('pointerover',event=>{if(!mode||selected)return;hovered=event.target.closest('#feedback-dialog')?null:targetFor(event);queuePosition();});
  document.addEventListener('pointerout',event=>{if(!mode||selected)return;if(!event.relatedTarget?.closest?.('[data-feedback-section]')){hovered=null;queuePosition();}});
  document.addEventListener('focusin',event=>{if(mode&&!selected&&!event.target.closest('#feedback-dialog')){hovered=targetFor(event);queuePosition();}});
  document.addEventListener('click',event=>{if(!mode||event.target.closest('#feedback-dialog'))return;const element=targetFor(event);if(!element)return;event.preventDefault();event.stopImmediatePropagation();compose(element.dataset.feedbackSection,element);},true);
  document.addEventListener('keydown',event=>{if(!modal.open)return;if(event.key==='Escape'){event.preventDefault();if(!submitting)modal.close();return;}if(!mode||event.target.closest('#feedback-dialog'))return;const element=targetFor(event);if(element&&(event.key==='Enter'||event.key===' ')){event.preventDefault();event.stopImmediatePropagation();compose(element.dataset.feedbackSection,element);}},true);
  new MutationObserver(()=>{const content=document.querySelector('#case-content');if(!content.children.length||content.querySelector('.case-feedback'))return;const button=document.createElement('button');button.className='case-feedback';button.textContent='Leave a note';button.addEventListener('click',()=>{previousFocus=document.activeElement;compose('Case study: '+document.querySelector('#case-title').textContent,content.querySelector('.case-intro'));});content.querySelector('.soon-wrap')?.append(button);}).observe(document.querySelector('#case-content'),{childList:true});
  message.addEventListener('input',()=>{updateCount();message.removeAttribute('aria-invalid');if(status.dataset.kind==='validation'){status.textContent='';delete status.dataset.kind;}});category.addEventListener('change',saveDraft);
  message.addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.metaKey||event.ctrlKey)){event.preventDefault();form.requestSubmit();}});
  form.addEventListener('submit',async event=>{event.preventDefault();if(submitting)return;const text=message.value.trim();if(text.length<10||text.length>2000){status.dataset.kind='validation';status.textContent=text.length<10?'Please write at least 10 characters so I can understand your suggestion.':'Please keep your note under 2,000 characters.';message.setAttribute('aria-invalid','true');message.focus({preventScroll:true});return;}if(!token){status.dataset.kind='verification';status.textContent='Finishing the spam check. Please try posting again in a moment.';return;}
    submitting=true;send.disabled=true;close.disabled=true;document.querySelector('#feedback-reselect').disabled=true;message.readOnly=true;category.disabled=true;send.textContent='Posting…';status.textContent='';modal.setAttribute('aria-busy','true');
    const version=new URL(document.querySelector('script[src*="app.js"]').src).searchParams.get('v');
    const payload={message:text,page:location.href,section:section.dataset.label,category:category.value,website:form.elements.website.value,token,version};
    try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)});const result=await response.json();if(!response.ok||result.ok!==true)throw new Error(result.error||'Your note couldn’t be sent. Please try again.');drafts.delete(section.dataset.key);message.value='';selected=null;highlight.hidden=true;releaseWidget();setState('sent');document.querySelector('#feedback-another').focus({preventScroll:true});}
    catch(error){status.textContent=error.name==='TimeoutError'?'The connection timed out. Your draft is still here—please try again.':error.message==='Failed to fetch'?'Couldn’t connect. Your draft is still here—please try again.':error.message;releaseWidget();verify();}
    finally{submitting=false;send.disabled=false;close.disabled=false;document.querySelector('#feedback-reselect').disabled=false;message.readOnly=false;category.disabled=false;send.innerHTML='Post note <span aria-hidden="true">↗</span>';modal.removeAttribute('aria-busy');}
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
      // Row-weighted delays create the travelling cloud and spring rebound.
      const row=(this.homeY[i]-c.bleed-c.gap/2)/Math.max(c.gap,this.height-c.gap);
      this.delay[i]=entrance?row*c.entryStagger*.85+Math.random()*c.entryStagger*.15:0;
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
const names=["Ehi Oko portrait","Notion","ColorStack AAMU","Sullivan Foundation","JPMorganChase","Thrive","Cornell Tech","IBM SkillsBuild","HBCU Game Jam","HBCU Pitch Competition"];
const sources=["story-portrait.jpg","story-notion.jpg","story-colorstack.jpg","story-sullivan-fixed.jpg","story-jpm.jpg","mental-health.png","story-cornell.jpg","story-ibm.jpg","story-game-jam.jpg","story-business-pitch.jpg"].map(file=>'./assets/'+file);
let portrait,clockTimer,opener;
const storyPhone=matchMedia("(max-width:760px)");
const rows=[...overlay.querySelectorAll('.story-experience')];
function clock(){document.querySelector('#story-clock').textContent=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',hour:'numeric',minute:'2-digit',second:'2-digit'}).format(new Date());}
function select(index){if(storyPhone.matches)index=0;fallback.src=sources[index];fallback.alt=names[index];canvas.setAttribute('aria-label','Interactive particle rendering: '+names[index]);canvas.dataset.image=index;portrait?.setImage(index);rows.forEach(row=>row.setAttribute('aria-pressed',String(Number(row.dataset.storyImage)===index)));}
function openStory(){if(overlay.open)return;opener=document.activeElement;document.querySelector('#command-palette').close();overlay.showModal();overlay.scrollTop=0;clock();clockTimer=setInterval(clock,1000);if(storyPhone.matches){select(0);portrait?.setVisible(false);}else if(!portrait){portrait=new StoryPortrait(canvas,sources,{gap:4.3,size:3.2,bleed:0,coverage:0,fit:'cover',maxParticles:65000,entrySpread:1200,entryStagger:3000,entryFade:250,scatter:90,swirl:600,chaos:230,cornerRadius:12,background:'#1c1c1c'});}else{portrait.setVisible(true);select(0);portrait.reset(true);}document.querySelector('#story-close').focus({preventScroll:true});}
function closeStory(){document.querySelector('#feedback-dialog').close();overlay.close();}
document.querySelectorAll('a[href="#story"]').forEach(link=>link.addEventListener('click',event=>{if(document.body.classList.contains('feedback-selecting'))return;event.preventDefault();openStory();}));
document.addEventListener('open-story',openStory);
storyPhone.addEventListener('change',()=>{if(!overlay.open)return;if(storyPhone.matches){portrait?.setVisible(false);select(0);}else{overlay.close();openStory();}});
document.querySelector('#story-home').addEventListener('click',()=>{closeStory();returnToVideo();});document.querySelector('#story-close').addEventListener('click',closeStory);
overlay.addEventListener('close',()=>{document.querySelector('#feedback-dialog').close();clearInterval(clockTimer);portrait?.setVisible(false);rows.forEach(row=>row.setAttribute('aria-pressed','false'));opener?.focus({preventScroll:true});});
rows.forEach(row=>{const index=Number(row.dataset.storyImage);row.addEventListener('pointerenter',()=>select(index));row.addEventListener('pointerleave',()=>select(0));row.addEventListener('focus',()=>select(index));row.addEventListener('blur',()=>select(0));row.addEventListener('click',()=>select(index));});
})();

// Responsive Writing covers with a 20px radius and 50% corner smoothing.
// Geometry follows Figma's arc-and-Bezier construction:
// https://www.figma.com/blog/desperately-seeking-squircles/
(function smoothWritingCorners(){
  function coverPath(width,height){
    const radius=Math.min(20,width/3,height/3),smoothing=.5;
    const extent=(1+smoothing)*radius;
    const radians=degrees=>degrees*Math.PI/180;
    const arc=90*(1-smoothing),length=Math.sin(radians(arc/2))*radius*Math.SQRT2;
    const tangent=radius*Math.tan(radians((90-arc)/4));
    const c=tangent*Math.cos(radians(45*smoothing)),d=c*Math.tan(radians(45*smoothing));
    const b=(extent-length-c-d)/3,a=2*b;
    return `M ${width-extent} 0
      c ${a} 0 ${a+b} 0 ${a+b+c} ${d}
      a ${radius} ${radius} 0 0 1 ${length} ${length}
      c ${d} ${c} ${d} ${b+c} ${d} ${a+b+c}
      L ${width} ${height-extent}
      c 0 ${a} 0 ${a+b} ${-d} ${a+b+c}
      a ${radius} ${radius} 0 0 1 ${-length} ${length}
      c ${-c} ${d} ${-(b+c)} ${d} ${-(a+b+c)} ${d}
      L ${extent} ${height}
      c ${-a} 0 ${-(a+b)} 0 ${-(a+b+c)} ${-d}
      a ${radius} ${radius} 0 0 1 ${-length} ${-length}
      c ${-d} ${-c} ${-d} ${-(b+c)} ${-d} ${-(a+b+c)}
      L 0 ${extent}
      c 0 ${-a} 0 ${-(a+b)} ${d} ${-(a+b+c)}
      a ${radius} ${radius} 0 0 1 ${length} ${-length}
      c ${c} ${-d} ${b+c} ${-d} ${a+b+c} ${-d} Z`.replace(/\s+/g,' ');
  }
  const observer=new ResizeObserver(entries=>{
    for(const {target} of entries){
      const {width,height}=target.getBoundingClientRect();
      if(!width||!height)continue;
      const clip=`path('${coverPath(width,height)}')`;
      if(CSS.supports('clip-path',clip)){
        target.style.clipPath=clip;
        target.classList.add('has-smooth-corners');
      }
    }
  });
  document.querySelectorAll('.writing-card').forEach(card=>observer.observe(card));
})();

// The butterfly returns to the intro; ordinary scrolling stays unrestricted.
function returnToVideo(){
  history.replaceState(history.state,'',location.pathname+location.search);
  window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  document.querySelector('.hero video')?.play().catch(()=>{});
}

// Project category cursor: independent damped springs give each label a soft trail.
(function projectCategoryCursor(){
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const categories={
    'internal-tooling':['Product design','Summer internship'],
    thrive:['Winning pitch','Startup'],
    colorstack:['Community','Graphic design']
  };
  const cursor=document.createElement('div');
  cursor.id='project-category-cursor';cursor.setAttribute('aria-hidden','true');
  document.body.append(cursor);
  let active=null,labels=[],pointer={x:0,y:0},frame=0,previous=0;
  const blocked=()=>!fine.matches||document.body.classList.contains('feedback-selecting')||document.querySelector('dialog[open]');
  function start(){if(!frame){previous=performance.now();frame=requestAnimationFrame(tick);}}
  function hide(){if(!active)return;active=null;document.body.classList.remove('category-cursor-active');start();}
  function show(card){
    if(card===active)return;
    active=card;document.body.classList.add('category-cursor-active');
    cursor.replaceChildren();
    labels=categories[card.dataset.case].map((text,i)=>{
      const el=document.createElement('span');el.className='cursor-category';el.textContent=text;cursor.append(el);
      return {el,x:pointer.x,y:pointer.y,vx:0,vy:0,scale:0,vs:0,index:i};
    });start();
  }
  function update(){
    if(blocked()){hide();return;}
    const card=document.elementFromPoint(pointer.x,pointer.y)?.closest('.projects .media');
    if(card&&categories[card.dataset.case])show(card);else hide();
  }
  function tick(now){
    frame=0;const dt=Math.min((now-previous)/1000,.032);previous=now;
    let moving=false;
    const width=Math.max(0,...labels.map(l=>l.el.offsetWidth));
    const x=pointer.x+16+width>innerWidth-12?pointer.x-width-16:pointer.x+16;
    const y=Math.max(12,Math.min(pointer.y+16,innerHeight-labels.length*36-12));
    for(const l of labels){
      const tx=Math.max(12,x),ty=y+l.index*36,goal=active?1:0;
      if(reduced.matches){l.x=tx;l.y=ty;l.scale=goal;l.vx=l.vy=l.vs=0;}
      else{
        const stiffness=240/(1+l.index*.22),damping=22;
        l.vx+=((tx-l.x)*stiffness-l.vx*damping)*dt;
        l.vy+=((ty-l.y)*stiffness-l.vy*damping)*dt;
        l.x+=l.vx*dt;l.y+=l.vy*dt;
        l.vs+=((goal-l.scale)*300-l.vs*20)*dt;l.scale+=l.vs*dt;
      }
      l.el.style.transform=`translate3d(${l.x}px,${l.y}px,0) scale(${Math.max(0,l.scale)})`;
      l.el.style.opacity=Math.min(1,Math.max(0,l.scale));
      moving ||= Math.abs(tx-l.x)+Math.abs(ty-l.y)+Math.abs(goal-l.scale)+Math.abs(l.vx)+Math.abs(l.vy)+Math.abs(l.vs)>.05;
    }
    if(moving)start();
  }
  window.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch'){hide();return;}
    pointer={x:event.clientX,y:event.clientY};update();if(active)start();
  },{passive:true});
  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',hide);
  window.addEventListener('blur',hide);
  document.documentElement.addEventListener('pointerleave',hide);
  document.addEventListener('pointerdown',hide,{capture:true});
  new MutationObserver(()=>{if(blocked())hide();}).observe(document.body,{attributes:true,attributeFilter:['class']});
  fine.addEventListener('change',hide);reduced.addEventListener('change',hide);
})();
