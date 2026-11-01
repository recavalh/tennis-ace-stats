import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {createHash} from 'node:crypto';
import {readFileSync, readdirSync} from 'node:fs';
import {join, relative} from 'node:path';

function sourceVersion() {
  const hash = createHash('sha256');
  function walk(directory: string) {
    for (const entry of readdirSync(directory, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(tsx?|css|html|json|svg)$/.test(entry.name)) {
        hash.update(relative(process.cwd(), path).replaceAll('\\', '/'));
        hash.update(readFileSync(path, 'utf8').replace(/\r+\n/g, '\n'));
      }
    }
  }
  for (const path of ['apps', 'packages', 'content']) walk(path);
  return hash.digest('hex').slice(0, 16);
}
export default defineConfig(({command}) => {
  const buildId = command === 'build' ? sourceVersion() : 'development';
  return {
    root: 'apps/client',
    envDir: process.cwd(),
    css: {postcss: {plugins: []}},
    define: {__APP_BUILD_ID__: JSON.stringify(buildId)},
    plugins: [react(), {name: 'game-build-version', generateBundle() {this.emitFile({type: 'asset', fileName: 'build-info.json', source: JSON.stringify({buildId})});}}],
    build: {outDir: '../../dist/client', emptyOutDir: true, target: 'safari15', rollupOptions: {output: {manualChunks: {phaser: ['phaser']}}}},
  };
});
