<template>
	<div class="total-info m-t-30">
		<p>
			Tu pedido ({{ cant_articles_text }}): 
			<span>
				{{ price(total) }}
			</span>
		</p>
		<p
		v-if="cart_payment_method && cart_payment_method.discount">
			Descuento por Metodo de Pago {{ cart_payment_method.name }} del {{ cart_payment_method.discount }}%
			<span>
				{{ price(total_with_payment_method_discount) }}
			</span>
		</p> 
		<p 
		v-if="cart_payment_method && cart_payment_method.surchage">
			Recargo por Metodo de Pago {{ cart_payment_method.name }} del {{ cart_payment_method.surchage }}%
			<span>
				{{ price(total_with_payment_method_surchage) }}
			</span>
		</p>
		<p
		v-if="cupon">
			<span
			v-if="cupon.amount">
				Con el cupon de {{ price(cupon.amount) }}: 
			</span>
			<span
			v-if="cupon.percentage">
				Con el cupon del {{ cupon.percentage }}%: 
			</span>
			<span>{{ price(total_with_cupon) }}</span>
		</p>
		<p
		v-if="cart.deliver && cart_delivery_zone">
			Mas {{ price(cart_delivery_zone.price) }} de envio: 
			<span>{{ price(total_with_deliver) }}</span>
		</p>
	</div>
</template>
<script>
import cart from '@/mixins/cart'
export default {
	mixins: [cart],
	computed: {
		cant_articles_text() {
			if (this.cant_cart_articles == 1) {
				return '1 producto'
			}
			return this.cant_cart_articles+' productos'
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