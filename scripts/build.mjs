import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
// Keep the local deep-link preview aligned with the homepage shell.
await writeFile('projects/sullivanfoundation/index.html', await readFile('index.html', 'utf8'));
for (const file of ['index.html', 'styles.css', 'next.css', 'navigation.js', 'spatial.js', 'entrance.js', 'app.js', 'assets', 'robots.txt', 'sitemap.xml', 'projects', 'CNAME', '.nojekyll']) {
  await cp(file, 'dist/' + file, { recursive: true });
}
await mkdir('dist/local-fonts', { recursive: true });
await cp('local-fonts/TWKLausannePan-400.otf', 'dist/local-fonts/TWKLausannePan-400.otf');
await cp('local-fonts/TWKLausannePan-500.woff2', 'dist/local-fonts/TWKLausannePan-500.woff2');
for(const page of ['dist/index.html','dist/projects/sullivanfoundation/index.html']){await writeFile(page,(await readFile('dist/index.html','utf8')).replace(/(styles\.css|app\.js)\?v=[^"]+/g,'$1?v=email-case-fix-3'));}
for(const slug of ['thrive','sullivan']){await mkdir('dist/'+slug,{recursive:true});await writeFile('dist/'+slug+'/index.html',(await readFile('dist/index.html','utf8')).replace('https://ehioko.com/\"','https://ehioko.com/'+slug+'\"'));}
console.log('Built portable static website in dist/');

await cp('local-fonts/TWKLausannePan-700.woff2', 'dist/local-fonts/TWKLausannePan-700.woff2');

await cp('local-fonts/TWKLausannePan-600.woff2', 'dist/local-fonts/TWKLausannePan-600.woff2');

await import('./prerender-cases.mjs');
