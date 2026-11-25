/**
 * Leyenda de descuento por medio de pago: «Con Transferencia o Efectivo, 10 % de descuento».
 *
 * Se arma SOLA con los métodos de pago del comercio (nada escrito a mano ni atado a un cliente): toma el MAYOR
 * descuento que tenga algún método y nombra a todos los que lo tienen. Sólo se muestra si el comercio prendió la
 * casilla «Mostrar en la tienda la leyenda de descuento por medio de pago» (Configuración Online).
 */

/**
 * Porcentaje legible en es-AR: sin ceros de más y con coma decimal (10 -> «10», «4.76» -> «4,76»).
 *
 * @param {number} porcentaje
 * @returns {string}
 */
function porcentaje_legible(porcentaje) {
	return String(Number(porcentaje.toFixed(2))).replace('.', ',')
}

/**
 * Une nombres como «A», «A o B», «A, B o C».
 *
 * @param {Array<string>} nombres
 * @returns {string}
 */
function unir_con_o(nombres) {
	if (nombres.length <= 1) {
		return nombres.join('')
	}
	return nombres.slice(0, -1).join(', ') + ' o ' + nombres[nombres.length - 1]
}

/**
 * Arma la leyenda de descuento.
 *
 * @param {Array<object>} metodos Métodos de pago de la tienda ({name, discount}); `discount` llega como string ("10.00").
 * @param {*} mostrar Valor de `mostrar_leyenda_de_descuento` de la configuración online (true/1 prende; false/0/undefined apaga).
 * @returns {string} La leyenda, o '' si está apagada, no hay métodos o ninguno tiene descuento.
 */
export function leyenda_descuento(metodos, mostrar) {
	if (!mostrar || !Array.isArray(metodos)) {
		return ''
	}
	// Mayor descuento entre todos los métodos (los inválidos o negativos no cuentan).
	let mayor = 0
	metodos.forEach(function(metodo) {
		let descuento = Number(metodo && metodo.discount)
		if (isFinite(descuento) && descuento > mayor) {
			mayor = descuento
		}
	})
	if (!mayor) {
		return ''
	}
	// Los nombres, tal como los escribió el comercio, de los métodos que tienen ese descuento.
	let nombres = []
	metodos.forEach(function(metodo) {
		if (metodo && Number(metodo.discount) === mayor && metodo.name) {
			nombres.push(metodo.name)
		}
	})
	if (!nombres.length) {
		return ''
	}
	return 'Con ' + unir_con_o(nombres) + ', ' + porcentaje_legible(mayor) + ' % de descuento'
}
