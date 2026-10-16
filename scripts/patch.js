(function () {
	const WORDS = {
		new:     ['new'],
		added:   ['added'],
		fixed:   ['fixed'],
		change: ['change'],
		removed: ['removed']
	};
	const MAP = {};
	for (const type in WORDS) WORDS[type].forEach(w => MAP[w] = type);
	document.querySelectorAll('.patch li').forEach(li => {
		const node = li.firstChild;
		if (!node || node.nodeType !== Node.TEXT_NODE) return;
		const m = node.nodeValue.match(/^\s*([A-Za-zÀ-ÿ]+)/);
		if (!m) return;
		const type = MAP[m[1].toLowerCase()];
		if (!type) return;
		const tag = document.createElement('span');
		tag.className = 'tag ' + type;
		tag.textContent = m[1];
		node.nodeValue = node.nodeValue.slice(m[0].length).replace(/^\s+/, '');
		li.insertBefore(tag, node);
	});
})();
(function () {
	const KEY = 'cubesia-patch-open';
	let saved = {};
	try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
	const seen = {};
	document.querySelectorAll('.patch details').forEach(d => {
		const name = d.querySelector('summary').textContent.trim();
		seen[name] = (seen[name] || 0) + 1;
		const id = seen[name] > 1 ? name + ' #' + seen[name] : name;
		if (id in saved) d.open = saved[id];
		d.addEventListener('toggle', () => {
			saved[id] = d.open;
			try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
		});
  });
})();
(function () {
	function formatDate(iso) {
		const p = iso.split('-').map(Number);
		return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
	const cards = [...document.querySelectorAll('.patch details')];
	cards.forEach(d => {
		const summary = d.querySelector('summary');
		const iso = d.dataset.date || PATCH_DATES[summary.textContent.trim()];
		if (!iso) return;
		const span = document.createElement('span');
		span.className = 'date';
		span.textContent = formatDate(iso);
		summary.appendChild(span);
	});
	const legend = document.querySelector('.patch .legend');
	if (!legend) return;
	const hint = document.createElement('p');
	hint.className = 'patch-hint';
	hint.textContent = 'Click a label to show only that type of change.';
	const tools = document.createElement('div');
	tools.className = 'patch-tools';
	tools.innerHTML = '<button type="button" data-act="open">Expand all</button><button type="button" data-act="close">Collapse all</button>';
	const empty = document.createElement('p');
	empty.className = 'patch-empty';
	empty.textContent = 'No change of this type.';
	empty.hidden = true;
	legend.after(hint, tools, empty);
	tools.addEventListener('click', e => {
		const b = e.target.closest('button');
		if (!b) return;
		cards.forEach(d => { if (!d.hidden) d.open = b.dataset.act === 'open'; });
	});
	const TYPES = ['new', 'added', 'fixed', 'change', 'removed'];
	const tags = [...legend.querySelectorAll('.tag')];
	let current = null;
	let before = null;
	function applyFilter(type) {
		if (type && !before) before = new Map(cards.map(d => [d, d.open]));
		let shown = 0;
		cards.forEach(d => {
			let any = false;
			d.querySelectorAll(':scope > ul > li').forEach(li => {
				const t = li.querySelector(':scope > .tag');
				const ok = !type || (t && t.classList.contains(type));
				li.hidden = !ok;
				if (ok) any = true;
			});
			d.querySelectorAll(':scope > ul > ul').forEach(sub => {
				const prev = sub.previousElementSibling;
				sub.hidden = !!type && !!prev && prev.hidden;
			});
			d.hidden = !!type && !any;
			if (!d.hidden) shown++;
			if (type && any) d.open = true;
		});
		if (!type && before) {
			cards.forEach(d => { d.open = before.get(d); });
			before = null;
		}
		empty.hidden = !type || shown > 0;
		tags.forEach(tag => {
			const on = !!type && tag.classList.contains(type);
			tag.classList.toggle('active', on);
			tag.classList.toggle('dim', !!type && !on);
			tag.setAttribute('aria-pressed', on ? 'true' : 'false');
		});
	}
	tags.forEach(tag => {
		const type = TYPES.find(t => tag.classList.contains(t));
		tag.setAttribute('role', 'button');
		tag.setAttribute('tabindex', '0');
		tag.setAttribute('aria-pressed', 'false');
		const toggle = () => {
			current = current === type ? null : type;
			applyFilter(current);
		};
		tag.addEventListener('click', toggle);
		tag.addEventListener('keydown', e => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				toggle();
			}
		});
	});
})();
