 import Vue from 'vue'
import axios from 'axios'
import { normalizar_provincia } from '@/constants/provincias'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true

/**
 * Código postal con el que el comprador cotizó la última vez, guardado en el navegador para
 * que no lo vuelva a escribir en cada visita. Lo único que se persiste del envío es esto:
 * las opciones y el destino se piden de nuevo, porque cambian con el carrito.
 *
 * El try/catch no sobra: en modo privado o con el almacenamiento bloqueado `localStorage`
 * tira, y un cotizador roto por eso sería un envío que nadie cotiza.
 *
 * @returns {string}
 */
function leer_zipcode_guardado() {
	try {
		return localStorage.getItem('envio_zipcode') || ''
	} catch (e) {
		return ''
	}
}

/**
 * Guarda el código postal en el navegador. Ver `leer_zipcode_guardado`.
 *
 * @param {string} zipcode
 */
function guardar_zipcode(zipcode) {
	try {
		if (zipcode) {
			localStorage.setItem('envio_zipcode', zipcode)
		} else {
			localStorage.removeItem('envio_zipcode')
		}
	} catch (e) {
		// Sin almacenamiento: el comprador lo escribe de nuevo la próxima vez, nada más.
	}
}

/**
 * Destinatario y dirección vacíos, con TODAS las claves que la API espera en
 * `carts.envio_destino` (EnvioDestinoHelper::CLAVES). Se crea con una función y no con un
 * objeto compartido para que resetear el envío no deje referencias viejas colgadas.
 *
 * @returns {object}
 */
function destino_vacio() {
	return {
		nombre: '',
		apellido: '',
		documento: '',
		email: '',
		telefono: '',
		calle: '',
		numero: '',
		piso_depto: '',
		localidad: '',
		provincia: '',
		codigo_postal: '',
		referencia: '',
		lat: null,
		lng: null,
	}
}

/**
 * Estado inicial del envío por correo (Zipnova). Es UNO solo para toda la tienda: el
 * cotizador de la página del artículo, el del carrito (que se monta dos veces) y el del
 * checkout leen y escriben acá, nunca en su `data()`.
 *
 * @returns {object}
 */
function envio_inicial() {
	return {
		zipcode: leer_zipcode_guardado(),
		/*
		 * Localidad y provincia del destino. Desde el 17/9/2026 las devuelve SIEMPRE el servidor
		 * en el 200 de `POST /api/envios/cotizar`, resueltas a partir del código postal (antes
		 * quedaban vacías salvo que el comprador las hubiera escrito a mano después de un
		 * `needs_location`). Son lo que se le muestra —"Envíos a Rosario, Santa Fe"—, lo que
		 * precarga el destino del checkout y lo que se le guarda en el perfil.
		 */
		city: '',
		state: '',
		opciones: [],
		opcion_key: null,
		point_id: null,
		/*
		 * Firma de las líneas con las que se cotizaron `opciones` ("id|cantidad" ordenadas).
		 * Cada cotizador la compara con la de lo que está mostrando: si difiere, las opciones
		 * son de OTRO carrito (o de un artículo suelto) y hay que volver a cotizar. Es el
		 * espejo del `items_hash` con el que el servidor decide si re-cotiza.
		 */
		items_firma: null,
		envio_gratis: false,
		/*
		 * Bloque `incremental` de la última cotización, o null. Solo viene cuando se cotizó con
		 * `articles_extra` (la ficha de un artículo con el carrito ya empezado): dice cuánto MÁS
		 * cuesta el envío por sumar ese artículo, que es lo único que el comprador necesita saber
		 * ahí —el envío es uno solo y ya lo está pagando—. Ver el docblock de `cotizar_envio`.
		 */
		incremental: null,
		destino: destino_vacio(),
		cotizando: false,
		error: null,
		needs_location: false,
		/* Claves del destino que el servidor rechazó (422 `codigo: 'destino'`), para marcarlas. */
		errores_destino: [],
	}
}

/**
 * Firma de un conjunto de líneas a cotizar: "id|cantidad" ordenadas y unidas con ";".
 *
 * @param {Array} lineas [{id, amount}, ...]
 * @returns {string}
 */
export function firma_de_lineas(lineas) {
	let partes = []
	;(lineas || []).forEach(linea => {
		partes.push(String(linea.id) + '|' + String(Number(linea.amount) || 0))
	})
	partes.sort()
	return partes.join(';')
}

