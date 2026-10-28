// Unpublished portfolio navigation and project presentation.
(() => {
  const root = document.querySelector('main');
  if (!root) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = [...document.querySelectorAll('.nav-control')];
  const status = root.querySelector('#navigation-status');
  const views = root.querySelector('.corner-views');
  const indicator = root.querySelector('.view-indicator');
  const stage = root.querySelector('.empty-stage');
  const contact = root.querySelector('.contact-control');
  const contactButton = root.querySelector('#nav-contact');
  const contactPanel = root.querySelector('.contact-reveal');
  const copyButton = root.querySelector('.contact-copy');
  const copyLabel = root.querySelector('.contact-copy-label');
  let copiedTimer;
  let contactLeaveTimer;

  function ripple(control, event, pressed = false) {
    if (reduced.matches) return;
    const rect = control.getBoundingClientRect();
    const diameter = Math.hypot(rect.width, rect.height) * 2;
    const x = event?.clientX && event.type !== 'focus' ? event.clientX - rect.left : rect.width / 2;
    const y = event?.clientY && event.type !== 'focus' ? event.clientY - rect.top : rect.height / 2;
    // Keep quick pointer re-entry from accumulating animated layers.
    const existing = [...control.querySelectorAll('.nav-ripple')];
    if (existing.length > 4) existing.slice(0, existing.length - 4).forEach(node => node.remove());
    for (const ring of [false, true]) {
      const ink = document.createElement('i');
      ink.className = 'nav-ripple' + (ring ? ' nav-ripple-ring' : '');
      ink.setAttribute('aria-hidden', 'true');
      Object.assign(ink.style, {width: diameter + 'px', height: diameter + 'px', left: x - diameter / 2 + 'px', top: y - diameter / 2 + 'px'});
      control.append(ink);
      const animation = ink.animate([
        {transform: 'scale(.04)', opacity: ring ? .14 : pressed ? .12 : .065},
        {opacity: ring ? .07 : pressed ? .06 : .035, offset: .35},
        {transform: 'scale(1)', opacity: 0}
      ], {duration: pressed ? 720 : 1000, easing: 'cubic-bezier(.16,1,.3,1)', delay: ring ? 65 : 0, fill: 'both'});
      animation.finished.then(() => ink.remove()).catch(() => ink.remove());
    }
  }
  controls.forEach(control => {
    control.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') ripple(control, event); });
    control.addEventListener('pointerdown', event => ripple(control, event, true));
    control.addEventListener('focus', event => { if (control.matches(':focus-visible')) ripple(control, event); });
    control.addEventListener('click', event => { if (control.getAttribute('aria-disabled') === 'true') event.preventDefault(); });
  });

  function placeIndicator() {
    const selected = views.querySelector('[aria-pressed="true"]');
    indicator.style.width = selected.offsetWidth + 'px';
    indicator.style.transform = `translateX(${selected.offsetLeft}px)`;
  }
  views.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => {
      views.querySelectorAll('[data-view]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      stage.dataset.activeView = button.dataset.view;
      stage.querySelector('.project-grid').hidden = button.dataset.view !== 'projects';
      stage.querySelector('.spatial-view').hidden = button.dataset.view !== 'spatial';
      stage.dispatchEvent(new Event('viewchange'));
      stage.setAttribute('aria-label', button.textContent.trim() + ' view');
      placeIndicator();
      stage.scrollIntoView({behavior: reduced.matches ? 'instant' : 'smooth', block: 'start'});
    });
    // Standard left/right navigation for this two-option view switch.
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const other = [...views.querySelectorAll('[data-view]')].find(item => item !== button);
      other.focus();
      other.click();
    });
  });
  new ResizeObserver(placeIndicator).observe(views);
  document.fonts.ready.then(placeIndicator);
  placeIndicator();

  document.querySelectorAll('[data-project-case]').forEach(button => {
    button.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('portfolio:open-project',{detail:button.dataset.projectCase}));
    });
  });

  function setContact(open, restoreFocus = false) {
    contact.classList.toggle('is-open', open);
    contactButton.classList.toggle('is-current', open);
    contactButton.setAttribute('aria-expanded', String(open));
    contactPanel.inert = !open;
    contactPanel.setAttribute('aria-hidden', String(!open));
    if (restoreFocus) contactButton.focus({preventScroll: true});
  }
  contactButton.addEventListener('click', event => {
    clearTimeout(contactLeaveTimer);
    // A mouse hover has already revealed the email; clicking should keep it available.
    setContact(event.detail > 0 || contactButton.getAttribute('aria-expanded') !== 'true');
  });
  contact.addEventListener('pointerenter', event => {
    clearTimeout(contactLeaveTimer);
    if (event.pointerType !== 'touch') setContact(true);
  });
  contact.addEventListener('pointerleave', () => {
    clearTimeout(contactLeaveTimer);
    contactLeaveTimer = setTimeout(() => {
      if (!contact.contains(document.activeElement)) setContact(false);
    }, 220);
  });
  document.addEventListener('pointerdown', event => { if (!contact.contains(event.target)) setContact(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && contactButton.getAttribute('aria-expanded') === 'true') { event.preventDefault(); setContact(false, true); }
  });
  contact.addEventListener('focusout', event => {
    if (event.relatedTarget && !contact.contains(event.relatedTarget)) setContact(false);
  });
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('ehigoko1@gmail.com');
      clearTimeout(copiedTimer);
      copyLabel.textContent = 'Copied';
      copyButton.classList.add('is-copied');
      status.textContent = 'Email address copied.';
      copiedTimer = setTimeout(() => {copyLabel.textContent = 'Copy'; copyButton.classList.remove('is-copied');}, 2200);
    } catch {
      copyLabel.textContent = 'Select';
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(copyButton.firstElementChild);
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Select and copy ehigoko1@gmail.com.';
    }
  });
  const info = root.querySelector('[data-nav-info]');
  const about = document.querySelector('#story-overlay');
  new MutationObserver(() => {
    info.classList.toggle('is-current', about.open);
    if (about.open) info.setAttribute('aria-current', 'page');
    else info.removeAttribute('aria-current');
  }).observe(about, {attributes: true, attributeFilter: ['open']});
})();

