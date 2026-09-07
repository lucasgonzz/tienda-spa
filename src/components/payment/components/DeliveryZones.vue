<template>
	<div
	class="checkout-section"
	v-if="deliver && delivery_zones.length">
		<h2 class="checkout-section__title">
			<i class="bi bi-truck"></i>
			Costo del envío
		</h2>
		<p class="checkout-section__hint">
			Elegí la zona donde recibís el pedido.
		</p>

		<div
		role="radiogroup"
		aria-label="Zona de envío">
			<div
			v-for="delivery_zone in delivery_zones"
			:key="delivery_zone.id"
			@click="cart_delivery_zone = delivery_zone"
			@keyup.enter="cart_delivery_zone = delivery_zone"
			@keyup.space="cart_delivery_zone = delivery_zone"
			:class="{'checkout-option--selected': esta_elegida(delivery_zone)}"
			class="checkout-option"
			role="radio"
			tabindex="0"
			:aria-checked="esta_elegida(delivery_zone) ? 'true' : 'false'">

				<span class="checkout-option__radio"></span>

				<div class="checkout-option__body">
					<p class="checkout-option__name">
						{{ delivery_zone.name }}
					</p>
					<p
					v-if="delivery_zone.description"
					class="checkout-option__description">
						{{ delivery_zone.description }}
					</p>
				</div>

				<p class="checkout-option__price">
					{{ price(delivery_zone.price) }}
				</p>
			</div>
		</div>
	</div>
</template>
<script>
import cart from '@/mixins/cart'
export default {
	mixins: [cart],
	methods: {
		/**
		 * Si esta es la zona de envío que el comprador tiene elegida.
		 *
		 * @param {object} delivery_zone
		 * @returns {boolean}
		 */
		esta_elegida(delivery_zone) {
			return !!(this.cart_delivery_zone && this.cart_delivery_zone.id == delivery_zone.id)
		},
	},
}
</script>
