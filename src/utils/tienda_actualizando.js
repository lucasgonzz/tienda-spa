/**
 * Aviso de "estamos actualizando la tienda" (misión aviso-actualizacion-sistema, 25/11/2026).
 *
 * Mientras el admin actualiza el sistema del cliente, tienda-api responde a las llamadas del comercio
 * con una marca: HTTP 503 y el cuerpo
 *   {"error":"sistema_actualizando","message":"Estamos actualizando la tienda. ...","reintentar_en_segundos":30}
 * Antes de esta misión la tienda no tenía interceptores: un 503 dejaba la página en blanco, porque
 * App.vue dibuja todo dentro de `v-if="commerce"` y el comercio nunca llegaba a cargar.
 *
 * Este archivo reúne las piezas puras (sin Vue ni store) para reconocer la marca, engancharla en
 * cualquier instancia de axios y reintentar hasta que el sistema se libere.
 *
 * Compatibilidad: una tienda-api que todavía no manda la marca no dispara nada de esto, y un 503
 * cualquiera (nginx, Laravel en `down` sin marca) NO es la marca: se trata como siempre.
 */

/**
 * Cada cuántos milisegundos la pantalla de actualización vuelve a preguntar si ya se liberó.
 * Coincide con `reintentar_en_segundos` (30) que manda tienda-api.
 *
 * @type {number}
 */
export const INTERVALO_REINTENTO_MS = 30000

/**
 * Indica si un error de axios es la marca de "sistema actualizando" de tienda-api.
 *
 * Se exigen las dos cosas (status 503 y `error` = 'sistema_actualizando') para no confundirla con un
 * 503 genérico ni con otro error que repita la clave.
 *
 * @param {*} err Error rechazado por axios (puede ser null, un Error de red sin `response`, etc.).
 * @returns {boolean} true sólo si es la marca.
 */
export function es_marca_actualizando(err) {
	if (!err || !err.response || err.response.status !== 503) {
		return false
	}
	let data = err.response.data
	return !!data && typeof data === 'object' && data.error === 'sistema_actualizando'
}

/**
 * Engancha en una instancia de axios un interceptor de respuesta que avisa cuando llega la marca.
 *
 * No traga el error: lo vuelve a rechazar tal cual para que cada llamador siga con su `.catch`
 * como hasta ahora. Las respuestas correctas y los demás errores pasan sin tocarse.
 *
 * @param {object} instancia Instancia de axios (la global, `$axios` o `$api`).
 * @param {function} al_detectar Se llama sin argumentos cada vez que llega la marca.
 * @returns {void}
 */
export function instalar_interceptor_actualizando(instancia, al_detectar) {
	instancia.interceptors.response.use(
		respuesta => respuesta,
		err => {
			if (es_marca_actualizando(err)) {
				al_detectar()
			}
			return Promise.reject(err)
		}
	)
}

/**
 * Consulta periódicamente si el sistema ya se liberó y avisa una única vez cuando pasa.
 *
 * Cada tick llama a `consultar()` (que devuelve una promesa de booleano: true = ya se liberó). Si una
 * consulta sigue en vuelo, el tick siguiente no lanza otra encima. Un rechazo (red caída, otro 503)
 * se ignora y se reintenta en el próximo tick. Al liberarse corta el intervalo y llama a `al_liberarse()`
 * una sola vez; eso vale aunque `detener()` se haya llamado con una consulta en vuelo (ver el comentario
 * en el `.then`). `detener()` sí impide cualquier consulta nueva.
 *
 * @param {function} consultar Devuelve una promesa que resuelve true cuando ya no está actualizando.
 * @param {function} al_liberarse Se llama una sola vez cuando `consultar` resolvió true.
 * @param {number} [intervalo_ms] Tiempo entre consultas (por defecto INTERVALO_REINTENTO_MS).
 * @returns {function} `detener()`: corta el reintento (idempotente).
 */
export function iniciar_reintento(consultar, al_liberarse, intervalo_ms) {
	/* Identificador del intervalo y bandera de consulta en vuelo. */
	let timer = null
	let consultando = false
	/* true una vez que se avisó la liberación: garantiza una única recarga. */
	let avisado = false

	/* Corta el intervalo si sigue vivo. */
	function detener() {
		if (timer !== null) {
			clearInterval(timer)
			timer = null
		}
	}

	timer = setInterval(() => {
		if (consultando) {
			return
		}
		consultando = true
		consultar()
		.then(liberado => {
			consultando = false
			/*
			 * Si la consulta ya respondió "liberado", se avisa AUNQUE detener() se haya llamado mientras
			 * volaba: la respuesta es real y no depende de que el llamador siga vivo. Caso que lo exige:
			 * getCommerce apaga `actualizando` y el v-if de App.vue destruye la pantalla (cuyo
			 * beforeDestroy llama a detener()) en el flush de Vue, ANTES de que esta cadena .then siga.
			 * Con `timer !== null` como condición, la tienda nunca recargaba al liberarse.
			 */
			if (liberado && !avisado) {
				avisado = true
				detener()
				al_liberarse()
			}
		})
		.catch(() => {
			consultando = false
		})
	}, intervalo_ms || INTERVALO_REINTENTO_MS)

	return detener
}