// Keep the floating annotation entry available inside native modal dialogs, too.
(() => {
  const launcher = document.querySelector('#annotate-feedback');
  const story = document.querySelector('#story-overlay');
  const study = document.querySelector('#case-study');
  const palette = document.querySelector('#command-palette');
  function mountLauncher() {
    const host = story.open ? story : study.open ? study : document.body;
    if (launcher.parentElement !== host) host.append(launcher);
    launcher.hidden = palette.open;
  }
  const observer = new MutationObserver(mountLauncher);
  [story, study, palette].forEach(dialog => observer.observe(dialog, {attributes: true, attributeFilter: ['open']}));
  mountLauncher();
})();

// Pause off-screen previews and preserve the visitor's playback choice.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.project-grid .project-panel').forEach(card => {
    if (card.querySelector('.project-thumbnail-image')) return;
    const video = card.querySelector('video');
    const projectName = card.querySelector('h2').textContent.trim();
    const launch = card.querySelector('.project-launch');
    const control = document.createElement('button');
    control.type = 'button'; control.className = 'project-preview-control';
    control.innerHTML = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle class="preview-progress" cx="16" cy="16" r="12" stroke="currentColor" stroke-width="1.4" stroke-dasharray="8 68" transform="rotate(-90 16 16)"/><path class="preview-play" d="M13.8 10.6 20.7 15.2Q21.9 16 20.7 16.8L13.8 21.4Q12.4 22.3 12.4 20.6V11.4Q12.4 9.7 13.8 10.6Z" fill="currentColor"/><path class="preview-pause" d="M13 11v10m6-10v10" stroke="currentColor" stroke-width="2.3"/></svg>';
    control.setAttribute('aria-label', video ? `Play ${projectName} preview` : launch.getAttribute('aria-label'));
    if (!video && launch.getAttribute('aria-disabled') === 'true') { control.disabled = true; control.setAttribute('aria-label', 'Preview coming soon'); }
    card.append(control);
    if (!video) { control.addEventListener('click', () => launch.click()); return; }
    let visible = false;
    let userPaused = reduced.matches;
    const update = () => {
      control.classList.toggle('is-playing', !video.paused);
      control.setAttribute('aria-label', (video.paused ? 'Play' : 'Pause') + ` ${projectName} preview`);
    };
    function sync() {
      if (visible && !userPaused && !reduced.matches && !document.hidden && document.querySelector('#navigation-stage').dataset.activeView === 'projects') video.play().catch(update);
      else video.pause();
    }
    control.addEventListener('click', () => {
      userPaused = !video.paused;
      if (video.paused) video.play().catch(update); else video.pause();
    });
    ['play', 'pause', 'loadeddata'].forEach(name => video.addEventListener(name, update));
    video.addEventListener('timeupdate', () => {
      const fraction = video.duration ? video.currentTime / video.duration : 0;
      control.querySelector('circle').style.strokeDasharray = `${Math.max(8, fraction * 75.4)} 75.4`;
    });
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, {threshold: .15}).observe(video);
    document.addEventListener('visibilitychange', sync);
    document.querySelector('#navigation-stage').addEventListener('viewchange', sync);
    reduced.addEventListener('change', () => { userPaused = reduced.matches; sync(); });
  });
})();

