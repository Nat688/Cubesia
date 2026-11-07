(function () {
	const form = document.getElementById('applyForm');
	const msg = document.getElementById('msg');
	const btn = document.getElementById('send');
	const endpoint = document.querySelector('[data-endpoint]').dataset.endpoint;
	const say = (t, kind) => { msg.textContent = t; msg.className = 'form-msg ' + (kind || ''); };
	if (!endpoint) {
		btn.disabled = true;
		say('Applications are not open yet.', 'error');
		return;
	}
	const COOLDOWN = 'cubesia-apply-sent';
	form.addEventListener('submit', async e => {
		e.preventDefault();
		if (!form.checkValidity()) { form.reportValidity(); return; }
		try {
			if (Date.now() - Number(localStorage.getItem(COOLDOWN) || 0) < 3600e3) { say('You already sent an application recently.', 'error'); return; }
		} catch (err) {}
		btn.disabled = true;
		say('Sending...', '');
		const data = Object.fromEntries(new FormData(form));
		try {
			const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
			if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (await r.text()).slice(0, 120));
			try { localStorage.setItem(COOLDOWN, Date.now()); } catch (err) {}
			form.reset();
			say('Thank you! Your application was sent.', 'ok');
		} catch (err) {
			btn.disabled = false;
			console.error('Apply form:', err);
			say('Something went wrong. Please try again later or open a ticket on Discord.', 'error');
		}
	});
})();
