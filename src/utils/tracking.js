import Vue from 'vue'
import moment from 'moment'
import commerce_module from '@/store/commerce'

/**
 * Seguimiento del comportamiento de los compradores en la tienda.
 *
 * Junta en una cola en memoria lo que el visitante hace (vistas de producto, busquedas,
 * carrito y checkout) y lo manda por lote a tienda-api. Todo el modulo esta detras de la
 * extencion 'tracking_buyers' del comercio.
 *
 * 🔴 El requisito de Lucas es UNO: que esto no degrade la navegacion. De ahi salen las
 * tres reglas que ordenan todo el archivo:
 *   1. Nunca reintenta. Si un lote se pierde, se pierde. Un tracking que insiste es
 *      exactamente lo que degrada la navegacion.
 *   2. Nunca deja escapar una excepcion. Todo acceso a storage y todo envio va en
 *      try/catch: en el modo privado de Safari localStorage TIRA, y si eso subiera
 *      romperia la carga del SPA.
 *   3. Nunca bloquea. El envio es sendBeacon cuando existe, y si no un POST suelto que
 *      nadie espera.
 *
 * ⚠️ El guard de la extencion que hay aca es una optimizacion (evita el trafico). La
 * autoridad es el helper de tienda-api, que decide con la MISMA extencion y el MISMO
 * slug. Si alguna vez divergen, gana el back.
 */

/* Slug de la extencion que prende el modulo. Mismo string que usa BuyerTrackingHelper. */
const SLUG_EXTENCION = 'tracking_buyers'

/* Ruta de ingesta, relativa al baseURL de $api (que ya termina en /api). */
const RUTA_INGESTA = '/buyer-tracking/events'

/* Claves de almacenamiento de la identidad del visitante. */
const CLAVE_VISITANTE = 'bt_visitor_id'
const CLAVE_SESION = 'bt_session_id'
const CLAVE_ACTIVIDAD = 'bt_session_last_activity'

/* Media hora sin actividad corta la sesion de navegacion y empieza otra. */
const MINUTOS_SESION = 30

/* Disparadores del envio: 20 eventos acumulados o 5 segundos desde el primero encolado. */
const TOPE_COLA = 20
const MS_ESPERA = 5000

/* Tope de eventos por lote que acepta la API. Si la cola tiene mas, salen varios lotes. */
const TOPE_LOTE_API = 50

/*
 * Formato de fecha local, el mismo que guarda el resto del sistema. NO se manda ISO en
 * UTC a proposito: la base del cliente guarda horas locales y un occurred_at en UTC
 * dejaria los eventos corridos tres horas respecto de sales, orders y todo lo demas.
 */
const FORMATO_FECHA = 'YYYY-MM-DD HH:mm:ss'

/**
 * Lista blanca de tipos de evento. Es el espejo exacto de BuyerTrackingEvent::TIPOS en
 * empresa-api: si aca aparece uno que alla no esta, el helper de la API lo descarta.
 */
export const TIPOS_EVENTO = {
	VISTA_PRODUCTO: 'product_view',
	BUSQUEDA: 'search',
	CARRITO_AGREGAR: 'cart_add',
	CARRITO_QUITAR: 'cart_remove',
	CHECKOUT_INICIO: 'checkout_start',
	CHECKOUT_COMPLETO: 'checkout_complete',
}

/* Los seis tipos, en array, para validar antes de encolar. */
const TIPOS_VALIDOS = [
	TIPOS_EVENTO.VISTA_PRODUCTO,
	TIPOS_EVENTO.BUSQUEDA,
	TIPOS_EVENTO.CARRITO_AGREGAR,
	TIPOS_EVENTO.CARRITO_QUITAR,
	TIPOS_EVENTO.CHECKOUT_INICIO,
	TIPOS_EVENTO.CHECKOUT_COMPLETO,
]

