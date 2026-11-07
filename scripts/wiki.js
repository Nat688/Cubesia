lucide.createIcons();
(function () {
	'use strict';
	const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
	const norm = s => s.replace(/\s+/g, ' ').trim();
	const fmtDate = iso => {
		const p = iso.split('-').map(Number);
		return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	};
	const labelFromId = id => id.replace(/^(\w)(\w*)-(\d+)$/, (m, a, b, n) => a.toUpperCase() + b + ' #' + n);
	const num = id => parseInt(id.split('-')[1], 10) || 0;

	const BLOCKS = 'p, li, td, th, .base, .rm-note, figcaption';
	const NESTED = 'p, li, td, th, ul, ol, table, .base, .rm-note';
	const blocks = $$(BLOCKS, document.querySelector('.wiki-content')).filter(el => !el.querySelector(NESTED));
	const heads = $$('.wiki-content :is(h1, h2, h3, h4), #toc a').map(el => {
		const node = [...el.childNodes].find(n => n.nodeType === 3 && norm(n.nodeValue));
		return node ? { node, en: node.nodeValue } : null;
	}).filter(Boolean);
	const origBlocks = blocks.map(el => ({ el, en: el.innerHTML, key: norm(el.innerHTML) }));

	const chips = $$('.wiki-content [data-patch]');
	chips.forEach(h => {
		const id = h.dataset.patch;
		const chip = document.createElement('a');
		chip.className = 'patch-chip';
		chip.href = 'patch.html#' + id;
		chip.textContent = labelFromId(id);
		h.insertBefore(chip, h.querySelector('.anchor'));
	});
	function markNew(meta) {
		chips.forEach(h => {
			const info = meta.items[h.dataset.patch];
			const chip = h.querySelector('.patch-chip');
			if (info && info.date && chip) chip.textContent = info.label + ' \u00B7 ' + fmtDate(info.date);
			if (h.dataset.patch !== meta.latestPatch && h.dataset.patch !== meta.latestUpdate) return;
			const badge = document.createElement('span');
			badge.className = 'new-badge';
			badge.textContent = 'NEW';
			h.insertBefore(badge, chip);
			const link = document.querySelector('#toc a[href="#' + h.id + '"]');
			if (link) {
				const b = badge.cloneNode(true);
				link.appendChild(b);
			}
		});
	}
	fetch('patch.html', { cache: 'no-cache' })
		.then(r => r.text())
		.then(html => {
			const doc = new DOMParser().parseFromString(html, 'text/html');
			const items = {};
			let latestPatch = '', latestUpdate = '';
			[...doc.querySelectorAll('.patch details[id]')].forEach(d => {
				items[d.id] = { label: d.querySelector('summary').textContent.trim(), date: d.dataset.date || '' };
				if (/^patch-/.test(d.id) && num(d.id) > num(latestPatch)) latestPatch = d.id;
				if (/^update-/.test(d.id) && num(d.id) > num(latestUpdate)) latestUpdate = d.id;
			});
			markNew({ items, latestPatch, latestUpdate });
		})
		.catch(() => {});

	let dict = null, lang = 'en';
	const KEY = 'cubesia-lang';
	const buttons = $$('.lang-switch button');
	function applyLang(l) {
		lang = l;
		document.documentElement.lang = l;
		buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
		const t = (dict && dict.t) || {};
		const ui = (dict && dict.ui) || {};
		heads.forEach(h => {
			const lead = h.en.match(/^\s*/)[0], trail = h.en.match(/\s*$/)[0];
			h.node.nodeValue = l === 'fr' && t[norm(h.en)] ? lead + t[norm(h.en)] + trail : h.en;
		});
		origBlocks.forEach(b => { b.el.innerHTML = l === 'fr' && t[b.key] ? t[b.key] : b.en; });
		if (window.cubesiaBindCopy) window.cubesiaBindCopy();
		const set = (sel, v, attr) => { const el = document.querySelector(sel); if (el && v) { if (attr) el.setAttribute(attr, v); else el.lastChild.nodeValue = v; } };
		set('.toc-search', l === 'fr' ? ui.search : 'Search the wiki...', 'placeholder');
		const title = document.querySelector('.toc-title');
		if (title) title.lastChild.nodeValue = l === 'fr' ? ui.toc : 'On this page';
		const empty = document.querySelector('.toc-empty');
		if (empty) empty.textContent = l === 'fr' ? ui.empty : 'No result.';
		try { localStorage.setItem(KEY, l); } catch (e) {}
	}
	function setLang(l) {
		if (l === 'fr' && !dict) {
			fetch('scripts/wiki-fr.json').then(r => r.json()).then(d => { dict = d; applyLang('fr'); }).catch(() => {});
		} else applyLang(l);
	}
	buttons.forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
	window.cubesiaMissing = () => {
		const t = (dict && dict.t) || {};
		return origBlocks.map(b => b.key).concat(heads.map(h => norm(h.en))).filter(k => !t[k]);
	};
	let saved = null;
	try { saved = localStorage.getItem(KEY); } catch (e) {}
	if (saved === 'fr') window.addEventListener('load', () => setLang('fr'));
})();
