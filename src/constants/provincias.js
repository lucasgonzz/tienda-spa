/*
 * Las 24 jurisdicciones de Argentina (23 provincias + CABA), con el nombre exacto que usa el
 * Correo y que Zipnova espera en `destination.state` (misión zipnova-envios, 14/9/2026).
 *
 * Es la lista del select de provincia del checkout y del formulario de "no reconocimos ese
 * código postal". Se guarda el nombre tal cual (con tilde): `carts.envio_destino.provincia`
 * viaja después a Zipnova sin transformar.
 */
export const PROVINCIAS = [
	'Buenos Aires',
	'Ciudad Autónoma de Buenos Aires',
	'Catamarca',
	'Chaco',
	'Chubut',
	'Córdoba',
	'Corrientes',
	'Entre Ríos',
	'Formosa',
	'Jujuy',
	'La Pampa',
	'La Rioja',
	'Mendoza',
	'Misiones',
	'Neuquén',
	'Río Negro',
	'Salta',
	'San Juan',
	'San Luis',
	'Santa Cruz',
	'Santa Fe',
	'Santiago del Estero',
	'Tierra del Fuego',
	'Tucumán',
]

/*
 * Formas alternativas con las que Zipnova, Google Maps o el comprador nombran una provincia,
 * ya sin tildes ni mayúsculas (ver `sin_tildes`). Lo que no está acá se resuelve comparando el
 * nombre sin tildes contra la lista de arriba: "Cordoba" → "Córdoba", "Entre Rios" → "Entre Ríos".
 */
const ALIAS = {
	'caba': 'Ciudad Autónoma de Buenos Aires',
	'capital federal': 'Ciudad Autónoma de Buenos Aires',
	'ciudad de buenos aires': 'Ciudad Autónoma de Buenos Aires',
	'cdad. autonoma de buenos aires': 'Ciudad Autónoma de Buenos Aires',
	'cdad autonoma de buenos aires': 'Ciudad Autónoma de Buenos Aires',
	'buenos aires capital': 'Ciudad Autónoma de Buenos Aires',
	'provincia de buenos aires': 'Buenos Aires',
	'tierra del fuego, antartida e islas del atlantico sur': 'Tierra del Fuego',
	'tierra del fuego antartida e islas del atlantico sur': 'Tierra del Fuego',
}

/**
 * Texto en minúsculas, sin tildes ni espacios de más, para comparar nombres de provincia.
 *
 * @param {string} texto
 * @returns {string}
 */
function sin_tildes(texto) {
	return String(texto || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.trim()
}

/**
 * Lleva cualquier forma de nombrar una provincia al nombre canónico de `PROVINCIAS`.
 *
 * Zipnova devuelve `state` sin tildes ("Cordoba", "Entre Rios") y Google Maps a veces con la
 * forma larga ("Cdad. Autónoma de Buenos Aires"): las dos tienen que caer en el mismo valor del
 * select, si no el comprador ve la provincia vacía aunque el cotizador ya la resolvió.
 *
 * @param {string} texto Nombre en cualquier forma.
 * @returns {string} Nombre canónico, o '' si no se reconoce (el comprador la elige a mano).
 */
export function normalizar_provincia(texto) {
	let clave = sin_tildes(texto)
	if (clave === '') {
		return ''
	}
	if (ALIAS[clave]) {
		return ALIAS[clave]
	}
	let encontrada = ''
	PROVINCIAS.forEach(provincia => {
		if (!encontrada && sin_tildes(provincia) === clave) {
			encontrada = provincia
		}
	})
	if (encontrada) {
		return encontrada
	}
	// "Tierra del Fuego, Antártida..." y variantes largas: alcanza con que empiece igual.
	PROVINCIAS.forEach(provincia => {
		if (!encontrada && clave.indexOf(sin_tildes(provincia)) === 0) {
			encontrada = provincia
		}
	})
	return encontrada
}