/*
 * Campos opcionales que viajan en el evento. Es una lista blanca, no un spread del objeto
 * que le pasa el llamador: nada que no este aca sale del navegador. Requisito de Lucas,
 * no preferencia — sin IP, sin user-agent, sin mail, sin telefono, sin nada de pago.
 */
const CAMPOS_OPCIONALES = [
	'article_id',
	'category_id',
	'sub_category_id',
	'search_term',
	'results_count',
	'quantity',
	'amount',
	'dwell_ms',
	'order_id',
]

/* Forma de uuid v4, para no persistir basura si alguien toca el storage a mano. */
const FORMA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/*
 * Copia en memoria de la identidad. Es la unica fuente cuando el storage tira excepcion
 * (modo privado de Safari, cuota llena): ahi el id dura lo que dure la pestaña, que es
 * una degradacion aceptable. Romper la carga del SPA no lo es.
 */
let visitante_en_memoria = null
let sesion_en_memoria = null
let actividad_en_memoria = 0

/* Cola de eventos pendientes de envio y su temporizador de flush. */
let cola = []
let temporizador = null

/**
 * Vista de producto en curso, con su propio reloj.
 * { article_id, category_id, sub_category_id, t0, ms_acumulados, cerrada, cerrada_por_ocultar }
 */
let vista_actual = null

/**
 * Lee una clave del storage sin dejar escapar la excepcion.
 *
 * @param {string} storage 'localStorage' o 'sessionStorage'
 * @param {string} clave
 * @returns {string|null}
 */
function leer_storage(storage, clave) {
	try {
		return window[storage].getItem(clave)
	} catch (e) {
		/* Modo privado de Safari y cuota llena tiran aca. Se cae al id en memoria. */
		return null
	}
}

/**
 * Escribe una clave en el storage sin dejar escapar la excepcion.
 *
 * @param {string} storage 'localStorage' o 'sessionStorage'
 * @param {string} clave
 * @param {string} valor
 * @returns {void}
 */
function escribir_storage(storage, clave, valor) {
	try {
		window[storage].setItem(clave, valor)
	} catch (e) {
		/* Sin storage el id vive lo que dure la pestaña. Es la degradacion aceptable. */
	}
}

/**
 * Pasa 16 bytes al formato canonico de uuid.
 *
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytes_a_uuid(bytes) {
	let hex = ''
	for (let i = 0; i < 16; i++) {
		hex += (bytes[i] + 0x100).toString(16).substr(1)
	}
	return hex.substr(0, 8) + '-' + hex.substr(8, 4) + '-' + hex.substr(12, 4) + '-' + hex.substr(16, 4) + '-' + hex.substr(20, 12)
}

/**
 * uuid v4 armado con Math.random. Es el ultimo recurso: alcanza de sobra para agrupar la
 * navegacion de un visitante, que es todo lo que este id tiene que hacer.
 *
 * @returns {string}
 */
function uuid_v4_debil() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, caracter => {
		let azar = Math.random() * 16 | 0
		let valor = caracter == 'x' ? azar : ((azar & 0x3) | 0x8)
		return valor.toString(16)
	})
}

/**
 * uuid v4. crypto.randomUUID solo existe en contexto seguro (https), asi que en el
 * entorno local por http hay que bajar un escalon; y si tampoco hay getRandomValues, dos.
 *
 * @returns {string}
 */
function uuid_v4() {
	try {
		if (window.crypto && typeof window.crypto.randomUUID == 'function') {
			return window.crypto.randomUUID()
		}
		if (window.crypto && typeof window.crypto.getRandomValues == 'function') {
			let bytes = new Uint8Array(16)
			window.crypto.getRandomValues(bytes)
			/* Version 4 y variante RFC 4122. */
			bytes[6] = (bytes[6] & 0x0f) | 0x40
			bytes[8] = (bytes[8] & 0x3f) | 0x80
			return bytes_a_uuid(bytes)
		}
	} catch (e) {
		/* Cae al generador debil. */
	}
	return uuid_v4_debil()
}

