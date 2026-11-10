document.querySelectorAll('.staff-head').forEach(img => {
	img.addEventListener('error', () => {
		const fb = img.dataset.fb;
		if (fb && img.src !== fb) { img.src = fb; img.dataset.fb = ''; }
		else img.style.visibility = 'hidden';
	});
});
