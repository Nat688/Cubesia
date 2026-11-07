(function () {
	const table = document.getElementById('prices');
	if (!table) return;
	const q = document.getElementById('q');
	const count = document.getElementById('count');
	const empty = document.getElementById('empty');
	const body = table.tBodies[0];
	const rows = [...body.rows];
	function update() {
		const terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
		let shown = 0;
		rows.forEach(r => {
			const ok = terms.every(t => r.textContent.toLowerCase().includes(t));
			r.hidden = !ok;
			if (ok) shown++;
		});
		count.textContent = shown + ' / ' + rows.length;
		empty.hidden = shown > 0;
	}
	q.addEventListener('input', update);
	let dir = 1, last = '';
	table.querySelectorAll('th button').forEach((b, i) => {
		b.addEventListener('click', () => {
			const key = b.dataset.sort;
			dir = last === key ? -dir : 1;
			last = key;
			const col = b.closest('th').cellIndex;
			rows.sort((a, c) => {
				const x = a.cells[col], y = c.cells[col];
				return key === 'price' ? (x.dataset.v - y.dataset.v) * dir : x.textContent.localeCompare(y.textContent) * dir;
			});
			rows.forEach(r => body.appendChild(r));
		});
	});
	update();
})();
