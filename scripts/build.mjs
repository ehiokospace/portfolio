import { cp, mkdir, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'assets', 'robots.txt', 'sitemap.xml', 'projects']) {
  await cp(file, 'dist/' + file, { recursive: true });
}
console.log('Built portable static website in dist/');
