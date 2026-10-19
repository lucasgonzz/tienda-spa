import { normalizar_provincia } from '@/constants/provincias'

/*
 * Direcciones de envío del comprador (misión formas-envio-direcciones-maps, 19/10/2026).
 *
 * Funciones puras que comparten el buscador de direcciones, el bloque del checkout, "Mis
 * direcciones" y el store del carrito. Todo lo que arma, recorta o muestra una dirección pasa por
 * acá, para que la pantalla, el carrito y el pedido digan EXACTAMENTE lo mismo.
 *
 * La forma de una dirección es la del contrato con tienda-api (`buyer_addresses` y el json
 * `carts.envio_direccion` / `orders.envio_direccion`):
 *
 *   { buyer_address_id, formatted_address, street, street_number, apartment, city, province,
 *     zip_code, reference, lat, lng, place_id }
 *
 * Las de la lista del comprador traen además `id` e `is_default`.
 */

/**
 * Largos máximos de cada campo de texto: los de las columnas de `buyer_addresses`. El servidor
 * recorta igual (o responde 422); acá se recorta antes para que lo que el comprador ve en la
 * tarjeta sea lo mismo que queda guardado.
 */
export const LARGOS = {
	formatted_address: 255,
	street: 160,
	street_number: 20,
	apartment: 60,
	city: 120,
	province: 120,
	zip_code: 20,
	reference: 255,
	place_id: 255,
}

/**
 * Las claves de texto del snapshot, en el orden del contrato.
 */
const CLAVES_DE_TEXTO = [
	'formatted_address', 'street', 'street_number', 'apartment',
	'city', 'province', 'zip_code', 'reference',
]

/**
 * Cuántas direcciones puede tener guardadas un comprador. Es el mismo tope que valida
 * tienda-api (422): acá solo sirve para no ofrecerle "Agregar otra" cuando ya no se puede.
 */
export const MAXIMO_DE_DIRECCIONES = 20

/**
 * Si la tienda tiene las direcciones de envío nuevas: `GET /api/commerce/{id}` manda
 * `direcciones_de_envio: true` solo cuando la base del cliente ya tiene `buyer_addresses` y las
 * columnas `envio_direccion` (tienda-api, DireccionesEsquemaHelper).
 *
 * 🔴 Es LO ÚNICO que prende todo lo nuevo del checkout y de "Mi cuenta". Una tienda-api vieja no
 * manda la clave (undefined) y una base sin las migraciones la manda en false: en los dos casos
 * el checkout es exactamente el de antes, con la dirección en texto libre.
 *
 * @param {object|null} commerce El comercio del store.
 * @returns {boolean}
 */
export function direcciones_activas(commerce) {
	return !!(commerce && Number(commerce.direcciones_de_envio) === 1)
}

/**
 * Si una forma de envío propia (`delivery_zones`) es "a convenir": el costo lo coordina el
 * vendedor con el comprador después de la compra y la tienda no cobra nada por ella.
 *
 * MySQL puede mandar el tinyint como "1"/"0" (string truthy siempre): por eso `Number()`. Con una
 * base sin la columna la clave no viene y la forma se comporta como siempre (cobra su precio).
 *
 * @param {object|null} zona
 * @returns {boolean}
 */
export function zona_a_convenir(zona) {
	return !!(zona && Number(zona.costo_a_convenir) === 1)
}

/**
 * Un valor como texto recortado (sin espacios a los costados ni de más en el medio) y cortado al
 * largo máximo. null/undefined dan ''.
 *
 * @param {*} valor
 * @param {number} largo
 * @returns {string}
 */
export function texto_limpio(valor, largo) {
	if (valor === null || valor === undefined) {
		return ''
	}
	let texto = String(valor).replace(/\s+/g, ' ').trim()
	if (largo && texto.length > largo) {
		texto = texto.substring(0, largo).trim()
	}
	return texto
}

/**
 * Una coordenada como número, o null si no es un número válido o está fuera de rango.
 *
 * @param {*} valor
 * @param {number} limite 90 para la latitud, 180 para la longitud.
 * @returns {number|null}
 */
