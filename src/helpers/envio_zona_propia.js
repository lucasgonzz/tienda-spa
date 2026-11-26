/**
 * Envío gratis en una forma de envío propia (`delivery_zones`) — misión truvari-carrito-entrega-pago (26/11/2026).
 *
 * ESPEJO EXACTO de `EnvioZonaPropiaHelper::resolver()` de tienda-api: la tabla de casos de los dos tests
 * (PHP y JS) es la misma. Si se cambia la regla, se cambia en las dos puntas.
 *
 *   a convenir                                -> precio 0, gratis false, a_convenir true
 *   desde > 0 y subtotal >= desde             -> precio 0, gratis, motivo 'monto'
 *   casilla de combos y el carrito tiene uno  -> precio 0, gratis, motivo 'combo'
 *   si no                                     -> el `price` de la zona
 *
 * El subtotal es `carts.total` (el computed `total` del mixin del carrito): sin envío, sin recargo web y sin
 * recargo ni descuento del medio de pago. Contra una API vieja la zona no trae las claves nuevas y cobra `price`.
 * Todo lo que llega de la API puede ser string ("1", "80000.00"): por eso las conversiones.
 */
import { zona_a_convenir } from '@/helpers/direcciones'

/**
 * Número de un valor que la API manda como número o como string decimal. Equivale al `is_numeric` de PHP:
 * vacío, null, booleanos y texto no numérico dan null.
 *
 * @param {*} valor
 * @returns {number|null}
 */
function numero_o_null(valor) {
	if (typeof valor === 'number') {
		return isFinite(valor) ? valor : null
	}
	if (typeof valor === 'string' && valor.trim() !== '') {
		let numero = Number(valor)
		return isFinite(numero) ? numero : null
	}
	return null
}

/**
 * Si un valor "tildado" lo está (mismo criterio que `FILTER_VALIDATE_BOOLEAN` de PHP): true, 1, "1", "true",
 * "on", "yes". Ausente, 0, "0" o cualquier otra cosa es false.
 *
 * @param {*} valor
 * @returns {boolean}
 */
function esta_tildado(valor) {
	if (valor === true || valor === 1) {
		return true
	}
	if (typeof valor === 'string') {
		return ['1', 'true', 'on', 'yes'].indexOf(valor.trim().toLowerCase()) !== -1
	}
	return false
}

/**
 * Resuelve cuánto cobra una forma propia (función pura).
 *
 * @param {object} zona forma propia tal como llega de GET /api/delivery-zones (claves nuevas opcionales)
 * @param {number|string} subtotal lo que valen las líneas, sin envío
 * @param {boolean} tiene_combo el carrito tiene una promoción de vinoteca o un combo
 * @returns {{precio: number, gratis: boolean, motivo: (string|null), a_convenir: boolean}}
 */
export function resolver_zona(zona, subtotal, tiene_combo) {
	let precio_de_lista = numero_o_null(zona && zona.price)
	if (precio_de_lista === null) {
		precio_de_lista = 0
	}
	// "A convenir" gana sobre todo: nunca "Gratis" ni se cobra nada online.
	if (zona_a_convenir(zona)) {
		return { precio: 0, gratis: false, motivo: null, a_convenir: true }
	}
	// Mínimo de compra: sólo vale un monto mayor a cero; `>=` como Zipnova (80000 justos es gratis).
	let desde = numero_o_null(zona && zona.envio_gratis_desde)
	let monto = Number(subtotal)
	if (desde !== null && desde > 0 && monto >= desde) {
		return { precio: 0, gratis: true, motivo: 'monto', a_convenir: false }
	}
	// Combo o promoción en el carrito con la casilla de la forma tildada.
	if (tiene_combo && esta_tildado(zona && zona.envio_gratis_con_combo)) {
		return { precio: 0, gratis: true, motivo: 'combo', a_convenir: false }
	}
	return { precio: precio_de_lista, gratis: false, motivo: null, a_convenir: false }
}

/**
 * Si una colección del carrito (promociones o combos) tiene alguna línea con cantidad mayor a cero.
 *
 * @param {Array} lineas
 * @returns {boolean}
 */
function alguna_con_cantidad(lineas) {
	return (lineas || []).filter(function(linea) {
		return linea && linea.pivot && Number(linea.pivot.amount) > 0
	}).length > 0
}

