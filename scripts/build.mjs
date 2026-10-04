import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'assets', 'robots.txt', 'sitemap.xml', 'projects']) {
  await cp(file, 'dist/' + file, { recursive: true });
}
for(const page of ['dist/index.html','dist/projects/sullivanfoundation/index.html']){await writeFile(page,(await readFile('dist/index.html','utf8')).replace(/sullivan-url-27/g,'popup-selection-35'));}
console.log('Built portable static website in dist/');