export function coordenada(valor, limite) {
	if (valor === null || valor === undefined || valor === '') {
		return null
	}
	let numero = Number(valor)
	if (!isFinite(numero) || Math.abs(numero) > limite) {
		return null
	}
	return numero
}

/**
 * Una dirección vacía, con todas las claves del contrato.
 *
 * @returns {object}
 */
export function direccion_vacia() {
	return {
		buyer_address_id: null,
		formatted_address: '',
		street: '',
		street_number: '',
		apartment: '',
		city: '',
		province: '',
		zip_code: '',
		reference: '',
		lat: null,
		lng: null,
		place_id: null,
	}
}

/**
 * "Calle 1234, Localidad, Provincia": la dirección en una línea armada con sus partes, para cuando
 * no hay una de Google (carga a mano, o Google no trajo la altura y la que trajo no la tiene).
 * La localidad no se repite si es igual a la provincia (pasa con CABA).
 *
 * @param {object} direccion
 * @returns {string}
 */
export function armar_formatted_address(direccion) {
	if (!direccion) {
		return ''
	}
	let partes = []
	let calle = (texto_limpio(direccion.street) + ' ' + texto_limpio(direccion.street_number)).trim()
	if (calle) {
		partes.push(calle)
	}
	let ciudad = texto_limpio(direccion.city)
	let provincia = texto_limpio(direccion.province)
	if (ciudad) {
		partes.push(ciudad)
	}
	if (provincia && provincia.toLowerCase() !== ciudad.toLowerCase()) {
		partes.push(provincia)
	}
	return partes.join(', ')
}

/**
 * Normaliza una dirección a la forma del contrato: solo las claves del snapshot, textos
 * recortados y cortados a su largo, coordenadas en rango (o null) y la provincia con el nombre
 * canónico de `constants/provincias` (si no se reconoce, queda como vino).
 *
 * Si no trae `formatted_address`, se arma con las partes: es la primera línea que el ERP muestra y
 * la que el servidor usa para `orders.address`.
 *
 * @param {object} direccion
 * @returns {object}
 */
export function normalizar_direccion(direccion) {
	let limpia = direccion_vacia()
	if (!direccion) {
		return limpia
	}
	CLAVES_DE_TEXTO.forEach(clave => {
		limpia[clave] = texto_limpio(direccion[clave], LARGOS[clave])
	})
	let provincia = normalizar_provincia(limpia.province)
	if (provincia) {
		limpia.province = provincia
	}
	if (!limpia.formatted_address) {
		limpia.formatted_address = texto_limpio(armar_formatted_address(limpia), LARGOS.formatted_address)
	}
	limpia.lat = coordenada(direccion.lat, 90)
	limpia.lng = coordenada(direccion.lng, 180)
	// Una coordenada sin la otra no ubica nada.
	if (limpia.lat === null || limpia.lng === null) {
		limpia.lat = null
		limpia.lng = null
	}
	let place_id = texto_limpio(direccion.place_id, LARGOS.place_id)
	limpia.place_id = place_id !== '' ? place_id : null
	let id = direccion.buyer_address_id
	limpia.buyer_address_id = id !== null && id !== undefined && id !== '' && isFinite(Number(id)) ? Number(id) : null
	return limpia
}

/**
 * Snapshot de una dirección GUARDADA en la cuenta del comprador (una fila de
 * `GET /api/buyer/addresses`), listo para el carrito: las claves del contrato con
 * `buyer_address_id` = el id de la fila.
 *
 * @param {object} guardada
 * @returns {object}
 */
export function snapshot_de_guardada(guardada) {
	let snapshot = normalizar_direccion(guardada)
	snapshot.buyer_address_id = guardada && guardada.id ? Number(guardada.id) : snapshot.buyer_address_id
	return snapshot
}

/**
 * Primer renglón de la tarjeta: calle y altura, y el piso/depto si lo hay.
 *
 * @param {object} direccion
 * @returns {string}
 */
export function renglon_de_la_calle(direccion) {
	if (!direccion) {
		return ''
	}
	let calle = (texto_limpio(direccion.street) + ' ' + texto_limpio(direccion.street_number)).trim()
	if (!calle) {
		// Una dirección que vino solo con la línea de Google (sin partes): se muestra esa.
		calle = texto_limpio(direccion.formatted_address)
	}
	let piso = texto_limpio(direccion.apartment)
	return piso ? calle + ', ' + piso : calle
}

