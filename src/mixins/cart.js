export default {
	computed: {
		cant_cart_items() {
			let cant_items = 0
			let cart = this.$store.state.cart.cart
			if (cart) {
				cart.articles.forEach(article => {
					cant_items += article.amount
				})

				cart.promociones_vinoteca.forEach(promo => {
					cant_items += promo.amount
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
		setBtnMpVisible(set_visible) {
			let btn = document.getElementsByClassName('mp-btn')
			console.log(btn)
			if (btn.length) {
				if (set_visible) {
					btn[0].style.display = 'block'
					console.log('se hizo visible')
				} else {
					btn[0].style.display = 'none'
					let child = document.getElementsByClassName('mercadopago-button')
					console.log('se hizo no visible')
					if (child.length) {
						child[0].remove()
						console.log('se removio btn')
					}
				}
			}
		},
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
		makeOrder(from_mercadopago = false) {
			if (this.canMakeOrder()) {
				this.$store.commit('auth/setLoading', true)
				if (from_mercadopago) {
					this.$store.commit('auth/setMessage', 'Guardando pedido para luego pagar con Mercado Pago')
				} else {
					this.$store.commit('auth/setMessage', 'Enviando pedido')
				}
				this.$store.dispatch('cart/save')
				.then(() => {
					return this.$api.post('/orders', {
						commerce_id 	: process.env.VUE_APP_COMMERCE_ID,
						cart_id         : this.cart.id,
						dolar_blue      : this.dolar_blue,
						buyer_id		: this.buyer_id,
						seller_id		: this.user.seller_id,
						buyer 			: this.user,
						selected_buyer 	: this.selected_buyer,
						fecha_entrega 	: this.fecha_entrega,
						// Direccion explicita: la que el comprador VIO en el formulario y acepto al
						// confirmar. OrderController@get_address le da prioridad sobre cualquier
						// direccion guardada en buyer/selected_buyer (ver prompt 402).
						address         : this.order_address,
					})
					.then(() => {
						if (from_mercadopago) {
							this.$store.commit('auth/setLoading', false)
							this.$store.commit('auth/setMessage', '')
							return
						}

						// Se guarda el id ANTES de limpiar el carrito del store: despues this.cart es null.
						const cart_id = this.cart.id

						this.$store.commit('cart/setCart', null)
						this.$store.commit('cart/set_buyer_id', null)
						this.$store.commit('cart/set_selected_buyer', null)
						localStorage.cart = null

						// Secuencia obligatoria. El orden ES el fix: OrderController@current resuelve el
						// comprador leyendo del guard 'buyer', asi que si la sesion se invalida antes,
						// el pedido no se puede recuperar nunca mas y la pagina de gracias queda vacia.
						// 1) cargar el pedido -> 2) borrar el carrito -> 3) cerrar sesion -> 4) navegar.
						this.$store.dispatch('orders/getCurrentOrder')
						.then(() => {
							return this.deleteCartAfterOrder(cart_id)
						})
						.then(() => {
							return this.logoutGuestAfterOrder()
						})
						.then(() => {
							this.$store.commit('auth/setLoading', false)
							this.$store.commit('auth/setMessage', '')
							this.$router.push({name: 'Thanks'})
						})
					})
					.catch(err => {
						this.$store.commit('auth/setLoading', false)
						this.$store.commit('auth/setMessage', '')
						console.log(err)
					})
				})
			} 
		},
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