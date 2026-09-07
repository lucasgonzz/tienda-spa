import { trackear, TIPOS_EVENTO, enviar_cola } from '@/utils/tracking'
export default {
	computed: {
		/**
		 * Unidades totales del carrito: la suma de las cantidades, no la cantidad de lineas.
		 *
		 * 🔴 Los `Number()` NO son decorativos. `amount` llega como STRING desde la API, asi que
		 * `0 + "1"` da `"01"` y de ahi en adelante cada vuelta CONCATENA en vez de sumar. Con 20
		 * productos en el carrito eso mostraba `013445254443565164166 unidades` en la barra de
		 * navegacion (medido el 29/8/2026 en tienda.comerciocity.store con el comprador
		 * renata.cabrera@gmail.com). El contador de productos distintos de abajo nunca se rompio
		 * porque usa `.length`.
		 *
		 * El patron correcto ya estaba en este mismo archivo, en `total()`:
		 * `Number(article.pivot.price) * Number(article.pivot.amount)`. Habia quedado sin aplicar
		 * justo aca.
		 *
		 * ⚠️ El `|| 0` tampoco sobra: `Number(undefined)` da NaN, y un solo renglon sin `amount`
		 * contagiaria el total entero a `NaN unidades`. Con la concatenacion vieja ese caso salia
		 * como `...undefined...`, o sea que ya estaba roto — pero NaN es una forma de fallar NUEVA
		 * que introduce este arreglo, y esta pantalla se filma para la demo comercial.
		 *
		 * @returns {number}
		 */
		cant_cart_items() {
			let cant_items = 0
			let cart = this.$store.state.cart.cart
			if (cart) {
				cart.articles.forEach(article => {
					cant_items += Number(article.amount) || 0
				})

				cart.promociones_vinoteca.forEach(promo => {
					cant_items += Number(promo.amount) || 0
				})
			}
			return cant_items
		},
		/**
		 * Cantidad de líneas distintas en el carrito (artículos + promos vinoteca).
		 * @returns {number}
		 */
		cart_unique_products_count() {
			let cart = this.$store.state.cart.cart
			if (!cart) {
				return 0
			}
			let count = 0
			if (cart.articles) {
				count += cart.articles.length
			}
			if (cart.promociones_vinoteca) {
				count += cart.promociones_vinoteca.length
			}
			return count
		},
		/**
		 * Etiqueta singular/plural para productos distintos del resumen.
		 * @returns {string}
		 */
		cart_products_label() {
			return this.cart_unique_products_count === 1 ? 'producto' : 'productos'
		},
		/**
		 * Etiqueta singular/plural para unidades totales del resumen.
		 * @returns {string}
		 */
		cart_units_label() {
			return this.cant_cart_items === 1 ? 'unidad' : 'unidades'
		},
		loading_last_cart() {
			return this.$store.state.cart.loading_last_cart
		},
		articles() {
			let cart = this.$store.state.cart.cart
			if (cart) {
				return cart.articles
			}
			return []
		},
		promociones_vinoteca() {
			let cart = this.$store.state.cart.cart
			if (cart) {
				return cart.promociones_vinoteca
			}
			return []
		},
		cart() {
			return this.$store.state.cart.cart
		},
		// cart_buyer() {
		// 	return this.$store.state.cart.buyer
		// },
		delivery_zones() {
			return this.$store.state.delivery_zones.models
		},
		deliver() {
			return this.$store.state.cart.cart.deliver
		},
		cupon: {
			get() {
				return this.$store.state.cart.cupon
			},
			set(value) {
				this.$store.commit('cart/setCupon', value)
			}
		},
		cart_payment_method: {
			get() {
				return this.$store.state.cart.payment_method
			},
			set(value) {
				this.$store.commit('cart/setPaymentMethod', value)
			}
		},
		cart_delivery_zone: {
			get() {
				return this.$store.state.cart.delivery_zone
			},
			set(value) {
				this.$store.commit('cart/setDeliveryZone', value)
			}
		},
		order() {
			return this.$store.state.orders.order
		},
		/**
		 * Total del carrito: valor del servidor si existe; si no, suma local por pivot (guest checkout).
		 */
		total() {
			let cart_total = this.$store.state.cart.cart.total
			if (cart_total != null && cart_total !== undefined) {
				return cart_total
			}
			// Calcular localmente para guest (cart no persistido aun)
			let total = 0
			let articles = this.$store.state.cart.cart.articles || []
			articles.forEach(function(article) {
				if (article.pivot && article.pivot.price != null && article.pivot.price !== undefined) {
					total += Number(article.pivot.price) * Number(article.pivot.amount)
				}
			})
			return total
		},
		total_with_payment_method_discount() {
			if (this.cart_payment_method && this.cart_payment_method.discount) {
				return this.total - (this.total * this.cart_payment_method.discount / 100)
			}
			return this.total
		},
		total_with_payment_method_surchage() {
			if (this.cart_payment_method && this.cart_payment_method.surchage) {
				return this.total + (this.total * this.cart_payment_method.surchage / 100)
			}
			return this.total
		},
		total_with_payment_method() {
			if (this.cart_payment_method && this.cart_payment_method.discount) {
				return this.total_with_payment_method_discount
			}
			if (this.cart_payment_method && this.cart_payment_method.surchage) {
				return this.total_with_payment_method_surchage
			}
			return this.total
		},
		total_with_cupon() {
			let total = this.total_with_payment_method 
			if (this.cupon) {
				if (this.cupon.amount) {
					total -= this.cupon.amount
				} else {
					total = total - (total * this.percentageToMultiply(this.cupon.percentage))
				}
			}
			return total
		},
		total_with_deliver() {
			return this.total_with_cupon + Number(this.cart_delivery_zone.price)
		},
		total_final() {
			return this.total_with_deliver
		},
		buyer_id() {
			return this.$store.state.cart.buyer_id
		},
		selected_buyer() {
			return this.$store.state.cart.selected_buyer
		},
		fecha_entrega() {
			return this.$store.state.cart.fecha_entrega
		},
		/**
		 * Direccion que el comprador tiene a la vista en el checkout y que acepta al
		 * confirmar. Es la unica fuente de verdad de la direccion del pedido: se manda
		 * explicita al backend (OrderController@get_address le da prioridad sobre
		 * cualquier direccion guardada del Buyer o del Client del ERP).
		 *
		 * Orden de resolucion, siguiendo lo que cada flujo muestra en pantalla:
		 *   1. Vendedor con cliente seleccionado -> el input de Addresses.vue, que edita
		 *      selected_buyer.comercio_city_client.address.
		 *   2. Comprador invitado -> el input "Direccion" de Buyer.vue (store cart.buyer.address).
		 *   3. Comprador logueado -> el input de Addresses.vue (user.address o
		 *      user.comercio_city_client.address).
		 *
		 * @returns {string|null}
		 */
		order_address() {
			// 1) Vendedor con un cliente seleccionado: gana siempre, porque cart.buyer
			// puede tener datos de una sesion anterior del mismo browser.
			if (this.selected_buyer && this.selected_buyer.comercio_city_client && this.selected_buyer.comercio_city_client.address) {
				let direccion = String(this.selected_buyer.comercio_city_client.address).trim()
				if (direccion) {
					return direccion
				}
			}

			// 2) Comprador invitado: lo que escribio en el input de Buyer.vue
			if (this.$store.state.cart.buyer && this.$store.state.cart.buyer.address) {
				let direccion = String(this.$store.state.cart.buyer.address).trim()
				if (direccion) {
					return direccion
				}
			}

			// 3) Comprador logueado: direccion propia o la del cliente del ERP asociado
			if (this.user) {
				if (this.user.address) {
					let direccion = String(this.user.address).trim()
					if (direccion) {
						return direccion
					}
				}
				if (this.user.comercio_city_client && this.user.comercio_city_client.address) {
					let direccion = String(this.user.comercio_city_client.address).trim()
					if (direccion) {
						return direccion
					}
				}
			}

			// Sin direccion (ej. retiro por local): valor valido, el pedido no lleva
			// direccion de envio.
			return null
		},
	},
	methods: {
		discountCupon(total) {
			if (this.cupon) {
				if (this.cupon.amount) {
					total -= this.cupon.amount
				} else {
					total = total - (total * this.percentageToMultiply(this.cupon.percentage))
				}
			}
			return total
		},
		/**
		 * Crea el pedido a partir del carrito.
		 *
		 * Devuelve SIEMPRE una promesa, y resuelve con `true` si el pedido quedo creado o con `null`
		 * si algo fallo. Antes no devolvia nada, y por eso el checkout no tenia forma de encadenar
		 * nada despues del pedido: el camino de Mercado Pago pedia la preferencia EN PARALELO, sin
		 * mirar si el pedido se habia creado.
		 *
		 * No rechaza nunca: los llamadores viejos (Payway, el modal del carrito, el gateway) la
		 * invocan sin `.catch`, y una promesa rechazada ahi solo ensuciaria la consola.
		 *
		 * @param {boolean} from_mercadopago El pago sigue en Mercado Pago: no se limpia el carrito ni
		 *                                   se navega a la pagina de gracias, eso pasa al volver.
		 * @param {boolean} mostrar_overlay Prender el cartel de carga a pantalla completa. El checkout
		 *                                  pasa `false` porque muestra el estado adentro del boton;
		 *                                  los demas llamadores no tienen boton propio y lo dejan en
		 *                                  `true`.
		 * @returns {Promise<boolean|null>}
		 */
		makeOrder(from_mercadopago = false, mostrar_overlay = true) {
			if (!this.canMakeOrder()) {
				return Promise.resolve(null)
			}

			let self = this

			if (mostrar_overlay) {
				this.$store.commit('auth/setLoading', true)
				this.$store.commit('auth/setMessage', 'Enviando pedido')
			}

			let apagar_overlay = function() {
				if (mostrar_overlay) {
					self.$store.commit('auth/setLoading', false)
					self.$store.commit('auth/setMessage', '')
				}
			}

			return this.$store.dispatch('cart/save')
			.then(function() {
				return self.$api.post('/orders', {
					commerce_id 	: process.env.VUE_APP_COMMERCE_ID,
					cart_id         : self.cart.id,
					dolar_blue      : self.dolar_blue,
					buyer_id		: self.buyer_id,
					seller_id		: self.user.seller_id,
					buyer 			: self.user,
					selected_buyer 	: self.selected_buyer,
					fecha_entrega 	: self.fecha_entrega,
					// Direccion explicita: la que el comprador VIO en el formulario y acepto al
					// confirmar. OrderController@get_address le da prioridad sobre cualquier
					// direccion guardada en buyer/selected_buyer (ver prompt 402).
					address         : self.order_address,
				})
			})
			.then(function(res) {
				if (from_mercadopago) {
					// El pedido YA quedo creado (el POST devolvio 201): lo que falta es el
					// pago en MercadoPago. Se trackea igual porque checkout_complete
					// significa "pedido creado", no "pedido pagado", y este camino nunca
					// vuelve a pasar por aca.
					//
					// El order_id sale del cuerpo del 201, que OrderController@store ahora
					// devuelve como {"order_id": N}. En esta rama el SPA nunca llama a
					// getCurrentOrder, asi que es la unica forma de conocerlo — y MercadoPago
					// es el medio dominante, o sea que sin esto el grueso de los
					// checkout_complete quedaria sin poder atarse a la venta.
					//
					// 🔴 El fallback a null NO es defensivo por las dudas: los dos lados nunca
					// se despliegan juntos, asi que este SPA va a correr un tiempo contra la
					// API vieja, que responde 201 con cuerpo VACIO. Ahi order_id queda null y
					// el evento igual se manda (armar_evento saltea los null).
					let order_id = res.data && res.data.order_id ? res.data.order_id : null
					trackear(TIPOS_EVENTO.CHECKOUT_COMPLETO, {
						order_id: order_id,
						amount: self.total,
					})
					// Vaciado inmediato: esta rama se va del SPA enseguida (redirect a
					// MercadoPago) y los 5 segundos del temporizador de la cola no llegan.
					// Ver el comentario largo de la rama de abajo para el otro motivo.
					enviar_cola()
					apagar_overlay()
					return true
				}

				// Se guarda el id ANTES de limpiar el carrito del store: despues self.cart es null.
				let cart_id = self.cart.id
				// Mismo motivo que cart_id: el total del carrito hay que leerlo antes de vaciarlo.
				let total_del_pedido = self.total

				self.$store.commit('cart/setCart', null)
				self.$store.commit('cart/set_buyer_id', null)
				self.$store.commit('cart/set_selected_buyer', null)
				localStorage.cart = null

				// Secuencia obligatoria. El orden ES el fix: OrderController@current resuelve el
				// comprador leyendo del guard 'buyer', asi que si la sesion se invalida antes,
				// el pedido no se puede recuperar nunca mas y la pagina de gracias queda vacia.
				// 1) cargar el pedido -> 2) borrar el carrito -> 3) cerrar sesion -> 4) navegar.
				return self.$store.dispatch('orders/getCurrentOrder')
				.then(function() {
					// El tracking se SUMA a la secuencia, no la altera: sigue siendo
					// 1) cargar el pedido -> 2) borrar el carrito -> 3) cerrar sesion ->
					// 4) navegar. Va aca y no antes porque el order_id recien se conoce
					// despues de getCurrentOrder (POST /orders responde 201 sin cuerpo).
					let pedido = self.$store.state.orders.order
					trackear(TIPOS_EVENTO.CHECKOUT_COMPLETO, {
						order_id: pedido ? pedido.id : null,
						amount: pedido && pedido.total != null ? pedido.total : total_del_pedido,
					})
					/*
					 * 🔴 Vaciado INMEDIATO, y esto no es una optimizacion: es lo unico que
					 * le da una chance al buyer_id.
					 *
					 * trackear() solo encola — el envio real sale 5 segundos despues, por
					 * temporizador. Mientras tanto esta misma cadena sigue y llega a
					 * logoutGuestAfterOrder(), que hace POST buyer/logout y es el camino
					 * NORMAL del checkout de invitado. Cuando el lote finalmente saliera, la
					 * sesion ya no existe, y BuyerTrackingController resuelve el comprador
					 * desde el guard en el momento de la ingesta: buyer_id llegaria null.
					 * Peor que perderlo siempre: si el temporizador casualmente disparaba
					 * antes del logout, si lo llevaba. Sin esto la atribucion de las compras
					 * queda librada a una carrera, sin patron.
					 *
					 * ⚠️ Esto REDUCE la carrera, no la elimina: el envio del tracking y el
					 * del logout son dos requests independientes y el orden en que llegan al
					 * servidor no esta garantizado. La atribucion igual es recuperable por
					 * order_id -> orders.buyer_id, que es la via confiable cuando el
					 * buyer_id del evento viene null.
					 */
					enviar_cola()
					return self.deleteCartAfterOrder(cart_id)
				})
				.then(function() {
					return self.logoutGuestAfterOrder()
				})
				.then(function() {
					apagar_overlay()
					self.$router.push({name: 'Thanks'})
					return true
				})
			})
			.catch(function(err) {
				apagar_overlay()
				console.log(err)
				return null
			})
		},
		// 🔴 NO convertir esto en un porton que devuelva false sin frenar tambien a los
		// llamadores. Se intento el 31/8/2026 y se revirtio: makeOrder() se alcanza desde
		// CardPaymentMethod.setSelected(), que llama makeOrder(true) e INMEDIATAMENTE
		// despues initMp(), sin mirar el resultado. Hoy, con un invitado sin identificar, la
		// cadena revienta en this.user.seller_id y el overlay de carga queda prendido
		// tapando el boton de MercadoPago que initMp() acaba de dibujar. Es un bug feo, pero
		// tapa el pago. Si canMakeOrder() devuelve false y limpia el overlay sin frenar a
		// initMp(), el boton de MercadoPago queda vivo y el comprador PUEDE PAGAR sin que
		// exista ningun pedido de este lado. Arreglar esto de verdad es cerrar la identidad
		// del comprador en los cuatro caminos de pago, no poner un guard aca.
		canMakeOrder() {
			return true
		},
		/**
		 * Borra el carrito del pedido ya confirmado. Necesita la sesion viva, asi que corre
		 * ANTES del logout del invitado. Nunca rechaza: un fallo aca no debe impedir que el
		 * comprador llegue a la pagina de gracias.
		 *
		 * @param {number|null} cart_id id del carrito que origino el pedido
		 * @returns {Promise}
		 */
		deleteCartAfterOrder(cart_id) {
			if (!cart_id) {
				return Promise.resolve()
			}
			return this.$api.delete('carts/' + cart_id)
			.catch(() => {})
		},
		/**
		 * Destruye la sesion del comprador invitado, para que la proxima visita al sitio sea
		 * anonima. Solo aplica si el comercio permite comprar sin registrarse. Nunca rechaza.
		 *
		 * Los commits al store van DESPUES de que el logout resolvio: si se limpia
		 * `authenticated` antes, cualquier interceptor de $api que dependa de ese flag puede
		 * comportarse distinto durante el request.
		 *
		 * @returns {Promise}
		 */
		logoutGuestAfterOrder() {
			if (!this.puede_comprar_sin_login) {
				return Promise.resolve()
			}
			return this.$api.post('buyer/logout')
			.catch(() => {})
			.then(() => {
				this.$store.commit('auth/setAuthenticated', false)
				this.$store.commit('auth/setUser', null)
			})
		},
	}
}