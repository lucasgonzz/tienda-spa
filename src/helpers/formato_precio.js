import numeral from 'numeral'

/**
 * Formato de precios de la tienda: es-AR ($3.779,07), punto de miles y coma decimal.
 *
 * 🔴 NO se resuelve registrando un locale en numeral (`numeral.register('locale', ...)` +
 * `numeral.locale(...)`), que es el atajo obvio, y rompe los precios en silencio.
 * numeral usa los delimitadores del locale activo tambien para LEER strings, y Laravel serializa
 * las columnas `decimal` (final_price, pivot.price, carts.total...) como string con punto:
 *
 *   numeral('3779.07').format('$0,0.00')   locale en     ->  $3,779.07
 *   numeral('3779.07').format('$0,0.00')   locale es-AR  ->  $377.907,00   (x100)
 *   numeral('0.5').format('$0,0.00')       locale es-AR  ->  $5,00         (x10)
 *
 * Medido con numeral 2.0.6 el 13/10/2026 (mismo hallazgo que empresa-spa, 21/8/2026).
 *
 * Por eso numeral queda con su locale por defecto (lee los numeros exactamente igual que antes) y
 * solo se da vuelta el TEXTO ya formateado. Cualquier otro numeral() que aparezca despues sigue
 * leyendo bien, porque no hay ningun estado global cambiado.
 *
 * Deteccion de la proxima vez que alguien lo intente:
 *   git grep -n "numeral.locale\|numeral.register" -- src
 */

/**
 * Da vuelta los separadores de un texto formateado en ingles: "," <-> ".".
 *
 * @param {string} texto Ej: "$1,234.50"
 * @returns {string} Ej: "$1.234,50"
 */
function dar_vuelta_separadores(texto) {
	return texto.replace(/[,.]/g, function (caracter) {
		return caracter === ',' ? '.' : ','
	})
}

/**
 * Precio con simbolo, miles con punto y siempre dos decimales con coma.
 * Solo para MOSTRAR: el resultado es texto y no se vuelve a parsear ni se manda a la API.
 *
 * @param {number|string} p Importe; acepta number o el string decimal que manda la API ("3779.07").
 * @returns {string} Ej: 3779.07 -> "$3.779,07"; "101316.00" -> "$101.316,00"
 */
export function precio_es(p) {
	return dar_vuelta_separadores(numeral(p).format('$0,0.00'))
}
