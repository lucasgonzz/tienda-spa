<template>
	<b-form-group
	class="m-t-15">
		<!-- <p
		v-if="cart_payment_method && cart_payment_method.type && cart_payment_method.type.name == 'MercadoPago'"
		class="text-with-icon text-black b-w s">
			<i class="bi bi-exclamation-triangle-fill"></i>
			Luego de que MercadoPago procese tu pago, no olvides <strong>regresar al sitio</strong>, presionando el botón "Volver al sitio", para que actualicemos la información de tu pago y enviemos tu pedido.
		</p> -->

		<div 
		@click="saveCart"
		class="mp-btn shadow-1"></div>

		<b-button
		v-if="is_payway"
		block
		@click="payway"
		variant="success">
			Ir a pagar
		</b-button>
		
		<b-button
		v-if="!is_mp && !is_payway"
		block
		size="lg"
		@click="ready"
		class="btn-pay">
			<i class="bi bi-lock-fill"></i>
			Finalizar Compra
		</b-button>
	</b-form-group>
</template>
<script>
import cart from '@/mixins/cart'
export default {
	mixins: [cart],
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
	},
	methods: {
		saveCart() {
			this.$store.dispatch('cart/save')
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
		 * Vive en un metodo propio, y no adentro de ready(), porque hay DOS botones que
		 * arrancan el checkout -- "Finalizar Compra" (ready) e "Ir a pagar" de Payway
		 * (check) -- y los dos tienen que aplicar la misma politica. Poner el guard solo en
		 * ready() dejaba a Payway navegando a /pagar sin sesion.
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

				this.$store.commit('auth/setLoading', true)
				this.$store.commit('auth/setMessage', 'Enviando pedido')

				this.$api.post('buyer', { ...buyer, commerce_id: this.commerce.id })
				.then(res => {
					// El modelo que devuelve POST buyer viene con la direccion ya actualizada
					// (el backend la persiste al reconocer el email, prompt 400). Aun asi, la
					// direccion del pedido se manda explicita desde order_address (prompt 402):
					// es lo que el comprador VIO en pantalla, y esa es la unica fuente de verdad.
					// Este bug ya se pago una vez -- un pedido guardado con la direccion vieja de
					// un cliente del ERP mientras el comprador miraba en pantalla la nueva.
					this.$store.commit('auth/setUser', res.data.model)
					this.makeOrder()
				})
				.catch(err => {
					this.$store.commit('auth/setLoading', false)
					this.$store.commit('auth/setMessage', '')
					this.$toast.error('Hubo un error al identificar el comprador')
				})

			} else {
				// Flujo autenticado: comportamiento original sin cambios
				const checkout_errors = this.collect_authenticated_checkout_errors()
				if (checkout_errors.length) {
					this.show_checkout_validation_errors(checkout_errors)
					return
				}
				this.$store.commit('auth/setLoading', true)
				this.$store.commit('auth/setMessage', 'Enviando pedido')
				this.$store.dispatch('cart/save')
				.then(() => {
					this.makeOrder()
				})
				.catch(err => {
					this.$store.commit('auth/setLoading', false)
				})
			}
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
				errors.push('Metodo de pago')
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
				errors.push('Metodo de pago')
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
		 * Indica si la tienda exige elegir un día de entrega.
		 *
		 * @returns {boolean}
		 */
		must_select_delivery_day() {
			return this.$store.state.delivery_day.models.length > 0
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
<style lang="sass">
.btn-pay
	background: #269e24 !important
	border: 1px solid #269e24 !important
	padding: .7rem 1rem !important
.mp-btn
	.mercadopago-button
		display: block
		width: 100%
		padding: .7rem 1rem
		font-size: 1.25rem
		line-height: 1.5
		border-radius: 0.3rem
</style>