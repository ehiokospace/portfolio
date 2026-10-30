document.querySelector('.header-brand')?.addEventListener('click',()=>returnToVideo());
document.querySelector('[aria-label="Back to top"]').addEventListener('click',event=>{event.preventDefault();returnToVideo();});
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
  if (!heroVideo) return;
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
    copyEmailButton.querySelector('.email-label').textContent = 'Copied!';
    copyEmailButton.classList.add('is-copied');
    emailResetTimer = setTimeout(() => {
      copyEmailButton.querySelector('.email-label').textContent = 'Email';
      copyEmailButton.classList.remove('is-copied');
    }, 2000);
  } catch {
    document.querySelector('#notice-title').textContent = 'Email';
    document.querySelector('#notice-body').textContent = 'Copy this address: ehigoko1@gmail.com';
    dialog.showModal();
  }
});

const sidebarEmail=document.querySelector('#sidebar-copy-email');
sidebarEmail?.addEventListener('click',()=>copyEmailButton.click());
document.addEventListener('email-copied',()=>{
  if(!sidebarEmail)return;
  const label=sidebarEmail.querySelector('.email-label');label.textContent='Copied!';
  clearTimeout(sidebarEmail.resetTimer);sidebarEmail.resetTimer=setTimeout(()=>{label.textContent='Email';},2000);
});

