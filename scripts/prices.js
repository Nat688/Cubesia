(function () {
	'use strict';
	const table = document.getElementById('prices');
	if (!table) return;
	const $ = id => document.getElementById(id);
	const body = table.tBodies[0];
	const rows = [...body.rows];
	const iconUrl = document.querySelector('[data-icon-url]').dataset.iconUrl;
	const fmt = n => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
	const store = {
		get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
		set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
	};
	function iconFor(id, alt) {
		const img = new Image(28, 28);
		img.alt = '';
		img.loading = 'lazy';
		img.className = 'item-icon';
		img.src = iconUrl.replace('{id}', id);
		img.onerror = () => { img.style.visibility = 'hidden'; };
		return img;
	}
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
	const byId = Object.fromEntries(rows.map(r => [r.dataset.id, r]));
	let lines = store.get('cubesia-calc-lines', []).filter(l => byId[l.id]);
	let mults = store.get('cubesia-calc-mults', {});
	const linesEl = $('lines'), totalEl = $('total');
	function renderLines() {
		linesEl.textContent = '';
		if (!lines.length) {
			const p = document.createElement('p');
			p.className = 'calc-empty';
			p.textContent = 'No item yet.';
			linesEl.appendChild(p);
		}
		let total = 0;
		lines.forEach((l, i) => {
			const r = byId[l.id];
			const price = +r.dataset.price, m = +(mults[r.dataset.cat] || 1);
			const sub = price * l.qty * m;
			total += sub;
			const row = document.createElement('div');
			row.className = 'calc-line';
			row.appendChild(iconFor(l.id));
			const name = document.createElement('span');
			name.className = 'cl-name';
			name.textContent = r.cells[1].textContent;
			const qty = document.createElement('input');
			qty.type = 'number'; qty.min = 1; qty.value = l.qty;
			qty.setAttribute('aria-label', 'Quantity of ' + name.textContent);
			qty.addEventListener('change', () => { l.qty = Math.max(1, Math.floor(+qty.value || 1)); save(); });
			const stack = document.createElement('button');
			stack.type = 'button'; stack.textContent = '\u00D764'; stack.title = 'One stack';
			stack.addEventListener('click', () => { l.qty = 64; save(); });
			const s = document.createElement('span');
			s.className = 'cl-sub';
			s.textContent = fmt(sub);
			const del = document.createElement('button');
			del.type = 'button'; del.textContent = '\u00D7'; del.setAttribute('aria-label', 'Remove ' + name.textContent);
			del.addEventListener('click', () => { lines.splice(i, 1); save(); });
			row.append(name, qty, stack, s, del);
			linesEl.appendChild(row);
		});
		totalEl.textContent = fmt(total);
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
	const multsEl = $('mults');
	cats.forEach(c => {
		const lab = document.createElement('label');
		lab.textContent = c;
		const inp = document.createElement('input');
		inp.type = 'number'; inp.min = 0; inp.step = 0.01; inp.value = mults[c] || 1;
		inp.addEventListener('change', () => { mults[c] = Math.max(0, +inp.value || 1); save(); });
		lab.appendChild(inp);
		multsEl.appendChild(lab);
	});
	renderLines();
})();
