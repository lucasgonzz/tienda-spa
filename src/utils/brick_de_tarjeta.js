/**
 * Puente con el Card Payment Brick de Mercado Pago (formulario de tarjeta dentro de la página).
 *
 * El formulario real vive en iframes de Mercado Pago: ningún campo de tarjeta existe en nuestro DOM ni en nuestro
 * estado. Lo único que sale de acá es lo que devuelve `getFormData()`: el token de un solo uso, el medio de pago,
 * el emisor y el pagador. El número, el vencimiento y el código de seguridad NUNCA llegan a la tienda ni al servidor.
 *
 * El controlador del Brick se guarda acá (y no en Vuex ni en `data`) porque es un objeto del SDK, no estado.
 */

// Controlador del Brick montado actualmente (o null si no hay formulario en pantalla).
let controlador = null

/**
 * Registra el controlador que devolvió `bricks().create(...)`. Si había otro lo desmonta antes.
 *
 * @param {object} nuevo_controlador Controlador del Brick (tiene getFormData() y unmount()).
 * @returns {void}
 */
export function registrar(nuevo_controlador) {
	desmontar()
	controlador = nuevo_controlador
}

/**
 * Pide al Brick los datos tokenizados del formulario. Acepta las dos formas en que el SDK puede entregarlos:
 * los campos sueltos o dentro de `formData`.
 *
 * @returns {Promise<object>} {token, payment_method_id, issuer_id, payer:{email, identification}}.
 *   Rechaza con Error('brick_no_listo') si el formulario todavía no está montado, o con el error del Brick
 *   si la tarjeta está incompleta o inválida.
 */
export function obtener_datos() {
	if (!controlador) {
		return Promise.reject(new Error('brick_no_listo'))
	}
	return controlador.getFormData()
	.then(function(respuesta) {
		let datos = respuesta && respuesta.formData ? respuesta.formData : respuesta
		if (!datos || !datos.token) {
			throw new Error('brick_sin_token')
		}
		return datos
	})
}

/**
 * Desmonta el formulario (saca los iframes) y olvida el controlador. Sin controlador no hace nada.
 *
 * @returns {void}
 */
export function desmontar() {
	if (!controlador) {
		return
	}
	let anterior = controlador
	controlador = null
	try {
		anterior.unmount()
	} catch (e) {
		// Si el SDK ya había sacado el formulario no hay nada más que limpiar.
	}
}

// Último intento de pago cuyo resultado se desconoce (el servidor no contestó): {firma, datos}. Ver recordar_intento().
let intento = null

/**
 * Recuerda los datos tokenizados del intento que se está enviando, junto con su `firma` (método + cuotas + monto).
 *
 * Existe por el doble cobro: si el servidor no contesta (503, corte de red) el pago pudo haberse aprobado igual. El
 * servidor evita cobrar dos veces con una clave que sale del token, así que el reintento TIENE que mandar el mismo
 * token en vez de pedirle uno nuevo al Brick.
 *
 * @param {string} firma Identifica el pago (método, cuotas y monto).
 * @param {object} datos Lo que devolvió obtener_datos().
 * @returns {void}
 */
export function recordar_intento(firma, datos) {
	intento = { firma: firma, datos: datos, incierto: false }
}

/**
 * Marca el intento actual como de resultado incierto (no hubo respuesta del servidor): el próximo igual lo reusa.
 *
 * @returns {void}
 */
export function marcar_intento_incierto() {
	if (intento) {
		intento.incierto = true
	}
}

/**
 * Devuelve los datos del intento anterior si quedó incierto y es el MISMO pago (misma firma); si no, null.
 *
 * @param {string} firma
 * @returns {object|null}
 */
export function intento_para_reusar(firma) {
	return intento && intento.incierto && intento.firma === firma ? intento.datos : null
}

/**
 * Olvida el intento recordado (pago resuelto: aprobado o rechazado).
 *
 * @returns {void}
 */
export function olvidar_intento() {
	intento = null
}

/**
 * Si hay un intento recordado y quedó incierto.
 *
 * @returns {boolean}
 */
export function hay_intento_incierto() {
	return !!(intento && intento.incierto)
}
