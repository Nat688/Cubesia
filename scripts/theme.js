(function () {
	'use strict';
	const root = document.documentElement;
	const KEY_T = 'cubesia-theme', KEY_Z = 'cubesia-zoom';
	const read = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
	const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
	function setTheme(t) {
		if (t === 'light' || t === 'dark') root.dataset.theme = t; else delete root.dataset.theme;
		write(KEY_T, t === 'auto' ? null : t);
		mark();
	}
	function setZoom(z) {
		root.style.setProperty('--text-zoom', z);
		write(KEY_Z, z === 1 ? null : String(z));
		mark();
	}
	const zooms = [0.9, 1, 1.15, 1.3];
	let panel;
	function mark() {
		if (!panel) return;
		const t = root.dataset.theme || 'auto';
		panel.querySelectorAll('[data-theme-set]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeSet === t)));
		const z = +(getComputedStyle(root).getPropertyValue('--text-zoom') || 1);
		panel.querySelectorAll('[data-zoom]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.zoom === z)));
	}
	function build() {
		const toggle = document.createElement('button');
		toggle.type = 'button';
		toggle.className = 'a11y-toggle';
		toggle.textContent = 'Aa';
		toggle.setAttribute('aria-label', 'Display settings');
		toggle.setAttribute('aria-expanded', 'false');
		panel = document.createElement('div');
		panel.className = 'a11y-panel';
		panel.hidden = true;
		panel.setAttribute('role', 'group');
		panel.setAttribute('aria-label', 'Display settings');
		panel.innerHTML =
			'<b>Theme</b><div class="row">' +
			'<button type="button" data-theme-set="auto">Auto</button>' +
			'<button type="button" data-theme-set="dark">Dark</button>' +
			'<button type="button" data-theme-set="light">Light</button></div>' +
			'<b>Text size</b><div class="row">' +
			zooms.map((z, i) => '<button type="button" data-zoom="' + z + '" aria-label="Text size ' + (z * 100) + '%">' + ['A\u2212', 'A', 'A+', 'A++'][i] + '</button>').join('') + '</div>';
		panel.addEventListener('click', e => {
			const b = e.target.closest('button');
			if (!b) return;
			if (b.dataset.themeSet) setTheme(b.dataset.themeSet);
			if (b.dataset.zoom) setZoom(+b.dataset.zoom);
		});
		toggle.addEventListener('click', () => {
			panel.hidden = !panel.hidden;
			toggle.setAttribute('aria-expanded', String(!panel.hidden));
		});
		document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); } });
		document.body.append(toggle, panel);
		mark();
	}
	if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
