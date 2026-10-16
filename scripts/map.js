lucide.createIcons();
(function () {
	const frame = document.getElementById('mapFrame');
	const button = document.getElementById('mapFull');
	const request = frame.requestFullscreen || frame.webkitRequestFullscreen;
	if (!request) { button.hidden = true; return; }
	button.addEventListener('click', () => request.call(frame));
})();
