/**
 * Canales en vivo por sistema (misión pusher-canales-por-sistema, 19/10/2026).
 *
 * Toda la flota (tiendas y sistemas de gestión) usa UNA sola app de Pusher, y hasta esta misión
 * los canales llevaban solo un id (`message.from_commerce.{comprador}`, `order.{comprador}`…):
 * dos sistemas con el mismo id se escuchaban entre sí. Desde ahora cada API le agrega a sus
 * canales un sufijo propio del sistema, el "espacio" (`order.7@26d5013a6846`), calculado con su
 * base de datos (ver App\Broadcasting\EspacioDeCanales en tienda-api).
 *
 * Este módulo es la mitad del SPA, en UN solo punto: la instancia de Echo se envuelve al crearla
 * (src/helpers/echo.js) y traduce el nombre lógico al físico en cada `channel`, `private`,
 * `encryptedPrivate`, `join`, `leave`, `leaveChannel` y `listen`. Los componentes y
 * src/mixins/WebSockets.js siguen pidiendo los nombres lógicos de siempre y no se enteran.
 *
 * De dónde sale el espacio: tienda-api lo manda en el atributo `canales_en_vivo` del comprador
 * (login, registro, GET /api/user…), que src/store/auth.js le pasa a set_canales_en_vivo() en
 * cada setUser. Se guarda acá y no en `state.user` a propósito: `state.user` se reemplaza desde
 * varios endpoints, y alguno (POST /api/buyer de una cuenta con contraseña) devuelve un comprador
 * recortado, sin el atributo.
 *
 * Los modos (los decide tienda-api con BROADCAST_CANALES_VIEJOS_DE_TIENDA):
 *  - Sin espacio (una tienda-api vieja que no manda `canales_en_vivo`): los nombres no cambian.
 *    El SPA nuevo contra una API vieja se comporta EXACTAMENTE como hoy.
 *  - Transición (`canales_viejos_de_tienda: true`, el default): los nombres tampoco cambian.
 *    TODO lo que escucha tienda-spa es un canal de tienda (lo emite tienda-api o empresa-api), y
 *    en transición las dos APIs emiten cada canal de tienda con Y sin espacio: escuchando el de
 *    siempre, el SPA nuevo oye a un ERP viejo y a uno nuevo, y nunca recibe dos veces.
 *  - Estricto (`canales_viejos_de_tienda: false`): todo con espacio. Se prende en el ERP y en la
 *    tienda del mismo sistema a la vez.
 *
 * Por qué no hay doble sufijo con laravel-echo 1.8 (leído de node_modules/laravel-echo/dist):
 * los métodos de la instancia (`Echo.leave`, `Echo.listen`, `Echo.channel`…) delegan en el
 * CONECTOR (`this.connector.leave(…)`, `this.connector.channel(…)`), y el conector se llama a sí
 * mismo (`leave` → su propio `leaveChannel`; `listen` → su propio `channel`), nunca de vuelta a
 * la instancia. O sea que cada nombre pasa una sola vez por la traducción. Y aunque pasara dos,
 * nombre_fisico() no agrega el sufijo a un nombre que ya lo tiene.
 */

/* Separador entre el canal lógico y el espacio. Mismo que en las dos APIs. */
const SEPARADOR = '@'

/*
 * Prefijos que Pusher pone adelante del nombre del canal. Van adelante y no se tocan: el sufijo
 * va al final. Del más largo al más corto, para que `private-encrypted-` no se lea como `private-`.
 */
const PREFIJOS_DE_PUSHER = ['private-encrypted-', 'private-', 'presence-']

/*
 * El último `canales_en_vivo` recibido de tienda-api.
 *  - espacio: null hasta que llegue uno (API vieja: los nombres no cambian).
 *  - canales_viejos_de_tienda: true (transición) salvo que la API diga false.
 */
let estado = {
	espacio: null,
	canales_viejos_de_tienda: true,
}

/**
 * Guarda lo que mandó tienda-api en `canales_en_vivo`.
 *
 * Ignora un valor vacío o sin espacio, y nunca borra uno ya recibido: un endpoint que devuelve el
 * comprador recortado (o una API vieja) no puede dejar al SPA sin espacio a mitad de la sesión.
 *
 * @param {Object|null} datos { espacio: string, canales_viejos_de_tienda: boolean }
 * @returns {void}
 */
export function set_canales_en_vivo(datos) {
	if (!datos || typeof datos !== 'object') {
		return
	}
	if (!datos.espacio) {
		return
	}
	estado.espacio = String(datos.espacio)
	/* Solo un false explícito es estricto: una clave que falta es transición, como en la API. */
	estado.canales_viejos_de_tienda = datos.canales_viejos_de_tienda !== false
}

