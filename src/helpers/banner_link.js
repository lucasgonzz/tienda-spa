// Validación de consumo: la API histórica puede entregar datos sin validar.
export function bannerLink(value) {
	if (typeof value != 'string' || value.length > 500) return null
	let decoded = value
	let stable = false
	for (let i = 0; i < 8; i++) {
		let characters = Array.from(decoded.replace(/^ +| +$/g, ''))
		if (characters.some(function(character) {
			let code = character.charCodeAt(0)
			return code <= 32 || code === 127 || code === 92
		})) return null
		let next
		try { next = decodeURIComponent(decoded) } catch (error) { return null }
		if (next === decoded) { stable = true; break }
		decoded = next
	}
	if (!stable) return null
	let link = value.trim()
	let safe = decoded.trim()
	if (!link || !safe) return null
	if (/^https?:\/\//i.test(link)) {
		try {
			let url = new URL(link)
			let decodedUrl = new URL(safe)
			// También rechazar la sintaxis de credenciales vacías que URL normaliza y oculta.
			if (/^https?:\/\/[^/?#]*@/i.test(link) || /^https?:\/\/[^/?#]*@/i.test(safe)) return null
			if (!url.hostname || url.username || url.password || decodedUrl.username || decodedUrl.password) return null
			return { href: url.href, external: true }
		} catch (error) { return null }
	}
	if (/^\/\//.test(safe) || safe.indexOf(':') !== -1 || /(?:^|\/)\.{1,2}(?:\/|[?#]|$)/.test(safe)) return null
	return { href: '/' + link.replace(/^\/+/, ''), external: false }
}
