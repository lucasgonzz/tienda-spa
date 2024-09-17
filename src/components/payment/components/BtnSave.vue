<template>
	<b-form-group
	class="m-t-15">
		<!-- <p
		v-if="cart_payment_method && cart_payment_method.type && cart_payment_method.type.name == 'MercadoPago'"
		class="text-with-icon text-black b-w s">
			<i class="icon-exclamation"></i>
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
			<i class="icon-lock-1"></i>
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
			if (this.check()) {
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
		check() {
			if (this.cart.deliver == null) {
				this.$toast.error('Seleccione metodo de entrega')
				return false
			}
			if (!this.cart_payment_method && this.payment_methods.length) {
				this.$toast.error('Seleccione un metodo de pago')
				return false
			}
			if (this.cart.deliver && !this.cart.address_id) {
				this.$toast.error('Seleccione una direccion')
				return false
			}
			if (this.cart.deliver && this.delivery_zones.length && !this.cart_delivery_zone) {
				this.$toast.error('Seleccione el precio de envio')
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