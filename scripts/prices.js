(function () {
	'use strict';
	const table = document.getElementById('prices');
	if (!table) return;
	const $ = id => document.getElementById(id);
	const body = table.tBodies[0];
	const rows = [...body.rows];
	const main = document.querySelector('[data-icon-url]');
	const iconUrls = (main.dataset.iconUrl || '').split('|').map(s => s.trim()).filter(Boolean);
	const fmt = n => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
	const store = {
		get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
		set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
	};
	let iconOk = 0, iconFail = 0;
	const BLOCK_OF = { iron: 'Iron', gold: 'Gold', diamond: 'Diamond', emerald: 'Emerald', lapis: 'Lapis_Lazuli', redstone: 'Redstone', coal: 'Coal', copper: 'Copper', netherite: 'Netherite', amethyst: 'Amethyst', quartz: 'Quartz', raw_iron: 'Raw_Iron', raw_gold: 'Raw_Gold', raw_copper: 'Raw_Copper' };
	function wikiName(id, name) {
		const m = id.match(/^(.*)_block$/);
		if (m && BLOCK_OF[m[1]]) return 'Block_of_' + BLOCK_OF[m[1]];
		if (id === 'ender_eye') return 'Eye_of_Ender';
		return name.trim().replace(/\s+/g, '_').replace(/_(Of|The|And|On|In|With)(?=_)/g, (x, w) => '_' + w.toLowerCase());
	}
	function hue(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360; return h; }
	function iconFor(id) {
		const row = byId[id];
		const name = row ? row.cells[1].textContent : id;
		const cat = row ? row.dataset.cat : '';
		const img = new Image(28, 28);
		img.alt = '';
		img.loading = 'lazy';
		img.className = 'item-icon';
		const urls = [];
		iconUrls.forEach(t => urls.push(t.replace('{id}', id).replace('{name}', wikiName(id, name))));
		let n = 0;
		const next = () => {
			if (n < urls.length) { img.src = urls[n++]; return; }
			iconFail++;
			const ph = el('span', 'item-icon ph', name.charAt(0).toUpperCase());
			ph.style.setProperty('--h', hue(cat + name));
			if (img.parentNode) img.replaceWith(ph);
			img.dataset.failed = '1';
			if (iconFail >= 12 && iconOk === 0) $('iconNote').hidden = false;
		};
		img.onload = () => { iconOk++; $('iconNote').hidden = true; };
		img.onerror = next;
		next();
		return img;
	}
	const byId = Object.fromEntries(rows.map(r => [r.dataset.id, r]));
	const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
	rows.forEach(r => r.cells[0].appendChild(iconFor(r.dataset.id)));
	const q = $('q'), count = $('count'), empty = $('empty'), chips = $('chips');
	const cats = [...new Set(rows.map(r => r.dataset.cat))].filter(Boolean).sort();
	let cat = '';
	function addChip(label, value) {
		const b = document.createElement('button');
		b.type = 'button';
		b.textContent = label;
		b.dataset.cat = value;
		b.setAttribute('aria-pressed', String(value === cat));
		b.addEventListener('click', () => {
			cat = value;
			[...chips.children].forEach(c => c.setAttribute('aria-pressed', String(c.dataset.cat === cat)));
			update();
		});
		chips.appendChild(b);
	}
	addChip('All', '');
	cats.forEach(c => addChip(c, c));
	function update() {
		const terms = q.value.toLowerCase().replace(/_/g, ' ').split(/\s+/).filter(Boolean);
		let shown = 0;
		rows.forEach(r => {
			const text = (r.cells[1].textContent + ' ' + r.dataset.id.replace(/_/g, ' ')).toLowerCase();
			const ok = (!cat || r.dataset.cat === cat) && terms.every(t => text.includes(t));
			r.hidden = !ok;
			if (ok) shown++;
		});
		count.textContent = shown + ' / ' + rows.length;
		empty.hidden = shown > 0;
	}
	q.addEventListener('input', update);
	update();
	let sortCol = -1, dir = 1;
	table.querySelectorAll('th button').forEach(b => b.addEventListener('click', () => {
		const col = +b.dataset.col;
		dir = sortCol === col ? -dir : 1;
		sortCol = col;
		rows.sort((a, c) => b.dataset.type === 'num'
			? (a.dataset.price - c.dataset.price) * dir
			: a.cells[col].textContent.localeCompare(c.cells[col].textContent) * dir);
		rows.forEach(r => body.appendChild(r));
	}));
	let lines = store.get('cubesia-calc-lines', []).filter(l => byId[l.id]);
	let mults = store.get('cubesia-calc-mults', {});
	const linesEl = $('lines'), totalEl = $('total'), baseEl = $('base'), bonusEl = $('bonus');
	const mult = c => +(mults[c] ?? 1);
	const btn = (text, label, onClick) => { const b = el('button', null, text); b.type = 'button'; b.setAttribute('aria-label', label); b.addEventListener('click', onClick); return b; };
	function renderLines() {
		linesEl.textContent = '';
		if (!lines.length) {
			const box = el('div', 'calc-empty');
			box.append(el('i'), el('p', null, 'No item yet. Use the + buttons in the list to add items.'));
			box.firstChild.setAttribute('data-lucide', 'shopping-basket');
			linesEl.appendChild(box);
		}
		let base = 0, total = 0;
		lines.forEach((l, i) => {
			const r = byId[l.id];
			const price = +r.dataset.price, m = mult(r.dataset.cat);
			base += price * l.qty;
			total += price * l.qty * m;
			const row = el('div', 'calc-line');
			const top = el('div', 'cl-top');
			const name = el('span', 'cl-name', r.cells[1].textContent);
			const sub = el('span', 'cl-sub', fmt(price * l.qty * m));
			top.append(iconFor(l.id), name, sub, btn('\u00D7', 'Remove ' + name.textContent, () => { lines.splice(i, 1); save(); }));
			const bottom = el('div', 'cl-bottom');
			const stepper = el('div', 'stepper');
			const qty = el('input');
			qty.type = 'number'; qty.min = 1; qty.value = l.qty;
			qty.setAttribute('aria-label', 'Quantity of ' + name.textContent);
			qty.addEventListener('change', () => { l.qty = Math.max(1, Math.floor(+qty.value || 1)); save(); });
			stepper.append(btn('\u2212', 'Less', () => { l.qty = Math.max(1, l.qty - 1); save(); }), qty, btn('+', 'More', () => { l.qty++; save(); }));
			const stack = btn('64', 'One stack of 64', () => { l.qty = 64; save(); });
			stack.className = 'cl-stack';
			const unit = el('span', 'cl-unit', fmt(price) + (m !== 1 ? ' \u00D7 ' + fmt(m) : '') + ' each');
			bottom.append(stepper, stack, unit);
			row.append(top, bottom);
			linesEl.appendChild(row);
		});
		baseEl.textContent = fmt(base);
		const bonus = total - base;
		bonusEl.textContent = (bonus > 0 ? '+' : '') + fmt(bonus);
		totalEl.textContent = fmt(total);
		const custom = Object.values(mults).filter(v => +v !== 1).length;
		$('multsSum').textContent = custom ? custom + ' custom' : 'all \u00D71';
		if (window.lucide) lucide.createIcons();
	}
	function save() { store.set('cubesia-calc-lines', lines); store.set('cubesia-calc-mults', mults); renderLines(); }
	body.addEventListener('click', e => {
		const b = e.target.closest('.add');
		if (!b) return;
		const id = b.closest('tr').dataset.id;
		const l = lines.find(x => x.id === id);
		if (l) l.qty++; else lines.push({ id, qty: 1 });
		save();
	});
	$('clear').addEventListener('click', () => { lines = []; save(); });
	const toggle = $('multsToggle'), multsBody = $('multsBody');
	toggle.addEventListener('click', () => {
		const open = multsBody.hidden;
		multsBody.hidden = !open;
		toggle.setAttribute('aria-expanded', String(open));
		toggle.classList.toggle('open', open);
	});
	const multsEl = $('mults');
	const clamp = v => Math.min(10, Math.max(0, Math.round((+v || 0) * 100) / 100));
	function renderMults() {
		multsEl.textContent = '';
		cats.forEach(c => {
			const cell = el('div', 'mult-cell');
			cell.appendChild(el('span', 'mc-name', c));
			const stepper = el('div', 'stepper');
			const inp = el('input');
			inp.type = 'number'; inp.min = 0; inp.max = 10; inp.step = 0.1; inp.value = mult(c);
			inp.setAttribute('aria-label', 'Multiplier of ' + c);
			inp.addEventListener('change', () => { mults[c] = clamp(inp.value); save(); renderMults(); });
			stepper.append(btn('\u2212', 'Less', () => { mults[c] = clamp(mult(c) - 0.1); save(); renderMults(); }), inp, btn('+', 'More', () => { mults[c] = clamp(mult(c) + 0.1); save(); renderMults(); }));
			cell.appendChild(stepper);
			multsEl.appendChild(cell);
		});
	}
	$('applyAll').addEventListener('click', () => { const v = clamp($('allMult').value); cats.forEach(c => { mults[c] = v; }); save(); renderMults(); });
	$('resetMults').addEventListener('click', () => { mults = {}; $('allMult').value = 1; save(); renderMults(); });
	renderMults();
	renderLines();
})();