/**
 * @param {string|null} valor
 * @returns {boolean}
 */
function es_uuid(valor) {
	return typeof valor == 'string' && FORMA_UUID.test(valor)
}

/**
 * Id del visitante: uuid v4 en localStorage, persiste entre sesiones y entre recargas.
 * Hoy la tienda no tiene ninguna identidad para el visitante no logueado, asi que este
 * id es lo unico que ata su navegacion anonima.
 *
 * @returns {string}
 */
function id_de_visitante() {
	let guardado = leer_storage('localStorage', CLAVE_VISITANTE)
	if (es_uuid(guardado)) {
		visitante_en_memoria = guardado
		return guardado
	}
	if (!es_uuid(visitante_en_memoria)) {
		visitante_en_memoria = uuid_v4()
	}
	escribir_storage('localStorage', CLAVE_VISITANTE, visitante_en_memoria)
	return visitante_en_memoria
}

/**
 * Id de la sesion de navegacion: uuid v4 en sessionStorage con marca de ultima actividad.
 * Se renueva despues de MINUTOS_SESION sin eventos.
 *
 * @returns {string}
 */
function id_de_sesion() {
	let ahora = Date.now()
	let id = leer_storage('sessionStorage', CLAVE_SESION)
	let ultima = Number(leer_storage('sessionStorage', CLAVE_ACTIVIDAD))

	if (!es_uuid(id)) {
		id = sesion_en_memoria
		ultima = actividad_en_memoria
	}

	if (!es_uuid(id) || !ultima || (ahora - ultima) > MINUTOS_SESION * 60 * 1000) {
		id = uuid_v4()
	}

	sesion_en_memoria = id
	actividad_en_memoria = ahora
	escribir_storage('sessionStorage', CLAVE_SESION, id)
	escribir_storage('sessionStorage', CLAVE_ACTIVIDAD, String(ahora))
	return id
}

/**
 * El interruptor. Mismo criterio, mismo slug y misma fuente que commerce_has_extencion()
 * del mixin generals: el comercio ya viaja con sus extencions y main.js lo carga antes
 * del primer render, asi que no hace falta ninguna llamada nueva.
 *
 * @returns {boolean}
 */
export function tracking_activo() {
	let commerce = commerce_module.state.commerce
	if (!commerce || !commerce.extencions) {
		return false
	}
	let encontrada = commerce.extencions.find(extencion => {
		return extencion.slug == SLUG_EXTENCION
	})
	return typeof encontrada != 'undefined'
}

/**
 * Arma el evento con los cuatro campos comunes mas los opcionales que el llamador haya
 * cargado. Los que vienen vacios no viajan: la API los deja en null igual.
 *
 * @param {string} event_type
 * @param {object} datos
 * @returns {object}
 */
function armar_evento(event_type, datos) {
	let evento = {
		event_type: event_type,
		visitor_id: id_de_visitante(),
		session_id: id_de_sesion(),
		occurred_at: moment().format(FORMATO_FECHA),
	}
	CAMPOS_OPCIONALES.forEach(campo => {
		let valor = datos[campo]
		/* Ojo: el 0 SI viaja. Una busqueda con results_count 0 es el dato mas valioso. */
		if (valor === null || typeof valor == 'undefined' || valor === '') {
			return
		}
		evento[campo] = valor
	})
	return evento
}

/**
 * Manda un lote. Nunca reintenta y nunca rechaza hacia afuera.
 *
 * @param {Array} eventos
 * @returns {void}
 */
