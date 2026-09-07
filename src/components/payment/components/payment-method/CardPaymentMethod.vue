<template>
	<div
	@click="setSelected"
	@keyup.enter="setSelected"
	@keyup.space="setSelected"
	:class="{'checkout-option--selected': esta_elegido}"
	class="checkout-option"
	role="radio"
	tabindex="0"
	:aria-checked="esta_elegido ? 'true' : 'false'">

		<span class="checkout-option__radio"></span>

		<div class="checkout-option__body">
			<p class="checkout-option__name">
				{{ payment_method.name }}
				<span
				v-if="es_mercado_pago"
				class="checkout-option__brand">
					<i class="bi bi-wallet2"></i>
					Mercado Pago
				</span>
			</p>

			<p
			v-if="payment_method.description"
			class="checkout-option__description">
				{{ payment_method.description }}
			</p>

			<p
			v-else-if="es_mercado_pago"
			class="checkout-option__description">
				Tarjeta de crédito o débito, dinero en cuenta o QR
			</p>

			<div
			v-if="payment_method.discount || payment_method.surchage"
			class="checkout-option__tags">
				<span
				v-if="payment_method.discount"
				class="checkout-tag checkout-tag--good">
					{{ payment_method.discount }}% de descuento
				</span>
				<span
				v-if="payment_method.surchage"
				class="checkout-tag checkout-tag--warn">
					{{ payment_method.surchage }}% de recargo
				</span>
			</div>
		</div>
	</div>
</template>
<script>
import cart from '@/mixins/cart'

/**
 * Una forma de pago de la lista del checkout.
 *
 * 🔴 ES SOLO UNA OPCION ELEGIBLE, y esto cambió el 7/9/2026. Hasta esa fecha, elegir Mercado Pago
 * acá disparaba TODO el checkout: guardaba el carrito, CREABA EL PEDIDO (`makeOrder(true)`) detrás
 * de un cartel de carga a pantalla completa, y pedía la preferencia para que el SDK dibujara su
 * propio botón más abajo. O sea: dos botones distintos y una espera en el medio para hacer una
 * sola cosa, y un pedido creado aunque el comprador después cambiara de forma de pago — al
 * confirmar con otra, se creaba un SEGUNDO pedido.
 *
 * Ahora todo eso vive en el único botón del final del checkout (`BtnSave.vue`), que es donde el
 * comprador confirma. Elegir una forma de pago no manda ningún request.
 */
export default {
	props: ['payment_method'],
	mixins: [cart],
	computed: {
		/**
		 * Si esta forma de pago es la que el comprador tiene elegida.
		 * @returns {boolean}
		 */
		esta_elegido() {
			return !!(this.cart_payment_method && this.cart_payment_method.id == this.payment_method.id)
		},
		/**
		 * Si esta forma de pago cobra por Mercado Pago (el tipo lo define el ERP).
		 * @returns {boolean}
		 */
		es_mercado_pago() {
			return !!(this.payment_method.type && this.payment_method.type.name == 'MercadoPago')
		},
	},
	methods: {
		setSelected() {
			if (this.esta_elegido) {
				return
			}
			this.$store.commit('cart/setPaymentMethod', this.payment_method)
		},
	}
}
</script>
