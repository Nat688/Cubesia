const ALLOWED_ORIGIN = 'https://nat688.github.io';
const FIELDS = [['mc', 'Minecraft', 20], ['discord', 'Discord', 40], ['age', 'Age', 3], ['tz', 'Time zone', 40],
	['availability', 'Availability', 200], ['experience', 'Experience', 1000], ['why', 'Motivation', 1500]];
const cors = { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
export default {
	async fetch(request, env) {
		if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
		if (request.method !== 'POST' || request.headers.get('Origin') !== ALLOWED_ORIGIN) return new Response('Forbidden', { status: 403, headers: cors });
		let data;
		try { data = await request.json(); } catch (e) { return new Response('Bad request', { status: 400, headers: cors }); }
		if (data.website) return new Response('ok', { headers: cors });
		const fields = [];
		for (const [key, name, max] of FIELDS) {
			const value = String(data[key] || '').trim().slice(0, max);
			if (!value) return new Response('Missing ' + key, { status: 400, headers: cors });
			fields.push({ name, value, inline: value.length < 40 });
		}
		const res = await fetch(env.DISCORD_WEBHOOK, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ allowed_mentions: { parse: [] }, embeds: [{ title: 'New staff application', color: 0x7b6cff, fields }] })
		});
		return new Response(res.ok ? 'ok' : 'error', { status: res.ok ? 200 : 502, headers: cors });
	}
};
