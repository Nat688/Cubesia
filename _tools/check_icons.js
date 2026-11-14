const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'scripts', 'prices.js'), 'utf8');
const start = src.indexOf('\tconst BLOCK_OF');
const end = src.indexOf('\tfunction hue');
const wikiNames = new Function(src.slice(start, end) + '\nreturn wikiNames;')();
const config = fs.readFileSync(path.join(root, '_config.yml'), 'utf8');
const template = (config.match(/^item_icon_url:\s*"([^"]+)"/m) || [])[1];
const templates = template.split('|').map(s => s.trim()).filter(Boolean);
const items = JSON.parse(fs.readFileSync(path.join(root, '_data', 'prices.json'), 'utf8'));
async function exists(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0 (icon check)' } });
      if (r.status === 429 || r.status >= 500) { await new Promise(s => setTimeout(s, 1000 * (i + 1))); continue; }
      return r.ok;
    } catch (e) {
      await new Promise(s => setTimeout(s, 500));
    }
  }
  return false;
}
function candidates(id, name) {
  const urls = [];
  wikiNames(id, name).forEach(n => templates.forEach(t => {
    const u = t.replace('{id}', id).replace('{name}', n);
    urls.push(u);
    if (/\.png(\?.*)?$/.test(u)) urls.push(u.replace(/\.png(\?.*)?$/, '.gif$1'));
  }));
  return urls;
}
async function main() {
  const missing = [];
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const it = items[next++];
      const id = it.id.toLowerCase();
      let found = false;
      for (const u of candidates(id, it.name)) {
        if (await exists(u)) { found = true; break; }
      }
      if (!found) missing.push({ id, name: it.name, tried: candidates(id, it.name)[0] });
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  missing.sort((a, b) => a.id.localeCompare(b.id));
  missing.forEach(m => console.log(m.name + '  ->  ' + m.tried));
  console.log(`\n${items.length} items checked, ${missing.length} without icon.`);
}
main();
