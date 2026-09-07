<template>
	<div class="checkout-summary__lines">
		<p class="checkout-summary__line">
			Subtotal ({{ cant_articles_text }})
			<span>{{ price(total) }}</span>
		</p>

		<p
		v-if="cart_payment_method && cart_payment_method.discount"
		class="checkout-summary__line checkout-summary__line--good">
			Descuento por {{ cart_payment_method.name }} ({{ porcentaje(cart_payment_method.discount) }}%)
			<span>- {{ price(total - total_with_payment_method_discount) }}</span>
		</p>

		<p
		v-if="cart_payment_method && cart_payment_method.surchage"
		class="checkout-summary__line">
			Recargo por {{ cart_payment_method.name }} ({{ porcentaje(cart_payment_method.surchage) }}%)
			<span>+ {{ price(total_with_payment_method_surchage - total) }}</span>
		</p>

		<p
		v-if="cupon"
		class="checkout-summary__line checkout-summary__line--good">
			<span
			v-if="cupon.amount"
			class="checkout-summary__concept">
				Cupón de {{ price(cupon.amount) }}
			</span>
			<span
			v-else
			class="checkout-summary__concept">
				Cupón del {{ porcentaje(cupon.percentage) }}%
			</span>
			<span>- {{ price(total_with_payment_method - total_with_cupon) }}</span>
		</p>

		<p
		v-if="cart.deliver && cart_delivery_zone"
		class="checkout-summary__line">
			Envío ({{ cart_delivery_zone.name }})
			<span>+ {{ price(cart_delivery_zone.price) }}</span>
		</p>

		<p class="checkout-summary__total">
			Total
			<span>{{ price(total_a_pagar) }}</span>
		</p>
	</div>
</template>
<script>
import cart from '@/mixins/cart'
export default {
	mixins: [cart],
	computed: {
		/**
		 * Cuantas unidades lleva el pedido. Antes decia "productos" contando UNIDADES, asi que dos
		 * productos con tres unidades se leia "3 productos".
		 *
		 * @returns {string}
		 */
		cant_articles_text() {
			return this.cant_cart_items + ' ' + this.cart_units_label
		},
		/**
		 * Lo que el comprador va a pagar, con todo aplicado.
		 *
		 * 🔴 No se usa `total_final` del mixin: ese hace `Number(this.cart_delivery_zone.price)`
		 * sin guarda y revienta con `cart_delivery_zone` en null, que es el estado normal cuando
		 * el comprador eligió retiro por local o todavía no eligió zona. Acá el envío se suma solo
		 * si hay envío Y zona elegida — exactamente el mismo `v-if` con el que se muestra la línea
		 * de arriba, así que el total mostrado siempre cierra con el desglose que está a la vista.
		 *
		 * Es un cálculo de PANTALLA: lo que efectivamente se cobra lo resuelve la API
		 * (OnlinePaymentHelper), y esto no lo cambia.
		 *
		 * @returns {number}
		 */
		total_a_pagar() {
			let total = this.total_with_cupon
			if (this.cart.deliver && this.cart_delivery_zone) {
				total += Number(this.cart_delivery_zone.price)
			}
			return total
		},
	},
	methods: {
		/**
		 * Porcentaje legible: la columna es decimal(12,2) y llega como "5.00".
		 *
		 * @param {string|number} valor
		 * @returns {string}
		 */
		porcentaje(valor) {
			const numero = Number(valor)
			if (!isFinite(numero)) {
				return String(valor)
			}
			return String(Number(numero.toFixed(2)))
		},
	},
}
</script>
