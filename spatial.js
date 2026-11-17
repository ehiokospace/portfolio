// A looping exhibition with a camera that pans and travels through layers of artwork.
(() => {
 const stage = document.querySelector('#navigation-stage');
 const view = stage?.querySelector('.spatial-view');
 if (!view) return;
 const scene = view.querySelector('.spatial-scene');
 const holder = scene.querySelector('.spatial-nodes');
 const canvas = document.createElement('canvas');
 canvas.className = 'exhibition-webgl';
 canvas.setAttribute('aria-hidden', 'true');
 scene.prepend(canvas);
 let renderExhibition;
 let rendererRequested = false;
 async function loadRenderer() {
  if (rendererRequested) return;
  rendererRequested = true;
  try {
   const { mountExhibition } = await import('./spatial-renderer.js?v=3');
   renderExhibition = await mountExhibition(canvas);
   start();
  } catch (error) {
   console.warn('Spatial is using its HTML renderer.', error);
  }
 }
 canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  holder.classList.add('show-html-art');
 });
 canvas.addEventListener('webglcontextrestored', () => {
  holder.classList.remove('show-html-art');
  start();
 });
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const media = [
  {"title": "Thrive Pitch Win", "src": "thrive-pitch-winners.png", "description": "My co-founders and I pitched Thrive, our approach to making mental wellness more accessible through community. We won the HBCU Business Pitch Competition."},
  {"title": "Notion Campus Community", "src": "spatial-notion.gif", "description": "As a Notion Campus Leader, I helped build a community where students could learn Notion and share how they used it in their own work."},
  {"title": "ColorStack AAMU", "src": "spatial-joy-in-stem-poster.png", "description": "Black Girl Joy in STEM brought together Black women in STEM at Alabama A&M. We invited students to hear directly from the panelists about their paths and experiences."},
  {"title": "ColorStack AAMU", "src": "spatial-colorstack-gathering.jpg", "description": "As part of ColorStack AAMU’s leadership, I helped create spaces for students in tech to meet and get to know each other outside class."},
  {"title": "Sullivan Foundation Dashboard", "src": "sullivan-thumbnail-v3.png", "description": "During my Sullivan Foundation internship, I worked on a dashboard for community organizations. It brought conversations, referrals, and follow-ups into one place so teams could keep track of what needed attention."},
  {"title": "HBCU Game Jam", "src": "spatial-hbcu-game-jam.jpg", "description": "My team competed at HBCU Game Jam in spring 2025. Our project won Best Sound Design."},
  {"title": "IBM SkillsBuild Ambassador", "src": "ibm-thumbnail.gif", "description": "I served as an IBM SkillsBuild ambassador at Alabama A&M in spring 2025, helping students find free courses and resources for building tech skills."},
  {"title": "ColorStack AAMU", "src": "spatial-joy-in-stem-photos.jpg", "description": "Black Girl Joy in STEM gave students at Alabama A&M a chance to hear from Black women about their experiences in STEM and connect with others exploring similar paths."},
  {"title": "Thrive Website", "src": "thrive-website.png", "description": "As a Thrive co-founder, I worked on how to explain our approach to mental wellness to someone encountering Thrive for the first time. The website put culturally responsive care and community at the center of that introduction."},
  {"title": "ColorStack AAMU", "src": "spatial-colorstack-workshop.jpg", "description": "Through ColorStack AAMU, I helped make room for students in tech to learn from each other. Workshops gave members time to work together and ask questions outside the classroom."},
  {"title": "Sullivan Service Corps", "src": "sullivan-service-corps.jpg", "description": "I spent five weeks in Asheville with the Sullivan Foundation’s Service Corps. I worked with community organizations and took on consulting, product design, and engineering during the internship."},
  {"title": "ColorStack AAMU", "src": "spatial-colorstack-chapter-photo.jpg", "description": "I helped lead ColorStack AAMU during the 2025–2026 school year. Our chapter gave students in tech a place to find peers and build relationships on campus."},
  {"title": "Thrive Wordmark", "src": "thrive-brand-1.png", "description": "Co-founding Thrive meant figuring out how a mental wellness brand should feel to the people using it. I wanted it to feel approachable and reflect the role of community in the product."},
  {"title": "ColorStack AAMU", "src": "colorstack-thumbnail.png", "description": "Leading ColorStack AAMU in 2025–2026 gave me the chance to build a community for students in tech through chapter gatherings, workshops, and conversations like Black Girl Joy in STEM."},
  {"title": "Thrive Typography", "src": "thrive-brand-2.png", "description": "Working on Thrive’s visual identity meant thinking about how people would read it in different settings, from their first visit to the website to everyday use of the app."},
  {"title": "Thrive App Icon", "src": "thrive-brand-4.png", "description": "While building Thrive, I explored how its identity would carry from the website into the app and stay recognizable at a glance."}
 ];
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
  button.setAttribute('aria-label', 'About ' + item.title);
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
   const viewport = scene.getBoundingClientRect();
   if (!button.classList.contains('is-culled') &&
       bounds.left >= viewport.left + 8 && bounds.right <= viewport.right - 8 &&
       bounds.top >= viewport.top + 8 && bounds.bottom <= viewport.bottom - 8) return;
   target.x += node.offsetX;
   target.y += node.offsetY;
   start();
  });
  holder.append(button);
  const node = {
   button,
   url: artwork.src,
   animated: item.src.endsWith('.gif'),
   x: .075 + .85 * (column + .14 + noise(12.9898) * .76) / 5,
   y: .12 + .76 * (row + .12 + noise(78.233) * .80) / 4,
   z: 540 + noise(32.018) * 900,
   size: 108 + noise(19.49) * 150,
   offsetX: 0,
   offsetY: 0
  };
  node.width = node.size;
  node.height = node.size;
  function fitArtwork() {
   if (!artwork.naturalWidth) return;
   const ratio = artwork.naturalHeight / artwork.naturalWidth;
   node.width = Math.min(node.size, 310 / ratio);
   node.height = node.width * ratio;
   button.style.width = node.width + 'px';
   start();
  }
  button.style.width = node.width + 'px';
  fitArtwork();
  artwork.addEventListener('load', fitArtwork);
  return node;
 });

 function draw() {
  const width = view.clientWidth;
  const height = view.clientHeight;
  const tileWidth = Math.max(width * 1.25, 820);
  const tileHeight = Math.max(height * 1.38, 760);
  const responsiveSize = Math.min(1.35, Math.max(.68, width / 1150));
  const artwork = [];
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
   const offscreen = Math.abs(x) > (width + node.width * scale * 1.06) / 2 ||
     Math.abs(y) > (height + node.height * scale * 1.06) / 2;
   const alpha = opacity * edgeFade;
   const culled = offscreen || alpha < .01;
   if (culled && node.button !== document.activeElement) {
    node.button.classList.add('is-culled');
    continue;
   }
   node.button.classList.remove('is-culled');
   if (renderExhibition && !node.animated && !culled) {
    artwork.push({
     button: node.button, url: node.url, width: node.width * responsiveSize,
     x: node.offsetX - camera.hoverX, y: node.offsetY - camera.hoverY,
     distance: 420 + distance, opacity: alpha, order: Math.round(depth - distance),
     highlighted: !scene.classList.contains('is-dragging') && node.button.matches(':hover,:focus-visible'),
    });
   }
   Object.assign(node.button.style, {
    transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`,
    opacity: alpha,
    pointerEvents: alpha > .12 ? '' : 'none',
    zIndex: String(Math.round(depth - distance))
   });
  }
  if (width && height) renderExhibition?.(width, height, artwork);
 }

 function animate(time) {
  frame = 0;
  if (view.hidden || document.hidden) return;
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
  if (!frame && !view.hidden && !document.hidden) frame = requestAnimationFrame(animate);
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

 const indexSwitch = document.querySelector('.corner-views [data-view="projects"]');
 const header = document.querySelector(".shared-navigation");
 function measureHeader() {
  document.documentElement.style.setProperty('--spatial-header-height', header.getBoundingClientRect().height + 'px');
 }
 new ResizeObserver(measureHeader).observe(header);
 const sidebar = stage.closest('.work-layout').querySelector('.work-sidebar');
 stage.addEventListener('viewchange', () => {
  sidebar.inert = !view.hidden;
  if (view.hidden) {
   clearMovement();
   return;
  }
  measureHeader();
  loadRenderer();
  scene.focus({preventScroll:true});
  start();
 });
 new ResizeObserver(start).observe(view);
 window.addEventListener('blur', clearMovement);
 document.addEventListener('visibilitychange', () => { clearMovement(); start(); });

 view.addEventListener('keydown', event => {
  if (event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented ||
      event.target.closest('input, textarea, [contenteditable]')) return;
  if (event.key === 'Escape') {
   indexSwitch.click();
   return;
  }
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

 const cursor = scene.querySelector('.exhibition-cursor');
 scene.addEventListener('focusin', start);
 scene.addEventListener('focusout', start);
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
  const bounds = scene.getBoundingClientRect();
  cursor.style.transform = `translate(${event.clientX - bounds.left}px, ${event.clientY - bounds.top}px)`;
  cursor.classList.toggle('is-visible', event.pointerType === 'mouse');
  cursor.classList.toggle('over-artwork', Boolean(event.target.closest('.exhibition-artwork')));
  const previous = pointers.get(event.pointerId);
  if (!previous) {
   if (event.pointerType === 'mouse' && !reduced.matches) {
    target.hoverX = 24 * ((event.clientX - bounds.left) / bounds.width - .5);
    target.hoverY = 24 * ((event.clientY - bounds.top) / bounds.height - .5);
   }
   start();
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
 const gallery = document.createElement('dialog');
 gallery.id = 'spatial-gallery';
 gallery.setAttribute('aria-labelledby', 'spatial-gallery-title');
 gallery.setAttribute('aria-describedby', 'spatial-gallery-description');
 gallery.innerHTML = `
  <header class="spatial-gallery-header">
   <h2 id="spatial-gallery-title"></h2>
   <button type="button" class="spatial-gallery-close" aria-label="Close artifact description">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
   </button>
  </header>
  <p id="spatial-gallery-description"></p>`;
 document.body.append(gallery);
 const galleryTitle = gallery.querySelector('h2');
 const galleryDescription = gallery.querySelector('p');
 const galleryClose = gallery.querySelector('.spatial-gallery-close');
 let originNode;

 function openGallery(index, button) {
  originNode = button;
  clearMovement();
  const item = media[index];
  galleryTitle.textContent = item.title;
  galleryDescription.textContent = item.description;
  gallery.showModal();
  galleryClose.focus({preventScroll:true});
 }

 galleryClose.addEventListener('click', () => gallery.close());
 gallery.addEventListener('click', event => {
  if (event.target !== gallery) return;
  const bounds = gallery.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) gallery.close();
 });
 gallery.addEventListener('close', () => {
  if (!view.hidden) originNode?.focus({preventScroll:true});
 });
})();