/**
 * Líneas a cotizar a partir de los artículos del carrito, en la forma que pide
 * `POST /api/envios/cotizar` (`articles: [{id, amount}]`). Las promociones de vinoteca quedan
 * afuera: no son artículos y no tienen peso ni medidas propias.
 *
 * 🔴 Las líneas con cantidad 0 (o negativa, o no numérica) se DESCARTAN, y esto no es una
 * prolijidad: el servidor exige `articles.*.amount >= 1` y una sola línea rara del carrito hacía
 * fallar la cotización de CADA artículo que el comprador mirara, con un 422 que encima le echaba
 * la culpa al código postal ("Revisá el código postal e intentá de nuevo").
 *
 * Y se descarta en vez de mandarse como 1 por dos motivos:
 *
 *   - una línea en 0 no es algo que el comprador esté comprando; contarla como un bulto infla el
 *     envío de la base y deja la diferencia que se le muestra en la ficha MÁS BARATA que la real;
 *   - es lo que el servidor ya hace con esa misma línea: `ZipnovaPaquetesHelper::items_desde_lineas`
 *     castea a `(int)` y saltea la línea si queda por debajo de 1. Mandarla como 1 lo contradice.
 *
 * El truncado a entero es el mismo `(int)` del servidor, por la misma razón: que los dos lados
 * cuenten los mismos bultos.
 *
 * ⚠️ Distinto es el 0 de la FICHA (el selector de cantidad arranca vacío): ese significa "todavía
 * no eligió", no "cero unidades", y lo normaliza a 1 `lineas_normalizadas` en `Cotizador.vue`.
 *
 * @param {object} cart
 * @returns {Array}
 */
export function lineas_del_carrito(cart) {
	let lineas = []
	if (!cart || !cart.articles) {
		return lineas
	}
	cart.articles.forEach(article => {
		let amount = article.amount
		if ((amount === undefined || amount === null) && article.pivot) {
			amount = article.pivot.amount
		}
		amount = Math.floor(Number(amount))
		if (!isFinite(amount) || amount < 1) {
			return
		}
		lineas.push({
			id: article.id,
			amount: amount,
		})
	})
	return lineas
}

/**
 * Ver la mutación `hidratar_envio_desde_cart`.
 *
 * @param {object} state Estado del módulo.
 * @param {object} cart Carrito tal como lo devuelve la API.
 */
function hidratar_envio(state, cart) {
	let cotizacion = cart ? cart.envio_cotizacion : null
	if (!cotizacion || !Array.isArray(cotizacion.opciones)) {
		return
	}
	state.envio.opciones = cotizacion.opciones
	state.envio.items_firma = firma_de_lineas(lineas_del_carrito(cart))
	// El snapshot guardado del carrito es el envío del carrito ENTERO: no hay diferencia contra
	// nada. Si quedara colgada la de la última ficha, el carrito mostraría un cartel que no es suyo.
	state.envio.incremental = null
	// El snapshot trae `envio_gratis`; si es viejo y no lo trae, vale lo que diga la opción elegida.
	state.envio.envio_gratis = cotizacion.envio_gratis !== undefined
		? !!cotizacion.envio_gratis
		: !!(cart.envio_opcion && cart.envio_opcion.envio_gratis)
	if (cotizacion.zipcode) {
		state.envio.zipcode = String(cotizacion.zipcode)
		guardar_zipcode(state.envio.zipcode)
	}
	state.envio.city = cotizacion.city || ''
	state.envio.state = cotizacion.state || ''
	state.envio.opcion_key = cart.envio_opcion && cart.envio_opcion.key ? cart.envio_opcion.key : null
	state.envio.point_id = cart.envio_opcion && cart.envio_opcion.point_id ? cart.envio_opcion.point_id : null
	if (cart.envio_destino && typeof cart.envio_destino === 'object') {
		// `point_id` vive en `envio.point_id`, no dentro del destino (se agrega al mandar).
		let destino = Object.assign(destino_vacio(), cart.envio_destino)
		delete destino.point_id
		state.envio.destino = destino
	}
	state.envio.error = null
	state.envio.needs_location = false
	state.envio.errores_destino = []
}

/**
 * Ver la mutación `reset_envio`.
 *
 * @param {object} state Estado del módulo.
 */
function resetear_envio(state) {
	let zipcode = state.envio.zipcode
	state.envio = envio_inicial()
	state.envio.zipcode = zipcode
}

/**
 * Lo que viaja al servidor dentro del carrito como `envio` (EnvioCartHelper::sincronizar).
 *
 * 🔴 NUNCA lleva precio. El SPA manda la `opcion_key` que el comprador eligió y el destino; el
 * precio que se cobra lo re-cotiza y guarda el servidor en `carts.envio_precio`. Sin envío a
 * domicilio o sin opción elegida va `null`, y el servidor limpia las columnas.
 *
 * @param {object} state Estado del módulo.
 * @returns {object|null}
 */
function payload_envio(state) {
	if (Number(state.cart.deliver) !== 1 || !state.envio.opcion_key) {
		return null
	}
	return {
		zipcode: state.envio.zipcode,
		city: state.envio.city || null,
		state: state.envio.state || null,
		opcion_key: state.envio.opcion_key,
		point_id: state.envio.point_id,
		destino: Object.assign({}, state.envio.destino, {
			// El CP del destino es SIEMPRE el cotizado: es para ese código postal que vale el precio.
			codigo_postal: state.envio.zipcode,
			point_id: state.envio.point_id,
		}),
	}
}

