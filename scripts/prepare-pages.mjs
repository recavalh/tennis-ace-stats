import { copyFile, mkdir } from 'node:fs/promises';

// Real entry files allow direct visits and reloads on GitHub Pages.
for (const route of ['jogo', 'android', 'watch', 'platform', 'privacy']) {
  await mkdir('dist/' + route, { recursive: true });
  await copyFile('dist/index.html', 'dist/' + route + '/index.html');
}
await copyFile('CNAME', 'dist/CNAME');
await copyFile('dist/index.html', 'dist/404.html');
