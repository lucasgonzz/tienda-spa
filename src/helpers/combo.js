/**
 * Lógica PURA de la tarjeta de un combo (imagen que se muestra y tope de stock).
 *
 * Vive fuera del componente por dos motivos:
 *  1. Lo comparten la tarjeta (`common/combo-card/Index.vue`) y el popup del mini-carrito
 *     (`nav/right-buttons/cart-btn/LastArticle.vue`): la misma regla de "qué foto lleva un
 *     combo" tiene que dar lo mismo en los dos lugares.
 *  2. No depende de Vue ni de Vuex, así que se prueba con node suelto.
 *
 * 🔴 Ninguna función acá recalcula el precio ni el stock del combo: los dos vienen resueltos del
 * servidor (`final_price` por lista, `stock_disponible` por la regla del mínimo entre
 * componentes). El SPA solo los interpreta.
 *
 * 🔴 NO se usa `mixins/images.js`: es legado y lee `image.url`, que ya no existe. La URL de una
 * imagen es `image.hosting_url`, tal cual viene, sin transformar (no hay thumbnails).
 */

/**
 * La URL de la primera imagen usable de una lista de imágenes (formato de `Article.images`).
 *
 * @param {Array|null|undefined} images
 * @returns {string|null}
 */
function primera_url(images) {
	if (!Array.isArray(images)) {
		return null
	}
	for (let i = 0; i < images.length; i++) {
		if (images[i] && images[i].hosting_url) {
			return images[i].hosting_url
		}
	}
	return null
}

/**
 * La foto PROPIA del combo (la que se carga en el ABM de empresa), o null si no tiene.
 *
 * `images` siempre viene del servidor (vacío si no hay foto), pero se lee defensivo: una API
 * vieja que todavía no manda la clave no puede romper el render.
 *
 * @param {object|null|undefined} combo
 * @returns {string|null}
 */
export function imagen_propia_de_combo(combo) {
	if (!combo) {
		return null
	}
	return primera_url(combo.images)
}

/**
 * Las teselas del mosaico con las imágenes de los artículos que componen el combo: una por
 * artículo componente, hasta `max`. Un componente sin imagen entra con la imagen por defecto
 * del comercio y, si tampoco hay, con null (la plantilla dibuja un ícono): se deja entrar igual
 * para que el mosaico no cambie de forma según qué artículo tenga foto.
 *
 * @param {object|null|undefined} combo
 * @param {number} max cuántas teselas entran antes del contador "+N"
 * @param {string|null|undefined} imagen_por_defecto
 * @returns {Array<string|null>}
 */
export function imagenes_de_componentes(combo, max, imagen_por_defecto) {
	let urls = []
	let articulos = combo && Array.isArray(combo.articles) ? combo.articles : []
	articulos.forEach(article => {
		if (urls.length >= max) {
			return
		}
		let imagen = article ? primera_url(article.images) : null
		if (!imagen && imagen_por_defecto) {
			imagen = imagen_por_defecto
		}
		urls.push(imagen)
	})
	return urls
}

/**
 * Lo que dibuja la tarjeta arriba de todo.
 *
 * - Con foto propia: UNA sola tesela con esa foto y sin contador "+N".
 * - Sin foto propia: el mosaico de los componentes (`imagenes_de_componentes`) y el "+N" con
 *   los componentes que no entraron.
 *
 * @param {object|null|undefined} combo
 * @param {number} max
 * @param {string|null|undefined} imagen_por_defecto
 * @param {boolean} ignorar_propia true si la foto propia falló al cargar: cae al mosaico
 * @returns {{urls: Array<string|null>, restantes: number, propia: boolean}}
 */
export function imagenes_de_tarjeta(combo, max, imagen_por_defecto, ignorar_propia) {
	let propia = ignorar_propia ? null : imagen_propia_de_combo(combo)
	if (propia) {
		return { urls: [propia], restantes: 0, propia: true }
	}
	let urls = imagenes_de_componentes(combo, max, imagen_por_defecto)
	let total = combo && Array.isArray(combo.articles) ? combo.articles.length : 0
	let restantes = total - max
	return { urls: urls, restantes: restantes > 0 ? restantes : 0, propia: false }
}

