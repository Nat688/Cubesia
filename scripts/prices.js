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
	const missingIcons = new Set();
	const CHECK = /[?&]iconcheck\b/.test(location.search);
	const tried = {};
	let iconDone = 0;
	window.cubesiaIconsMissing = () => [...missingIcons];
	const BLOCK_OF = { iron: 'Iron', gold: 'Gold', diamond: 'Diamond', emerald: 'Emerald', lapis: 'Lapis_Lazuli', redstone: 'Redstone', coal: 'Coal', copper: 'Copper', netherite: 'Netherite', amethyst: 'Amethyst', quartz: 'Quartz', raw_iron: 'Raw_Iron', raw_gold: 'Raw_Gold', raw_copper: 'Raw_Copper' };
	const ALT = { turtle_helmet: 'Turtle_Shell', rabbit_foot: "Rabbit's_Foot", slime_ball: 'Slimeball', vine: 'Vines', beef: 'Raw_Beef', porkchop: 'Raw_Porkchop', chicken: 'Raw_Chicken', mutton: 'Raw_Mutton', rabbit: 'Raw_Rabbit', cod: 'Raw_Cod', salmon: 'Raw_Salmon', redstone: 'Redstone_Dust', quartz: 'Nether_Quartz', map: 'Empty_Map', cooked_beef: 'Steak', hay_block: 'Hay_Bale', experience_bottle: "Bottle_o'_Enchanting", writable_book: 'Book_and_Quill', leather_helmet: 'Leather_Cap', leather_chestplate: 'Leather_Tunic', leather_leggings: 'Leather_Pants', netherite_upgrade_smithing_template: 'Netherite_Upgrade', waxed_copper_block: 'Waxed_Block_of_Copper', resin_block: 'Block_of_Resin', bamboo_block: 'Block_of_Bamboo', stripped_bamboo_block: 'Block_of_Stripped_Bamboo', tnt: 'TNT', tnt_minecart: 'Minecart_with_TNT', disc_fragment_5: 'Disc_Fragment', bamboo_chest_raft: 'Bamboo_Raft_with_Chest', comparator: 'Redstone_Comparator', repeater: 'Redstone_Repeater', dragon_breath: "Dragon's_Breath", lapis_ore: 'Lapis_Lazuli_Ore', deepslate_lapis_ore: 'Deepslate_Lapis_Lazuli_Ore', furnace_minecart: 'Minecart_with_Furnace', hopper_minecart: 'Minecart_with_Hopper', chest_minecart: 'Minecart_with_Chest', command_block_minecart: 'Minecart_with_Command_Block', potion: 'Water_Bottle', splash_potion: 'Splash_Water_Bottle', lingering_potion: 'Lingering_Water_Bottle', music_disc_creator_music_box: 'Music_Disc_Creator_(Music_Box)' };
	const MOB_BUCKET = /^(?!water_|lava_|milk_|powder_snow_)(.+)_bucket$/;
	const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
	function wikiName(id, name) {
		const m = id.match(/^(.*)_block$/);
		if (m && BLOCK_OF[m[1]]) return 'Block_of_' + BLOCK_OF[m[1]];
		if (id === 'ender_eye') return 'Eye_of_Ender';
		return name.trim().replace(/\s+/g, '_').replace(/_(Of|The|And|On|In|With|A)(?=_)/g, (x, w) => '_' + w.toLowerCase());
	}
	function wikiNames(id, name) {
		const list = [];
		if (ALT[id]) list.push(ALT[id]);
		const bucket = id.match(MOB_BUCKET);
		if (bucket) list.push('Bucket_of_' + bucket[1].split('_').map(cap).join('_'));
		const boat = id.match(/^(.*)_chest_boat$/);
		if (boat) list.push(boat[1].split('_').map(cap).join('_') + '_Boat_with_Chest');
		const trim = id.match(/^(.*)_armor_trim_smithing_template$/);
		if (trim) list.push(trim[1].split('_').map(cap).join('_') + '_Armor_Trim');
		const disc = id.match(/^music_disc_(.+)$/);
		if (disc) list.push('Music_Disc_(' + disc[1].split('_').map(cap).join('_') + ')');
		if (/_banner_pattern$/.test(id)) list.push('Banner_Pattern');
		list.push(wikiName(id, name));
		if (/^waxed_/.test(id)) list.push(...wikiNames(id.slice(6), name.replace(/^Waxed /, '')));
		const sentence = n => n.charAt(0) + n.slice(1).toLowerCase();
		list.push(...list.map(sentence));
		return [...new Set(list)];
	}
	function hue(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360; return h; }
	const MAX_LOADS = CHECK ? 16 : 6;
	const queue = [];
	let active = 0;
	function pump() {
		while (active < MAX_LOADS && queue.length) { active++; queue.shift()(); }
	}
	const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(e => {
		if (e.isIntersecting) { io.unobserve(e.target); e.target.start(); }
	}), { rootMargin: '300px' }) : null;
	function iconFor(id) {
		const row = byId[id];
		const name = row ? row.cells[1].textContent : id;
		const cat = row ? row.dataset.cat : '';
		const img = new Image(28, 28);
		img.alt = '';
		img.className = 'item-icon';
		const urls = [];
		wikiNames(id, name).forEach(n => iconUrls.forEach(t => {
			const u = t.replace('{id}', id).replace('{name}', n);
			urls.push(u);
			if (/\.png(\?.*)?$/.test(u)) urls.push(u.replace(/\.png(\?.*)?$/, '.gif$1'));
		}));
		tried[id] = urls;
		let n = 0;
		const fail = () => {
			iconFail++;
			missingIcons.add(id);
			if (CHECK) { iconDone++; report(); }
			const ph = el('span', 'item-icon ph', name.charAt(0).toUpperCase());
			ph.style.setProperty('--h', hue(cat + name));
			if (CHECK) { ph.style.background = '#c62828'; ph.style.color = '#fff'; }
			if (img.parentNode) img.replaceWith(ph);
			if (iconFail >= 12 && iconOk === 0) $('iconNote').hidden = false;
		};
		const attempt = () => {
			if (n >= urls.length) { fail(); return; }
			queue.push(() => { img.src = urls[n++]; });
			pump();
		};
		img.onload = () => { active--; pump(); iconOk++; $('iconNote').hidden = true; if (CHECK) { iconDone++; report(); } };
		img.onerror = () => { active--; pump(); attempt(); };
		img.start = attempt;
		if (CHECK || !io) attempt(); else io.observe(img);
		return img;
	}
	function report() {
		const box = $('iconReport') || (() => {
			const b = el('div');
			b.id = 'iconReport';
			b.style.cssText = 'margin:1rem 0;padding:1rem;border:2px solid #c62828;border-radius:8px;background:rgba(198,40,40,.12);font:14px/1.5 system-ui,sans-serif';
			table.parentNode.insertBefore(b, table);
			return b;
		})();
		const total = rows.length;
		box.replaceChildren();
		const head = el('b', null, iconDone < total ? `Checking icons... ${iconDone} / ${total}` : `Done: ${iconOk} icons found, ${missingIcons.size} not found`);
		head.style.color = missingIcons.size ? '#ff6b6b' : '#4caf50';
		box.appendChild(head);
		if (iconDone < total) return;
		if (!missingIcons.size) return;
		const ul = el('ul');
		ul.style.cssText = 'margin:.6rem 0 0;padding-left:1.2rem;max-height:420px;overflow:auto';
		[...missingIcons].sort().forEach(id => {
			const li = el('li');
			const row = byId[id];
			li.style.color = '#ff6b6b';
			li.appendChild(document.createTextNode((row ? row.cells[1].textContent : id) + '  '));
			const a = el('a', null, tried[id][0]);
			a.href = tried[id][0];
			a.target = '_blank';
			a.rel = 'noopener';
			a.style.color = '#ff9e9e';
			li.appendChild(a);
			ul.appendChild(li);
		});
		box.appendChild(ul);
		const copy = el('button', 'btn', 'Copy the list');
		copy.type = 'button';
		copy.style.marginTop = '.6rem';
		copy.addEventListener('click', () => navigator.clipboard.writeText([...missingIcons].sort().map(id => byId[id].cells[1].textContent).join('\n')));
		box.appendChild(copy);
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
			const unit = el('span', 'cl-unit', fmt(price) + (m !== 1 ? ' \u00D7 ' + fmt(m) : '') + ' each');
			const info = el('div', 'cl-info');
			info.append(name, unit);
			top.append(iconFor(l.id), info, btn('\u00D7', 'Remove ' + name.textContent, () => { lines.splice(i, 1); save(); }));
			const bottom = el('div', 'cl-bottom');
			const stepper = el('div', 'stepper');
			const qty = el('input');
			qty.type = 'number'; qty.min = 1; qty.value = l.qty;
			qty.setAttribute('aria-label', 'Quantity of ' + name.textContent);
			qty.addEventListener('change', () => { l.qty = Math.max(1, Math.floor(+qty.value || 1)); save(); });
			stepper.append(btn('\u2212', 'Less', () => { l.qty = Math.max(1, l.qty - 1); save(); }), qty, btn('+', 'More', () => { l.qty++; save(); }));
			const stack = btn('64', 'One stack of 64', () => { l.qty = 64; save(); });
			stack.className = 'cl-stack';
			bottom.append(stepper, stack, sub);
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
