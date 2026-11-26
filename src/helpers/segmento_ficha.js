/**
 * Segmento de URL de la ficha de un artículo (contrato de la misión tienda-articulos-sin-slug).
 *
 * La ficha vive en /articulos/:slug/:commerce_id. Algunos artículos no tienen slug (datos
 * viejos): para ellos el segmento es `~<id>` (tilde + id decimal). El `~` no puede aparecer en
 * ningún slug generado por el sistema, por eso nunca choca con uno real. tienda-api resuelve
 * el mismo formato (tienda-api, ArticleController).
 *
 * @param {object|null} article Artículo (o promoción) con `slug` y/o `id`.
 * @returns {string|null} El slug (si es un string no vacío tras trim), `~<id>` si no hay slug
 *                        pero sí id, o null si no hay forma de armar la URL.
 */
export function segmento_de_ficha(article) {
	if (!article) {
		return null
	}
	// Un slug válido es un string con algo más que espacios
	if (typeof article.slug === 'string' && article.slug.trim() !== '') {
		return article.slug
	}
	// Sin slug: se usa el id, si existe
	if (article.id !== undefined && article.id !== null && article.id !== '') {
		return '~' + article.id
	}
	return null
}
