(function () {
	'use strict';
	const $ = (sel, root) => (root || document).querySelector(sel);
	const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
	const content = $('.wiki-content');
	const toc = document.getElementById('toc');
	const HEADINGS = 'h2[id], h3[id], h4[id]';
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
	if (toc && !toc.classList.contains('js')) {
		toc.classList.add('js');
		const links = new Map($$('a[href^="#"]', toc).map(a => [a.getAttribute('href').slice(1), a]));
		const heads = $$(HEADINGS, content).filter(h => links.has(h.id));
		let ticking = false;
		const update = () => {
			let cur = heads[0];
			for (const h of heads) {
				if (h.getBoundingClientRect().top <= 110) cur = h; else break;
			}
			if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) cur = heads[heads.length - 1];
			$$('a.active', toc).forEach(a => a.classList.remove('active'));
			$$('.group.open', toc).forEach(g => g.classList.remove('open'));
			const a = cur && links.get(cur.id);
			if (a) {
				a.classList.add('active');
				const group = a.closest('.group');
				if (group) group.classList.add('open');
				const r = a.getBoundingClientRect(), t = toc.getBoundingClientRect();
				if (r.top < t.top + 8) toc.scrollTop -= (t.top + 8 - r.top);
				else if (r.bottom > t.bottom - 8) toc.scrollTop += (r.bottom - t.bottom + 8);
			}
			ticking = false;
		};
		window.addEventListener('scroll', () => {
			if (!ticking) { requestAnimationFrame(update); ticking = true; }
		}, { passive: true });
		update();
	}
	if (toc && content && !$('.toc-search', toc)) {
		const heads = $$(HEADINGS, content);
		const index = new Map();
		heads.forEach(h => {
			const level = Number(h.tagName[1]);
			let text = h.textContent;
			for (let n = h.nextElementSibling; n && !(/^H[1-6]$/.test(n.tagName) && Number(n.tagName[1]) <= level); n = n.nextElementSibling) {
				text += ' ' + n.textContent;
			}
			index.set(h.id, text.toLowerCase().replace(/\s+/g, ' '));
		});
		const input = document.createElement('input');
		input.type = 'search';
		input.className = 'toc-search';
		input.placeholder = 'Search...';
		input.setAttribute('aria-label', 'Search this page');
		const empty = document.createElement('p');
		empty.className = 'toc-empty';
		empty.textContent = 'No result.';
		empty.hidden = true;
		$('.toc-title', toc).after(input);
		$(':scope > ul', toc).after(empty);
		const filter = () => {
			const terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
			const matches = a => terms.every(t => (index.get(a.getAttribute('href').slice(1)) || '').includes(t));
			toc.classList.toggle('searching', terms.length > 0);
			let shown = 0;
			$$(':scope > ul > li', toc).forEach(group => {
				let anySub = false;
				$$('.subs li', group).forEach(li => {
					const ok = matches($('a', li));
					li.hidden = terms.length > 0 && !ok;
					if (ok) anySub = true;
				});
				const visible = terms.length === 0 || matches($(':scope > a', group)) || anySub;
				group.hidden = !visible;
				if (visible) shown++;
			});
			empty.hidden = terms.length === 0 || shown > 0;
		};
		input.addEventListener('input', filter);
		input.addEventListener('keydown', e => {
			if (e.key === 'Escape') { input.value = ''; filter(); }
			else if (e.key === 'Enter') {
				const first = $$('a[href^="#"]', toc).find(a => !a.closest('[hidden]'));
				if (first) { location.hash = first.getAttribute('href'); toc.classList.remove('open'); }
			}
		});
	}
	if (toc && !$('.toc-fab')) {
		const fab = document.createElement('button');
		fab.type = 'button';
		fab.className = 'toc-fab';
		fab.setAttribute('aria-label', 'Open the table of contents');
		fab.innerHTML = '<i data-lucide="list"></i>';
		document.body.appendChild(fab);
		if (window.lucide) lucide.createIcons();
		fab.addEventListener('click', () => toc.classList.toggle('open'));
		toc.addEventListener('click', e => { if (e.target.closest('a')) toc.classList.remove('open'); });
		document.addEventListener('click', e => {
			if (!toc.contains(e.target) && !fab.contains(e.target)) toc.classList.remove('open');
		});
	}
	if (content && !$('.anchor', content)) {
		$$(HEADINGS, content).forEach(h => {
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
	}
	if (content) {
		const targets = $$('.cmd-list .command', content).concat(
			$$('code', content).filter(c => /^\/[A-Za-z]/.test(c.textContent) && !/[<>&]/.test(c.textContent))
		);
		targets.forEach(el => {
			el.classList.add('copyable');
			el.setAttribute('role', 'button');
			el.setAttribute('tabindex', '0');
			el.title = 'Click to copy';
			let timer;
			const copy = () => {
				copyText(el.textContent.trim());
				el.classList.add('copied');
				clearTimeout(timer);
				timer = setTimeout(() => el.classList.remove('copied'), 1000);
			};
			el.addEventListener('click', copy);
			el.addEventListener('keydown', e => {
				if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copy(); }
			});
		});
	}
	const shots = $$('.shots a');
	if (shots.length) {
		let box, img, caption, current = [], pos = 0, opener = null, startX = null;
		const build = () => {
			box = document.createElement('div');
			box.className = 'lightbox';
			box.hidden = true;
			box.setAttribute('role', 'dialog');
			box.setAttribute('aria-modal', 'true');
			box.setAttribute('aria-label', 'Image viewer');
			box.innerHTML = '<button type="button" class="lb-close" aria-label="Close">\u2715</button>' +
				'<button type="button" class="lb-prev" aria-label="Previous image">\u2039</button>' +
				'<figure><img alt=""><figcaption></figcaption></figure>' +
				'<button type="button" class="lb-next" aria-label="Next image">\u203A</button>';
			document.body.appendChild(box);
			img = $('img', box);
			caption = $('figcaption', box);
			$('.lb-close', box).addEventListener('click', close);
			$('.lb-prev', box).addEventListener('click', () => step(-1));
			$('.lb-next', box).addEventListener('click', () => step(1));
			box.addEventListener('click', e => { if (e.target === box) close(); });
			box.addEventListener('touchstart', e => { startX = e.changedTouches[0].clientX; }, { passive: true });
			box.addEventListener('touchend', e => {
				if (startX === null) return;
				const dx = e.changedTouches[0].clientX - startX;
				startX = null;
				if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
			}, { passive: true });
			document.addEventListener('keydown', e => {
				if (box.hidden) return;
				if (e.key === 'Escape') close();
				else if (e.key === 'ArrowLeft') step(-1);
				else if (e.key === 'ArrowRight') step(1);
			});
		};
		const show = () => {
			const a = current[pos];
			const thumb = $('img', a);
			img.src = a.href;
			img.alt = thumb ? thumb.alt : '';
			caption.textContent = (img.alt || '') + (current.length > 1 ? '  (' + (pos + 1) + '/' + current.length + ')' : '');
		};
		const step = d => {
			if (current.length < 2) return;
			pos = (pos + d + current.length) % current.length;
			show();
		};
		const open = a => {
			if (!box) build();
			opener = a;
			current = $$('a', a.closest('.shots'));
			pos = current.indexOf(a);
			box.classList.toggle('single', current.length < 2);
			show();
			box.hidden = false;
			document.documentElement.style.overflow = 'hidden';
			$('.lb-close', box).focus();
		};
		const close = () => {
			box.hidden = true;
			img.removeAttribute('src');
			document.documentElement.style.overflow = '';
			if (opener) opener.focus();
		};
		shots.forEach(a => a.addEventListener('click', e => {
			if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
			e.preventDefault();
			open(a);
		}));
	}
	const top = document.createElement('button');
	top.type = 'button';
	top.className = 'to-top';
	top.setAttribute('aria-label', 'Back to top');
	top.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>';
	document.body.appendChild(top);
	top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
	const onScroll = () => top.classList.toggle('show', window.scrollY > 700);
	window.addEventListener('scroll', onScroll, { passive: true });
	onScroll();
})();