/**
 * UNA sola imagen que represente al combo (el popup del mini-carrito, que muestra una miniatura):
 * la foto propia; si no tiene, la primera imagen de un componente; si tampoco, la imagen por
 * defecto del comercio; si tampoco, null.
 *
 * @param {object|null|undefined} combo
 * @param {string|null|undefined} imagen_por_defecto
 * @returns {string|null}
 */
export function imagen_de_combo(combo, imagen_por_defecto) {
	let propia = imagen_propia_de_combo(combo)
	if (propia) {
		return propia
	}
	let articulos = combo && Array.isArray(combo.articles) ? combo.articles : []
	for (let i = 0; i < articulos.length; i++) {
		let imagen = articulos[i] ? primera_url(articulos[i].images) : null
		if (imagen) {
			return imagen
		}
	}
	return imagen_por_defecto || null
}

/**
 * El tope de unidades que se pueden comprar del combo, o null si no hay tope.
 *
 * `stock_disponible` lo calcula el servidor (mínimo entre componentes de floor(stock/cantidad)):
 *  - null / ausente => sin control de stock, hay siempre => SIN tope.
 *  - número        => tope; un negativo o un valor que no es número finito se toma como 0.
 *
 * Con `ignorar_stock` prendido (Online Configurations -> Stock) la tienda entera trata todo como
 * siempre disponible, igual que `hasStock()` del mixin de artículos: sin tope ni cartel.
 *
 * ⚠️ NO se aplica `stock_null_equal_0`: ese flag es del artículo suelto (su stock null significa
 * "no cargado"). En un combo, null significa "ningún componente lleva stock" y hay siempre.
 *
 * @param {object|null|undefined} combo
 * @param {boolean} ignorar_stock
 * @returns {number|null}
 */
export function tope_de_stock_del_combo(combo, ignorar_stock) {
	if (ignorar_stock || !combo) {
		return null
	}
	let stock = combo.stock_disponible
	if (stock === null || stock === undefined || stock === '') {
		return null
	}
	stock = Number(stock)
	if (!isFinite(stock) || stock < 0) {
		return 0
	}
	return Math.floor(stock)
}

/**
 * ¿El combo está agotado? Solo con un tope conocido y en cero.
 *
 * @param {number|null} tope resultado de `tope_de_stock_del_combo`
 * @returns {boolean}
 */
export function combo_agotado(tope) {
	return tope === 0
}

/**
 * Recorta la cantidad tipeada al tope, mismo criterio que `add-to-cart/Amount.vue::check_amount`.
 * Sin tope, con tope 0 (el botón ya está deshabilitado), o con un valor vacío/no numérico, no
 * toca nada: eso lo decide la validación de "cantidad válida" de la tarjeta.
 *
 * @param {string|number} valor lo que hay en el input
 * @param {number|null} tope
 * @returns {{valor: string|number, recortado: boolean}}
 */
export function recortar_cantidad_al_tope(valor, tope) {
	if (tope === null || tope === undefined || tope <= 0 || valor === '' || valor === null || valor === undefined) {
		return { valor: valor, recortado: false }
	}
	let cantidad = Number(valor)
	if (!isFinite(cantidad) || cantidad <= tope) {
		return { valor: valor, recortado: false }
	}
	return { valor: tope, recortado: true }
}

/**
 * El texto de "cuántos quedan", o null si no corresponde mostrarlo: sin tope (stock null o
 * `ignorar_stock`), agotado (ahí va el cartel), o con `mostrar_stock_disponible` apagado.
 *
 * @param {number|null} tope
 * @param {boolean} mostrar false si el comercio apagó `mostrar_stock_disponible`
 * @returns {string|null}
 */
export function texto_quedan(tope, mostrar) {
	if (!mostrar || tope === null || tope === undefined || tope <= 0) {
		return null
	}
	return tope === 1 ? 'Queda 1' : 'Quedan ' + tope
}
