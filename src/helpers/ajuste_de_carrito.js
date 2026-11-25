/**
 * Helpers puros del ajuste de carritos por stock (mision carritos-ajuste-stock).
 *
 * Cuando el stock baja, tienda-api/empresa-api recortan la cantidad de un renglón del carrito y
 * guardan lo que faltó en `pivot.amount_insuficiente`. Estas funciones interpretan esos campos.
 *
 * Compatibilidad con una tienda-api anterior: todos los campos son opcionales. Si no vienen, no
 * hay cartel de faltante, la casilla "completar al reponer" se considera marcada y no se avisa
 * que el producto puede agotarse. Ninguna función lanza con una línea sin `pivot`.
 */

/**
 * Convierte un valor numérico de la API en número (null, undefined o no numérico → 0).
 * @param {*} valor valor crudo
 * @returns {number}
 */
function a_numero(valor) {
	let numero = Number(valor)
	return isNaN(numero) ? 0 : numero
}

/**
 * Unidades que quedaron hoy en el renglón.
 * @param {object} linea renglón del carrito
 * @returns {number}
 */
function unidades_actuales(linea) {
	return a_numero(linea && linea.pivot ? linea.pivot.amount : 0)
}

/**
 * Unidades que el comprador agregó originalmente: lo que quedó más lo que falta.
 * @param {object} linea renglón del carrito
 * @returns {number}
 */
export function unidades_pedidas(linea) {
	let faltante = linea && linea.pivot ? a_numero(linea.pivot.amount_insuficiente) : 0
	return unidades_actuales(linea) + (faltante > 0 ? faltante : 0)
}

/**
 * Indica si al renglón se le bajó la cantidad por falta de stock (faltante positivo).
 * @param {object} linea renglón del carrito
 * @returns {boolean}
 */
export function tiene_faltante(linea) {
	return !!(linea && linea.pivot) && a_numero(linea.pivot.amount_insuficiente) > 0
}

/**
 * Texto del cartel del renglón recortado.
 * @param {object} linea renglón del carrito
 * @returns {string} "Agregaste X unidades, ahora hay Y disponibles."
 */
export function texto_faltante(linea) {
	let pedidas = unidades_pedidas(linea)
	let actuales = unidades_actuales(linea)
	return 'Agregaste ' + pedidas + (pedidas === 1 ? ' unidad' : ' unidades')
		+ ', ahora hay ' + actuales + ' disponibles.'
}

/**
 * Valor de la casilla "Completar mi carrito cuando vuelva a haber stock". Si la API no manda
 * el campo (API anterior) se considera marcada, que es el valor por defecto.
 * @param {object} linea renglón del carrito
 * @returns {boolean}
 */
export function completar_al_reponer(linea) {
	if (!linea || !linea.pivot) {
		return true
	}
	let valor = linea.pivot.completar_al_reponer
	if (valor === undefined || valor === null) {
		return true
	}
	return !!a_numero(valor) || valor === true
}

/**
 * Indica si hay que avisar que el producto está en carritos de otros y puede agotarse.
 * Sólo es true cuando la API lo manda explícitamente en true.
 * @param {object} linea renglón del carrito
 * @returns {boolean}
 */
export function puede_agotarse(linea) {
	return !!linea && linea.puede_agotarse === true
}

/**
 * Renglones del carrito que se muestran en el resumen del checkout: se sacan los que quedaron
 * en 0 esperando stock (cantidad 0 con faltante positivo).
 * @param {Array} articulos renglones del carrito (puede venir undefined)
 * @returns {Array}
 */
export function lineas_para_resumen(articulos) {
	let resultado = []
	;(articulos || []).forEach(linea => {
		if (unidades_actuales(linea) === 0 && tiene_faltante(linea)) {
			return
		}
		resultado.push(linea)
	})
	return resultado
}