/**
 * Segundo renglón de la tarjeta: localidad y provincia, y el código postal si lo hay.
 *
 * @param {object} direccion
 * @returns {string}
 */
export function renglon_de_la_localidad(direccion) {
	if (!direccion) {
		return ''
	}
	let ciudad = texto_limpio(direccion.city)
	let provincia = texto_limpio(direccion.province)
	let partes = []
	if (ciudad) {
		partes.push(ciudad)
	}
	if (provincia && provincia.toLowerCase() !== ciudad.toLowerCase()) {
		partes.push(provincia)
	}
	let texto = partes.join(', ')
	let cp = texto_limpio(direccion.zip_code)
	if (cp) {
		texto += (texto ? ' ' : '') + '(CP ' + cp + ')'
	}
	return texto
}

/**
 * La dirección en UNA línea para `orders.address` (la que el ERP muestra, los mails y el WhatsApp
 * del pedido).
 *
 * 🔴 Es la réplica de lo que arma tienda-api en `OrderController@store` cuando hay
 * `envio_direccion` y el envío no es Zipnova: `formatted_address` + ", " + piso/depto +
 * " (" + referencia + ")". Si difieren, el comprador vería una dirección en pantalla y otra en el
 * mail.
 *
 * @param {object} direccion
 * @returns {string}
 */
export function linea_de_direccion(direccion) {
	if (!direccion) {
		return ''
	}
	let linea = texto_limpio(direccion.formatted_address)
	if (!linea) {
		linea = armar_formatted_address(direccion)
	}
	let piso = texto_limpio(direccion.apartment)
	if (piso) {
		linea += (linea ? ', ' : '') + piso
	}
	let referencia = texto_limpio(direccion.reference)
	if (referencia) {
		linea += (linea ? ' ' : '') + '(' + referencia + ')'
	}
	return linea
}

/**
 * Campos obligatorios que le faltan a una dirección: calle, altura, localidad y provincia
 * siempre; el código postal solo si se pide (la tienda cotiza por correo con Zipnova, que cotiza
 * por código postal).
 *
 * @param {object} direccion
 * @param {boolean} pide_codigo_postal
 * @returns {string[]} claves del contrato
 */
export function faltantes_de_direccion(direccion, pide_codigo_postal) {
	let faltan = []
	let obligatorios = ['street', 'street_number', 'city', 'province']
	if (pide_codigo_postal) {
		obligatorios.push('zip_code')
	}
	obligatorios.forEach(clave => {
		if (!direccion || texto_limpio(direccion[clave]) === '') {
			faltan.push(clave)
		}
	})
	return faltan
}

/**
 * Nombre visible de cada campo, para los avisos de "te falta completar".
 *
 * @param {string} clave
 * @returns {string}
 */
export function etiqueta_de_campo(clave) {
	let etiquetas = {
		street: 'Calle',
		street_number: 'Altura',
		apartment: 'Piso / depto',
		city: 'Localidad',
		province: 'Provincia',
		zip_code: 'Código postal',
		reference: 'Referencia',
	}
	return etiquetas[clave] ? etiquetas[clave] : clave
}

/**
 * Separa "Corrientes 1234" en calle y altura: lo que el comprador ya escribió en el buscador se
 * aprovecha cuando pasa a la carga a mano (Google no respondió o no encontró su dirección).
 *
 * @param {string} texto
 * @returns {object} { street, street_number }
 */
export function separar_calle_y_altura(texto) {
	let limpio = texto_limpio(texto)
	// Si escribió también la localidad ("Corrientes 1234, Rosario"), se queda con lo de antes de la coma.
	let primera_parte = limpio.split(',')[0].trim()
	let match = primera_parte.match(/^(.*?)\s+(\d+[a-zA-Z]?)$/)
	if (match && match[1].trim() !== '') {
		return { street: match[1].trim(), street_number: match[2] }
	}
	return { street: primera_parte, street_number: '' }
}
