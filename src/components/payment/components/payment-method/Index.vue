<template>
	<div
	v-if="payment_methods.length"
	class="background">
		<h5>
			Forma de pago
		</h5>
		<payment-methods></payment-methods>
		<total></total>
	</div>
</template>
<script>
import PaymentMethods from '@/components/payment/components/payment-method/PaymentMethods'
import Total from '@/components/payment/components/payment-method/Total'

import CartMixin from '@/mixins/cart'
export default {
	mixins: [CartMixin],
	components: {
		PaymentMethods,
		Total,
	},
	computed: {
		cant_articles_text() {
			if (this.cant_cart_articles == 1) {
				return '1 producto'
			}
			return this.cant_cart_articles+' productos'
		},
		payment_methods() {
			return this.$store.state.payment_methods.models
		},
		tarjeta_description() {
			if (this.cart.deliver) {
				return `${this.efectivo_description}, mas ${this.commerce.percentage_card}% de interes: ${this.price(this.total_efectivo + (this.total_efectivo * this.percentage_card_formated))}` 
			}
			return `Mas ${this.commerce.percentage_card}% de interes: ${this.price(this.total_efectivo + (this.total_efectivo * this.percentage_card_formated))}` 
		},
		efectivo_description() {
			if (this.cart.deliver) {
				return `Mas ${this.price(this.commerce.delivery_price)} de envio: ${this.price(this.total_efectivo)}`
			}
			return null
		},
	}
}
</script>
<style lang="sass">
.total-info
	text-align: left
	font-weight: 600
	p 
		display: flex
		justify-content: space-between
</style>