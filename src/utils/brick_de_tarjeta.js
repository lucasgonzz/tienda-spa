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