/**
 * Una copia del estado actual (para diagnosticar desde la consola o desde un test).
 *
 * @returns {Object} { espacio, canales_viejos_de_tienda }
 */
export function get_canales_en_vivo() {
	return {
		espacio: estado.espacio,
		canales_viejos_de_tienda: estado.canales_viejos_de_tienda,
	}
}

/**
 * El nombre físico de un canal LÓGICO (sin el `private-` de Pusher), como lo reciben `channel`,
 * `private`, `join`, `leave` y `listen`.
 *
 *  - sin espacio → igual (API vieja);
 *  - transición  → igual (todo canal de tienda-spa es de tienda: se escucha sin espacio);
 *  - estricto    → `nombre@espacio`, salvo que ya termine con el sufijo (nunca dos veces).
 *
 * @param {string} nombre
 * @returns {string}
 */
export function nombre_fisico(nombre) {
	if (typeof nombre !== 'string') {
		return nombre
	}
	if (!estado.espacio) {
		return nombre
	}
	if (estado.canales_viejos_de_tienda) {
		return nombre
	}

	/* El sufijo propio de este sistema. */
	let sufijo = SEPARADOR + estado.espacio

	if (termina_con(nombre, sufijo)) {
		return nombre
	}
	return nombre + sufijo
}

/**
 * El nombre físico de un nombre COMPLETO de Pusher (`private-x.1`, `presence-x.1`, `x.1`), como
 * lo recibe `leaveChannel`: se separa el prefijo de Pusher, se traduce el resto y se vuelve a
 * pegar.
 *
 * @param {string} nombre_completo
 * @returns {string}
 */
export function nombre_fisico_completo(nombre_completo) {
	if (typeof nombre_completo !== 'string') {
		return nombre_completo
	}

	/* El prefijo de Pusher que tiene adelante, o '' si es un canal público. */
	let prefijo = ''
	PREFIJOS_DE_PUSHER.forEach(candidato => {
		if (prefijo === '' && nombre_completo.indexOf(candidato) === 0) {
			prefijo = candidato
		}
	})

	return prefijo + nombre_fisico(nombre_completo.substring(prefijo.length))
}

/**
 * Envuelve una instancia de laravel-echo para que traduzca los nombres de canal al físico.
 *
 * Reemplaza los métodos EN LA INSTANCIA y devuelve la MISMA instancia: src/mixins/WebSockets.js
 * compara `echo === this.ws_echo` para saber si ya suscribió en esta conexión, y usa
 * `echo.connector.pusher.connection` para la reconexión; los dos siguen andando igual.
 *
 * Envolverla dos veces no hace nada (queda marcada).
 *
 * @param {Object} echo instancia de Echo recién creada
 * @returns {Object} la misma instancia
 */
export function envolver_echo(echo) {
	if (!echo || echo.__canales_en_vivo_envuelto) {
		return echo
	}

	/* Los que reciben el nombre LÓGICO como primer argumento. */
	let con_nombre_logico = ['channel', 'private', 'encryptedPrivate', 'join', 'leave', 'listen']

	con_nombre_logico.forEach(metodo => {
		reemplazar_primer_argumento(echo, metodo, nombre_fisico)
	})

	/* leaveChannel recibe el nombre COMPLETO, con el prefijo de Pusher. */
	reemplazar_primer_argumento(echo, 'leaveChannel', nombre_fisico_completo)

	/* Marca no enumerable: no aparece si alguien recorre la instancia. */
	Object.defineProperty(echo, '__canales_en_vivo_envuelto', {
		value: true,
		enumerable: false,
	})

	return echo
}

/**
 * Reemplaza `echo[metodo]` por una función que traduce el primer argumento con `traducir` y llama
 * a la original con el resto igual. Si la instancia no tiene ese método, no hace nada.
 *
 * @param {Object} echo
 * @param {string} metodo
 * @param {Function} traducir
 * @returns {void}
 */
function reemplazar_primer_argumento(echo, metodo, traducir) {
	/* La original (normalmente del prototipo de Echo), atada a la instancia al llamarla. */
	let original = echo[metodo]
	if (typeof original !== 'function') {
		return
	}

	echo[metodo] = function () {
		let argumentos = Array.prototype.slice.call(arguments)
		if (argumentos.length > 0) {
			argumentos[0] = traducir(argumentos[0])
		}
		return original.apply(echo, argumentos)
	}
}

/**
 * Si `texto` termina con `final` (sin String.prototype.endsWith, por los navegadores viejos que
 * todavía entran a las tiendas).
 *
 * @param {string} texto
 * @param {string} final
 * @returns {boolean}
 */
function termina_con(texto, final) {
	if (final.length === 0 || texto.length < final.length) {
		return false
	}
	return texto.substring(texto.length - final.length) === final
}
