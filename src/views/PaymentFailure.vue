<template>
	<div class="payment-result">
		<div class="payment-result__card">
			<i class="bi bi-exclamation-triangle-fill payment-result__icon payment-result__icon--error"></i>

			<h1 class="payment-result__title">
				No se pudo completar el pago
			</h1>
			<p class="payment-result__text">
				Mercado Pago no procesó la operación, así que no te cobramos nada.
			</p>
			<p class="payment-result__text">
				Tu pedido igual quedó registrado, sin el pago. El negocio se va a poner en contacto con vos para resolverlo.
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

/**
 * Vuelta de Mercado Pago con el pago rechazado.
 *
 * 🔴 ACA NO SE OFRECE VOLVER AL CHECKOUT, y hasta el 7/9/2026 sí se hacía ("Cambiar metodo de
 * pago"). Ese botón llevaba a una pantalla vacía: el pedido se crea ANTES de salir a pagar, y con
 * eso `carts.order_id` queda escrito; `CartController@lastCart` filtra `whereNull('order_id')`, así
 * que al volver de Mercado Pago —que siempre es una carga limpia del SPA— el carrito ya no se
 * recupera. El comprador aterrizaba en un checkout sin productos con el botón "Finalizar compra"
 * habilitado, y si lo apretaba creaba un pedido VACÍO.
 *
 * Por eso tampoco se usa el mixin de pago: no hay carrito que limpiar, ya está vacío.
 *
 * Reintentar el pago de un pedido que ya existe es algo que la tienda todavía no sabe hacer. El día
 * que lo sepa, el botón vuelve — pero apuntando a ese pedido, no a un checkout en blanco.
 */
export default {
	metaInfo: {
		title: 'Pago rechazado',
	},
}
</script>
