<template>
	<div class="payment-result">
		<div class="payment-result__card">
			<i class="bi bi-exclamation-triangle-fill payment-result__icon payment-result__icon--error"></i>

			<h1 class="payment-result__title">
				No se pudo completar el pago
			</h1>
			<p class="payment-result__text">
				Mercado Pago no procesó la operación. No te cobramos nada.
			</p>
			<p class="payment-result__text">
				Podés intentarlo de nuevo o elegir otra forma de pago.
			</p>

			<div class="payment-result__actions">
				<b-button
				block
				variant="success"
				:to="{name: 'Payment'}">
					Elegir otra forma de pago
				</b-button>
				<b-button
				block
				variant="outline-secondary"
				:to="{name: 'Home'}">
					Volver a la tienda
				</b-button>
			</div>
		</div>
	</div>
</template>
<script>

/**
 * Vuelta de Mercado Pago con el pago rechazado.
 *
 * No usa el mixin de pago a propósito: el carrito NO se limpia, porque el comprador vuelve al
 * checkout a elegir otra forma de pago y necesita tener su pedido a mano.
 */
export default {
	metaInfo: {
		title: 'Pago rechazado',
	},
}
</script>