// A quiet, locally synthesized tap, played only after deliberate interaction.
(() => {
  let muted = false;
  try { muted = localStorage.getItem('portfolio-sound-muted') === 'true'; } catch {}
  let context;
  const toggles = [];
  const icon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path class="sound-on" d="M15 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path class="sound-off" d="m15 9 6 6m0-6-6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  function refresh() {
    toggles.forEach(button => {
      button.setAttribute('aria-pressed', String(muted));
      button.setAttribute('aria-label', muted ? 'Unmute interaction sounds' : 'Mute interaction sounds');
      button.title = muted ? 'Sound off' : 'Sound on';
    });
  }
  document.querySelectorAll('[data-sound-control-host]').forEach(host => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'interaction-sound'; button.innerHTML = icon;
    host.append(button); toggles.push(button);
    button.addEventListener('click', toggleSound);
  });
  function toggleSound() { muted = !muted; try { localStorage.setItem('portfolio-sound-muted', String(muted)); } catch {} refresh(); }
  document.addEventListener('portfolio:toggle-sound', toggleSound);
  refresh();
  function tap() {
    if (muted) return;
    try {
      context ||= new (window.AudioContext || window.webkitAudioContext)();
      context.resume().then(() => {
        const now = context.currentTime;
        const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * .025), context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i=0;i<data.length;i++) data[i] = (Math.random()*2-1)*Math.exp(-i/(context.sampleRate*.0035));
        const source = context.createBufferSource(); source.buffer = buffer;
        const filter = context.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1900; filter.Q.value = .7;
        const gain = context.createGain(); gain.gain.setValueAtTime(.12, now); gain.gain.exponentialRampToValueAtTime(.001, now+.025);
        source.connect(filter).connect(gain).connect(context.destination); source.start(now); source.stop(now+.03);
      }).catch(() => {});
    } catch {}
  }
  document.addEventListener('click', event => {
    if (!event.isTrusted || !event.target.closest('button, a, select, [role="option"]')) return;
    if (event.target.closest('[disabled], [aria-disabled="true"]')) return;
    tap();
  });
})();

// Thumbnail discipline labels: independently damped rows follow the native cursor.
(() => {
  const fine = matchMedia('(min-width:701px) and (hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const labels = {
    ibm: ['GROWTH', 'COMMUNITY'],
    aven: ['PRODUCT DESIGN', 'HEALTHCARE'],
    thrive: ['WINNING PITCH', 'PRODUCT DESIGN'],
    'internal-tooling': ['PRODUCT DESIGN', 'ENGINEERING'],
    notion: ['GROWTH', 'COMMUNITY'],
    apron: ['PRODUCT DESIGN', 'INTERACTION DESIGN'],
    colorstack: ['GROWTH', 'COMMUNITY']
  };
  const host = document.createElement('div');
  host.className = 'project-cursor-labels'; host.setAttribute('aria-hidden', 'true');
  const rows = [0,1].map(i => {
    const row = document.createElement('div'); row.className = 'project-cursor-row';
    const clip = document.createElement('div'); clip.className = 'project-cursor-clip';
    clip.style.setProperty('--label-delay', `${i * 70}ms`);
    const text = document.createElement('span'); clip.append(text); row.append(clip); host.append(row);
    return {row, clip, text, x:0, y:0, width:0};
  });
  document.body.append(host);
  let active = null, frame = 0, reveal = 0, stopAt = 0, previous = 0;
  const point = {x:0, y:0};
  const speeds = [.14,.1,.07];
  function tick(now) {
    frame = 0;
    const dt = Math.min(3, Math.max(.25, (now - (previous || now - 16.67)) / 16.67)); previous = now;
    let moving = false;
    rows.forEach((r,i) => {
      const x = Math.max(8,Math.min(point.x + 14, innerWidth - r.width - 8));
      const y = Math.max(8,Math.min(point.y + 14, innerHeight - 2 * 40 - 8)) + i * 40;
      const ease = reduced.matches ? 1 : 1 - (1 - speeds[i]) ** dt;
      r.x += (x-r.x)*ease; r.y += (y-r.y)*ease;
      if(Math.abs(x-r.x)>.1 || Math.abs(y-r.y)>.1)moving=true;
      r.row.style.transform = `translate3d(${r.x}px,${r.y}px,0)`;
    });
    if(moving || now < stopAt)frame=requestAnimationFrame(tick);
  }
  function wake(){if(!frame){previous=0;frame=requestAnimationFrame(tick);}}
  function hide(){
    active=null; cancelAnimationFrame(reveal); host.classList.remove('is-visible');
    stopAt=performance.now()+450; wake();
  }
  function resolve(element) {
    if(!fine.matches || document.hidden || document.body.classList.contains('feedback-selecting') || document.querySelector('dialog[open]'))return null;
    const card=element?.closest?.('.project-grid .project-panel');
    if(!card || element.closest('.project-preview-control') || card.closest('[hidden]'))return null;
    const bounds=card.querySelector('.project-image-space').getBoundingClientRect();
    if(point.x<bounds.left || point.x>bounds.right || point.y<bounds.top || point.y>bounds.bottom)return null;
    return labels[(card.querySelector('[data-project-case]')?.dataset.projectCase || card.querySelector('[data-project-tags]')?.dataset.projectTags)]?card:null;
  }
  function update(element) {
    const card=resolve(element);
    if(card===active){if(card)wake();return;}
    if(!card){if(active)hide();return;}
    active=card;cancelAnimationFrame(reveal);host.classList.remove('is-visible');
    labels[card.querySelector('[data-project-case]')?.dataset.projectCase || card.querySelector('[data-project-tags]')?.dataset.projectTags].forEach((text,i)=>{
      const r=rows[i];r.text.textContent=text;r.width=r.text.offsetWidth;r.clip.style.setProperty('--label-width',r.width+'px');
      r.x=Math.max(8,Math.min(point.x+14,innerWidth-r.width-8));
      r.y=Math.max(8,Math.min(point.y+14,innerHeight-3*34-8))+i*34;
      r.row.style.transform=`translate3d(${r.x}px,${r.y}px,0)`;
      r.clip.getBoundingClientRect();
    });
    reveal=requestAnimationFrame(()=>{if(active===card)host.classList.add('is-visible');});wake();
  }
  document.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;point.x=e.clientX;point.y=e.clientY;update(e.target);},{passive:true});
  window.addEventListener('scroll',()=>update(document.elementFromPoint(point.x,point.y)),{passive:true,capture:true});
  for(const event of ['blur','pagehide'])window.addEventListener(event,hide);
  document.documentElement.addEventListener('pointerleave',hide);
  document.addEventListener('visibilitychange',hide);
  document.addEventListener('keydown',hide,true);
  fine.addEventListener('change',hide);
  new MutationObserver(()=>{if(active && !resolve(document.elementFromPoint(point.x,point.y)))hide();}).observe(document.body,{attributes:true,subtree:true,attributeFilter:['open','hidden']});
})();

