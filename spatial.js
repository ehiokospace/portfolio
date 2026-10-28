// Connected project constellation with an orbit camera and a continuous focus move.
(() => {
 const stage=document.querySelector('#navigation-stage'),view=document.querySelector('.spatial-view');
 const scene=view.querySelector('.spatial-scene'),canvas=scene.querySelector('canvas'),ctx=canvas.getContext('2d'),holder=scene.querySelector('.spatial-nodes');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let yaw=-.35,pitch=-.12,vx=0,vy=0,width=0,height=0,raf=0,last=0,zoom=0,targetZoom=0;
 let selected=null,hovered=null,dragging=false,moved=false,previous=null,focusMove=null,pinchDistance=0;
 const pointers=new Map();
 // Each entry is one media piece. Detail crops are labeled as details; empty slots
 // remain explicit placeholders until the corresponding deliverables are supplied.
 const media=[
  {group:'thrive',title:'App mockup',src:'mental-health.png'},
  {group:'sullivan',title:'Dashboard',src:'internal-tooling.png'},
  {group:'notion',title:'Campus materials',src:'story-notion.jpg'},
  {group:'colorstack',title:'Community artwork',src:'community.png'},
  {group:'thrive',title:'Winning pitch',src:'story-business-pitch.jpg'},
  {group:'sullivan',title:'Dashboard detail',src:'internal-tooling.png',detail:true,position:'65% 35%'},
  {group:'notion',title:'Campus detail',src:'story-notion.jpg',detail:true,position:'45% 65%'},
  {group:'colorstack',title:'Chapter gathering',src:'story-colorstack.jpg'},
  {group:'thrive',title:'Media 03'},
  {group:'sullivan',title:'Service Corps',src:'sullivan-service-corps.jpg'},
  {group:'notion',title:'Media 03'},
  {group:'colorstack',title:'Artwork detail',src:'community.png',detail:true,position:'50% 80%'},
  {group:'thrive',title:'Media 04'},
  {group:'sullivan',title:'Media 04'},
  {group:'notion',title:'Media 04'},
  {group:'colorstack',title:'Media 04'},
  {group:'sullivan',title:'Media 05'},
  {group:'colorstack',title:'Media 05'}
 ];
 const groups={
  thrive:{name:'Thrive',color:'195,130,162'},
  sullivan:{name:'Sullivan Foundation',color:'109,155,181'},
  notion:{name:'Notion',color:'139,125,184'},
  colorstack:{name:'ColorStack AAMU',color:'153,143,104'}
 };
 const nodes=media.map((item,i)=>{
  const panel=document.querySelector('.panel-'+item.group),launch=panel.querySelector('.project-launch');
  const title=groups[item.group].name+' · '+item.title;
  const button=document.createElement('button');button.type='button';button.className='spatial-node';
  button.dataset.experience=item.group;button.dataset.media=item.title;
  button.setAttribute('aria-label','Open '+title);
  button.style.setProperty('--node-surface',getComputedStyle(panel).getPropertyValue('--project-surface'));
  const art=document.createElement('span');art.className='spatial-node-art';art.setAttribute('aria-hidden','true');
  if(item.src){
   const image=document.createElement('img');image.src='./assets/'+item.src;image.alt='';image.draggable=false;
   image.style.objectPosition=item.position||'center';
   if(item.detail)image.className='spatial-detail';
   art.append(image);
  }else{
   art.classList.add('spatial-media-placeholder');
   const name=document.createElement('span');name.textContent=groups[item.group].name;
   const slot=document.createElement('span');slot.textContent=item.title.toUpperCase();art.append(name,slot);
  }
  const caption=document.createElement('span');caption.className='spatial-node-caption';
  const captionText=document.createElement('span');captionText.className='spatial-node-title';captionText.textContent=item.title;
  caption.append(captionText);button.append(art,caption);holder.append(button);
  // Equal-area latitude bands paired with the golden angle cover the whole sphere.
  const pointIndex=(i*7)%media.length;
  const y=1-2*(pointIndex+.5)/media.length,angle=pointIndex*Math.PI*(3-Math.sqrt(5)),ring=Math.sqrt(1-y*y);
  const node={button,launch,item,group:item.group,point:[Math.cos(angle)*ring,y,Math.sin(angle)*ring],index:i};
  button.addEventListener('pointerenter',()=>{hovered=i;});
  button.addEventListener('pointerleave',()=>{hovered=null;});
  button.addEventListener('focus',()=>{hovered=i;vx=vy=0;});
  button.addEventListener('blur',()=>{hovered=null;});
  button.addEventListener('click',event=>{
   event.stopPropagation();if(moved)return;
   openGallery(i);
  });
  return node;
 });
 // One minimum-length tree per experience keeps the idle constellation quiet.
 const edges=[];
 Object.keys(groups).forEach(group=>{
  const members=nodes.filter(node=>node.group===group),connected=new Set([members[0].index]);
  while(connected.size<members.length){
   let best=null;
   members.filter(node=>connected.has(node.index)).forEach(a=>members.filter(node=>!connected.has(node.index)).forEach(b=>{
    const score=dot(a.point,b.point);if(!best||score>best.score)best={a:a.index,b:b.index,score};
   }));
   edges.push({...best,group,color:groups[group].color});connected.add(best.b);
  }
 });
 scene.dataset.idleConnections=String(edges.length);
 function dot(a,b){return a.reduce((sum,v,i)=>sum+v*b[i],0);}
 function rotate([x,y,z]){const a=x*Math.cos(yaw)+z*Math.sin(yaw),b=z*Math.cos(yaw)-x*Math.sin(yaw);return[a,y*Math.cos(pitch)-b*Math.sin(pitch),y*Math.sin(pitch)+b*Math.cos(pitch)];}
 function project(point){
  const[x,y,z]=rotate(point),radius=Math.min(width*.36,height*.37),distance=3.8-zoom*.65;
  const perspective=distance/(distance-z),magnification=1+zoom*1.4;
  return{x:x*radius*perspective*magnification,y:y*radius*perspective*magnification,z,scale:perspective*(1+zoom*.42)};
 }
 function arc(a,b,t){const cosine=Math.max(-.9999,Math.min(.9999,dot(a,b))),angle=Math.acos(cosine),sin=Math.sin(angle);return a.map((v,i)=>(v*Math.sin((1-t)*angle)+b[i]*Math.sin(t*angle))/sin);}
 function draw(){
  ctx.clearRect(0,0,width,height);
  const active=hovered??selected;
  const paths=edges.map(edge=>({...edge,highlight:false}));
  if(active!==null){
   const group=nodes[active].group;
   nodes.filter(node=>node.index!==active&&node.group===group).forEach(node=>{
    const existing=paths.find(edge=>(edge.a===active&&edge.b===node.index)||(edge.b===active&&edge.a===node.index));
    if(existing)existing.highlight=true;
    else paths.push({a:active,b:node.index,group,color:groups[group].color,highlight:true});
   });
  }
  paths.forEach(edge=>{
   const a=nodes[edge.a].point,b=nodes[edge.b].point;
   const angle=Math.acos(Math.max(-1,Math.min(1,dot(a,b))));
   const steps=Math.max(12,Math.min(74,Math.round(angle*Math.min(width,height)*.37/8)));
   for(let step=1;step<steps;step++){
    const p=project(arc(a,b,step/steps));
    const alpha=edge.highlight ? .32+(p.z+1)*.1 : (active===null ? .2 : .055)*(.7+(p.z+1)*.15);
    ctx.fillStyle=`rgba(${edge.color},${alpha})`;
    ctx.beginPath();ctx.arc(width/2+p.x,height/2+p.y,edge.highlight ? 1.1 : .95,0,Math.PI*2);ctx.fill();
   }
  });
  scene.dataset.activeConnections=String(paths.filter(edge=>edge.highlight).length);
  nodes.forEach(({button,point,index})=>{
   const p=project(point),related=active===null||nodes[active].group===nodes[index].group;
   button.dataset.related=String(related);
   button.style.transform=`translate(-50%, -50%) translate(${p.x}px, ${p.y}px) scale(${p.scale})`;
   button.style.opacity=String((.5+(p.z+1)*.25)*(related?1:.42));button.style.zIndex=String(Math.round((p.z+1)*100));
   button.classList.toggle('is-selected',selected===index);
   button.classList.toggle('is-hovered',hovered===index);
  });
 }
 function orbit(){selected=null;focusMove=null;targetZoom=0;vx=vy=0;delete scene.dataset.focusedProject;nodes.forEach(n=>n.button.setAttribute('aria-label',n.button.querySelector('.spatial-node-title').textContent+' — open media'));start();}
 function tick(time){
  if(view.hidden||document.hidden||gallery.open){raf=0;last=0;return;}
  const dt=Math.min(2,(time-last)/16.67||1);last=time;
  zoom+=(targetZoom-zoom)*(reduced.matches?1:1-Math.pow(.9,dt));
  if(focusMove){
   const progress=reduced.matches?1:Math.min(1,(time-focusMove.start)/1100);
   const eased=1-Math.pow(1-progress,4);
   yaw=focusMove.fromYaw+(focusMove.toYaw-focusMove.fromYaw)*eased;pitch=focusMove.fromPitch+(focusMove.toPitch-focusMove.fromPitch)*eased;
   if(progress===1)focusMove=null;
  }else if(!dragging){
   yaw+=vx*dt;pitch+=vy*dt;vx*=Math.pow(.93,dt);vy*=Math.pow(.93,dt);
   if(!reduced.matches&&hovered===null&&selected===null)yaw+=.0006*dt;
  }
  pitch=Math.max(-1.55,Math.min(1.55,pitch));draw();raf=requestAnimationFrame(tick);
 }
 function start(){if(!raf&&!view.hidden&&!document.hidden)raf=requestAnimationFrame(tick);}
 function resize(){const r=scene.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
 new ResizeObserver(resize).observe(scene);stage.addEventListener('viewchange',()=>{if(view.hidden){pointers.clear();dragging=false;}resize();start();});document.addEventListener('visibilitychange',start);
 scene.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'&&event.button!==0)return;
  if(event.pointerType==='mouse')event.preventDefault();
  pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(pointers.size===2){const[a,b]=[...pointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);moved=true;return;}
  dragging=true;moved=false;previous={x:event.clientX,y:event.clientY};vx=vy=0;
 });
 scene.addEventListener('pointermove',event=>{
  if(!pointers.has(event.pointerId))return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(pointers.size===2){const[a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);targetZoom=Math.max(0,Math.min(1.2,targetZoom+(distance-pinchDistance)*.004));pinchDistance=distance;focusMove=null;return;}
  if(!dragging)return;const dx=event.clientX-previous.x,dy=event.clientY-previous.y;if(!moved&&Math.hypot(dx,dy)<4)return;
  moved=true;focusMove=null;selected=null;delete scene.dataset.focusedProject;scene.setPointerCapture(event.pointerId);scene.classList.add('is-dragging');
  yaw+=dx*.005;pitch+=dy*.005;vx=dx*.0025;vy=dy*.0025;previous={x:event.clientX,y:event.clientY};draw();
 });
 function release(event){pointers.delete(event.pointerId);if(scene.hasPointerCapture(event.pointerId))scene.releasePointerCapture(event.pointerId);dragging=false;previous=null;scene.classList.remove('is-dragging');if(reduced.matches)vx=vy=0;}
 scene.addEventListener('pointerup',release);scene.addEventListener('pointercancel',release);scene.addEventListener('lostpointercapture',()=>{dragging=false;scene.classList.remove('is-dragging');});
 scene.addEventListener('click',event=>{if(!moved&&!event.target.closest('.spatial-node'))orbit();});
 scene.addEventListener('wheel',event=>{
  // Ordinary wheel scrolling navigates the page. Trackpad pinch (Ctrl+wheel)
  // zooms the constellation; clicking, touch pinch, and keyboard zoom also work.
  if(!event.ctrlKey)return;
  event.preventDefault();focusMove=null;selected=null;delete scene.dataset.focusedProject;
  targetZoom=Math.max(0,Math.min(1.2,targetZoom-event.deltaY*(event.ctrlKey ? .009 : .0018)));start();
 },{passive:false});
 scene.addEventListener('keydown',event=>{
  if(event.key==='Enter'||event.key===' ')moved=false;
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Escape','Home'].includes(event.key))return;
  event.preventDefault();focusMove=null;vx=vy=0;
  if(event.key==='ArrowLeft')yaw-=.15;if(event.key==='ArrowRight')yaw+=.15;if(event.key==='ArrowUp')pitch-=.15;if(event.key==='ArrowDown')pitch+=.15;
  if(event.key==='+'||event.key==='=')targetZoom=Math.min(1.2,targetZoom+.15);if(event.key==='-')targetZoom=Math.max(0,targetZoom-.15);
  if(event.key==='Escape'||event.key==='Home')orbit();draw();
 });
 const gallery=document.createElement('dialog');gallery.id='spatial-gallery';
 gallery.setAttribute('aria-labelledby','spatial-gallery-title');
 gallery.innerHTML=`<div class="spatial-gallery-shell"><header class="spatial-gallery-header"><h2 id="spatial-gallery-title"></h2><button type="button" class="spatial-gallery-case">View case study ↗</button><button type="button" class="spatial-gallery-close" aria-label="Close media"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button></header><figure class="spatial-gallery-media"><div class="spatial-gallery-art"></div><figcaption></figcaption></figure><div class="spatial-gallery-thumbnails" role="group"></div></div>`;
 document.body.append(gallery);
 const galleryArt=gallery.querySelector('.spatial-gallery-art');
 const galleryStrip=gallery.querySelector('.spatial-gallery-thumbnails');
 const caseButton=gallery.querySelector('.spatial-gallery-case');
 let galleryIndex=0,originNode=null,openingAnimation=null;
 function paintMedia(host,item){
  host.replaceChildren();host.style.background=getComputedStyle(document.querySelector('.panel-'+item.group)).getPropertyValue('--project-surface');
  if(item.src){
   const image=document.createElement('img');image.src='./assets/'+item.src;image.alt=groups[item.group].name+' — '+item.title;image.draggable=false;
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
 function openGallery(index){
  if(gallery.open)return;
  const node=nodes[index],source=node.button.querySelector('.spatial-node-art').getBoundingClientRect();
  originNode=node.button;selected=index;hovered=null;vx=vy=0;focusMove=null;
  showMedia(index);gallery.showModal();
  if(!reduced.matches){
   const destination=galleryArt.getBoundingClientRect();
   const dx=source.left+source.width/2-destination.left-destination.width/2;
   const dy=source.top+source.height/2-destination.top-destination.height/2;
   openingAnimation=galleryArt.animate([
    {transform:`translate(${dx}px,${dy}px) scale(${source.width/destination.width},${source.height/destination.height})`,opacity:.75},
    {transform:'translate(0,0) scale(1)',opacity:1}
   ],{duration:460,easing:'cubic-bezier(.22,1,.36,1)'});
  }
  gallery.querySelector('.spatial-gallery-close').focus({preventScroll:true});
 }
 function closeGallery(){openingAnimation?.cancel();gallery.close();}
 gallery.querySelector('.spatial-gallery-close').addEventListener('click',closeGallery);
 gallery.addEventListener('click',event=>{if(event.target===gallery)closeGallery();});
 gallery.addEventListener('cancel',()=>openingAnimation?.cancel());
 gallery.addEventListener('close',()=>{selected=null;hovered=originNode?nodes.findIndex(node=>node.button===originNode):null;originNode?.focus({preventScroll:true});start();});
 caseButton.addEventListener('click',()=>{const launch=nodes[galleryIndex].launch;closeGallery();launch.click();});
 gallery.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
  event.preventDefault();const related=media.map((item,index)=>({item,index})).filter(entry=>entry.item.group===media[galleryIndex].group);
  const current=related.findIndex(entry=>entry.index===galleryIndex);
  showMedia(related[(current+(event.key==='ArrowRight'?1:-1)+related.length)%related.length].index);
 });
 resize();start();
})();
