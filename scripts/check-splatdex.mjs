import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const demo = path.join(root, 'splatdex');
const main = fs.readFileSync(path.join(demo, 'main.js'), 'utf8');
const html = fs.readFileSync(path.join(demo, 'index.html'), 'utf8');
const icons = fs.readFileSync(path.join(root, 'assets/icons.svg'), 'utf8');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
for (const [, id] of main.matchAll(/\$\(['"]([^'"]+)['"]\)/g)) {
  assert(ids.has(id), `Missing UI element: ${id}`);
}
for (const file of fs.readdirSync(demo).filter(name => name.endsWith('.js'))) {
  const source = fs.readFileSync(path.join(demo, file), 'utf8');
  execFileSync(process.execPath, ['--check', path.join(demo, file)]);
  assert(!/\/api\/captures|127\.0\.0\.1|localhost|chatgpt\.site/.test(source), `${file} contains a private-service dependency`);
  for (const [, relative] of source.matchAll(/(?:from\s+|import\s*\()\s*['"](\.\/[^'"]+)['"]/g)) {
    assert(fs.existsSync(path.join(demo, relative)), `${file}: missing ${relative}`);
  }
}
assert(!/getUserMedia|id="capture"|id="scanBtn"/.test(html + main), 'Public capture must remain unavailable');
const declaration = main.slice(main.indexOf('const splats='), main.indexOf('let app,'));
const items = vm.runInNewContext(`${declaration}\nsplats`, {}, { timeout: 1000 });
for (const item of items) {
  const model = path.join(demo, item.url ?? `models/${item.file}.${item.ext ?? 'sog'}`);
  assert(fs.existsSync(model), `${item.name}: missing model`);
  assert(fs.statSync(model).size < 100 * 1024 * 1024, `${item.name}: exceeds GitHub's per-file limit`);
  assert(fs.existsSync(path.join(demo, `thumbs/${item.file}.png`)), `${item.name}: missing thumbnail`);
}
for (const relative of ['index.html', 'projects/splatdex/index.html', 'splatdex/index.html']) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  for (const [, url] of source.matchAll(/(?:src|poster|href)="([^"#]+)"/g)) {
    if (/^(?:https?:|mailto:|#)/.test(url)) continue;
    if (url.includes('icons.svg') && url.includes('#')) {
      assert(icons.includes(`id="${url.split('#')[1]}"`), `${relative}: missing icon ${url}`);
    }
    let target = path.resolve(url.startsWith('/') ? root : path.dirname(path.join(root, relative)), url.replace(/^\//, '').split(/[?#]/)[0]);
    if (url.split(/[?#]/)[0].endsWith('/')) target = path.join(target, 'index.html');
    assert(fs.existsSync(target), `${relative}: missing ${url}`);
  }
}
console.log(`Splatdex checks passed: ${items.length} models and thumbnails, JS imports, UI targets, page assets, and no private capture access`);
