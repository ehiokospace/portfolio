// A looping exhibition with a camera that pans and travels through layers of artwork.
(() => {
 const stage = document.querySelector('#navigation-stage');
 const view = stage?.querySelector('.spatial-view');
 if (!view) return;
 const scene = view.querySelector('.spatial-scene');
 const holder = scene.querySelector('.spatial-nodes');
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const media=[
  {
    "group": "thrive",
    "title": "Winning Pitch",
    "src": "thrive-pitch-winners.png"
  },
  {
    "group": "notion",
    "title": "Campus Community",
    "src": "spatial-notion.gif"
  },
  {
    "group": "colorstack",
    "title": "Chapter Gathering",
    "src": "spatial-colorstack-gathering.jpg"
  },
  {
    "group": "aven",
    "title": "My Insights",
    "src": "aven-thumbnail.png"
  },
  {
    "group": "sullivan",
    "title": "Dashboard",
    "src": "sullivan-thumbnail-v3.png"
  },
  {
    "group": "thrive",
    "title": "Focus Challenge",
    "src": "thrive-focus.png"
  },
  {
    "group": "ibm",
    "title": "Skillsbuild Ambassador",
    "src": "ibm-thumbnail.gif"
  },
  {
    "group": "colorstack",
    "title": "Community Workshop",
    "src": "spatial-colorstack-workshop.jpg"
  },
  {
    "group": "thrive",
    "title": "Birthday Onboarding",
    "src": "thrive-birthday.png"
  },
  {
    "group": "thrive",
    "title": "Name Onboarding",
    "src": "thrive-name.png"
  },
  {
    "group": "sullivan",
    "title": "Service Corps",
    "src": "sullivan-service-corps.jpg"
  },
  {
    "group": "thrive",
    "title": "Stay Connected",
    "src": "thrive-notifications.png"
  },
  {
    "group": "thrive",
    "title": "Website",
    "src": "thrive-website.png"
  },
  {
    "group": "thrive",
    "title": "Wordmark",
    "src": "thrive-brand-1.png"
  },
  {
    "group": "thrive",
    "title": "Typography",
    "src": "thrive-brand-2.png"
  },
  {
    "group": "thrive",
    "title": "Product Preview",
    "src": "thrive-thumbnail.jpg"
  },
  {
    "group": "thrive",
    "title": "App Icon",
    "src": "thrive-brand-4.png"
  }
];
 const groups={thrive:{name:"Thrive"},sullivan:{name:"Sullivan Foundation"},notion:{name:"Notion"},colorstack:{name:"ColorStack AAMU"},aven:{name:"Aven"},ibm:{name:"IBM"}};
 const camera = { x: 0, y: 0, z: 0, hoverX: 0, hoverY: 0 };
 const target = { ...camera };
 const keys = new Set();
 const pointers = new Map();
 const directions = {
  w: [0, 0, 1], a: [-1, 0], s: [0, 0, -1], d: [1, 0],
  ArrowUp: [0, -1], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowRight: [1, 0]
 };
 const depth = 3400;
 const wrap = (value, length) => ((value % length) + length) % length;
 let frame = 0;
 let lastTime = 0;
 let dragged = false;

 // Give each artwork its own position and depth.
 const nodes = media.map((item, index) => {
  const column = index % 5;
  const row = Math.floor(index / 5);
  const noise = (seed) => wrap(Math.sin((index + 1) * seed) * 43758.5453, 1);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'exhibition-artwork';
  const label = groups[item.group].name + ' · ' + item.title;
  button.setAttribute('aria-label', 'View ' + label);
  const artwork = document.createElement('img');
  artwork.src = './assets/' + item.src;
  artwork.alt = '';
  artwork.draggable = false;
  artwork.decoding = 'async';
  artwork.style.objectPosition = item.position || 'center';
  button.append(artwork);
  button.addEventListener('click', event => {
   if (!dragged || event.detail === 0) openGallery(index, button);
  });
  button.addEventListener('focus', () => {
   if (!button.matches(':focus-visible')) return;
   const bounds = button.getBoundingClientRect();
   if (!button.classList.contains('is-culled') &&
       bounds.left >= 8 && bounds.right <= view.clientWidth - 8 &&
       bounds.top >= 8 && bounds.bottom <= view.clientHeight - 8) return;
   target.x += node.offsetX;
   target.y += node.offsetY;
   start();
  });
  holder.append(button);
  const node = {
   button,
   x: (column + .14 + noise(12.9898) * .76) / 5,
   y: (row + .12 + noise(78.233) * .80) / 4,
   z: 540 + noise(32.018) * 900,
   size: 108 + noise(19.49) * 150,
   offsetX: 0,
   offsetY: 0
  };
  button.style.width = node.size + 'px';
  return node;
 });

 function draw() {
  const width = view.clientWidth;
  const height = view.clientHeight;
  const tileWidth = Math.max(width * 1.25, 820);
  const tileHeight = Math.max(height * 1.38, 760);
  const responsiveSize = Math.min(1.35, Math.max(.68, width / 1150));
  for (const node of nodes) {
   const distance = wrap(node.z - camera.z, depth);
   const perspective = 1350 / (420 + distance);
   node.offsetX = wrap(node.x * tileWidth - camera.x, tileWidth) - tileWidth / 2;
   node.offsetY = wrap(node.y * tileHeight - camera.y, tileHeight) - tileHeight / 2;
   // Repeated world boundaries stay outside the visible area on the near layers.
   const x = (node.offsetX - camera.hoverX) * perspective;
   const y = (node.offsetY - camera.hoverY) * perspective;
   const scale = perspective * responsiveSize;
   const opacity = Math.min(1, distance / 180, (depth - distance) / 250) *
     Math.max(.24, 1.18 - distance / 4200);
   const edgeFade = Math.min(1, (tileWidth / 2 - Math.abs(node.offsetX)) / 90,
     (tileHeight / 2 - Math.abs(node.offsetY)) / 90);
   // Allow for the hover scale when checking whether the artwork can enter the frame.
   const offscreen = Math.abs(x) > (width + node.size * scale * 1.06) / 2 ||
     Math.abs(y) > (height + 245 * scale * 1.06) / 2;
   const alpha = opacity * edgeFade;
   const culled = offscreen || alpha < .01;
   if (culled && node.button !== document.activeElement) {
    node.button.classList.add('is-culled');
    continue;
   }
   node.button.classList.remove('is-culled');
   Object.assign(node.button.style, {
    transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`,
    opacity: alpha,
    pointerEvents: alpha > .12 ? '' : 'none',
    zIndex: String(Math.round(depth - distance))
   });
  }
 }

 function animate(time) {
  frame = 0;
  if (!view.open || document.hidden) return;
  const elapsed = lastTime ? Math.min(32, time - lastTime) : 16;
  lastTime = time;
  for (const key of keys) {
   const [x, y, z = 0] = directions[key];
   target.x += x * elapsed * .53;
   target.y += y * elapsed * .53;
   target.z += z * elapsed * .95;
  }
  const blend = reduced.matches ? 1 : 1 - Math.exp(-elapsed / 85);
  let settling = false;
  for (const axis of ['x', 'y', 'z', 'hoverX', 'hoverY']) {
   const remaining = target[axis] - camera[axis];
   camera[axis] += Math.abs(remaining) < .05 ? remaining : remaining * blend;
   settling ||= Math.abs(remaining) >= .05;
  }
  draw();
  if (settling || keys.size) start();
  else lastTime = 0;
 }

 function start() {
  if (!frame && view.open && !document.hidden) frame = requestAnimationFrame(animate);
 }

 function clearHover() {
  target.hoverX = 0;
  target.hoverY = 0;
  start();
 }

 function clearMovement() {
  clearHover();
  keys.clear();
  pointers.clear();
  scene.classList.remove('is-dragging');
  view.querySelectorAll('[data-move]').forEach(button => button.classList.remove('is-held'));
 }

 function reset() {
  Object.assign(target, { x: 0, y: 0, z: 0 });
  start();
 }

 function pressDirection(key) {
  keys.add(key);
  view.querySelector(`[data-move="${key}"]`)?.classList.add('is-held');
  start();
 }

 function releaseDirection(key) {
  keys.delete(key);
  view.querySelector(`[data-move="${key}"]`)?.classList.remove('is-held');
 }

 const indexSwitch = document.querySelector('.shared-navigation [data-view="projects"]');
 view.querySelector('.exhibition-exit').addEventListener('click', () => indexSwitch.click());
 view.addEventListener('cancel', event => {
  event.preventDefault();
  indexSwitch.click();
 });
 stage.addEventListener('viewchange', () => {
  if (stage.dataset.activeView === 'spatial' && !view.open) {
   view.showModal();
   scene.focus({preventScroll:true});
   start();
  } else if (stage.dataset.activeView !== 'spatial' && view.open) {
   clearMovement();
   view.close();
  }
 });
 new ResizeObserver(start).observe(view);
 window.addEventListener('blur', clearMovement);
 document.addEventListener('visibilitychange', () => { clearMovement(); start(); });

 view.addEventListener('keydown', event => {
  if (event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented ||
      event.target.closest('input, textarea, [contenteditable]')) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (Object.hasOwn(directions, key)) {
   event.preventDefault();
   pressDirection(key);
  } else if (['+', '=', '-', 'Home'].includes(key)) {
   event.preventDefault();
   if (key === 'Home') reset();
   else target.z += key === '-' ? -145 : 145;
   start();
  }
 });
 window.addEventListener('keyup', event => releaseDirection(event.key.length === 1 ? event.key.toLowerCase() : event.key));

 for (const button of view.querySelectorAll('[data-move]')) {
  const key = button.dataset.move;
  button.addEventListener('pointerdown', event => {
   if (event.button !== 0) return;
   button.setPointerCapture(event.pointerId);
   pressDirection(key);
  });
  button.addEventListener('lostpointercapture', () => releaseDirection(key));
  button.addEventListener('click', event => {
   if (event.detail !== 0) return;
   const [x, y, z = 0] = directions[key];
   target.x += x * 100;
   target.y += y * 100;
   target.z += z * 145;
   start();
  });
 }
 view.querySelector('.exhibition-reset').addEventListener('click', reset);

 const cursor = scene.querySelector('.exhibition-cursor');
 scene.addEventListener('pointerleave', () => {
  cursor.classList.remove('is-visible');
  clearHover();
 });
 scene.addEventListener('pointerdown', event => {
  if (event.button !== 0 || pointers.size >= 2) return;
  if (pointers.size === 0) dragged = false;
  clearHover();
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 2) {
   dragged = true;
   for (const id of pointers.keys()) scene.setPointerCapture(id);
  }
 });
 scene.addEventListener('pointermove', event => {
  cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  cursor.classList.toggle('is-visible', event.pointerType === 'mouse');
  cursor.classList.toggle('over-artwork', Boolean(event.target.closest('.exhibition-artwork')));
  const previous = pointers.get(event.pointerId);
  if (!previous) {
   if (event.pointerType === 'mouse' && !reduced.matches) {
    const bounds = scene.getBoundingClientRect();
    target.hoverX = 24 * ((event.clientX - bounds.left) / bounds.width - .5);
    target.hoverY = 24 * ((event.clientY - bounds.top) / bounds.height - .5);
    start();
   }
   return;
  }
  const dx = event.clientX - previous.x;
  const dy = event.clientY - previous.y;
  if (!dragged && Math.hypot(dx, dy) < 5) return;
  dragged = true;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (!scene.hasPointerCapture(event.pointerId)) scene.setPointerCapture(event.pointerId);
  scene.classList.add('is-dragging');
  if (pointers.size === 2) {
   const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)[1];
   target.z += (Math.hypot(event.clientX - other.x, event.clientY - other.y) -
     Math.hypot(previous.x - other.x, previous.y - other.y)) * 7;
  } else {
   target.x -= dx * 1.25;
   target.y -= dy * 1.25;
  }
  start();
 });
 for (const type of ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave']) {
  scene.addEventListener(type, event => {
   if (type === 'lostpointercapture' && event.target !== scene) return;
   if (type === 'pointerleave' && scene.hasPointerCapture(event.pointerId)) return;
   pointers.delete(event.pointerId);
   if (!pointers.size) scene.classList.remove('is-dragging');
  });
 }
 scene.addEventListener('wheel', event => {
  event.preventDefault();
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? view.clientHeight : 1;
  target.z -= Math.max(-180, Math.min(180, event.deltaY * unit)) * (event.ctrlKey ? 8 : 3);
  target.x += event.deltaX * unit * .65;
  start();
 }, {passive:false});
 const gallery=document.createElement('dialog');gallery.id='spatial-gallery';
 gallery.setAttribute('aria-labelledby','spatial-gallery-title');
 gallery.innerHTML=`<div class="spatial-gallery-shell"><header class="spatial-gallery-header"><h2 id="spatial-gallery-title"></h2><button type="button" class="spatial-gallery-case">View case study ↗</button><button type="button" class="spatial-gallery-close" aria-label="Close media"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button></header><figure class="spatial-gallery-media"><div class="spatial-gallery-art"></div><figcaption></figcaption></figure><div class="spatial-gallery-thumbnails" role="group"></div></div>`;
 document.body.append(gallery);
 const galleryArt=gallery.querySelector('.spatial-gallery-art');
 const galleryStrip=gallery.querySelector('.spatial-gallery-thumbnails');
 const caseButton=gallery.querySelector('.spatial-gallery-case');
 let galleryIndex=0,originNode=null;
 function paintMedia(host,item){
  host.replaceChildren();host.style.background=getComputedStyle(document.querySelector('.panel-'+item.group)).getPropertyValue('--project-surface');
  if(item.src){
   const image=document.createElement('img');image.src='./assets/'+item.src;image.alt=groups[item.group].name+' — '+item.title;image.draggable=false;
   if(/^thrive-(focus|birthday|name|notifications)\.png$/.test(item.src)){image.style.objectFit='contain';}
   image.style.objectPosition=item.position||'center';if(item.detail)image.className='spatial-gallery-detail';host.append(image);
  }else{
   const placeholder=document.createElement('div');placeholder.className='spatial-gallery-placeholder';
   const title=document.createElement('span');title.textContent=groups[item.group].name;
   const label=document.createElement('span');label.textContent=item.title+' · Media placeholder';placeholder.append(title,label);host.append(placeholder);
  }
 }
 function showMedia(index){
  galleryIndex=index;const item=media[index],group=groups[item.group];
  gallery.querySelector('h2').textContent=group.name;
  caseButton.hidden=!['thrive','sullivan'].includes(item.group);
  gallery.querySelector('figcaption').textContent=item.title;
  paintMedia(galleryArt,item);galleryStrip.replaceChildren();galleryStrip.setAttribute('aria-label','More from '+group.name);
  media.forEach((other,i)=>{
   if(other.group!==item.group)return;
   const thumb=document.createElement('button');thumb.type='button';thumb.className='spatial-gallery-thumb';
   thumb.setAttribute('aria-label','Show '+other.title);thumb.setAttribute('aria-pressed',String(i===index));
   paintMedia(thumb,other);thumb.addEventListener('click',()=>{showMedia(i);galleryStrip.querySelector('[aria-pressed="true"]').focus({preventScroll:true});});
   galleryStrip.append(thumb);
  });
 }
 function openGallery(index, button) {
  originNode = button;
  clearMovement();
  showMedia(index);
  gallery.showModal();
  gallery.querySelector('.spatial-gallery-close').focus({preventScroll:true});
 }
 function closeGallery() { gallery.close(); }
 gallery.querySelector('.spatial-gallery-close').addEventListener('click',closeGallery);
 gallery.addEventListener('click',event=>{if(event.target===gallery)closeGallery();});
 gallery.addEventListener('close', () => {
  if (view.open && !document.querySelector('#case-study[open]')) originNode?.focus({preventScroll:true});
 });
 caseButton.addEventListener('click', () => {
  const launch = document.querySelector('.panel-' + media[galleryIndex].group + ' .project-launch');
  closeGallery();
  launch?.click();
 });
 gallery.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
  event.preventDefault();const related=media.map((item,index)=>({item,index})).filter(entry=>entry.item.group===media[galleryIndex].group);
  const current=related.findIndex(entry=>entry.index===galleryIndex);
  showMedia(related[(current+(event.key==='ArrowRight'?1:-1)+related.length)%related.length].index);
 });
})();
