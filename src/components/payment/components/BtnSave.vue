<template>
	<b-form-group
	class="m-t-15">
		<p
		v-if="cart_payment_method && cart_payment_method.type && cart_payment_method.type.name == 'MercadoPago'"
		class="text-with-icon b-w s">
			<i class="icon-exclamation"></i>
			Luego de que MercadoPago procese tu pago, no olvides <strong>regresar al sitio</strong>, presionando el botón "Volver al sitio", para que actualicemos la información de tu pago y enviemos tu pedido.
		</p>
		<div 
		@click="saveCart"
		class="mp-btn shadow-1"></div>
		<b-button
		v-if="!is_mp"
		block
		@click="ready"
		variant="success">
			Hacer pedido
		</b-button>
	</b-form-group>
</template>
<script>
import cart from '@/mixins/cart'
export default {
	mixins: [cart],
	computed: {
		is_mp() {
			return this.cart_payment_method && this.cart_payment_method.type && this.cart_payment_method.type.name == 'MercadoPago'
		},
	},
	methods: {
		saveCart() {
			this.$store.dispatch('cart/save')
		},	
		ready() {
			if (this.check()) {
				this.$store.dispatch('cart/save')
				.then(() => {
					this.makeOrder()
				})
			}
		},
		check() {
			if (this.cart.deliver == null) {
				this.$toast.error('Seleccione metodo de entrega')
				return false
			}
			if (!this.cart_payment_method) {
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
.mp-btn
	.mercadopago-button
		display: block
		width: 100%
</style>