function enviar_lote(eventos) {
	if (!eventos.length) {
		return
	}
	/*
	 * commerce_id va en el cuerpo y no en la ruta porque es lo que lee
	 * BuyerTrackingController@store ($request->input('commerce_id')). Es el comercio dueño
	 * de la instancia, el mismo valor que ya mandan /carts y /orders. Sin el, el helper
	 * corta en la primera guarda y no escribe nada.
	 *
	 * buyer_id NO viaja a proposito: lo resuelve el controller desde la sesion. Si saliera
	 * de aca, cualquiera podria atribuirle su navegacion a otro comprador.
	 */
	let cuerpo = {
		commerce_id: process.env.VUE_APP_COMMERCE_ID,
		events: eventos,
	}
	try {
		/*
		 * sendBeacon sobrevive al cierre de la pestaña, que es justo el momento en que se
		 * pierde el ultimo product_view. No admite headers propios, pero no hacen falta:
		 * las rutas de /api de Laravel no pasan por VerifyCsrfToken, y el beacon viaja
		 * con credenciales (la cookie de sesion) igual que el resto de las llamadas.
		 */
		if (typeof navigator != 'undefined' && typeof navigator.sendBeacon == 'function') {
			let blob = new Blob([JSON.stringify(cuerpo)], { type: 'application/json' })
			if (navigator.sendBeacon(process.env.VUE_APP_API_URL + '/api' + RUTA_INGESTA, blob)) {
				return
			}
		}
		/* Sin sendBeacon: $api, que ya tiene baseURL y withCredentials. Sin interceptores. */
		if (Vue.prototype.$api) {
			Vue.prototype.$api.post(RUTA_INGESTA, cuerpo)
			.catch(() => {})
		}
	} catch (e) {
		/* Un lote perdido es un lote perdido. Ver regla 1 del docblock de arriba. */
	}
}

/**
 * Vacia la cola. Si hay mas eventos que el tope de la API, salen en varios lotes.
 *
 * @returns {void}
 */
function enviar_cola() {
	try {
		if (temporizador !== null) {
			clearTimeout(temporizador)
			temporizador = null
		}
		while (cola.length) {
			enviar_lote(cola.splice(0, TOPE_LOTE_API))
		}
	} catch (e) {
		/* Ni el vaciado de la cola puede llegarle al comprador. */
	}
}

/**
 * Encola un evento. Es la unica puerta de entrada del modulo para los componentes y el
 * store.
 *
 * @param {string} event_type uno de TIPOS_EVENTO
 * @param {object} [datos] campos opcionales (article_id, search_term, amount, etc.)
 * @returns {void}
 */
export function trackear(event_type, datos) {
	try {
		if (!tracking_activo()) {
			return
		}
		if (TIPOS_VALIDOS.indexOf(event_type) == -1) {
			return
		}
		cola.push(armar_evento(event_type, datos || {}))
		if (cola.length >= TOPE_COLA) {
			enviar_cola()
			return
		}
		if (temporizador === null) {
			temporizador = setTimeout(enviar_cola, MS_ESPERA)
		}
	} catch (e) {
		/* Ver regla 2 del docblock: de aca no sale nada hacia el comprador. */
	}
}

/**
 * Corta el reloj de la vista en curso y suma lo transcurrido a ms_acumulados.
 *
 * 🔴 Aca esta la diferencia entre "tiempo en pantalla" y "tiempo con la pestaña abierta":
 * el dwell se acumula por tramos y NUNCA se calcula como (ahora - t0) al final. Si se
 * midiera asi, una pestaña que quedo de fondo toda la tarde sumaria horas de lectura.
 *
 * @returns {void}
 */
function pausar_reloj() {
	if (!vista_actual || !vista_actual.t0) {
		return
	}
	vista_actual.ms_acumulados += Date.now() - vista_actual.t0
	vista_actual.t0 = null
}

/**
 * Cierra la vista de producto en curso y encola su product_view con el dwell medido.
 *
 * 🔴 Es IDEMPOTENTE a proposito: la llaman cuatro caminos distintos (el watcher de $route,
 * beforeRouteLeave, visibilitychange y beforeunload/pagehide) y varios pueden dispararse
 * para la misma vista. Sin la bandera `cerrada` se duplicarian eventos; sin los cuatro
 * llamadores se perderian.
 *
 * @returns {void}
 */
