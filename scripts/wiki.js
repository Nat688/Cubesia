lucide.createIcons();
(function () {
	const toc = document.getElementById('toc');
	toc.classList.add('js');
	const heads = [...document.querySelectorAll('.wiki-content h2[id], .wiki-content h3[id]')];
	const links = new Map([...toc.querySelectorAll('a')].map(a => [a.getAttribute('href').slice(1), a]));
	let ticking = false;
	function update() {
		let cur = heads[0];
		for (const h of heads) {
			if (h.getBoundingClientRect().top <= 110) cur = h; else break;
		}
		if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) cur = heads[heads.length - 1];
		toc.querySelectorAll('a.active').forEach(a => a.classList.remove('active'));
		toc.querySelectorAll('.group.open').forEach(g => g.classList.remove('open'));
		const a = links.get(cur.id);
		if (a) {
			a.classList.add('active');
			const group = a.closest('.group');
			if (group) group.classList.add('open');
			const r = a.getBoundingClientRect(), t = toc.getBoundingClientRect();
			if (r.top < t.top + 8) toc.scrollTop -= (t.top + 8 - r.top);
			else if (r.bottom > t.bottom - 8) toc.scrollTop += (r.bottom - t.bottom + 8);
		}
		ticking = false;
	}
	window.addEventListener('scroll', () => {
		if (!ticking) { requestAnimationFrame(update); ticking = true; }
	}, { passive: true });
	update();
})();
(function () {
	const toc = document.getElementById('toc');
	const heads = [...document.querySelectorAll('.wiki-content h2[id], .wiki-content h3[id]')];
	const index = new Map();
	heads.forEach(h => {
		let text = h.textContent;
		let n = h.nextElementSibling;
		while (n && !/^H[23]$/.test(n.tagName)) {
			text += ' ' + n.textContent;
			n = n.nextElementSibling;
		}
		index.set(h.id, text.toLowerCase().replace(/\s+/g, ' '));
	});
	async function copyText(text) {
		try {
			await navigator.clipboard.writeText(text);
		} catch (e) {
			const t = document.createElement('textarea');
			t.value = text;
			document.body.appendChild(t);
			t.select();
			document.execCommand('copy');
			t.remove();
		}
	}
	heads.forEach(h => {
		const a = document.createElement('a');
		a.className = 'anchor';
		a.href = '#' + h.id;
		a.textContent = '#';
		a.setAttribute('aria-label', 'Copy link to this section');
		a.addEventListener('click', () => {
			copyText(location.origin + location.pathname + '#' + h.id);
			a.textContent = '\u2713';
			setTimeout(() => { a.textContent = '#'; }, 1200);
		});
		h.appendChild(a);
	});
	const input = document.createElement('input');
	input.type = 'search';
	input.className = 'toc-search';
	input.placeholder = 'Search the wiki...';
	input.setAttribute('aria-label', 'Search the wiki');
	const empty = document.createElement('p');
	empty.className = 'toc-empty';
	empty.textContent = 'No result.';
	empty.hidden = true;
	toc.querySelector('.toc-title').after(input);
	toc.querySelector(':scope > ul').after(empty);
	function filter() {
		const terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
		const matches = a => {
			const text = index.get(a.getAttribute('href').slice(1)) || '';
			return terms.every(t => text.includes(t));
		};
		toc.classList.toggle('searching', terms.length > 0);
		let shown = 0;
		toc.querySelectorAll(':scope > ul > li').forEach(group => {
			let anySub = false;
			group.querySelectorAll('.subs li').forEach(li => {
				const ok = matches(li.querySelector('a'));
				li.hidden = terms.length > 0 && !ok;
				if (ok) anySub = true;
			});
			const visible = terms.length === 0 || matches(group.querySelector(':scope > a')) || anySub;
			group.hidden = !visible;
			if (visible) shown++;
		});
		empty.hidden = terms.length === 0 || shown > 0;
	}
	input.addEventListener('input', filter);
	input.addEventListener('keydown', e => {
		if (e.key === 'Escape') {
			input.value = '';
			filter();
		} else if (e.key === 'Enter') {
			const first = [...toc.querySelectorAll('a[href^="#"]')].find(a => !a.closest('[hidden]'));
			if (first) {
				location.hash = first.getAttribute('href');
				toc.classList.remove('open');
			}
		}
	});
	const fab = document.createElement('button');
	fab.type = 'button';
	fab.className = 'toc-fab';
	fab.setAttribute('aria-label', 'Open the table of contents');
	fab.innerHTML = '<i data-lucide="list"></i>';
	document.body.appendChild(fab);
	if (window.lucide) lucide.createIcons();
	fab.addEventListener('click', () => toc.classList.toggle('open'));
	toc.addEventListener('click', e => {
		if (e.target.closest('a')) toc.classList.remove('open');
	});
	document.addEventListener('click', e => {
		if (!toc.contains(e.target) && !fab.contains(e.target)) toc.classList.remove('open');
	});
})();
