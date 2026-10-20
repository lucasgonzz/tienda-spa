<template>
	<div class="payment-result">
		<div class="payment-result__card">
			<i class="bi bi-hourglass-split payment-result__icon payment-result__icon--wait"></i>

			<h1 class="payment-result__title">
				Tu pago está en revisión
			</h1>
			<p class="payment-result__text">
				Mercado Pago todavía está verificando la operación. Tu pedido ya quedó registrado y lo vamos a preparar igual.
			</p>
			<p class="payment-result__text">
				No hace falta que hagas nada más: el pago se registra solo cuando Mercado Pago lo resuelve, aunque cierres esta ventana.
			</p>

			<div class="payment-result__actions">
				<b-button
				v-if="authenticated"
				block
				variant="success"
				:to="{name: 'Orders'}">
					Ver mis pedidos
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
import payment from '@/mixins/payment'

/**
 * Vuelta de Mercado Pago con el pago pendiente de acreditación.
 *
 * Igual que `PaymentSuccess`: no guarda nada. El estado real del pago lo escribe el webhook cuando
 * Mercado Pago lo resuelve, que puede ser bastante después de que el comprador cierre esta pantalla
 * — que es exactamente por lo que el "NO CIERRES ESTA VENTANA" que había acá no tenía sentido.
 */
export default {
	mixins: [payment],
	metaInfo: {
		title: 'Pago pendiente',
	},
}
</script>