export function cerrar_vista() {
	try {
		if (!vista_actual || vista_actual.cerrada) {
			return
		}
		vista_actual.cerrada = true
		pausar_reloj()
		trackear(TIPOS_EVENTO.VISTA_PRODUCTO, {
			article_id: vista_actual.article_id,
			category_id: vista_actual.category_id,
			sub_category_id: vista_actual.sub_category_id,
			dwell_ms: vista_actual.ms_acumulados,
		})
	} catch (e) {
		/* Ver regla 2. */
	}
}

/**
 * Abre la vista de producto y arranca su reloj.
 *
 * ⚠️ Cierra primero la anterior, y eso NO es defensivo: al ir de un articulo a otro la
 * vista Article se reusa, beforeRouteLeave no dispara y sin este cierre la vista vieja
 * quedaria abierta para siempre.
 *
 * @param {object|null} article articulo que se esta mostrando
 * @returns {void}
 */
export function abrir_vista_de_producto(article) {
	try {
		if (!tracking_activo() || !article || !article.id) {
			return
		}
		cerrar_vista()
		vista_actual = {
			article_id: article.id,
			category_id: typeof article.category_id != 'undefined' ? article.category_id : null,
			sub_category_id: typeof article.sub_category_id != 'undefined' ? article.sub_category_id : null,
			t0: Date.now(),
			ms_acumulados: 0,
			cerrada: false,
			cerrada_por_ocultar: false,
		}
	} catch (e) {
		/* Ver regla 2. */
	}
}

/**
 * La pestaña se oculta (o se esta cerrando). Es la ultima oportunidad de mandar: el
 * navegador puede descartar la pestaña y no volver nunca.
 *
 * Por eso la vista se CIERRA con lo medido hasta aca en vez de solo pausarse. Si el
 * visitante vuelve, al_volver_a_la_pestania abre un tramo nuevo para el mismo articulo:
 * quedan dos filas en vez de una, y el rollup diario del ERP las suma con SUM(dwell_ms).
 * Perder la vista entera, en cambio, no se recupera con nada.
 *
 * @returns {void}
 */
function al_ocultar_la_pestania() {
	try {
		let habia_vista_abierta = !!(vista_actual && !vista_actual.cerrada)
		cerrar_vista()
		if (habia_vista_abierta) {
			vista_actual.cerrada_por_ocultar = true
		}
		enviar_cola()
	} catch (e) {
		/* Ver regla 2. */
	}
}

/**
 * El visitante vuelve a la pestaña: si la vista se habia cerrado por ocultarse (y no
 * porque se fue del articulo), se reanuda la medicion en un tramo nuevo.
 *
 * @returns {void}
 */
function al_volver_a_la_pestania() {
	try {
		if (!vista_actual || !vista_actual.cerrada_por_ocultar) {
			return
		}
		vista_actual.t0 = Date.now()
		vista_actual.ms_acumulados = 0
		vista_actual.cerrada = false
		vista_actual.cerrada_por_ocultar = false
	} catch (e) {
		/* Ver regla 2. */
	}
}

/*
 * Los tres caminos que no pasan por el router. Se registran una sola vez, al importar el
 * modulo, y sin mirar la extencion: si esta apagada, cerrar_vista y enviar_cola cortan
 * solos en tracking_activo() y no sale ni un request.
 *
 * beforeunload NO dispara en el Safari de iOS ni cuando el navegador descarta una pestaña
 * de fondo; pagehide si. Los dos terminan en la misma funcion y cerrar_vista() es
 * idempotente, asi que que lleguen los dos no duplica nada.
 */
if (typeof document != 'undefined' && typeof window != 'undefined') {
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState == 'hidden') {
			al_ocultar_la_pestania()
		} else {
			al_volver_a_la_pestania()
		}
	})
	window.addEventListener('beforeunload', al_ocultar_la_pestania)
	window.addEventListener('pagehide', al_ocultar_la_pestania)
}
