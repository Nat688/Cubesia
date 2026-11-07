(function () {
	'use strict';
	const tiles = [...document.querySelectorAll('.rule-tile')];
	tiles.forEach(t => {
		const n = t.querySelectorAll('.tile-body li:not(:has(ul))').length;
		t.querySelector('.tile-count').textContent = n + (n > 1 ? ' rules' : ' rule');
		t.addEventListener('click', e => { if (!e.target.closest('a.anchor')) open(t); });
		t.addEventListener('keydown', e => {
			if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(t); }
		});
	});
	let dlg;
	function open(tile) {
		if (!dlg) {
			dlg = document.createElement('dialog');
			dlg.className = 'rule-dialog';
			dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
			document.body.appendChild(dlg);
		}
		const h = tile.querySelector('h3, h4');
		dlg.textContent = '';
		const head = document.createElement('div');
		head.className = 'rd-head';
		const title = document.createElement('h2');
		title.textContent = h.firstChild.nodeValue.trim();
		const close = document.createElement('button');
		close.type = 'button';
		close.textContent = '\u00D7';
		close.setAttribute('aria-label', 'Close');
		close.addEventListener('click', () => dlg.close());
		head.append(title, close);
		const body = document.createElement('div');
		body.className = 'rd-body';
		body.innerHTML = tile.querySelector('.tile-body').innerHTML;
		dlg.append(head, body);
		if (!dlg.open) dlg.showModal();
		if (history.replaceState) history.replaceState(null, '', '#' + h.id);
		close.focus();
	}
	function fromHash() {
		const el = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
		const t = el && el.closest('.rule-tile');
		if (t) { t.scrollIntoView({ block: 'center' }); open(t); }
	}
	window.addEventListener('load', fromHash);
	window.addEventListener('hashchange', fromHash);
})();
