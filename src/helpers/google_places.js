import { normalizar_provincia } from '@/constants/provincias'
import { texto_limpio, coordenada, LARGOS } from '@/helpers/direcciones'

/*
 * Autocompletado de direcciones con Google Places API (New), por JS (misión
 * formas-envio-direcciones-maps, 19/10/2026).
 *
 * El script de Maps lo carga `public/index.html` con `&libraries=places`, async, con la key que
 * escribe el admin en `config.js` (`VUE_APP_GOOGLE_MAPS_API_KEY`).
 *
 * 🔴 NADA DE ESTO GUARDA UNA REFERENCIA A `google` AL IMPORTARSE: cada función la resuelve en el
 * momento de usarla (`window.google`). Por dos motivos:
 *   1. El script de Maps es async y puede terminar de cargar después que el bundle.
 *   2. Para probar el buscador sin facturación en Google se inyecta desde el navegador un
 *      `window.google.maps.places` falso (un stub) y el componente tiene que tomarlo sin recargar.
 *
 * 🔴 Y TODO PUEDE FALLAR, y la compra no puede depender de esto: al 19/10/2026 el proyecto de
 * Google de comerciocity.erp NO tiene facturación y Places responde PERMISSION_DENIED a cualquier
 * búsqueda. Cada función de acá rechaza o resuelve null ante cualquier problema, y el buscador
 * (BuscadorDireccion.vue) pasa a la carga a mano.
 */

/** Cuánto se espera una respuesta de Google antes de darla por perdida y cargar a mano. */
const TIEMPO_LIMITE_MS = 8000

/** Ya se avisó en la consola que Google no anda (se avisa una sola vez por carga de página). */
let aviso_dado = false

/** La última vez que se usó, Google falló (se vuelve a false cuando una búsqueda anda). */
let ultimo_fallo = false

/**
 * Deja en la consola, UNA sola vez, por qué el buscador pasó a la carga a mano. Sin esto no hay
 * forma de distinguir "el comprador no encontró su dirección" de "Google responde
 * PERMISSION_DENIED para todo" (lo que pasa sin facturación) sin ir a pegarle a la API a mano.
 *
 * @param {string} motivo
 * @param {*} error
 */
export function avisar_una_vez(motivo, error) {
	ultimo_fallo = true
	if (aviso_dado) {
		return
	}
	aviso_dado = true
	// eslint-disable-next-line no-console
	console.warn('Direcciones: el autocompletado de Google no está disponible (' + motivo + '). Se carga la dirección a mano.', error || '')
}

/**
 * Si en esta carga de página Google ya falló (no está, o respondió con error). El buscador que se
 * abre después de un fallo arranca directo en la carga a mano: hacerle escribir al comprador para
 * volver a fallar es hacerle perder tiempo en el checkout.
 *
 * @returns {boolean}
 */
export function google_ya_fallo() {
	return ultimo_fallo
}

/**
 * Google respondió bien: el próximo buscador vuelve a arrancar buscando. Pasa, por ejemplo, si el
 * script de Maps terminó de cargar tarde, o al probar con un `google.maps.places` falso inyectado
 * desde el navegador después de un fallo.
 */
export function marcar_google_ok() {
	ultimo_fallo = false
}

/**
 * Envuelve una promesa con un tiempo límite: si Google no contesta, el comprador no se queda
 * mirando "Buscando..." para siempre.
 *
 * @param {Promise} promesa
 * @param {number} ms
 * @returns {Promise}
 */
function con_tiempo_limite(promesa, ms) {
	return new Promise((resolve, reject) => {
		let timer = setTimeout(() => {
			reject(new Error('Google no respondió en ' + ms + ' ms'))
		}, ms)
		promesa.then(valor => {
			clearTimeout(timer)
			resolve(valor)
		}, error => {
			clearTimeout(timer)
			reject(error)
		})
	})
}

/**
 * La librería de Places (New), o null si no está.
 *
 * Primero mira `google.maps.places` (lo deja cargado `&libraries=places`). Si no tiene
 * `AutocompleteSuggestion` —un index.html viejo en caché sin `libraries=places`, o un script
 * cargado con `loading=async`— prueba `google.maps.importLibrary('places')`.
 *
 * Resuelve SIEMPRE (null si no hay forma), nunca rechaza.
 *
 * @returns {Promise<object|null>}
 */
