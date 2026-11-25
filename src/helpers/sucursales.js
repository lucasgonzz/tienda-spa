/**
 * Texto de la dirección de una sucursal de retiro (Andreani, Correo Argentino, OCA...).
 *
 * 🔴 Una sucursal de Andreani puede venir sin calle o sin altura (tienda-api deja `null`). Concatenar
 * `street + ' ' + street_number` mostraba "null" al comprador (checkout y pantalla de gracias): se arma siempre acá,
 * descartando lo que no tiene texto. No lo "simplifiques" volviendo a la concatenación.
 *
 * @param {object|null} punto Sucursal con `street` y `street_number` (cualquiera puede ser null/undefined/'').
 * @returns {string} "Calle 123", "Calle", "123" o '' si no hay nada que mostrar.
 */
export function texto_de_calle(punto) {
	if (!punto) {
		return ''
	}
	// Texto de cada parte, vacío si es null/undefined o sólo espacios.
	let partes = [punto.street, punto.street_number].map(parte => {
		return parte === null || parte === undefined ? '' : String(parte).trim()
	})
	return partes.filter(parte => parte !== '').join(' ')
}