/**
 * Si el carrito tiene al menos una promoción de vinoteca o un combo con cantidad > 0 (los artículos sueltos no
 * cuentan). En la tienda las dos se venden como "combo".
 *
 * @param {object|null} cart
 * @returns {boolean}
 */
export function carrito_tiene_combo(cart) {
	if (!cart) {
		return false
	}
	return alguna_con_cantidad(cart.promociones_vinoteca) || alguna_con_cantidad(cart.combos)
}

/**
 * Monto "desde" de una zona como número, o null si no hay mínimo válido.
 *
 * @param {object} zona
 * @returns {number|null}
 */
function minimo_de_la_zona(zona) {
	let desde = numero_o_null(zona && zona.envio_gratis_desde)
	return desde !== null && desde > 0 ? desde : null
}

/**
 * Por qué es gratis el envío, para mostrar junto al precio.
 *
 * @param {string|null} motivo 'monto' | 'combo' | null
 * @param {object} zona
 * @param {function} formato_precio recibe un número y devuelve el texto del importe
 * @returns {string} "Por compras desde $ 80.000", "Con combos" o ''
 */
export function texto_motivo_gratis(motivo, zona, formato_precio) {
	if (motivo === 'monto') {
		let desde = minimo_de_la_zona(zona)
		return desde === null ? 'Envío gratis' : 'Por compras desde ' + formato_precio(desde)
	}
	if (motivo === 'combo') {
		return 'Con combos'
	}
	return ''
}

/**
 * Lo que le falta al comprador para que el envío sea gratis. Vacío si ya es gratis, si la forma es a convenir
 * o si no tiene ninguna regla.
 *
 * @param {object} zona
 * @param {number|string} subtotal
 * @param {boolean} tiene_combo
 * @param {function} formato_precio
 * @returns {string}
 */
export function hint_envio_gratis(zona, subtotal, tiene_combo, formato_precio) {
	if (!zona || resolver_zona(zona, subtotal, tiene_combo).gratis || zona_a_convenir(zona)) {
		return ''
	}
	let desde = minimo_de_la_zona(zona)
	let con_combo = esta_tildado(zona.envio_gratis_con_combo)
	if (desde !== null) {
		let falta = desde - Number(subtotal)
		return 'Te faltan ' + formato_precio(falta) + ' para el envío gratis' + (con_combo ? ' o sumá un combo' : '')
	}
	if (con_combo) {
		return 'Gratis si sumás un combo'
	}
	return ''
}

/**
 * Línea de envío propio de un pedido ya hecho (página de gracias y WhatsApp). La foto del pedido
 * (`envio_zona_precio`) manda; sin ella (pedido viejo o tienda vieja) se lee el precio vivo de la zona.
 *
 * @param {object} order pedido con `deliver`, `delivery_zone` y la foto
 * @param {function} formato_precio
 * @returns {string} "Envío: <zona> · Gratis (compras desde $ X)" / "· Gratis (con combos)" / "· $ X" /
 *   "· A coordinar con el vendedor", o '' sin envío a domicilio propio (retiro, correo o sin zona)
 */
export function texto_envio_del_pedido(order, formato_precio) {
	if (!order || Number(order.deliver) !== 1 || order.envio_opcion || !order.delivery_zone) {
		return ''
	}
	let zona = order.delivery_zone
	let cabecera = 'Envío: ' + zona.name + ' · '
	if (zona_a_convenir(zona)) {
		return cabecera + 'A coordinar con el vendedor'
	}
	let foto = numero_o_null(order.envio_zona_precio)
	let precio = foto !== null ? foto : numero_o_null(zona.price)
	if (precio === null || precio <= 0) {
		// Gratis: el motivo que se guardó con el pedido (si la zona ya no tiene mínimo, queda sólo "Gratis").
		let desde = minimo_de_la_zona(zona)
		if (order.envio_zona_gratis_motivo === 'monto' && desde !== null) {
			return cabecera + 'Gratis (compras desde ' + formato_precio(desde) + ')'
		}
		if (order.envio_zona_gratis_motivo === 'combo') {
			return cabecera + 'Gratis (con combos)'
		}
		return cabecera + 'Gratis'
	}
	return cabecera + formato_precio(precio)
}
