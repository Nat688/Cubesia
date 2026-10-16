function buildUrl(url, pseudo) {
	return url.replace(/\{pseudo\}/g, encodeURIComponent(pseudo));
}
function isValidPseudo(pseudo) {
	return /^[A-Za-z0-9_.]{1,20}$/.test(pseudo);
}
function formatTime(sec) {
	const h = Math.floor(sec / 3600);
	const m = Math.floor((sec % 3600) / 60);
	const s = sec % 60;
	return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
const VOTE_SITES = [
	{ name: 'Vote N°1', key: 'timer_1h30',    seconds: 90 * 60,    url:  'https://serveur-prive.net/minecraft/cubesia/vote/{pseudo}' },
	{ name: 'Vote N°2', key: 'timer_1h30*',   seconds: 90 * 60,    url:  'https://serveur-minecraft-vote.fr/serveur/2859/voter?pseudo={pseudo}'},
	{ name: 'Vote N°3', key: 'timer_2h',      seconds: 2 * 3600,   url: 'https://top-serveurs.net/minecraft/vote/cubesia?pseudo={pseudo}' },
	{ name: 'Vote N°4', key: 'timer_2h*',     seconds: 2 * 3600,   url: 'https://serveur-minecraft.com/5983?username={pseudo}'},
	{ name: 'Vote N°5', key: 'timer_3h',      seconds: 3 * 3600,   url: 'https://www.liste-serveurs-minecraft.org/vote/?idc=208990&nickname={pseudo}'},
	{ name: 'Vote N°6', key: 'timer_24h',     seconds: 24 * 3600,  url: 'https://playerpicked.com/servers/cubesia?pseudo={pseudo}'},
	{ name: 'Vote N°7', key: 'timer_24h*',    seconds: 24 * 3600,  url: 'https://www.serveursminecraft.org/serveur/7757/?pseudo={pseudo}'}
];
const PSEUDO_KEY = 'cubesia-vote-pseudo';
const input = document.getElementById('pseudo');
const hint = document.getElementById('pseudoHint');
const section = document.getElementById('voteSection');
const store = {
	get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
	set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
	del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
function getPseudo() { return input.value.trim(); }
function setHint(text, kind) {
	hint.textContent = text;
	hint.className = 'pseudo-hint' + (kind ? ' ' + kind : '');
}
function updateHint() {
	const p = getPseudo();
	if (!p) setHint('', '');
	else if (!isValidPseudo(p)) setHint('Use only letters, numbers, _ and .', 'error');
	else setHint('Username saved.', 'ok');
}
VOTE_SITES.forEach(site => {
	const card = document.createElement('div');
	card.className = 'vote-card ready';
	const title = document.createElement('span');
	const b = document.createElement('b');
	b.textContent = site.name;
	title.appendChild(b);
	const timer = document.createElement('p');
	timer.className = 'vote-timer';
	timer.textContent = 'You can vote!';
	const link = document.createElement('a');
	link.className = 'vote-btn';
	link.target = '_blank';
	link.rel = 'noopener';
	link.textContent = 'Vote Now';
	card.append(title, timer, link);
	section.appendChild(card);
	Object.assign(site, { card, timer, link, interval: null });
	link.addEventListener('click', () => runTimer(site));
});
function refreshLinks() {
	const p = getPseudo();
	VOTE_SITES.forEach(site => {
		site.link.href = buildUrl(site.url, isValidPseudo(p) ? p : '');
	});
}
function runTimer(site) {
	clearInterval(site.interval);
	let end = store.get(site.key);
	if (!end) {
		end = Date.now() + site.seconds * 1000;
		store.set(site.key, end);
	} else {
		end = parseInt(end, 10);
	}
	function tick() {
		const left = Math.floor((end - Date.now()) / 1000);
		if (left <= 0) {
			clearInterval(site.interval);
			store.del(site.key);
			site.timer.textContent = 'You can vote!';
			site.card.classList.add('ready');
			site.card.classList.remove('waiting');
			return;
		}
		site.timer.textContent = formatTime(left);
		site.card.classList.add('waiting');
		site.card.classList.remove('ready');
	}
	site.interval = setInterval(tick, 1000);
	tick();
}
VOTE_SITES.forEach(site => { if (store.get(site.key)) runTimer(site); });
input.value = store.get(PSEUDO_KEY) || '';
input.addEventListener('input', () => {
	store.set(PSEUDO_KEY, input.value.trim());
	refreshLinks();
	updateHint();
});
refreshLinks();
updateHint();