// Compact navigation drawer on narrow screens; reuse the original live controls.
(() => {
 const breakpoint=matchMedia('(max-width:700px)');
 const header=document.querySelector('.shared-navigation .corner-top-right');
 const sidebar=document.querySelector('.work-sidebar');
 const links=sidebar.querySelector('.sidebar-links');
 const views=header.querySelector('.corner-views');
 const linksAnchor=document.createComment('Sidebar navigation');links.before(linksAnchor);
 const viewsAnchor=document.createComment('Portfolio views');views.before(viewsAnchor);
 const toggle=document.createElement('button');toggle.type='button';toggle.className='mobile-navigation-toggle';toggle.setAttribute('aria-label','Open navigation');toggle.setAttribute('aria-haspopup','dialog');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','mobile-navigation-drawer');
 toggle.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M4 8h16M4 16h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';header.append(toggle);
 const drawer=document.createElement('dialog');drawer.id='mobile-navigation-drawer';drawer.setAttribute('aria-label','Navigation');drawer.innerHTML='<header><span>NAVIGATION</span><button type="button" aria-label="Close navigation">CLOSE</button></header><div class="mobile-navigation-body"></div>';
 document.body.append(drawer);const body=drawer.querySelector('.mobile-navigation-body');
 toggle.addEventListener('click',()=>{drawer.showModal();toggle.setAttribute('aria-expanded','true');});
 drawer.querySelector('header button').addEventListener('click',()=>drawer.close());
 drawer.addEventListener('close',()=>toggle.setAttribute('aria-expanded','false'));
 drawer.addEventListener('click',event=>{if(event.target===drawer)drawer.close();else if(event.target.closest('.sidebar-links a,.sidebar-links button,.nav-control'))drawer.close();});
 function sync(){if(breakpoint.matches){body.append(views,links);}else{if(drawer.open)drawer.close();viewsAnchor.after(views);linksAnchor.after(links);}}
 breakpoint.addEventListener('change',sync);sync();
})();

// Put the shared header before the film on mobile, retaining desktop order.
(() => {
 const header=document.querySelector('main>.shared-navigation');
 const intro=document.querySelector('main>.intro-landing');
 if(!header||!intro)return;
 const anchor=document.createComment('Desktop header position');header.before(anchor);
 const mobile=matchMedia('(max-width:700px)');
 const sync=()=>{if(mobile.matches)intro.before(header);else anchor.after(header);};
 mobile.addEventListener('change',sync);sync();
})();