export function resolver_places() {
	let google = typeof window !== 'undefined' ? window.google : null
	if (!google || !google.maps) {
		return Promise.resolve(null)
	}
	let places = google.maps.places
	if (places && places.AutocompleteSuggestion && typeof places.AutocompleteSuggestion.fetchAutocompleteSuggestions === 'function') {
		return Promise.resolve(places)
	}
	if (typeof google.maps.importLibrary !== 'function') {
		return Promise.resolve(null)
	}
	let importada
	try {
		importada = google.maps.importLibrary('places')
	} catch (e) {
		return Promise.resolve(null)
	}
	return con_tiempo_limite(Promise.resolve(importada), TIEMPO_LIMITE_MS)
		.then(libreria => {
			if (libreria && libreria.AutocompleteSuggestion && typeof libreria.AutocompleteSuggestion.fetchAutocompleteSuggestions === 'function') {
				return libreria
			}
			return null
		})
		.catch(() => null)
}

/**
 * Un token de sesión de autocompletado nuevo, o null si la librería no lo tiene.
 *
 * Google cobra el autocompletado por SESIÓN (todas las teclas de una búsqueda más el detalle del
 * lugar elegido) si cada pedido lleva el mismo token. Se crea uno al empezar a escribir y se
 * descarta al elegir una sugerencia.
 *
 * @param {object} libreria
 * @returns {object|null}
 */
export function nuevo_token(libreria) {
	try {
		return libreria && libreria.AutocompleteSessionToken ? new libreria.AutocompleteSessionToken() : null
	} catch (e) {
		return null
	}
}

/**
 * Texto de un `FormattableText` de Places (New) (`{text}`), o del string si ya vino plano.
 *
 * @param {*} formateable
 * @returns {string}
 */
function texto_de(formateable) {
	if (!formateable) {
		return ''
	}
	if (typeof formateable === 'string') {
		return formateable
	}
	return formateable.text ? String(formateable.text) : ''
}

/**
 * Pide sugerencias de direcciones para lo que el comprador escribió.
 *
 * @param {object} libreria La de `resolver_places()`.
 * @param {string} texto
 * @param {object|null} token
 * @returns {Promise<Array>} [{place_id, principal, secundario, texto, prediccion}] — rechaza si
 *                          Google falla (sin facturación: PERMISSION_DENIED / REQUEST_DENIED).
 */
export function buscar_sugerencias(libreria, texto, token) {
	let pedido = {
		input: texto,
		includedRegionCodes: ['ar'],
		language: 'es',
	}
	if (token) {
		pedido.sessionToken = token
	}
	let promesa
	try {
		promesa = libreria.AutocompleteSuggestion.fetchAutocompleteSuggestions(pedido)
	} catch (e) {
		return Promise.reject(e)
	}
	return con_tiempo_limite(Promise.resolve(promesa), TIEMPO_LIMITE_MS)
		.then(respuesta => {
			let sugerencias = respuesta && Array.isArray(respuesta.suggestions) ? respuesta.suggestions : []
			let lista = []
			sugerencias.forEach(sugerencia => {
				let prediccion = sugerencia ? sugerencia.placePrediction : null
				if (!prediccion) {
					return
				}
				let principal = texto_de(prediccion.mainText)
				let secundario = texto_de(prediccion.secondaryText)
				let completo = texto_de(prediccion.text)
				lista.push({
					place_id: prediccion.placeId || null,
					principal: principal || completo,
					// "Rosario, Santa Fe, Argentina": el país sobra, todas son de Argentina.
					secundario: secundario.replace(/,\s*Argentina$/i, ''),
					texto: completo,
					prediccion: prediccion,
				})
			})
			return lista
		})
}

/**
 * Valor de un componente de dirección por tipo. Acepta la forma de Places (New)
 * (`longText`/`shortText`) y, por las dudas, la del Geocoder viejo (`long_name`/`short_name`).
 *
 * @param {Array} componentes
 * @param {string} tipo
 * @param {boolean} corto
 * @returns {string}
 */
function componente(componentes, tipo, corto) {
	let encontrado = ''
	;(componentes || []).forEach(c => {
		if (encontrado || !c || !Array.isArray(c.types) || c.types.indexOf(tipo) === -1) {
			return
		}
		let valor = corto
			? (c.shortText || c.short_name || c.longText || c.long_name)
			: (c.longText || c.long_name || c.shortText || c.short_name)
		encontrado = valor ? String(valor) : ''
	})
	return encontrado
}

/**
 * Texto sin tildes ni mayúsculas, para comparar.
 *
 * @param {string} texto
 * @returns {string}
 */