export default {
	namespaced: true,
	state: {
		cart: {
			articles: [],
			promociones_vinoteca: [],
			/*
			 * Tercera colección del carrito, hermana de `promociones_vinoteca`. Un combo NO es
			 * un artículo: tiene su propia secuencia de ids y su propio pivote (`cart_combo`),
			 * así que mezclarlo con `articles` haría que un id repetido pise la línea de otro.
			 */
			combos: [],
			deliver: 0,
			description: '',
			payment_id: '',
			payment_status: '',
			address_id: '',
			payment_card_info_id: null,
			fecha_entrega: 0,
			envio: null,
		},
		/* Envío por correo (Zipnova): cotización, opción elegida y destino. Ver envio_inicial(). */
		envio: envio_inicial(),
		buyer: {
			name: '',
			email: '',
			phone: '',
			ciudad: '',
			barrio: '',
			address: '',
		},
		buyer_id: null,
		selected_buyer: null,
		payment_method: null,
		delivery_zone: null,
		cupon: null,
		loading_last_cart: false,
		saving: false,

		added_item: null,
		/** Visibilidad del popup flotante al agregar un ítem al carrito */
		added_item_popup_visible: false,
	},
	mutations: {
		set_added_item(state, value) {
			state.added_item = value
		},
		/**
		 * Muestra u oculta la tarjeta flotante del ítem agregado en la barra de navegación.
		 * @param {object} state
		 * @param {boolean} value
		 */
		set_added_item_popup_visible(state, value) {
			state.added_item_popup_visible = value
		},
		setBuyer(state, value) {
			state.buyer = value 
		},
		/**
		 * Setea un campo puntual del comprador invitado sin reemplazar el objeto entero.
		 * Se usa en el prefill del checkout (Buyer.vue): completa solo direccion/ciudad/
		 * barrio sin pisar el resto de lo que el comprador ya tipeo.
		 *
		 * @param {object} state
		 * @param {object} payload { field, value }
		 */
		set_buyer_field(state, payload) {
			Vue.set(state.buyer, payload.field, payload.value)
		},
		set_buyer_id(state, value) {
			state.buyer_id = value 
		},
		set_selected_buyer(state, value) {
			state.selected_buyer = value 
		},
		setDeliver(state, value) {
			state.cart.deliver = value
		},
		setAddressId(state, value) {
			state.cart.address_id = value
		},
		setPaymentCardInfoId(state, value) {
			state.cart.payment_card_info_id = value
		},
		set_fecha_entrega(state, value) {
			state.cart.fecha_entrega = value
		},
		setPaymentMethod(state, value) {
			state.payment_method = value
		},
		setDeliveryZone(state, value) {
			state.delivery_zone = value
			// Zona propia del negocio y opción de Zipnova nunca conviven (decisión §0.6 del plan):
			// elegir una zona suelta la opción de correo que hubiera elegida.
			if (value) {
				state.envio.opcion_key = null
				state.envio.point_id = null
			}
		},

		// ── Envío por correo (Zipnova) ─────────────────────────────────────────────────────

		/**
		 * Código postal a cotizar. Cambiarlo invalida lo cotizado: las opciones eran para OTRO
		 * destino, así que se vacían junto con la localidad resuelta y la opción elegida.
		 *
		 * 🔴 Vaciar `city` y `state` es obligatorio y no una prolijidad: la localidad la resolvió
		 * el servidor para el código postal ANTERIOR, y si quedara colgada viajaría como pista en
		 * la próxima cotización. Zipnova le da prioridad a la pareja localidad+provincia cuando
		 * matchea su padrón, así que el comprador escribiría 5000 y se le cotizaría a Rosario.
		 *
		 * @param {object} state
		 * @param {string} value
		 */
		set_envio_zipcode(state, value) {
			let zipcode = String(value || '').replace(/\s+/g, '').substring(0, 8)
			if (zipcode === state.envio.zipcode) {
				return
			}
			state.envio.zipcode = zipcode
			state.envio.city = ''
			state.envio.state = ''
			state.envio.opciones = []
			state.envio.opcion_key = null
			state.envio.point_id = null
			state.envio.items_firma = null
			state.envio.envio_gratis = false
			state.envio.incremental = null
			state.envio.error = null
			state.envio.needs_location = false
			guardar_zipcode(zipcode)
		},
		/**
		 * Localidad y provincia del destino, cuando el código postal solo no alcanza
		 * (`needs_location`) o cuando Zipnova las devuelve resueltas.
		 *
		 * @param {object} state
		 * @param {object} payload { city, state }
		 */
		set_envio_localidad(state, payload) {
			if (payload.city !== undefined) {
				state.envio.city = payload.city || ''
			}
			if (payload.state !== undefined) {
				state.envio.state = payload.state || ''
			}
		},
		/**
		 * Resultado de una cotización. Además de las opciones guarda para QUÉ líneas se cotizó
		 * (`items_firma`) y precarga en el destino lo que ya se sabe (CP, localidad, provincia)
		 * sin pisar lo que el comprador haya escrito.
		 *
		 * `city` y `state` del payload son los que resolvió Zipnova, y desde el 17/9/2026 vienen
		 * llenos también cuando el comprador mandó solo el código postal: el servidor los resuelve
		 * con el centinela de `ZipnovaCotizadorService` (tienda-api). Que pisen lo que el comprador
		 * haya escrito es lo correcto —Zipnova sabe a dónde cotizó de verdad—, y si se equivocó de
		 * localidad, el cotizador le deja corregirla con "No es mi localidad".
		 *
		 * Si la opción que estaba elegida sigue existiendo se conserva (re-cotización por cambio
		 * de cantidades); si desapareció, se suelta para que la vuelva a elegir.
		 *
		 * @param {object} state
		 * @param {object} payload { opciones, zipcode, city, state, envio_gratis, items_firma, incremental }
		 */
		set_envio_opciones(state, payload) {
			state.envio.opciones = payload.opciones || []
			state.envio.items_firma = payload.items_firma || null
			state.envio.envio_gratis = !!payload.envio_gratis
			// Sin `incremental` en el payload queda en null: es lo que corresponde para el
			// carrito y el checkout, que cotizan el envío entero y no una diferencia.
			state.envio.incremental = payload.incremental || null
			if (payload.zipcode) {
				state.envio.zipcode = String(payload.zipcode)
				guardar_zipcode(state.envio.zipcode)
			}
			if (payload.city) {
				state.envio.city = payload.city
			}
			if (payload.state) {
				state.envio.state = payload.state
			}
			state.envio.error = null
			state.envio.needs_location = false

			let sigue = state.envio.opciones.find(opcion => {
				return opcion.key == state.envio.opcion_key
			})
			if (!sigue) {
				state.envio.opcion_key = null
				state.envio.point_id = null
			}

			let destino = state.envio.destino
			if (state.envio.zipcode) {
				destino.codigo_postal = state.envio.zipcode
			}
			if (!destino.localidad && state.envio.city) {
				destino.localidad = state.envio.city
			}
			if (!destino.provincia && state.envio.state) {
				destino.provincia = normalizar_provincia(state.envio.state)
			}
		},
		/**
		 * Opción de Zipnova elegida por su `key`. Suelta la zona propia (§0.6) y la sucursal,
		 * salvo que la opción nueva tenga UNA sola sucursal, que se elige sola.
		 *
		 * Volver a elegir la que YA está elegida no hace nada: la tarjeta entera es clickeable y
		 * el comprador la toca de nuevo al elegir la sucursal o al corregir un campo, y eso no
		 * puede borrarle la sucursal ni las marcas de error.
		 *
		 * @param {object} state
		 * @param {string|null} key
		 */
		set_envio_opcion_key(state, key) {
			if (key && key === state.envio.opcion_key) {
				return
			}
			state.envio.opcion_key = key || null
			state.envio.point_id = null
			state.envio.errores_destino = []
			if (!key) {
				return
			}
			state.delivery_zone = null
			let opcion = state.envio.opciones.find(opcion => {
				return opcion.key == key
			})
			if (opcion && opcion.es_punto_de_retiro && opcion.puntos_de_retiro && opcion.puntos_de_retiro.length === 1) {
				state.envio.point_id = opcion.puntos_de_retiro[0].point_id
			}
		},
		set_envio_point_id(state, value) {
			state.envio.point_id = value || null
		},
		/**
		 * Un campo del destinatario/dirección. Vue.set por si el campo no existía (destinos
		 * hidratados desde un carrito guardado con menos claves).
		 *
		 * @param {object} state
		 * @param {object} payload { field, value }
		 */
		set_envio_destino_field(state, payload) {
			Vue.set(state.envio.destino, payload.field, payload.value)
			// El comprador está corrigiendo: el campo deja de estar marcado como rechazado.
			let index = state.envio.errores_destino.indexOf(payload.field)
			if (index !== -1) {
				state.envio.errores_destino.splice(index, 1)
			}
			// La ubicación geocodificada era de OTRA dirección: si cambia la calle, el número, la
			// localidad o la provincia, lat/lng dejan de valer hasta que se vuelva a geocodificar.
			if (['calle', 'numero', 'localidad', 'provincia'].indexOf(payload.field) !== -1) {
				Vue.set(state.envio.destino, 'lat', null)
				Vue.set(state.envio.destino, 'lng', null)
			}
		},
		set_envio_cotizando(state, value) {
			state.envio.cotizando = !!value
		},
		set_envio_error(state, value) {
			state.envio.error = value || null
		},
		set_envio_needs_location(state, value) {
			state.envio.needs_location = !!value
		},
		set_envio_errores_destino(state, value) {
			state.envio.errores_destino = Array.isArray(value) ? value : []
		},
		/**
		 * Vuelve el envío a cero. Conserva SOLO el código postal (es lo que se guarda en el
		 * navegador): el destino con nombre, DNI y teléfono no queda en memoria después de
		 * un pedido, que en un comercio puede ser una computadora compartida.
		 *
		 * @param {object} state
		 */
		reset_envio(state) {
			resetear_envio(state)
		},
		/**
		 * Carga el envío desde un carrito que vino del servidor (`envio_cotizacion`,
		 * `envio_opcion`, `envio_destino`): al volver a la tienda o después de cada guardado, lo
		 * que muestra la pantalla es lo que el servidor tiene, con SU precio.
		 *
		 * Solo se hidrata si el carrito trae una cotización. Un carrito sin `envio_cotizacion`
		 * puede venir de una API que todavía no conoce el envío (los dos lados no se despliegan
		 * juntos) o de un carrito con retiro por el local: en ninguno de los dos hay que pisar lo
		 * que el comprador tiene en pantalla.
		 *
		 * @param {object} state
		 * @param {object} cart
		 */
		hidratar_envio_desde_cart(state, cart) {
			hidratar_envio(state, cart)
		},
		setCardId(state, value) {
			state.cart.card_id = value
		},
		setDescription(state, value) {
			state.cart.description = value
		},
		setPaymentId(state, value) {
			state.cart.payment_id = value
		},
		setPaymentStatus(state, value) {
			state.cart.payment_status = value
		},
		setCupon(state, value) {
			state.cupon = value
		},
		addItem(state, item) {

			let is_promocion_vinoteca = item.is_promocion_vinoteca
			let is_combo = item.is_combo
			let index

			/* Un carrito que vino de una API sin combos no trae la clave. Ver setCart(). */
			if (!Array.isArray(state.cart.combos)) {
				Vue.set(state.cart, 'combos', [])
			}

			if (is_combo) {

				index = state.cart.combos.findIndex(combo => {
					return combo.id == item.id
				})

			} else if (is_promocion_vinoteca) {

				index = state.cart.promociones_vinoteca.findIndex(promo => {
					return promo.id == item.id
				})

			} else {

				index = state.cart.articles.findIndex(article => {
					return article.id == item.id && (!article.pivot.variant_id || article.pivot.variant_id == item.variant_id)
				})

			}

			if (index != -1) {
				if (is_combo) {
					state.cart.combos.splice(index, 1)
				} else if (is_promocion_vinoteca) {
					state.cart.promociones_vinoteca.splice(index, 1)
				} else {
					state.cart.articles.splice(index, 1)
				}
			} else {
				if (is_combo) {
					state.cart.combos.push(item)
				} else if (is_promocion_vinoteca) {
					state.cart.promociones_vinoteca.push(item)
				} else {
					state.cart.articles.push(item)
				}
			}
		},
		/*
		 * Cambia la cantidad de una linea que YA esta en el carrito, sin sacarla.
		 *
		 * 🔴 No se puede usar addItem para esto: addItem es un TOGGLE —si el articulo ya estaba,
		 * lo saca—, asi que actualizar con el terminaria vaciando la linea. Existe para el
		 * comprador invitado, cuyo carrito no se persiste hasta el checkout y por lo tanto no
		 * tiene `id` contra el que pegarle a la API.
		 *
		 * El precio viaja desde el llamador porque el unitario sigue a la cantidad
		 * (`article_price_ranges`): quien llama ya lo resolvio con `precio_por_cantidad()`, el
		 * mismo helper que usa el alta. Para el comprador logueado esto no corre: ahi el precio
		 * lo fija el servidor y vuelve en el setCart de la respuesta.
		 */
		update_item_amount(state, { item, amount, price, notes }) {

			let coleccion

			if (item.is_combo) {
				coleccion = Array.isArray(state.cart.combos) ? state.cart.combos : []
			} else if (item.is_promocion_vinoteca) {
				coleccion = state.cart.promociones_vinoteca
			} else {
				coleccion = state.cart.articles
			}

			let index = coleccion.findIndex(linea => {
				if (item.is_combo || item.is_promocion_vinoteca) {
					return linea.id == item.id
				}
				/* Misma comparacion de variante que addItem: dos variantes del mismo articulo son
				   dos lineas distintas. */
				return linea.id == item.id && (!linea.pivot.variant_id || linea.pivot.variant_id == item.variant_id)
			})

			if (index == -1) {
				return
			}

			/*
			 * 🔴 LA LINEA SE REEMPLAZA ENTERA, no se le escriben los campos encima. Y no es
			 * cuestion de estilo: sin esto el dato queda bien y la PANTALLA no se entera.
			 *
			 * El carrito del invitado lo arma `saveCart()` con asignaciones planas sobre un objeto
			 * que Vue YA venia observando (`article.amount = ...`, `article.pivot = {...}`). En Vue 2
			 * eso deja esas claves SIN getter reactivo, y `Vue.set` tampoco lo arregla: cuando la
			 * clave ya existe se degrada a una asignacion comun. Medido en la tienda corriendo el
			 * 17/9/2026, sobre la linea del carrito de un invitado:
			 *
			 *   linea.amount -> plana     linea.notes -> plana     linea.pivot -> plana, sin __ob__
			 *   linea.price  -> REACTIVA (esa si vino de la API)
			 *
			 * O sea que escribir `pivot.amount` y `linea.amount` encima dejaba el numerito del icono
			 * del carrito clavado en 1 despues de actualizar a 4.
			 *
			 * `Vue.set` sobre el INDICE del array si notifica —usa el splice parcheado, que dispara
			 * el dep DEL ARRAY, que es justo del que dependen `cant_cart_items()` y `total()` de
			 * mixins/cart.js porque los dos lo recorren— y ademas observa entero el objeto nuevo.
			 * Los dos numeros se rehacen juntos.
			 *
			 * La identidad no importa: `get_item_cart()` y las tres busquedas de este archivo
			 * matchean por `id`, nunca por referencia.
			 */
			let linea = coleccion[index]

			/*
			 * 🔴 LA CANTIDAD VIAJA DOS VECES, en el pivote y en la copia plana, y las DOS se
			 * escriben. Es el invariante que `setCart()` sostiene unas mutaciones mas abajo
			 * (`article.amount = article.pivot.amount`, idem `price` y `notes`) y que el alta del
			 * invitado ya sostenia a mano en `saveCart()`. Media tienda lee la copia PLANA:
			 *
			 *   - `mixins/cart.js :: cant_cart_items()`  -> el numerito del icono del carrito
			 *   - `article-card/body/Cantidad.vue`       -> el "Cantidad: N" de la linea
			 *   - `article-card/body/CartInfo.vue`       -> el subtotal de la linea
			 *   - `mixins/articles.js :: checkCartArticleAmount()` -> con que cantidad vuelve a
			 *     abrir la ficha
			 *
			 * mientras que `mixins/cart.js :: total()` suma por el PIVOTE. Escribir uno solo deja los
			 * dos numeros peleados, y el que queda mal es el que el comprador ve: medido el 17/9/2026
			 * con un articulo de $27.999 agregado en 1 y actualizado a 4, la linea decia
			 * "Cantidad: 1" y el resumen "1 producto / 1 unidad" con el TOTAL en $111.996,00 —las 4.
			 * La pantalla mostraba una unidad y el total cobraba cuatro.
			 */
			let pivot_nuevo = Object.assign({}, linea.pivot, { amount: amount })
			let linea_nueva = Object.assign({}, linea, { amount: amount })

			/* `price` y `notes` solo pisan si el llamador los mando, y van a los dos lugares. */
			if (price !== null && typeof price != 'undefined') {
				pivot_nuevo.price = price
				linea_nueva.price = price
			}

			if (typeof notes != 'undefined') {
				pivot_nuevo.notes = notes
				linea_nueva.notes = notes
			}

			linea_nueva.pivot = pivot_nuevo

			Vue.set(coleccion, index, linea_nueva)
		},
		removeArticle(state, {item, remove_only_one_amount }) {
			if (remove_only_one_amount == undefined) {
				remove_only_one_amount = true
			}

			let is_promocion_vinoteca = item.is_promocion_vinoteca
			let is_combo = item.is_combo

			if (!Array.isArray(state.cart.combos)) {
				Vue.set(state.cart, 'combos', [])
			}

			let index
			if (is_combo) {
				console.log('eliminado combo')
				index = state.cart.combos.findIndex(combo => {
					return combo.id == item.id
				})
			} else if (is_promocion_vinoteca) {
				console.log('eliminado promocion vinoteca')
				index = state.cart.promociones_vinoteca.findIndex(promo => {
					return promo.id == item.id
				})
			} else {
				console.log('eliminado article')
				index = state.cart.articles.findIndex(article => {
					return article.id == item.id
				})
			}

			/*
				🔴 findIndex devuelve -1 cuando no encontro nada, y abajo ese -1 no seria inocuo:
				`splice(-1, 1)` cuenta desde el final y borra la ULTIMA linea del carrito -- una
				que el comprador no pidio sacar --, y `Vue.set(coleccion[-1], ...)` escribe sobre
				undefined. O sea que el sintoma de "no lo encontre" seria borrar el item
				equivocado, sin un solo error en consola.

				Es el mismo defecto que esta misma rama tapo del otro lado, en el store de VENDER
				de empresa-spa (removeItem / updateItem matcheaban por id pelado). Aca la guarda va
				una sola vez y arriba, asi cubre las tres colecciones.
			*/
			if (index === -1) {
				return
			}

			if (item.amount > 1 && remove_only_one_amount) {
				let new_amount = item.amount
				new_amount--
				delete item.amount

				if (is_combo) {
					Vue.set(state.cart.combos[index], 'amount', new_amount)
				} else if (is_promocion_vinoteca) {
					Vue.set(state.cart.promociones_vinoteca[index], 'amount', new_amount)
				} else {
					Vue.set(state.cart.articles[index], 'amount', new_amount)
				}
			} else {
				if (is_combo) {
					console.log('se elimino el combo')
					state.cart.combos.splice(index, 1)
				} else if (is_promocion_vinoteca) {
					console.log('se lo eliminio promo')
					state.cart.promociones_vinoteca.splice(index, 1)
				} else {
					console.log('se lo eliminio article')
					state.cart.articles.splice(index, 1)
				}
			}
		},
		setCart(state, cart = null) {
			if (cart) {
				/*
				 * 🔴 Una API que todavía no conoce los combos —o un cliente al que todavía no
				 * le llegó la migración de `cart_combo`— NO manda esta clave. Sin normalizarla
				 * acá, `state.cart.combos` queda undefined y revienta el primer `.forEach` o
				 * `.length` que la toque. Se normaliza ANTES de asignar el carrito para que Vue
				 * la haga reactiva al recorrer el objeto.
				 */
				if (!Array.isArray(cart.combos)) {
					cart.combos = []
				}
				state.cart = cart
				cart.articles.forEach(article => {
					article.amount = article.pivot.amount
					article.price = article.pivot.price
					article.notes = article.pivot.notes
				})
				cart.promociones_vinoteca.forEach(promo => {
					promo.amount = promo.pivot.amount
					promo.price = promo.pivot.price
					promo.notes = promo.pivot.notes
				})
				cart.combos.forEach(combo => {
					combo.amount = combo.pivot.amount
					combo.price = combo.pivot.price
					combo.notes = combo.pivot.notes
				})
				state.payment_method = cart.payment_method
				state.delivery_zone = cart.delivery_zone
				state.cupon = cart.cupon
				// Envío por correo guardado en el servidor (si lo hay): ver hidratar_envio_desde_cart.
				hidratar_envio(state, cart)
			} else {
				state.cart = {
					articles: [],
					promociones_vinoteca: [],
					combos: [],
					deliver: 0,
					description: '',
					payment_id: '',
					address_id: '',
					payment_card_info_id: null,
					fecha_entrega: 0,
					envio: null,
				}
				state.payment_method = null
				// Hasta el 14/9/2026 decia `delovery_zone`: la zona elegida sobrevivia al vaciado.
				state.delivery_zone = null
				state.cupon = null
				resetear_envio(state)
			}
			console.log(state.cart)
		},
		setLoadingLastCart(state, value) {
			state.loading_last_cart = value
		},
		setSaving(state, value) {
			state.saving = value
		},
	},
	actions: {
		save({ state, commit }) {
			if (state.payment_method) {
				state.cart.payment_method_id = state.payment_method.id
			} else {
				state.cart.payment_method_id = null
			}
			if (state.cupon) {
				state.cart.cupon_id = state.cupon.id
			} else {
				state.cart.cupon_id = null
			}
			if (state.delivery_zone) {
				state.cart.delivery_zone_id = state.delivery_zone.id
			} else {
				state.cart.delivery_zone_id = null
			}
			// Envío por correo (Zipnova): la opción elegida y el destino, sin precio. Ver payload_envio().
			state.cart.envio = payload_envio(state)
			console.log('carrito antes de guardar:')
			console.log(state.cart)
			if (!state.cart.id) {
				commit('setSaving', true)
				return axios.post('/api/carts', {
					cart	    : state.cart,
					commerce_id : process.env.VUE_APP_COMMERCE_ID 
				})
				.then(res => {
					commit('setSaving', false)
					console.log('Carrito creado')
					commit('setCart', res.data.cart)
				})
				.catch(err => {
					commit('setSaving', false)
					console.log(err)
					throw err
				})
			} else {
				commit('setSaving', true)
				return axios.put('/api/carts', state.cart)
				.then(res => {
					commit('setSaving', false)
					console.log('Carrito actualizado')
					commit('setCart', res.data.cart)
				})
				.catch(err => {
					commit('setSaving', false)
					console.log(err)
					throw err
				})
			}
		},
		getLastCart({ commit, state }) {
			commit('setLoadingLastCart', true)
			return axios.get(`/api/carts/last-cart/${process.env.VUE_APP_COMMERCE_ID}`)
			.then(res => {
				console.log('getLastCart')
				commit('setLoadingLastCart', false)
				if (res.data.has_last_cart) {
					commit('setCart', res.data.last_cart)
				} else {
					console.log('no tenia getLastCart')
				}
			})
			.catch(err => {
				commit('setLoadingLastCart', false)
				console.log(err)
			})
		},
		removeArticle({ state, commit }, article_param) {
			if (
				state.cart.articles.length
				|| state.cart.promociones_vinoteca.length
				|| (state.cart.combos && state.cart.combos.length)
			) {
				// Sin esto el servidor leería un carrito SIN `envio` y limpiaría la forma de envío
				// elegida: sacar un artículo cambia el costo, pero no tiene por qué borrar la elección.
				// El servidor re-cotiza solo (cambió el hash de líneas) y conserva la opción si sigue.
				state.cart.envio = payload_envio(state)
				axios.put('/api/carts', state.cart)
				.then(res => {
					console.log('Carrito actualizado')
					commit('setCart', res.data.cart)
				})
				.catch(err => {
					console.log(err)
				})
			} else {
				axios.delete(`/api/carts/${state.cart.id}`)
				.then(() => {
					commit('setCart', null)
					console.log('Carrito eliminado')
				})
				.catch(err => {
					console.log(err)
				})
			}
		},	
		/**
		 * Cotiza el envío por correo contra `POST /api/envios/cotizar` con el código postal (y la
		 * localidad/provincia si ya se resolvieron) del store.
		 *
		 * Se cotiza `articles` (líneas `{id, amount}`) y, si el carrito ya está guardado, también
		 * `cart_id`: el servidor puede leer las líneas y el subtotal de cualquiera de los dos. Lo
		 * que vuelve son las opciones YA normalizadas y con el precio que cobra el servidor: acá
		 * no se calcula nada. Vuelven también `city` y `state`: la localidad y la provincia que
		 * Zipnova resolvió para ese código postal, aunque el comprador no haya escrito ninguna.
		 *
		 * `city`/`state` se mandan solo si el comprador ya los tiene: son una PISTA para Zipnova,
		 * que le gana al código postal cuando la pareja matchea su padrón. Sin ellos, el servidor
		 * resuelve por el código postal solo, que es el caso normal.
		 *
		 * `articles_extra` son las líneas que el comprador está por AGREGAR (la ficha del
		 * artículo, con la cantidad que eligió) sobre lo que ya tiene. Con eso el servidor cotiza
		 * dos veces —el carrito solo y el carrito con el artículo—, devuelve las opciones del
		 * conjunto (es lo que va a pagar si agrega) y suma un bloque `incremental` con la
		 * diferencia. Sin `articles_extra` la respuesta es la de siempre.
		 *
		 * 🔴 La firma (`items_firma`) se arma con las DOS listas juntas: si se armara solo con
		 * `articles`, dos fichas distintas sobre el mismo carrito tendrían la misma firma y la
		 * segunda mostraría la diferencia de la primera.
		 *
		 * Resuelve con la respuesta. Rechaza con el error de axios para que el cotizador decida
		 * qué hacer (por ejemplo, intentar resolver la localidad con Google Maps ante
		 * `needs_location`); el mensaje legible ya queda en `envio.error`.
		 *
		 * @param {object} context
		 * @param {object} payload { articles: [{id, amount}], articles_extra?: [{id, amount}], cart_id?: number }
		 * @returns {Promise}
		 */
		cotizar_envio({ state, commit }, payload) {
			let articles = payload && payload.articles ? payload.articles : []
			let articles_extra = payload && payload.articles_extra ? payload.articles_extra : []
			let body = {
				commerce_id: process.env.VUE_APP_COMMERCE_ID,
				zipcode: state.envio.zipcode,
				articles: articles,
			}
			if (articles_extra.length) {
				body.articles_extra = articles_extra
			}
			if (state.envio.city) {
				body.city = state.envio.city
			}
			if (state.envio.state) {
				body.state = state.envio.state
			}
			if (payload && payload.cart_id) {
				body.cart_id = payload.cart_id
			}

			commit('set_envio_cotizando', true)
			commit('set_envio_error', null)

			return axios.post('/api/envios/cotizar', body)
			.then(res => {
				commit('set_envio_cotizando', false)
				commit('set_envio_opciones', {
					opciones: res.data.opciones || [],
					zipcode: res.data.zipcode,
					city: res.data.city,
					state: res.data.state,
					envio_gratis: res.data.envio_gratis,
					incremental: res.data.incremental,
					items_firma: firma_de_lineas(articles.concat(articles_extra)),
				})
				if (!res.data.opciones || !res.data.opciones.length) {
					commit('set_envio_error', 'Ningún correo llega a ese código postal. Probá con otro o elegí retiro por el local.')
				}
				return res.data
			})
			.catch(err => {
				commit('set_envio_cotizando', false)
				let data = err.response && err.response.data ? err.response.data : {}
				let mensaje = data.message || 'No pudimos cotizar el envío en este momento. Probá de nuevo en un rato.'
				// Las opciones que hubiera eran de otra cotización: no se muestran con un error abajo.
				// (set_envio_opciones también apaga error y needs_location, por eso van después.)
				commit('set_envio_opciones', {
					opciones: [],
					items_firma: null,
				})
				commit('set_envio_error', mensaje)
				if (err.response && err.response.status == 422 && data.needs_location) {
					commit('set_envio_needs_location', true)
				}
				throw err
			})
		},
	}
}