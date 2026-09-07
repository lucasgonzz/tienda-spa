<template>
	<div class="payment-result">
		<div class="payment-result__card">
			<i class="bi bi-check-circle-fill payment-result__icon payment-result__icon--ok"></i>

			<h1 class="payment-result__title">
				¡Listo! Recibimos tu pago
			</h1>
			<p class="payment-result__text">
				Tu pedido ya está confirmado. Te vamos a avisar por correo o WhatsApp cuando esté en camino.
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
 * Vuelta de Mercado Pago con el pago aprobado.
 *
 * 🔴 No hace ningún request. El pedido se creó ANTES de salir a pagar y el pago lo registra el
 * webhook de Mercado Pago (`MercadoPagoController@webhook`), que no depende de que el comprador
 * vuelva a la tienda. Lo único que pasa acá es local: vaciar el carrito de esta pestaña, y eso lo
 * hace el mixin. Hasta el 7/9/2026 esta pantalla mostraba una barra de progreso de 5 segundos, un
 * "NO CIERRES ESTA VENTANA" y una cuenta regresiva de 7 — y por el camino creaba un carrito
 * huérfano en cada pago.
 */
export default {
	mixins: [payment],
	metaInfo: {
		title: 'Pago exitoso',
	},
}
</script>