function comparable(texto) {
	return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/**
 * Arma una dirección del contrato con lo que devolvió Google para un lugar.
 *
 *   - calle: `route`; altura: `street_number` (puede no venir: la pide la tarjeta);
 *   - localidad: `locality`, si no `administrative_area_level_2`, si no `sublocality`;
 *   - provincia: `administrative_area_level_1` llevada al nombre de `constants/provincias`;
 *   - código postal: `postal_code` (puede no venir; en Argentina a veces viene en formato CPA,
 *     "C1043AAZ", que Zipnova acepta igual);
 *   - coordenadas de `location`.
 *
 * 🔴 CABA: Google la nombra de varias formas. Si la provincia queda en "Buenos Aires" pero la
 * localidad es "Buenos Aires" o el código postal es CPA con "C" adelante (la letra de CABA), la
 * provincia es la Ciudad Autónoma, no la provincia de Buenos Aires: el correo cotiza y entrega a
 * otro lugar si se confunden. Y como localidad de CABA se prefiere el barrio (`sublocality`), que
 * es lo que le sirve al repartidor, en vez de "Buenos Aires".
 *
 * @param {object} lugar El Place con `addressComponents`, `formattedAddress` y `location`.
 * @param {object} sugerencia La sugerencia elegida (por el place_id y el texto, de respaldo).
 * @returns {object} { street, street_number, city, province, zip_code, formatted_address, lat,
 *                     lng, place_id, numero_de_google }
 */
export function direccion_desde_lugar(lugar, sugerencia) {
	let componentes = lugar && Array.isArray(lugar.addressComponents) ? lugar.addressComponents : []
	let calle = componente(componentes, 'route', false)
	let altura = componente(componentes, 'street_number', false)
	let barrio = componente(componentes, 'sublocality_level_1', false) || componente(componentes, 'sublocality', false)
	let localidad = componente(componentes, 'locality', false)
		|| componente(componentes, 'administrative_area_level_2', false)
		|| barrio
	let provincia_cruda = componente(componentes, 'administrative_area_level_1', false)
	let provincia = normalizar_provincia(provincia_cruda) || texto_limpio(provincia_cruda, LARGOS.province)
	let codigo_postal = componente(componentes, 'postal_code', false).replace(/\s+/g, '')

	let es_caba = provincia === 'Ciudad Autónoma de Buenos Aires'
	if (!es_caba && (provincia === 'Buenos Aires' || provincia === '')) {
		if (comparable(localidad) === 'buenos aires' || /^C\d{4}/i.test(codigo_postal)) {
			provincia = 'Ciudad Autónoma de Buenos Aires'
			es_caba = true
		}
	}
	if (es_caba && barrio && (comparable(localidad) === 'buenos aires' || localidad === '')) {
		localidad = barrio
	}

	let formatted = lugar && lugar.formattedAddress ? String(lugar.formattedAddress) : (sugerencia ? sugerencia.texto : '')
	formatted = formatted.replace(/,\s*Argentina$/i, '')

	let lat = null
	let lng = null
	let location = lugar ? lugar.location : null
	if (location) {
		lat = coordenada(typeof location.lat === 'function' ? location.lat() : location.lat, 90)
		lng = coordenada(typeof location.lng === 'function' ? location.lng() : location.lng, 180)
	}

	let place_id = lugar && lugar.id ? lugar.id : (sugerencia ? sugerencia.place_id : null)

	return {
		street: texto_limpio(calle, LARGOS.street),
		street_number: texto_limpio(altura, LARGOS.street_number),
		city: texto_limpio(localidad, LARGOS.city),
		province: provincia,
		zip_code: texto_limpio(codigo_postal, LARGOS.zip_code),
		formatted_address: texto_limpio(formatted, LARGOS.formatted_address),
		lat: lat,
		lng: lng,
		place_id: place_id ? String(place_id) : null,
		// Si Google trajo la altura: si no, su `formattedAddress` no la tiene y la línea se rearma
		// con la que escribe el comprador (ver BuscadorDireccion.vue).
		numero_de_google: altura !== '',
	}
}

/**
 * Trae el detalle del lugar de una sugerencia y lo convierte en dirección. Usa el mismo token de
 * sesión de la búsqueda (lo lleva la predicción adentro).
 *
 * @param {object} sugerencia Una de `buscar_sugerencias()`.
 * @returns {Promise<object>} Ver `direccion_desde_lugar` — rechaza si Google falla.
 */
export function detalle_de_sugerencia(sugerencia) {
	let lugar
	let promesa
	try {
		lugar = sugerencia.prediccion.toPlace()
		promesa = lugar.fetchFields({ fields: ['addressComponents', 'formattedAddress', 'location'] })
	} catch (e) {
		return Promise.reject(e)
	}
	return con_tiempo_limite(Promise.resolve(promesa), TIEMPO_LIMITE_MS)
		.then(respuesta => {
			// `fetchFields` resuelve con `{place}` y además completa el mismo objeto: se usa el que venga.
			let completo = respuesta && respuesta.place ? respuesta.place : lugar
			return direccion_desde_lugar(completo, sugerencia)
		})
}
