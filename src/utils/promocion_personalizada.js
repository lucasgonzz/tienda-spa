/**
 * Descarte del mensaje de promocion personalizada, por sesion de navegacion.
 *
 * El pedido de Lucas es literal: cerrado el mensaje, no vuelve a aparecer EN ESTA SESION.
 * sessionStorage es exactamente eso — "mientras dure esta pestaña" —, asi que no hace falta
 * ni localStorage (persistiria para siempre), ni cookie (viajaria en cada request a la API),
 * ni una columna en la base (el dueño del esquema es empresa-api y tienda-api ni siquiera
 * tiene database/migrations).
 *
 * 🔴 El patron de leer/escribir con try/catch se COPIA de src/utils/tracking.js, no se
 * importa: aquel modulo no lo exporta y ampliarle la superficie publica por esto seria
 * empeorarlo. La razon del try/catch es la misma que alla: en el modo privado de Safari
 * sessionStorage.getItem y setItem TIRAN excepcion, y si esa excepcion subiera romperia la
 * carga entera del SPA. Sin storage el descarte vive en memoria y dura lo que dure la
 * pestaña, que es una degradacion aceptable; romper la tienda no lo es.
 */

/*
 * Clave versionada: si algun dia cambia la forma de la firma, se sube a _v2 y nadie hereda
 * basura de la version anterior.
 */
const CLAVE_DESCARTE = 'promo_personalizada_descartada_v1'

/*
 * Copia en memoria: es la unica fuente cuando sessionStorage TIRA (modo privado de Safari,
 * cuota llena). Ahi el descarte dura lo que dure la pestaña.
 */
let descarte_en_memoria = null

/**
 * Lee la clave del sessionStorage sin dejar escapar la excepcion.
 *
 * @param {string} clave
 * @returns {string|null}
 */
function leer_storage(clave) {
	try {
		return window.sessionStorage.getItem(clave)
	} catch (e) {
		/* Modo privado de Safari y cuota llena tiran aca. Se cae a la copia en memoria. */
		return null
	}
}

/**
 * Escribe la clave en el sessionStorage sin dejar escapar la excepcion.
 *
 * @param {string} clave
 * @param {string} valor
 * @returns {void}
 */
function escribir_storage(clave, valor) {
	try {
		window.sessionStorage.setItem(clave, valor)
	} catch (e) {
		/* Sin storage el descarte vive lo que dure la pestaña. Es la degradacion aceptable. */
	}
}

/**
 * Firma de las ofertas que se le mostraron al comprador: comprador + ids de oferta.
 *
 * No es un simple `true` a proposito, y de eso dependen dos comportamientos:
 *   1. Si el comerciante activa una oferta NUEVA mientras el comprador navega, la firma
 *      cambia y el mensaje vuelve a aparecer. Es lo correcto: es otra oferta, no la que
 *      descarto.
 *   2. Si el comprador cierra sesion y entra otro en el mismo navegador, el buyer_id cambia
 *      y el segundo NO hereda el descarte del primero.
 *
 * @param {number|string} buyer_id
 * @param {Array} articles articulos con oferta, tal cual los manda la API
 * @returns {string} por ejemplo "12:45-46-51"
 */
export function firma_de_ofertas(buyer_id, articles) {
	let ids = []
	let lista = articles || []
	lista.forEach(article => {
		if (article && article.oferta_personalizada && article.oferta_personalizada.id) {
			ids.push(Number(article.oferta_personalizada.id))
		}
	})
	/* Orden NUMERICO y no alfabetico: [9, 10] tiene que dar "9-10" siempre, no "10-9". */
	ids.sort((a, b) => {
		return a - b
	})
	return String(buyer_id) + ':' + ids.join('-')
}

/**
 * Indica si esa misma combinacion de comprador y ofertas ya fue descartada en esta sesion.
 *
 * @param {string} firma
 * @returns {boolean}
 */
export function esta_descartado(firma) {
	if (!firma) {
		return false
	}
	let guardado = leer_storage(CLAVE_DESCARTE)
	if (guardado === null) {
		guardado = descarte_en_memoria
	}
	return guardado === firma
}

/**
 * Marca esa combinacion como descartada, en el storage y en memoria.
 *
 * @param {string} firma
 * @returns {void}
 */
export function marcar_descartado(firma) {
	if (!firma) {
		return
	}
	descarte_en_memoria = firma
	escribir_storage(CLAVE_DESCARTE, firma)
}