const descriptionButton=document.querySelector('#scramble-description');
const descriptions=['DESIGNED AND CODED WITH ♥︎'];
let descriptionIndex=0,scrambleFrame,visitStats=null,visitError=false;
const visitsEndpoint='https://portfolio-visits.ehigoko1.workers.dev/';
function previousVisitText(){
 if(!visitStats.lastVisit)return 'You’re the first visit';
 const elapsed=Math.max(0,Date.now()-visitStats.lastVisit),minutes=Math.floor(elapsed/60000);
 if(minutes<1)return 'Last visit just now';
 if(minutes<60)return 'Last visit '+minutes+' minute'+(minutes===1?'':'s')+' ago';
 const hours=Math.floor(minutes/60);if(hours<24)return 'Last visit '+hours+' hour'+(hours===1?'':'s')+' ago';
 const days=Math.floor(hours/24);return 'Last visit '+days+' day'+(days===1?'':'s')+' ago';
}
function footerText(){return descriptionIndex===0?descriptions[0]:!visitStats?(visitError?'Visit stats unavailable':'Loading visit stats…'):descriptionIndex===1?visitStats.visits.toLocaleString('en-US')+' visit'+(visitStats.visits===1?'':'s')+' and counting':previousVisitText();}
function paintFooter(animate=false){
 cancelAnimationFrame(scrambleFrame);const target=footerText();descriptionButton.setAttribute('aria-label',target+'. Click to cycle site stats');
 if(!animate||matchMedia('(prefers-reduced-motion: reduce)').matches){descriptionButton.textContent=target;return;}
 const start=performance.now(),characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
 function tick(now){const progress=Math.min((now-start)/450,1),resolved=Math.floor(progress*target.length);descriptionButton.textContent=Array.from(target,(c,i)=>c===' '||i<resolved?c:characters[Math.floor(Math.random()*characters.length)]).join('');if(progress<1)scrambleFrame=requestAnimationFrame(tick);else descriptionButton.textContent=target;}
 scrambleFrame=requestAnimationFrame(tick);
}
descriptionButton.title='Click to cycle credit, visit count and last visit';
descriptionButton.addEventListener('click',()=>{descriptionIndex=(descriptionIndex+1)%3;paintFooter(true);});
paintFooter();
(async()=>{
 // Preview visits never increment the live visitor count.
 if (!['ehioko.com','www.ehioko.com'].includes(location.hostname)) { visitError=true; return; }
 const key='portfolio-visit-v1';let saved=null;try{saved=JSON.parse(localStorage.getItem(key));}catch{}
 const recent=saved&&Date.now()-saved.recordedAt<30*60*1000;
 try{
  const response=await fetch(visitsEndpoint,{method:recent?'GET':'POST',mode:'cors',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error('Unavailable');const data=await response.json();if(!Number.isInteger(data.visits)||data.visits<0)throw Error('Invalid count');
  visitStats={visits:data.visits,lastVisit:recent?saved.lastVisit:data.lastVisit};
  if(!recent)try{localStorage.setItem(key,JSON.stringify({recordedAt:Date.now(),lastVisit:data.lastVisit}));}catch{}
 }catch{visitError=true;}
 if(descriptionIndex)paintFooter();
})();
setInterval(()=>{if(descriptionIndex===2&&visitStats)paintFooter();},60000);

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
  const palette=document.querySelector('#command-palette'), query=document.querySelector('#command-query'), results=document.querySelector('#command-results');
  const empty=palette.querySelector('.command-empty');
  let opener, active=-1, filtered=[];
  const project=(id)=>()=>document.dispatchEvent(new CustomEvent('portfolio:open-project',{detail:id}));
  const items=[
    {name:'Home',group:'Go to',shortcut:'⌥ H',key:'KeyH',aliases:'home introduction',run:()=>{document.querySelector('#case-study').close();window.scrollTo({top:0,behavior:'smooth'});}},
    {name:'Work',group:'Go to',shortcut:'⌥ W',key:'KeyW',aliases:'work index projects portfolio',run:()=>document.querySelector('#navigation-stage').scrollIntoView({behavior:'smooth',block:'start'})},
    {name:'About',group:'Go to',shortcut:'⌥ A',key:'KeyA',aliases:'story bio biography education experience',run:()=>document.dispatchEvent(new Event('open-story'))},
    {name:'Toggle sound',group:'Commands',shortcut:'⌥ S',key:'KeyS',keepOpen:true,aliases:'mute unmute audio sound',run:()=>document.dispatchEvent(new Event('portfolio:toggle-sound'))},
    {name:'Download résumé',group:'Commands',shortcut:'⌥ R',key:'KeyR',aliases:'resume cv experience pdf',run:()=>document.querySelector('#resume-link').click()},
    {name:'Copy email',group:'Commands',shortcut:'⌥ E',key:'KeyE',keepOpen:true,aliases:'email mail contact ehigoko1@gmail.com',run:()=>document.querySelector('#copy-email').click()},
    {name:'Annotate',group:'Commands',shortcut:'⌥ N',key:'KeyN',aliases:'note feedback suggestion comment',run:()=>document.querySelector('#annotate-feedback').click()}
  ];
  function highlight(){results.querySelectorAll('.command-result').forEach((b,i)=>{b.classList.toggle('active',i===active);b.setAttribute('aria-selected',String(i===active));});}
  function choose(i){const item=filtered[i];if(!item)return;if(!item.keepOpen)palette.close();item.run();}
  function render(){
    const terms=query.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    filtered=items.filter(item=>terms.every(t=>(item.name+' '+item.aliases+' '+item.shortcut).toLowerCase().includes(t)));
    active=terms.length?0:-1;results.replaceChildren();let group='';
    filtered.forEach((item,i)=>{if(item.group!==group){const h=document.createElement('h2');h.className='command-group';h.textContent=item.group;results.append(h);group=item.group;}
      const b=document.createElement('button');b.type='button';b.className='command-result';const name=document.createElement('span');name.textContent=item.name;const detail=document.createElement('small');detail.className='command-key';detail.textContent=item.shortcut;b.setAttribute('aria-keyshortcuts','Alt+'+item.key.slice(3));b.append(name,detail);b.addEventListener('click',()=>choose(i));b.addEventListener('pointerenter',()=>{active=i;highlight();});results.append(b);});
    empty.hidden=filtered.length>0;highlight();
  }
  function open(){if(palette.open)return;opener=document.activeElement;query.value='';render();palette.showModal();query.focus({preventScroll:true});if(!matchMedia('(prefers-reduced-motion:reduce)').matches)palette.animate([{opacity:0,transform:'translateY(8px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:240,easing:'cubic-bezier(.16,1,.3,1)'});}
  document.querySelectorAll('.portfolio-menu,#open-search,#mobile-menu').forEach(b=>b.addEventListener('click',open));
  document.querySelector('#close-search').addEventListener('click',()=>palette.close());
  palette.addEventListener('close',()=>opener?.focus({preventScroll:true}));
  palette.addEventListener('click',e=>{if(e.target===palette){const r=palette.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)palette.close();}});
  query.addEventListener('input',render);
  palette.querySelectorAll('[data-category-query]').forEach(b=>b.addEventListener('click',()=>{query.value=b.dataset.categoryQuery;render();query.focus();}));
  palette.addEventListener('keydown',e=>{if(e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.isComposing&&!e.repeat){const item=items.find(item=>item.key===e.code);if(item){e.preventDefault();if(!item.keepOpen)palette.close();item.run();return;}}if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();if(!filtered.length)return;active=(active+(e.key==='ArrowDown'?1:-1)+filtered.length)%filtered.length;highlight();results.querySelectorAll('.command-result')[active].scrollIntoView({block:'nearest'});}if(e.key==='Enter'&&e.target===query){e.preventDefault();choose(Math.max(0,active));}});
  document.addEventListener('keydown',e=>{
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();palette.open?palette.close():open();return;}
    if(e.key!=='Enter'||e.defaultPrevented||e.repeat||e.isComposing||e.metaKey||e.ctrlKey||e.altKey||e.shiftKey||palette.open)return;
    const target=e.target;
    if(target instanceof Element && target.closest('input,textarea,select,button,a,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="textbox"],video,audio'))return;
    if(document.querySelector('dialog[open]'))return;
    e.preventDefault();open();
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
  studies.notion={title:'Notion',summary:'Campus leader program'};
  studies.apron={title:'Apron',summary:'Cooking companion'};
  studies.aven={title:'Aven'};studies.ibm={title:'IBM'};
  const dockDescriptions={thrive:'Product','internal-tooling':'Internship',notion:'Growth',apron:'Project',colorstack:'Growth',aven:'Project',ibm:'Growth'};
  const presentation={thrive:{poster:'thrive-thumbnail.jpg',video:'thrive-thumbnail.mp4'},'internal-tooling':{poster:'sullivan-thumbnail-v3.png'},notion:{poster:'notion-thumbnail-v2.png'},apron:{poster:'apron-thumbnail.jpg',video:'apron-thumbnail.mp4'},colorstack:{poster:'colorstack-thumbnail.png'},aven:{poster:'aven-thumbnail.png'},ibm:{poster:'ibm-thumbnail.gif'}};
  const modal=document.querySelector('#case-study'),content=document.querySelector('#case-content'),expand=document.querySelector('#case-expand');
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let thriveStory;
  function openThriveStory(){
    if(!thriveStory){
      thriveStory=document.createElement('dialog');thriveStory.className='thrive-story-modal';thriveStory.setAttribute('aria-labelledby','thrive-story-title');
      thriveStory.innerHTML=`<header><h2 id="thrive-story-title">THE STORY</h2><button type="button" class="thrive-story-close" aria-label="Close story">Close</button></header><div class="thrive-story-body"><div class="thrive-story-intro"><p>In October 2024, our four-person team won first place and $10,000 at the HBCU Business Pitch Competition with Thrive, an AI-powered mental wellness platform. In early 2026, we returned to the idea with plans to build it into a real product.</p><p>I was the sole designer, working with two engineers and a product manager. I led the product's design direction, from research and strategy to its visual identity, interactive prototypes, and public-facing website.</p></div><section><h3>What I owned</h3><div><p>The product's end-to-end design direction, from early wireframes to high-fidelity prototypes.</p><p>Thrive's visual identity, design system, and reusable components.</p><p>The marketing and waitlist website, which I designed and built.</p><p>Core product experiences, including onboarding, AI-guided support, and community interactions.</p><p>User research, usability testing, and translating feedback into design decisions.</p><p>Interactive prototypes and custom interactions in Figma and Framer.</p></div></section><section><h3>What I contributed</h3><div><p>A rethinking of Thrive's original concept, moving beyond an AI companion toward a more community-centered wellness experience.</p><p>Product strategy discussions around feature prioritization, user needs, and what our small team could realistically build.</p><p>Conversations with university leadership about student mental health needs and opportunities for institutional support.</p><p>The exploration of Thribes, small peer-support communities, and Milo, our proposed AI companion and facilitator.</p><p>Decisions around the product's language, privacy, and approach to building trust in a sensitive space.</p></div></section><section><h3>Pitch to product</h3><div class="thrive-story-timeline"><h4>01 — The pitch</h4><p>We developed Thrive's initial concept, designed an early prototype, and won $10,000 at the HBCU Business Pitch Competition.</p><h4>02 — Rediscovery</h4><p>In early 2026, we returned to Thrive, reassessed our original assumptions, and began defining a more focused product direction.</p><h4>03 — Research</h4><p>I gathered insights from 30+ research participants and conversations with university leadership to better understand student needs.</p><h4>04 — Design exploration</h4><p>I translated our findings into user flows, wireframes, and interactive prototypes, reviewing ideas with the team as the product evolved.</p><h4>05 — Brand &amp; web</h4><p>I established the visual system and designed and built our public-facing website to introduce Thrive and capture early interest.</p><h4>06 — Product iteration</h4><p>Working with our engineers and PM, I refined core experiences, explored a community-first direction, and helped shape the scope of our MVP.</p></div></section></div>`;
      modal.append(thriveStory);
      const close=()=>{if(matchMedia('(prefers-reduced-motion:reduce)').matches){thriveStory.close();return;}const animation=thriveStory.animate([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(12px) scale(.985)'}],{duration:180,easing:'ease-in'});animation.finished.then(()=>thriveStory.close());};
      thriveStory.querySelector('button').addEventListener('click',close);
      thriveStory.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();close();});
      thriveStory.addEventListener('click',e=>{if(e.target===thriveStory){const r=thriveStory.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
    }
    thriveStory.showModal();thriveStory.querySelector('.thrive-story-body').scrollTop=0;
    if(!matchMedia('(prefers-reduced-motion:reduce)').matches)thriveStory.animate([{opacity:0,transform:'translateY(20px) scale(.975)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:380,easing:'cubic-bezier(.16,1,.3,1)'});
  }
  let previousFocus=null;
  let soonFrame=0;
  function render(study,id){
    cancelAnimationFrame(soonFrame);
    if(id==='internal-tooling'){
      content.innerHTML=`<article class="thrive-template sullivan-template"><div class="thrive-media-slot sullivan-cover"><img src="./assets/sullivan-service-corps-cover.jpg" alt="Sullivan Foundation Service Corps interns and supervisor together in Asheville"></div><header class="thrive-text thrive-template-header"><h1 id="case-title">Clearer Operations for Community-Driven Teams</h1><dl class="thrive-facts"><div><dt>Role</dt><dd>Product Engineering</dd></div><div><dt>Surfaces</dt><dd>Web</dd></div><div><dt>Industry</dt><dd>Social Impact</dd></div><div><dt>Context</dt><dd>Internship</dd></div></dl></header><div class="thrive-text thrive-rule"><img src="./assets/thrive-divider.svg" alt=""></div><section class="thrive-text thrive-overview"><p>This summer, I spent five weeks in Asheville, North Carolina, as an intern with the Sullivan Foundation’s Service Corps program. My role extended beyond engineering, bringing together consulting, product design, and technical problem-solving to help nonprofits address real challenges.</p><p>It was my first internship, and much of my first week was spent finding my footing. I was getting familiar with the organization, learning how a multidisciplinary team of interns approached nonprofit consulting, and understanding how ideas were developed, decisions were made, and solutions were presented to clients.</p><ul><li>Projected 100+ staff hours saved annually for Eliada Homes</li><li>Built a voice-enabled AI assistant and client analytics dashboard</li><li>Conducted client interviews and research on nonprofit AI adoption</li></ul><button class="thrive-read-more" type="button" aria-haspopup="dialog">Read more <img src="./assets/thrive-expand.svg" alt="" width="19.2" height="19.2"></button></section><section class="thrive-text case-narrative"><h2>The Challenge</h2><p>Nonprofits exist to serve communities, but that mission depends on the systems running behind the scenes. Administrative work can consume time and resources that organizations would rather dedicate to the people they serve.</p><p>At Eliada Homes, I focused on making organizational knowledge easier to access without adding complexity to existing workflows. The challenge was to understand where AI could be useful and make it practical for the staff using it.</p><blockquote>How might we make organizational knowledge more accessible while reducing administrative friction for nonprofit staff?</blockquote></section>
<section class="thrive-text case-narrative"><h2>Understanding the Organization</h2><p>Before developing anything, I researched nonprofit operations, AI’s potential applications, organizational constraints, and barriers to adoption. Stakeholder conversations helped me understand existing resources and the practical realities of introducing a new tool.</p><p>This shaped my approach: a solution needed to fit the people doing the work and remain useful beyond development.</p></section>
<section class="thrive-text case-narrative"><h2>Defining the Direction</h2><p>I narrowed the scope to one workflow: helping staff find information through natural-language questions. Three priorities guided the product:</p><ul><li><strong>Accessibility:</strong> Familiar, low-friction ways to ask questions</li><li><strong>Reliability:</strong> Answers grounded in organizational knowledge, with identifiable sources</li><li><strong>Visibility:</strong> A way for the organization to understand usage and identify improvements</li></ul></section>
<section class="thrive-text case-narrative"><h2>Introducing Ask Eli</h2><p>Ask Eli is a voice-enabled knowledge assistant that helps nonprofit staff retrieve internal information. Instead of manually searching documents, staff can ask a question and receive an answer informed by the organization’s knowledge base.</p><p>I independently led the implementation, spanning product decisions, backend development, interface design, and testing. The prototype uses Python, Gradio, Whisper, GPT-OSS-20B, and a retrieval-augmented generation pipeline.</p></section>
<div class="thrive-media-slot sullivan-demo-frame"><video autoplay muted loop playsinline controls preload="metadata" aria-label="Ask Eli assistant and analytics dashboard demo"><source src="./assets/sullivan-ask-eli-demo.mp4" type="video/mp4"></video></div>
<section class="thrive-text case-narrative"><h2>Behind the Answers</h2><p>A fluent answer is not necessarily a reliable one. I connected the assistant to organizational documents through retrieval-augmented generation: embeddings and semantic retrieval find relevant material before GPT-OSS-20B generates a response. Source citations let staff check the information behind an answer.</p><p>Staff can submit text or speak a question in Gradio. Whisper transcribes voice input, and request routing handles the question before retrieval and generation. This brought interaction and information access into one connected workflow.</p></section>
<figure class="thrive-media-slot sullivan-architecture"><img src="./assets/sullivan-architecture-v2.png" alt="Ask Eli system architecture: voice or text input, Whisper and routing, semantic retrieval from internal documents, GPT-OSS-20B generation, cited responses, and interaction logging to the client dashboard"></figure><section class="thrive-text case-narrative sullivan-tradeoff"><h2>Trading Breadth for Trust</h2><p>When staff and clients depend on accurate information, answering everything isn't necessarily better. I built Ask Eli around retrieval from organizational knowledge and source-backed responses, prioritizing verifiable information over the flexibility of a general-purpose chatbot.</p><figure><img src="./assets/sullivan-breadth-trust-v2.png" alt="A balance weighted toward verifiable answers over broad answers"></figure></section>
<section class="thrive-text case-narrative"><h2>Making Usage Visible</h2><p>I built an interaction logging pipeline that records usage data in a Hugging Face dataset, then designed a staff-facing analytics dashboard to review usage patterns, recurring questions, and assistant performance.</p><p>The assistant and dashboard formed two sides of one product: a tool for staff to access knowledge, and a tool for the organization to understand how that capability was being used.</p></section>
<div class="thrive-media-slot sullivan-dashboard-frame"><img src="./assets/sullivan-thumbnail-v3.png" alt="Eliada Homes staff-facing analytics dashboard showing conversations, referrals, resolution rate, hours saved, and recent conversations"></div>
<section class="thrive-text thrive-takeaways"><h2>Takeaways</h2><div class="thrive-takeaway-columns"><div><h3>Empathy in Action</h3><p>One lesson that stayed with me was putting empathy into action; solutions begin with understanding people and their environments.</p></div><div><h3>Learning to Navigate Ambiguity</h3><p>I learned to make decisions without always having a clear roadmap, and to become more comfortable figuring things out along the way.</p></div></div></section></article>`;
      content.querySelector('.thrive-read-more').addEventListener('click',()=>{
        let story=modal.querySelector('.sullivan-story-modal');
        if(!story){story=document.createElement('dialog');story.className='thrive-story-modal sullivan-story-modal';story.setAttribute('aria-labelledby','sullivan-story-title');story.innerHTML=`<header><h2 id="sullivan-story-title">THE STORY</h2><button type="button" class="thrive-story-close" aria-label="Close Sullivan story">Close</button></header><div class="thrive-story-body"><div class="thrive-story-intro"><p>As part of the Sullivan Foundation's Service Corps program, I spent five weeks in Asheville, North Carolina, working alongside interns from different disciplines on nonprofit consulting projects. My primary project was with Eliada Homes, where I independently led the research, design, and engineering of an AI-powered solution to improve access to organizational knowledge.</p><p>The challenge was to make information easier for staff to find without introducing another complicated system into their workflows. I developed Ask Eli, a voice-enabled AI assistant that retrieves information from organizational documents, provides source-backed answers, and helps staff navigate internal knowledge more efficiently.</p></div><section><h3>What I owned</h3><div><p>End-to-end design and development of Ask Eli, from initial discovery to technical architecture.</p><p>A voice-enabled RAG system built with Python, Whisper, GPT-OSS-20B, and Gradio.</p><p>A client dashboard for monitoring assistant usage, performance, and recurring questions.</p><p>Source citations, intelligent request routing, and interaction logging.</p></div></section><section><h3>What I contributed</h3><div><p>Conducted client interviews to identify staff needs.</p><p>Researched nonprofit AI adoption, examining practical applications, barriers, and opportunities.</p><p>Presented technical recommendations and project findings to stakeholders.</p></div></section><section><h3>Process</h3><div><h4>01 — Understanding the problem</h4><p>Before writing code, I needed to understand the people I was designing for. I started by speaking with the client, examining existing workflows, and identifying where information retrieval created unnecessary friction. These conversations helped me narrow the scope of the project and define what a useful solution would look like.</p><h4>02 — Designing and building Ask Eli</h4><p>I translated my findings into a working AI assistant, building a retrieval-augmented generation system that could answer questions using organizational knowledge. I incorporated voice input, source citations, and intelligent request routing to make the experience more accessible and reliable.</p><h4>03 — Testing and measuring impact</h4><p>After developing the prototype, I gathered client feedback and refined the experience. I also designed and built an analytics dashboard to give the client visibility into assistant usage and performance. The final solution was projected to save over 100 staff hours annually.</p></div></section><div class="sullivan-story-thanks"><p>I'm incredibly grateful to Greg Van Kirk and Luke Lingle, my supervisors at the Sullivan Foundation, for their guidance, encouragement, and trust throughout the summer. Thank you for giving me the space to explore new ideas, take ownership of my work, and grow beyond what I thought I was capable of.</p><p>A special thank you to Steve McDavid and his wife, Rosie, for their warmth, generosity, and for making Asheville feel like home.</p><p>And of course, to the wonderful group of interns I had the privilege of spending five weeks with. You made my first internship experience all the more memorable.</p><p>I came into the summer with a fairly narrow understanding of what it meant to be an engineer. I left with a much broader appreciation for how technology, design, and human connection can come together to create meaningful change, and an even greater curiosity about what I could build next.</p></div></div>`;modal.append(story);story.querySelector('button').addEventListener('click',()=>story.close());story.addEventListener('cancel',e=>e.stopPropagation());story.addEventListener('click',e=>{if(e.target===story){const r=story.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)story.close();}});}
        story.showModal();story.querySelector('.thrive-story-body').scrollTop=0;
        if(!matchMedia('(prefers-reduced-motion:reduce)').matches)story.animate([{opacity:0,transform:'translateY(20px) scale(.975)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:380,easing:'cubic-bezier(.16,1,.3,1)'});
      });return;
    }
    if(id==='thrive'){
      content.innerHTML=`<article class="thrive-template"><div class="thrive-media-slot thrive-pitch-cover"><img src="./assets/thrive-pitch-winners.png" alt="The Thrive team holding their $10,000 HBCU Business Pitch Competition winning check"></div><header class="thrive-text thrive-template-header"><h1 id="case-title">Thrive: Accessible Mental Wellness, Built For Community</h1><dl class="thrive-facts"><div><dt>Role</dt><dd>Co-Founder / Design Lead</dd></div><div><dt>Surfaces</dt><dd>iOS App, Web</dd></div><div><dt>Industry</dt><dd>Healthcare</dd></div><div><dt>Context</dt><dd>Winning Pitch</dd></div></dl></header><div class="thrive-text thrive-rule"><img src="./assets/thrive-divider.svg" alt=""></div><section class="thrive-text thrive-overview"><p>Thrive is a mental wellness app designed to make support more accessible for underrepresented communities. After winning <strong>$10,000</strong> at the HBCU Business Pitch competition in October 2024, we decided to take the idea further. From late 2024 to early 2026, I served as Co-Founder and Design Lead, shaping the product from early research and wireframes to its visual identity, interactive prototypes, a waitlist, and a reimagined community-centered experience. I worked alongside two engineers and a product manager.</p><ul><li><strong>$10,000 and 1st place</strong> at HBCU Business Pitch Competition</li><li>Support from <strong>Founders On The Yard (FOTY), The Alabama Collective, HBCUFI</strong></li><li>Recognition and feature from <strong>Alabama A&amp;M University</strong></li></ul><button class="thrive-read-more" type="button">Read more <img src="./assets/thrive-expand.svg" alt="" width="19.2" height="19.2"></button></section><section class="thrive-media-gallery" aria-label="Project gallery"><div class="thrive-media-pair"><div class="thrive-phone-frame"><img class="thrive-phone thrive-phone-name" src="./assets/thrive-name.png" alt="Thrive name onboarding screen"></div><div class="thrive-phone-frame"><img class="thrive-phone thrive-phone-focus" src="./assets/thrive-focus.png" alt="Thrive Focus Challenge screen"></div><div class="thrive-phone-frame"><img class="thrive-phone thrive-phone-notifications" src="./assets/thrive-notifications.png" alt="Thrive notification permissions screen"></div><div class="thrive-phone-frame thrive-identity-frame"><img src="./assets/thrive-brand-4.png" alt="Thrive app icon on a phone"></div><div class="thrive-phone-frame thrive-identity-frame"><img src="./assets/thrive-brand-2.png" alt="Thrive typography"></div><div class="thrive-phone-frame thrive-identity-frame"><img src="./assets/thrive-brand-1.png" alt="Thrive wordmark"></div></div></section><div class="thrive-media-slot thrive-website-frame"><img src="./assets/thrive-website.png" alt="Thrive culturally intelligent mental healthcare website"></div><section class="thrive-text thrive-takeaways"><h2>Takeaways</h2><div class="thrive-takeaway-columns"><div><h3>Trust Comes Before Aesthetics</h3><p>Designing for mental wellness meant prioritizing safety, empathy, and clarity over visual appeal.</p></div><div><h3>Winning a Pitch ≠ Product Validation</h3><p>The $10K proved our idea had potential, not that we'd found product-market fit.</p></div></div></section></article>`;
      const readMore=content.querySelector('.thrive-read-more');
      readMore.setAttribute('aria-haspopup','dialog');
      readMore.addEventListener('click',openThriveStory);
      return;
    }

    content.innerHTML='<section class="project-soon"><div class="soon-wrap"><div class="soon-num" aria-label="404"><span class="soon-cell"><span>4</span></span><span class="soon-cell"><span>0</span></span><span class="soon-cell"><span>4</span></span></div><h2 id="case-title">'+escape(study.title)+' is still being written.</h2><p>The '+escape(study.title)+' case study is currently in the works. If you would like to hear about it before it is public, reach out at <a href="mailto:ehigoko1@gmail.com">ehigoko1@gmail.com</a>.</p><button class="soon-back">‹ <span>Back to home</span></button></div></section>';
    const media=presentation[id];
    const hero=document.createElement('section');hero.className='case-cover';
    hero.innerHTML='<h1 class="case-cover-title">'+escape(study.title)+'</h1><div class="case-cover-media">'+(media.video?'<video autoplay muted loop playsinline poster="./assets/'+media.poster+'"><source src="./assets/'+media.video+'" type="video/mp4"></video>':'<img src="./assets/'+media.poster+'" alt="'+escape(study.title)+'">')+'</div>';
    content.prepend(hero);
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)hero.querySelector('video')?.pause();
    content.querySelector('.soon-back').addEventListener('click',closeCase);
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
    if(!['thrive','internal-tooling'].includes(id)||!studies[id])return;
    if(!modal.open)previousFocus=document.activeElement;
    const wasOpen=modal.open;
    projectDock.classList.remove('is-scroll-hidden');dockScrollTop=0;render(studies[id],id);modal.dataset.project=id;modal.classList.remove('expanded');expand.setAttribute('aria-pressed','false');expand.setAttribute('aria-label','Expand case study');
    if(!modal.open)modal.showModal();content.scrollTop=0;
    projectDock.querySelectorAll('[data-dock-project]').forEach(button=>{button.setAttribute('aria-current',button.dataset.dockProject===id?'page':'false');});
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
      content.getAnimations().forEach(a=>a.cancel());
      content.animate([{opacity:0,transform:'translateY(32px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,delay:wasOpen?0:240,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
      if(!wasOpen){
        projectDock.animate([{opacity:0,transform:'translate(-50%, -12px) scale(.94)'},{opacity:1,transform:'translate(-50%, 0) scale(1)'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});
        projectDock.querySelectorAll('[data-dock-project]').forEach((button,i)=>{
          const card=document.querySelector('.project-grid [data-project-case="'+button.dataset.dockProject+'"]')?.closest('.project-panel');
          const from=card?.getBoundingClientRect(),to=button.getBoundingClientRect();
          const dx=from?Math.max(-240,Math.min(240,from.x+from.width/2-to.x-to.width/2)):0;
          const dy=from?Math.max(35,Math.min(240,from.y+from.height/2-to.y)):100;
          button.animate([{opacity:0,transform:'translate('+dx+'px,'+dy+'px) scale(1.5)'},{opacity:1,transform:'translate(0,0) scale(1)'}],{duration:700,delay:i*45,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
        });
      }
    }

    if(updateURL){const url=new URL(location.href);url.pathname=id==='internal-tooling'?'/sullivan':'/thrive';url.searchParams.delete('case');url.hash='';history.pushState(null,'',url);}
  }
  const projectDock=document.createElement('nav');projectDock.className='case-project-dock';projectDock.setAttribute('aria-label','Project index');
  projectDock.innerHTML='<button type="button" class="case-dock-close" aria-label="Close project"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.5"/></svg></button><div class="case-dock-tray">'+Object.entries(presentation).map(([id,m])=>'<button type="button" data-dock-project="'+id+'" aria-label="'+escape(studies[id].title)+'" aria-describedby="dock-caption-'+id+'"><img src="./assets/'+m.poster+'" alt=""><span class="case-dock-caption" id="dock-caption-'+id+'" role="tooltip"><span>'+escape(studies[id].title)+'</span><span>'+escape(dockDescriptions[id])+'</span></span></button>').join('')+'</div>';
  modal.append(projectDock);
  const mobileHeader=document.createElement('header');
  mobileHeader.className='case-mobile-header';
  const mobileIcon=name=>'<img class="case-mobile-icon" src="./assets/mobile-'+name+'.svg" alt="">';
  const mobileBrand='<img src="./assets/header-butterfly.svg" alt="" width="23" height="23"><span>EHI OKO</span>';
  mobileHeader.innerHTML='<button type="button" data-case-panel="navigation" aria-label="Open navigation">'+mobileIcon('hamburger')+'</button><button type="button" class="case-mobile-brand" data-case-home>'+mobileBrand+'</button><button type="button" data-case-panel="projects" aria-label="Browse projects">'+mobileIcon('projects')+'</button>';
  modal.append(mobileHeader);
  const mobilePanel=document.createElement('dialog');mobilePanel.className='case-mobile-panel';mobilePanel.tabIndex=-1;modal.append(mobilePanel);
  let panelTrigger;
  async function closeMobilePanel(){
    if(!mobilePanel.open)return;
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)await mobilePanel.animate([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(-12px) scale(.98)'}],{duration:180,easing:'ease-in'}).finished;
    mobilePanel.close();panelTrigger?.focus({preventScroll:true});
  }
  function showMobilePanel(kind){
    panelTrigger=document.activeElement;
    const projects=kind==='projects';
    mobilePanel.setAttribute('aria-label',projects?'Browse projects':'Navigation');
    mobilePanel.dataset.panel=kind;
    mobilePanel.innerHTML='<header><button type="button" '+(projects?'data-switch="navigation" aria-label="Open navigation"':'data-panel-close aria-label="Close navigation"')+'>'+mobileIcon(projects?'hamburger':'close')+'</button><span class="case-mobile-brand">'+mobileBrand+'</span><button type="button" '+(projects?'data-panel-close aria-label="Close projects"':'data-switch="projects" aria-label="Browse projects"')+'>'+mobileIcon(projects?'close':'projects')+'</button></header>'+(projects?'<div class="case-mobile-projects" tabindex="0" aria-label="Scroll through projects">'+Object.entries(presentation).map(([id,m])=>'<button type="button" data-mobile-project="'+id+'"><img src="./assets/'+m.poster+'" alt=""><span>'+escape(studies[id].title)+'</span></button>').join('')+'</div>':'<nav class="case-mobile-links"><button data-mobile-action="work">Work</button><button data-mobile-action="about">About</button><button data-mobile-action="craft">Craft</button><button data-mobile-action="gallery">Gallery</button></nav><footer><div><a href="https://www.x.com/ehigoko" target="_blank" rel="noopener noreferrer">Twitter</a><a href="https://www.linkedin.com/in/ehi-oko" target="_blank" rel="noopener noreferrer">LinkedIn</a></div><span>© 2026 Ehi Oko</span></footer>');
    mobilePanel.querySelector('[data-panel-close]').onclick=closeMobilePanel;
    mobilePanel.querySelector('[data-switch]').onclick=e=>showMobilePanel(e.currentTarget.dataset.switch);
    mobilePanel.querySelectorAll('[data-mobile-project]').forEach(b=>b.onclick=async()=>{await closeMobilePanel();openCase(b.dataset.mobileProject);});
    mobilePanel.querySelectorAll('[data-mobile-action]').forEach(b=>b.onclick=async()=>{const action=b.dataset.mobileAction;await closeMobilePanel();if(action==='email'||action==='contact'){document.querySelector('#copy-email')?.click();return;}modal.close();if(action==='about')document.dispatchEvent(new Event('open-story'));if(action==='craft'||action==='gallery')document.querySelector('[data-missing="'+(action==='craft'?'Craft':'Gallery')+'"]')?.click();});
    if(!mobilePanel.open)mobilePanel.showModal();
    mobilePanel.focus({preventScroll:true});
    mobilePanel.style.setProperty('--panel-bottom',mobilePanel.getBoundingClientRect().bottom+'px');
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){mobilePanel.animate([{opacity:0,transform:'translateY(-20px) scale(.96)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:380,easing:'cubic-bezier(.16,1,.3,1)'});mobilePanel.querySelectorAll('.case-mobile-projects button,.case-mobile-links button').forEach((b,i)=>b.animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:400,delay:40+i*25,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}));}
  }
  mobileHeader.querySelectorAll('[data-case-panel]').forEach(b=>b.onclick=()=>showMobilePanel(b.dataset.casePanel));
  mobileHeader.querySelector('[data-case-home]').onclick=closeCase;
  mobilePanel.addEventListener('cancel',e=>{e.preventDefault();closeMobilePanel();});
  mobilePanel.addEventListener('click',e=>{if(e.target===mobilePanel){const r=mobilePanel.getBoundingClientRect();if(e.clientY<r.top||e.clientY>r.bottom||e.clientX<r.left||e.clientX>r.right)closeMobilePanel();}});
  let dockScrollTop=0;
  content.addEventListener('scroll',()=>{
    const next=content.scrollTop;
    const delta=next-dockScrollTop;
    if(delta>.5)projectDock.classList.add('is-scroll-hidden');
    else if(delta<-.5 || next<=0)projectDock.classList.remove('is-scroll-hidden');
    dockScrollTop=next;
  },{passive:true});

  const dockItems=[...projectDock.querySelectorAll('[data-dock-project]')];
  function liftNeighbors(index){dockItems.forEach((item,i)=>item.classList.toggle('dock-neighbor',Math.abs(i-index)===1));}
  dockItems.forEach((item,i)=>{item.addEventListener('pointerenter',()=>liftNeighbors(i));item.addEventListener('focus',()=>liftNeighbors(i));item.addEventListener('blur',()=>liftNeighbors(-10));});
  projectDock.addEventListener('pointerleave',()=>liftNeighbors(-10));

  let closing=false;
  function closeCase(){
    if(closing||!modal.open)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){modal.close();return;}
    closing=true;
    const animation=content.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(20px)'}],{duration:260,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
    projectDock.animate([{opacity:1,transform:'translate(-50%,0)'},{opacity:0,transform:'translate(-50%,-10px)'}],{duration:220,easing:'ease-in'});
    animation.finished.then(()=>{modal.close();animation.cancel();closing=false;}).catch(()=>{closing=false;});
  }
  modal.addEventListener('cancel',event=>{event.preventDefault();closeCase();});
  projectDock.querySelector('.case-dock-close').addEventListener('click',closeCase);
  projectDock.querySelectorAll('[data-dock-project]').forEach(button=>button.addEventListener('click',()=>openCase(button.dataset.dockProject)));
  document.addEventListener('portfolio:open-project',event=>openCase(event.detail));
  document.querySelectorAll('[data-case]').forEach(button=>button.addEventListener('click',()=>openCase(button.dataset.case)));
  document.querySelector('#case-home').addEventListener('click',()=>modal.close());
  expand.addEventListener('click',()=>{const expanded=modal.classList.toggle('expanded');expand.setAttribute('aria-pressed',String(expanded));expand.setAttribute('aria-label',expanded?'Restore popup size':'Expand case study');});
  modal.addEventListener('click',event=>{if(event.target!==modal)return;const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close();});
  modal.addEventListener('close',()=>{content.querySelectorAll('video').forEach(v=>v.pause());cancelAnimationFrame(soonFrame);const url=new URL(location.href);if(['/thrive','/sullivan','/projects/sullivanfoundation'].includes(url.pathname.replace(/\/$/,''))){url.pathname='/';url.hash='navigation-stage';history.replaceState(null,'',url);}if(url.searchParams.has('case')){url.searchParams.delete('case');history.replaceState(null,'',url);}previousFocus?.focus({preventScroll:true});});
  function caseFromLocation(){const path=location.pathname.replace(/\/$/,'');return path==='/thrive'?'thrive':['/sullivan','/projects/sullivanfoundation'].includes(path)?'internal-tooling':new URL(location.href).searchParams.get('case');}
  window.addEventListener('popstate',()=>{const id=caseFromLocation();if(studies[id])openCase(id,false);else if(modal.open)modal.close();});
  const initial=caseFromLocation();if(studies[initial])openCase(initial,false);const canonicalCase=initial==='internal-tooling'?'/sullivan':'/thrive';if(studies[initial]){const url=new URL(location.href);url.pathname=canonicalCase;url.searchParams.delete('case');url.hash='';history.replaceState(null,'',url);};
})();

// Keep the credit after all work on mobile, and in the sidebar on desktop.
(() => {const credit=document.querySelector(".sidebar-footer"),sidebar=document.querySelector(".layout aside"),main=document.querySelector("main"),mobile=matchMedia("(max-width:700px)");function placeCredit(){(mobile.matches?main:sidebar).append(credit);}mobile.addEventListener("change",placeCredit);placeCredit();})();

// Private notes stay attached to human-readable sections; drafts stay in this tab only.
(() => {
  const endpoint='https://portfolio-feedback.ehigoko1.workers.dev/';
  const sitekey='0x4AAAAAAFPjn8y4ZI1OyhDS';
  const localPreview=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  let verificationJob=null, settleVerification=null, verificationTimer;
  const modal=document.querySelector('#feedback-dialog'), form=document.querySelector('#feedback-form');
  const section=document.querySelector('#feedback-section'), context=document.querySelector('#feedback-context');
  const status=document.querySelector('#feedback-status'), send=document.querySelector('#feedback-send');
  const message=document.querySelector('#feedback-message'), category=document.querySelector('#feedback-category');
  const categoryButton=document.querySelector('#feedback-category-trigger');
  const categoryMenu=document.querySelector('#feedback-category-menu');
  const categoryOptions=[...categoryMenu.querySelectorAll('[role="option"]')];
  function syncCategoryPicker(){
    const current=categoryOptions.find(option=>option.dataset.category===category.value)||categoryOptions[0];
    categoryButton.querySelector('span').textContent=current.querySelector('span').textContent;
    categoryOptions.forEach(option=>option.setAttribute('aria-selected',String(option===current)));
  }
  function closeCategoryMenu(restore=false){
    categoryMenu.hidden=true;categoryButton.setAttribute('aria-expanded','false');
    if(restore)categoryButton.focus({preventScroll:true});
  }
  function openCategoryMenu(){
    if(categoryButton.disabled)return;
    syncCategoryPicker();categoryMenu.hidden=false;categoryButton.setAttribute('aria-expanded','true');
    const box=categoryButton.getBoundingClientRect();
    const available=Math.max(80,innerHeight-32);
    categoryMenu.style.maxHeight=Math.min(260,available)+'px';
    const menuHeight=categoryMenu.offsetHeight;
    categoryMenu.style.left=Math.max(16,Math.min(box.left,innerWidth-categoryMenu.offsetWidth-16))+'px';
    categoryMenu.style.top=Math.max(16,Math.min(box.bottom+6+menuHeight<=innerHeight-16?box.bottom+6:box.top-menuHeight-6,innerHeight-menuHeight-16))+'px';
    categoryOptions.find(option=>option.getAttribute('aria-selected')==='true').focus({preventScroll:true});
  }
  categoryButton.addEventListener('click',()=>categoryMenu.hidden?openCategoryMenu():closeCategoryMenu());
  categoryButton.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();openCategoryMenu();}});
  categoryOptions.forEach(option=>option.addEventListener('click',()=>{
    category.value=option.dataset.category;category.dispatchEvent(new Event('change',{bubbles:true}));
    syncCategoryPicker();closeCategoryMenu(true);
  }));
  categoryMenu.addEventListener('keydown',event=>{
    const index=categoryOptions.indexOf(document.activeElement);
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?categoryOptions.length-1:(index+(event.key==='ArrowDown'?1:-1)+categoryOptions.length)%categoryOptions.length;
      categoryOptions[next].focus({preventScroll:true});
    }
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeCategoryMenu(true);}
    if(event.key==='Tab')closeCategoryMenu();
  });
  // Escape is handled before the parent annotation dialog's capture listener.
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!categoryMenu.hidden){event.preventDefault();event.stopImmediatePropagation();closeCategoryMenu(true);}
  },true);
  document.addEventListener('pointerdown',event=>{if(!categoryMenu.hidden&&!event.target.closest('.note-category-picker'))closeCategoryMenu();});
  window.addEventListener('resize',()=>closeCategoryMenu());
  document.addEventListener('scroll',event=>{if(!categoryMenu.contains(event.target))closeCategoryMenu();},true);
  const prompt=document.querySelector('#feedback-prompt'), success=document.querySelector('#feedback-success');
  const step=document.querySelector('#feedback-step'), close=document.querySelector('#feedback-close');
  const entries=[...document.querySelectorAll('#leave-feedback,#story-feedback,#feedback-mobile,#annotate-feedback')];
  const highlight=document.createElement('div');highlight.id='note-highlight';highlight.hidden=true;highlight.setAttribute('aria-hidden','true');
  for(const corner of ['top-right','bottom-left']){const handle=document.createElement('span');handle.className='note-corner note-corner-'+corner;highlight.append(handle);}
  const hint=document.createElement('span');hint.id='note-highlight-label';highlight.append(hint);document.body.append(highlight);
  const drafts=new Map();
  let mode=false, selected=null, hovered=null, token='', widget=null, loading=null, previousFocus=null, submitting=false, revision=0, frame=0;
  const targets=[['.hero h1','Introduction'],['.hero .current','Previous experience'],['.bio p','Biography'],['nav h2,.links h2','Section heading'],['nav a,nav button','Navigation link'],['.utility p','Huntsville local time'],['.story-bio p','On design paragraph'],['.story-copy h2','About heading'],['.story-history p','About history paragraph'],['.story-date','Experience date'],['.story-experience','Experience'],['.story-particle-stage','About portrait']];
  targets.forEach(([selector,label])=>document.querySelectorAll(selector).forEach(el=>el.dataset.feedbackSection=label==='Experience'?el.querySelector('.story-company')?.textContent.trim()||label:label==='Section heading'||label==='About heading'?el.textContent.trim():label==='About history paragraph'?(el.closest('.story-history').querySelector('h2').textContent.trim()+': paragraph'):label==='Experience date'?('Date: '+el.closest('.story-experience').querySelector('.story-company').textContent.trim()):label));
  document.querySelectorAll('.project').forEach(card=>{const title=card.querySelector('h2').textContent;card.querySelectorAll('.media,.project-caption-heading,.project-description').forEach(el=>el.dataset.feedbackSection=title);});
  document.querySelectorAll('.project-panel').forEach(card=>{
    const title=card.querySelector('h2').textContent;
    card.dataset.feedbackSection='Project: '+title;
    card.querySelector('h2').dataset.feedbackSection=title+': title';
    card.querySelector('.project-description').dataset.feedbackSection=title+': description';
  });
  document.querySelectorAll('.work-introduction h2,.work-introduction p,.corner-footer p').forEach(el=>el.dataset.feedbackSection=el.closest('.corner-footer')?'Footer':'Work sidebar');
  function activeHost(){const story=document.querySelector('#story-overlay'),caseStudy=document.querySelector('#case-study');return story.open?story:caseStudy.open?caseStudy:document.body;}
  function mount(){const host=activeHost();host.append(modal,highlight);modal.classList.toggle('note-dark',host.id==='story-overlay');}
  function saveDraft(){if(section.dataset.key&&!form.hidden)drafts.set(section.dataset.key,{message:message.value,category:category.value});}
  function setState(state){closeCategoryMenu();modal.dataset.state=state;step.textContent=state==='choose'?'01 / SELECT':state==='write'?'02 / WRITE':'03 / SENT';prompt.hidden=state!=='choose';form.hidden=state!=='write';context.hidden=true;success.hidden=state!=='sent';queuePosition();}
  function markTargets(enabled){document.querySelectorAll('[data-feedback-section]').forEach(el=>{if(enabled){el.dataset.feedbackTabindex=el.getAttribute('tabindex')??'none';el.tabIndex=0;}else{const old=el.dataset.feedbackTabindex;if(old==='none')el.removeAttribute('tabindex');else if(old!==undefined)el.setAttribute('tabindex',old);delete el.dataset.feedbackTabindex;}});}
  function begin(){if(mode)return;mode=true;document.body.classList.add('feedback-selecting');markTargets(true);entries.forEach(el=>el.setAttribute('aria-pressed','true'));}
  function releaseWidget(){revision++;token='';clearTimeout(verificationTimer);settleVerification?.(false);settleVerification=null;verificationJob=null;if(widget!==null&&window.turnstile)window.turnstile.remove(widget);widget=null;}
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
  function updateCount(){
    const hasMessage=message.value.trim().length>0;
    form.classList.toggle('has-message',hasMessage);syncCategoryPicker();if(!hasMessage)closeCategoryMenu();
    send.disabled=!hasMessage||submitting;
    message.style.height='auto';message.style.height=Math.min(140,Math.max(40,message.scrollHeight))+'px';
    saveDraft();queuePosition();
  }
  function verificationFailed(){
    status.dataset.kind='verification';status.textContent='Verification unavailable.';retry.hidden=false;
  }
  function verify(){
    if(localPreview||token)return Promise.resolve(true);
    if(verificationJob)return verificationJob;
    const current=revision;let completed=false;
    verificationJob=new Promise(resolve=>{
      settleVerification=resolve;
      const finish=ok=>{if(current!==revision||completed)return;completed=true;clearTimeout(verificationTimer);settleVerification=null;verificationJob=null;resolve(ok);};
      verificationTimer=setTimeout(()=>finish(false),15000);
      loadTurnstile().then(()=>{
        if(completed||current!==revision||!modal.open||form.hidden){finish(false);return;}
        if(widget!==null)window.turnstile.remove(widget);
        widget=window.turnstile.render('#feedback-verification',{
          sitekey,action:'feedback',theme:modal.classList.contains('note-dark')?'dark':'light',appearance:'interaction-only',
          callback:value=>{if(current!==revision)return;token=value;retry.hidden=true;if(status.dataset.kind==='verification'){status.textContent='';delete status.dataset.kind;}finish(true);},
          'expired-callback':()=>{if(current===revision)token='';},
          'error-callback':()=>{if(current===revision){token='';finish(false);}}
        });
      }).catch(()=>{loading=null;finish(false);});
    });
    return verificationJob;
  }
  const retry=document.createElement('button');retry.type='button';retry.id='feedback-retry';retry.textContent='Retry';retry.hidden=true;status.after(retry);retry.addEventListener('click',async()=>{releaseWidget();loading=null;retry.hidden=true;status.textContent='Checking…';if(await verify()){status.textContent='';}else verificationFailed();});
  function compose(label,element){if(submitting)return;saveDraft();releaseWidget();mount();begin();selected=element;hovered=null;section.dataset.label=label;section.dataset.key=element?label+':'+[...document.querySelectorAll('[data-feedback-section]')].indexOf(element):label;section.textContent=label;const draft=drafts.get(section.dataset.key);form.reset();message.value=draft?.message||'';category.value=draft?.category||'General';message.removeAttribute('aria-invalid');status.textContent='';delete status.dataset.kind;retry.hidden=true;send.disabled=false;setState('write');if(!modal.open)modal.show();updateCount();message.focus({preventScroll:true});}
  document.querySelectorAll('#story-overlay,#case-study').forEach(parent=>parent.addEventListener('close',()=>{if(modal.open&&parent.contains(modal))modal.close();}));
  entries.forEach(el=>{el.title=el.id==='annotate-feedback'?'Annotate this page (⌘N)':'Leave a note (⌘N)';el.setAttribute('aria-keyshortcuts','Meta+N');});
  document.addEventListener('keydown',event=>{if(!event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||event.isComposing||event.repeat||event.key.toLowerCase()!=='n')return;event.preventDefault();if(modal.open){if(!form.hidden)message.focus({preventScroll:true});return;}const palette=document.querySelector('#command-palette');if(palette?.open)palette.close();start();});
  entries.forEach(el=>el.addEventListener('click',start));close.addEventListener('click',()=>{if(!submitting)modal.close();});document.querySelector('#feedback-reselect').addEventListener('click',choose);document.querySelector('#feedback-another').addEventListener('click',choose);
  modal.addEventListener('cancel',event=>{if(submitting)event.preventDefault();});modal.addEventListener('close',()=>{closeCategoryMenu();saveDraft();releaseWidget();mode=false;selected=null;hovered=null;highlight.hidden=true;document.body.classList.remove('feedback-selecting');markTargets(false);entries.forEach(el=>el.setAttribute('aria-pressed','false'));document.body.append(modal,highlight);previousFocus?.focus({preventScroll:true});});
  function targetFor(event){return event.target.closest('[data-feedback-section]');}
  document.addEventListener('pointerover',event=>{if(!mode||selected)return;hovered=event.target.closest('#feedback-dialog')?null:targetFor(event);queuePosition();});
  document.addEventListener('pointerout',event=>{if(!mode||selected)return;if(!event.relatedTarget?.closest?.('[data-feedback-section]')){hovered=null;queuePosition();}});
  document.addEventListener('focusin',event=>{if(mode&&!selected&&!event.target.closest('#feedback-dialog')){hovered=targetFor(event);queuePosition();}});
  document.addEventListener('click',event=>{if(!mode||event.target.closest('#feedback-dialog'))return;const element=targetFor(event);if(!element)return;event.preventDefault();event.stopImmediatePropagation();compose(element.dataset.feedbackSection,element);},true);
  document.addEventListener('keydown',event=>{if(!modal.open)return;if(event.key==='Escape'){event.preventDefault();if(!submitting)modal.close();return;}if(!mode||event.target.closest('#feedback-dialog'))return;const element=targetFor(event);if(element&&(event.key==='Enter'||event.key===' ')){event.preventDefault();event.stopImmediatePropagation();compose(element.dataset.feedbackSection,element);}},true);
  new MutationObserver(()=>{const content=document.querySelector('#case-content');if(!content.children.length||content.querySelector('.case-feedback'))return;const button=document.createElement('button');button.className='case-feedback';button.textContent='Leave a note';button.addEventListener('click',()=>{previousFocus=document.activeElement;compose('Case study: '+document.querySelector('#case-title').textContent,content.querySelector('.case-intro'));});content.querySelector('.soon-wrap')?.append(button);}).observe(document.querySelector('#case-content'),{childList:true});
  message.addEventListener('input',()=>{updateCount();message.removeAttribute('aria-invalid');if(status.dataset.kind==='validation'){status.textContent='';delete status.dataset.kind;}});category.addEventListener('change',saveDraft);
  message.addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.metaKey||event.ctrlKey)){event.preventDefault();form.requestSubmit();}});
  form.addEventListener('submit',async event=>{event.preventDefault();if(submitting)return;const text=message.value.trim();if(text.length<10||text.length>2000){status.dataset.kind='validation';status.textContent=text.length<10?'Please write at least 10 characters so I can understand your suggestion.':'Please keep your note under 2,000 characters.';message.setAttribute('aria-invalid','true');message.focus({preventScroll:true});return;}if(localPreview){
      try{
        const saved=JSON.parse(sessionStorage.getItem('portfolio-preview-notes')||'[]');
        saved.push({message:text,category:category.value,section:section.dataset.label,createdAt:new Date().toISOString()});
        sessionStorage.setItem('portfolio-preview-notes',JSON.stringify(saved));
      }catch{status.textContent='Your browser could not save this preview note. Your draft is still here.';return;}
      drafts.delete(section.dataset.key);message.value='';selected=null;highlight.hidden=true;
      success.querySelector('p').textContent='Preview note saved.';
      success.querySelector('.note-success-detail').textContent='Saved in this tab only. It has not been sent to Ehi.';
      setState('sent');document.querySelector('#feedback-another').focus({preventScroll:true});return;
    }
    if(!token){
      submitting=true;send.disabled=true;status.dataset.kind='verification';status.textContent='Checking…';
      const verified=await verify();submitting=false;
      if(!modal.open)return;
      if(!verified){send.disabled=false;verificationFailed();return;}
      status.textContent='';
    }
    submitting=true;send.disabled=true;close.disabled=true;document.querySelector('#feedback-reselect').disabled=true;message.readOnly=true;category.disabled=true;categoryButton.disabled=true;send.innerHTML='<span aria-hidden="true">…</span>';send.setAttribute('aria-label','Sending note');status.textContent='';modal.setAttribute('aria-busy','true');
    const version=new URL(document.querySelector('script[src*="app.js"]').src).searchParams.get('v');
    const payload={message:text,page:location.href,section:section.dataset.label,category:category.value,website:form.elements.website.value,token,version};
    try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)});const result=await response.json();if(!response.ok||result.ok!==true)throw new Error(result.error||'Your note couldn’t be sent. Please try again.');drafts.delete(section.dataset.key);message.value='';selected=null;highlight.hidden=true;releaseWidget();success.querySelector('p').textContent='Thank you! Your note has been added ;)';success.querySelector('.note-success-detail').textContent='Sent privately to Ehi.';setState('sent');document.querySelector('#feedback-another').focus({preventScroll:true});}
    catch(error){status.textContent=error.name==='TimeoutError'?'The connection timed out. Your draft is still here—please try again.':error.message==='Failed to fetch'?'Couldn’t connect. Your draft is still here—please try again.':error.message;releaseWidget();}
    finally{submitting=false;send.disabled=false;close.disabled=false;document.querySelector('#feedback-reselect').disabled=false;message.readOnly=false;category.disabled=false;categoryButton.disabled=false;send.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';send.setAttribute('aria-label','Send note');modal.removeAttribute('aria-busy');}
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
overlay.querySelector('[data-story-work]').addEventListener('click',event=>{event.preventDefault();closeStory();document.querySelector('#navigation-stage').scrollIntoView({behavior:'smooth'});});
overlay.querySelector('[data-story-gallery]').addEventListener('click',()=>{closeStory();document.querySelector('[data-missing="Gallery"]')?.click();});
overlay.querySelector('[data-story-email]').addEventListener('click',()=>document.querySelector('#copy-email').click());
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

// Expand the paragraph above its Read less control.
document.querySelector('.story-design-toggle').addEventListener('click',function(){const expanded=this.getAttribute('aria-expanded')!=='true';this.setAttribute('aria-expanded',String(expanded));this.querySelector('span').textContent=expanded?'Read less':'Read more';this.closest('.story-design-more').classList.toggle('is-expanded',expanded);document.querySelector('#story-design-paragraph').hidden=!expanded;});

// About experience destinations and a pink hover callout.
(function storyExperienceLinks(){
 const overlay=document.querySelector('#story-overlay'),badge=document.createElement('span');badge.className='story-link-callout';badge.setAttribute('aria-hidden','true');overlay.append(badge);
 let row=null,x=0,y=0,tx=0,ty=0,vx=0,vy=0,frame=0,previous=0;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 function tick(now){frame=0;const dt=Math.min((now-previous)/1000,.032);previous=now;if(reduced.matches){x=tx;y=ty;}else{vx+=((tx-x)*240-vx*22)*dt;vy+=((ty-y)*240-vy*22)*dt;x+=vx*dt;y+=vy*dt;}badge.style.transform='translate3d('+x+'px,'+y+'px,0)';if(row&&(Math.abs(tx-x)+Math.abs(ty-y)+Math.abs(vx)+Math.abs(vy)>.1))frame=requestAnimationFrame(tick);}
 function move(px,py){tx=Math.max(12,Math.min(px+16,innerWidth-badge.offsetWidth-12));ty=Math.max(12,Math.min(py+16,innerHeight-badge.offsetHeight-12));if(!frame){previous=performance.now();frame=requestAnimationFrame(tick);}}
 function hide(){row=null;badge.classList.remove('is-visible');}
 overlay.querySelectorAll('.story-experience').forEach(el=>{
  el.addEventListener('pointerenter',event=>{if(event.pointerType==='touch'||document.body.classList.contains('feedback-selecting'))return;row=el;badge.textContent=el.querySelector('.story-company').textContent.trim()+' '+(el.dataset.storyCase?'→':'↗');badge.classList.add('is-visible');x=event.clientX+16;y=event.clientY+16;move(event.clientX,event.clientY);});
  el.addEventListener('pointermove',event=>{if(row===el)move(event.clientX,event.clientY);});el.addEventListener('pointerleave',hide);
  if(el.dataset.storyCase)el.addEventListener('click',()=>{hide();overlay.close();document.querySelector('.projects .media[data-case="'+el.dataset.storyCase+'"]').click();});
 });overlay.addEventListener('close',hide);document.querySelector('#story-feedback').addEventListener('click',hide);overlay.querySelector('.story-copy').addEventListener('scroll',hide,{passive:true});
})();
