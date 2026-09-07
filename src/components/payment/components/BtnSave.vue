<template>
	<div class="checkout-confirm">
		<b-button
		block
		size="lg"
		:disabled="procesando"
		:class="{'checkout-confirm__btn--mp': is_mp}"
		class="checkout-confirm__btn"
		@click="confirmar">

			<span v-if="procesando">
				<b-spinner
				small
				class="m-r-10"></b-spinner>
				{{ texto_mientras_procesa }}
			</span>

			<span v-else-if="is_mp">
				<i class="bi bi-wallet2"></i>
				Pagar con Mercado Pago
			</span>

			<span v-else-if="is_payway">
				<i class="bi bi-credit-card-2-front"></i>
				Pagar con tarjeta
			</span>

			<span v-else>
				<i class="bi bi-lock-fill"></i>
				Finalizar compra
			</span>
		</b-button>

		<p
		v-if="is_mp"
		class="checkout-confirm__hint">
			Te llevamos a Mercado Pago para completar el pago.
		</p>
	</div>
</template>
<script>
import cart from '@/mixins/cart'

/**
 * El único botón que confirma el pedido.
 *
 * 🔴 UN SOLO BOTON PARA TODAS LAS FORMAS DE PAGO, y ese es el cambio del 7/9/2026. Antes había
 * dos: éste, y uno que dibujaba el SDK de Mercado Pago dentro de un `<div class="mp-btn">` y que
 * aparecía recién después de elegir esa forma de pago (con un cartel de carga a pantalla completa
 * en el medio, porque el pedido se creaba ahí). Ahora el botón cambia de texto según la forma de
 * pago elegida y hace todo en un click, mostrando el estado adentro suyo — sin tapar la pantalla.
 *
 * El orden del camino de Mercado Pago importa y no es el que había: primero se pide la
 * preferencia y DESPUES se crea el pedido. Si Mercado Pago rechaza la preferencia (el comercio sin
 * cuenta conectada es el caso real), el comprador se queda en el checkout sin ningún pedido
 * colgado, y puede reintentar o elegir otra forma de pago.
 */
