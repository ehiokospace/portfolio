import {readFile,writeFile,mkdir} from 'node:fs/promises';
const source=await readFile('app.js','utf8');
const shell=await readFile('dist/index.html','utf8');
const story=source.match(/thriveStory\.innerHTML=`([\s\S]*?)`;/)?.[1];
for(const [id,slug,title] of [['thrive','thrive','Thrive'],['internal-tooling','sullivan','Sullivan Foundation']]){
 const start=source.indexOf(`if(id==='${id}'){`,source.indexOf('function render(study,id)'));
 let article=source.slice(start).match(/content\.innerHTML=`([\s\S]*?)`;/)?.[1];
 if(!article)throw Error('Missing case content: '+id);
 if(id==='thrive'){
  const body=story.match(/<div class="thrive-story-body">([\s\S]*)<\/div>$/)[1];
  article=article.replace('</article>',`<section class="thrive-text"><h2>The Story</h2>${body}</section></article>`);
 }
 if(id==='internal-tooling'){
  const fullStory=source.match(/story\.innerHTML=`([\s\S]*?)`;/)?.[1];
  const body=fullStory?.match(/<div class="thrive-story-body">([\s\S]*)<\/div>$/)?.[1];
  if(body)article=article.replace('</article>',()=>`<section class="thrive-text"><h2>The Story</h2>${body}</section></article>`);
 }
 let html=shell.replace(/<title>[^<]*<\/title>/,`<title>${title} — Ehi Oko</title>`)
 .replace('rel="canonical" href="https://ehioko.com/"',`rel="canonical" href="https://ehioko.com/${slug}"`)
 .replace(/(<div\b[^>]*id="case-content"[^>]*>)/,(_,mount)=>mount+article)
 .replace(/(<dialog\b[^>]*id="case-study"[^>]*>)/,tag=>tag.replace('<dialog','<dialog open')+'<script>document.currentScript.parentElement.removeAttribute("open")</script>')
 .replace('</head>','<noscript><style>body>main{display:none}#case-study{display:block;position:relative;inset:auto;width:100%;height:auto;max-height:none}#case-home,.case-project-dock,.thrive-read-more{display:none}</style></noscript></head>');
 if(!html.includes(article))throw Error('Case content mount missing');
 await mkdir(`dist/${slug}`,{recursive:true});
 await writeFile(`dist/${slug}/index.html`,html);
}
// Legacy query URLs receive the same readable content when scripting is unavailable.
const thrive=source.slice(source.indexOf("if(id==='thrive'){",source.indexOf('function render(study,id)'))).match(/content\.innerHTML=`([\s\S]*?)`;/)[1];
await writeFile('dist/index.html',shell.replace('</body>',()=>`<noscript><section aria-label="Thrive case study"><a href="/thrive">Thrive case study</a>${thrive}</section></noscript></body>`));
