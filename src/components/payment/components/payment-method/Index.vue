<template>
	<div
	v-if="payment_methods.length"
	class="checkout-section">
		<h2 class="checkout-section__title">
			<i class="bi bi-credit-card"></i>
			¿Cómo pagás?
		</h2>

		<div
		role="radiogroup"
		aria-label="Forma de pago">
			<payment-methods></payment-methods>
		</div>
	</div>
</template>
<script>
import PaymentMethods from '@/components/payment/components/payment-method/PaymentMethods'

/**
 * Bloque de formas de pago del checkout.
 *
 * El desglose del total ya no vive acá: está una sola vez, en el resumen de la compra
 * (CartResume.vue). Antes se renderizaba en los dos lugares, con el mismo componente, y el
 * comprador veía dos veces la misma cuenta en la misma pantalla.
 */
export default {
	components: {
		PaymentMethods,
	},
	computed: {
		payment_methods() {
			return this.$store.state.payment_methods.models
		},
	}
}
</script>