export default {
	mixins: [cart],
	data() {
		return {
			/** Hay un checkout en curso: el botón queda deshabilitado y muestra el estado. */
			procesando: false,
		}
	},
	computed: {
		is_payway() {
			return this.cart_payment_method && this.cart_payment_method.type && this.cart_payment_method.type.name == 'Payway'
		},
		is_mp() {
			return this.cart_payment_method && this.cart_payment_method.type && this.cart_payment_method.type.name == 'MercadoPago'
		},
		payment_methods() {
			return this.$store.state.payment_methods.models
		},
		buyer_id() {
			return this.$store.state.cart.buyer_id
		},
		/**
		 * Qué dice el botón mientras trabaja. Con Mercado Pago la espera termina en otro sitio,
		 * así que conviene anticiparlo.
		 * @returns {string}
		 */
		texto_mientras_procesa() {
			if (this.is_mp) {
				return 'Te llevamos a Mercado Pago...'
			}
			return 'Enviando tu pedido...'
		},
	},
	methods: {
		/**
		 * Punto de entrada del botón. Reparte según la forma de pago elegida.
		 */
		confirmar() {
			if (this.procesando) {
				return
			}
			if (this.is_payway) {
				this.payway()
				return
			}
			this.ready()
		},
		payway() {
			if (this.check()) {
				this.$router.push({name: 'PaymentCard'})
			}
		},
		/**
		 * Manda al login al comprador que no tiene sesion en una tienda que exige registro,
		 * que es el tercer caso que el if/else de ready() no cubria.
		 *
		 * SON TRES CASOS, NO DOS: la negacion de (!autenticado && invitado_permitido) NO es
		 * "autenticado" -- tambien entra "sin sesion y con registro obligatorio". Hasta el
		 * 31/8/2026 ese caso caia en el else de ready(), rotulado "Flujo autenticado", que
		 * desreferencia this.user. Con this.user en null eso tira un TypeError DENTRO del
		 * handler del click, y una excepcion ahi no produce ninguna senial: sin pedido, sin
		 * request, sin toast y sin cambio de URL. Medido en la demo el 31/8/2026.
		 *
		 * Vive en un metodo propio, y no adentro de ready(), porque hay DOS caminos que
		 * arrancan el checkout -- el pedido comun y el de Payway (check) -- y los dos tienen
		 * que aplicar la misma politica.
		 *
		 * @returns {boolean} true si redirigio; el que llama tiene que cortar ahi
		 */
		redirect_to_login_if_no_session() {
			if (this.authenticated || this.puede_comprar_sin_login) {
				return false
			}
			// Misma politica que ya aplica CartFooter.next() al entrar al checkout: misma
			// cookie, mismo valor y misma ruta destino.
			this.$cookies.set('redirect_to', 'Payment')
			this.$toast.error('Iniciá sesión para completar tu compra')
			this.$router.push({name: 'Login'})
			return true
		},
		ready() {
			if (this.redirect_to_login_if_no_session()) {
				return
			}

			let self = this

			// Flujo guest: identificar comprador antes de crear el pedido
			if (!this.authenticated && this.puede_comprar_sin_login) {
				// Errores de validación acumulados del checkout invitado
				const checkout_errors = this.collect_guest_checkout_errors()
				if (checkout_errors.length) {
					this.show_checkout_validation_errors(checkout_errors)
					return
				}

				// Datos del comprador invitado a enviar al endpoint de identificación
				const buyer = this.$store.state.cart.buyer

				this.procesando = true

				this.$api.post('buyer', { ...buyer, commerce_id: this.commerce.id })
				.then(function(res) {
					// El modelo que devuelve POST buyer viene con la direccion ya actualizada
					// (el backend la persiste al reconocer el email, prompt 400). Aun asi, la
					// direccion del pedido se manda explicita desde order_address (prompt 402):
					// es lo que el comprador VIO en pantalla, y esa es la unica fuente de verdad.
					// Este bug ya se pago una vez -- un pedido guardado con la direccion vieja de
					// un cliente del ERP mientras el comprador miraba en pantalla la nueva.
					self.$store.commit('auth/setUser', res.data.model)
					return self.confirmar_pedido()
				})
				.catch(function(err) {
					console.log(err)
					self.procesando = false
					self.$toast.error('Hubo un error al identificar el comprador')
				})

			} else {
				// Flujo autenticado: comportamiento original sin cambios
				const checkout_errors = this.collect_authenticated_checkout_errors()
				if (checkout_errors.length) {
					this.show_checkout_validation_errors(checkout_errors)
					return
				}

				this.procesando = true

				this.$store.dispatch('cart/save')
				.then(function() {
					return self.confirmar_pedido()
				})
				.catch(function(err) {
					console.log(err)
					self.procesando = false
					self.$toast.error('No pudimos guardar tu pedido. Probá de nuevo.')
				})
			}
		},
		/**
		 * Con los datos ya validados y el comprador identificado: crea el pedido, o arranca el
		 * pago por Mercado Pago (que crea el pedido él mismo, después de la preferencia).
		 *
		 * @returns {Promise}
		 */
		confirmar_pedido() {
			if (this.is_mp) {
				return this.pagar_con_mercado_pago()
			}

			let self = this

			// mostrar_overlay = false: el estado ya lo muestra este botón, y el cartel a pantalla
			// completa es justamente lo que se sacó del checkout.
			return this.makeOrder(false, false)
			.then(function(ok) {
				self.procesando = false
				if (!ok) {
					self.$toast.error('No pudimos guardar tu pedido. Probá de nuevo.')
				}
			})
		},
		/**
		 * El camino de Mercado Pago, en un solo click.
		 *
		 * 🔴 EL ORDEN ES PRIMERO LA PREFERENCIA Y DESPUES EL PEDIDO, al revés de como estaba. Con
		 * el orden viejo (pedido primero, preferencia después, y encima en paralelo), un comercio
		 * sin cuenta de Mercado Pago conectada — que responde 422 y es el caso real de hoy — dejaba
		 * un pedido creado que nadie iba a pagar, y cada reintento del comprador dejaba otro.
		 *
		 * El `cart_id` se manda para que la API lo escriba como `external_reference` de la
		 * preferencia: con eso el webhook sabe a qué pedido atarle el pago aunque el comprador
		 * nunca vuelva a la tienda.
		 *
		 * @returns {Promise}
		 */
		pagar_con_mercado_pago() {
			let self = this

			return this.$api.post('mercado-pago/preference', {
				payment_method: this.cart_payment_method,
				cupon: this.cupon,
				delivery_zone: this.cart_delivery_zone,
				articles: this.articles,
				cart_id: this.cart ? this.cart.id : null,
			})
			.then(function(res) {
				const init_point = res.data && res.data.init_point ? res.data.init_point : null
				const preference_id = res.data && res.data.preference_id ? res.data.preference_id : null

				if (!init_point && !preference_id) {
					self.procesando = false
					self.$toast.error('No pudimos abrir Mercado Pago. Probá de nuevo o elegí otra forma de pago.')
					return
				}

				return self.makeOrder(true, false)
				.then(function(ok) {
					if (!ok) {
						self.procesando = false
						self.$toast.error('No pudimos guardar tu pedido. Probá de nuevo.')
						return
					}

					if (init_point) {
						// Un solo salto: el comprador se va del SPA derecho al checkout de
						// Mercado Pago. `procesando` queda en true a propósito — la página se está
						// yendo y no hay que devolverle el botón habilitado en el medio.
						window.location.href = init_point
						return
					}

					// API todavía sin `init_point` (los dos lados de la tienda no se despliegan el
					// mismo día): se abre el checkout con el SDK, como se hacía antes.
					self.abrir_checkout_con_el_sdk(preference_id)
				})
			})
			.catch(function(err) {
				console.log(err)
				self.procesando = false
				const mensaje = err.response && err.response.data && err.response.data.message
					? err.response.data.message
					: 'No pudimos abrir Mercado Pago. Probá de nuevo o elegí otra forma de pago.'
				self.$toast.error(mensaje)
			})
		},
		/**
		 * Respaldo para cuando la API todavía no devuelve `init_point`: el SDK abre el checkout de
		 * Mercado Pago sobre la tienda. El script del SDK se carga en `public/index.html`.
		 *
		 * @param {string|null} preference_id
		 */
		abrir_checkout_con_el_sdk(preference_id) {
			if (!preference_id || typeof MercadoPago === 'undefined') {
				this.procesando = false
				this.$toast.error('No pudimos abrir Mercado Pago. Probá de nuevo o elegí otra forma de pago.')
				return
			}

			const mp = new MercadoPago(this.cart_payment_method.public_key, {
				locale: 'es-AR',
			})

			mp.checkout({
				preference: {
					id: preference_id,
				},
				autoOpen: true,
			})
		},
		/**
		 * Indica si un valor de formulario está vacío o solo contiene espacios.
		 *
		 * @param {string} value
		 * @returns {boolean}
		 */
		is_blank_field(value) {
			return !value || String(value).trim() === ''
		},
		/**
		 * Arma la lista de campos faltantes del checkout invitado.
		 *
		 * @returns {string[]}
		 */
		collect_guest_checkout_errors() {
			const errors = []
			const buyer = this.$store.state.cart.buyer

			if (this.is_blank_field(buyer.name)) {
				errors.push('Nombre y apellido')
			}
			if (this.is_blank_field(buyer.phone)) {
				errors.push('Telefono')
			}
			if (this.is_blank_field(buyer.email)) {
				errors.push('Correo electronico')
			}
			if (this.is_blank_field(buyer.ciudad)) {
				errors.push('Ciudad')
			}
			if (
				this.flag_activo(this.commerce.online_configuration.pedir_barrio_al_registrarse)
				&& this.is_blank_field(buyer.barrio)
			) {
				errors.push('Barrio')
			}
			// La direccion solo es obligatoria si el comprador eligio envio a domicilio
			// (deliver == 1). Con retiro por local (deliver == 0) no hace falta.
			if (this.cart.deliver == 1 && this.is_blank_field(buyer.address)) {
				errors.push('Direccion')
			}
			if (this.cart.deliver == null) {
				errors.push('Metodo de entrega')
			}
			if (!this.cart_payment_method && this.payment_methods.length) {
				errors.push('Forma de pago')
			}
			if (this.must_select_delivery_day() && !this.has_selected_delivery_day()) {
				errors.push('Dia de entrega')
			}

			return errors
		},
		/**
		 * Arma la lista de datos faltantes del checkout autenticado.
		 *
		 * @returns {string[]}
		 */
		collect_authenticated_checkout_errors() {
			const errors = []

			if (this.cart.deliver == null) {
				errors.push('Metodo de entrega')
			}
			if (!this.cart_payment_method && this.payment_methods.length) {
				errors.push('Forma de pago')
			}
			if (
				this.cart.deliver
				&& this.user
				&& (
					(this.user.comercio_city_client && this.user.comercio_city_client.address == '')
					&& (this.user.address == '')
				)
			) {
				errors.push('Direccion de entrega')
			}
			if (this.cart.deliver && this.delivery_zones.length && !this.cart_delivery_zone) {
				errors.push('Precio de envio')
			}
			// 🔴 Este this.user.seller_id NO lleva guarda a proposito, aunque su hermana de
			// la Direccion de entrega si la tenga. Se le puso el 31/8/2026 y se revirtio:
			// sin sesion, esta linea es lo unico que frena a un invitado de una tienda
			// register_to_buy=0 que elige Payway. Guardandola, check() devuelve true,
			// payway() navega a /pagar, el comprador TOKENIZA LA TARJETA y recien ahi falla,
			// en una pantalla donde no existe ningun formulario para completar sus datos.
			// El caso "sin sesion y con registro obligatorio" -- el que dejaba el boton mudo
			// -- ya lo cortan ready() y check() antes de llegar aca, con
			// redirect_to_login_if_no_session(). Sacar esta nota solo cuando el checkout de
			// invitado valide sus propios datos en check(), como ya hace ready().
			if (this.user.seller_id && !this.buyer_id) {
				errors.push('Cliente del pedido')
			}
			if (this.must_select_delivery_day() && !this.has_selected_delivery_day()) {
				errors.push('Dia de entrega')
			}

			return errors
		},
		/**
		 * Indica si la tienda exige elegir un día de entrega: hay días configurados Y el
		 * select tiene sentido para el método de entrega elegido (DeliveryDay.vue solo lo
		 * muestra con envío a domicilio, deliver === 1 — retiro por local no usa día de
		 * entrega). Antes solo miraba delivery_day.models.length, así que un comercio con
		 * días configurados y un comprador que elegía retiro por local quedaba exigiendo
		 * un campo que la interfaz nunca ofrecía completar.
		 *
		 * @returns {boolean}
		 */
		must_select_delivery_day() {
			return this.cart.deliver === 1 && this.$store.state.delivery_day.models.length > 0
		},
		/**
		 * Indica si el comprador ya seleccionó un día de entrega válido.
		 *
		 * @returns {boolean}
		 */
		has_selected_delivery_day() {
			const fecha_entrega = this.$store.state.cart.cart.fecha_entrega
			return fecha_entrega && Number(fecha_entrega) !== 0
		},
		/**
		 * Muestra al usuario todos los campos faltantes en una sola notificación.
		 *
		 * @param {string[]} errors
		 */
		show_checkout_validation_errors(errors) {
			if (!errors.length) {
				return
			}

			if (errors.length === 1) {
				this.$toast.error('Completá el campo: ' + errors[0])
				return
			}

			this.$toast.error('Completá los siguientes campos: ' + errors.join(', '))
		},
		check() {
			// Payway entra por aca, no por ready(). Sin esto, un comprador sin sesion en una
			// tienda con registro obligatorio navegaba a /pagar y terminaba llamando a
			// makeOrder() desde Payway.vue.
			if (this.redirect_to_login_if_no_session()) {
				return false
			}
			const checkout_errors = this.collect_authenticated_checkout_errors()
			if (checkout_errors.length) {
				this.show_checkout_validation_errors(checkout_errors)
				return false
			}
			return true
		}
	}
}
</script>
