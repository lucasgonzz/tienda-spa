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
		ready() {
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
				this.commerce.online_configuration.pedir_barrio_al_registrarse
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