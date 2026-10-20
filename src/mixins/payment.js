/**
 * Vuelta de Mercado Pago (pago exitoso / pendiente).
 *
 * 🔴 ACA NO SE GUARDA NADA, Y ES A PROPOSITO. Hasta el 7/9/2026 este mixin mostraba una barra de
 * progreso de 5 segundos y despues hacia `cart/save` con el `payment_id` y el `status` que venian
 * en la query string. Eso tenia tres problemas, y ninguno era de estilo:
 *
 *   1. El carrito NO estaba en el store. El comprador vuelve de Mercado Pago con una carga limpia
 *      del SPA, asi que `cart.id` era null y `cart/save` hacia un `POST /carts` NUEVO: cada pago
 *      dejaba un carrito huerfano y el pedido real no se tocaba.
 *   2. La query string la escribe el navegador del comprador: cualquiera puede poner
 *      `?status=approved` a mano. Por eso desde el 5/9/2026 el pago lo registra el WEBHOOK
 *      (`MercadoPagoController@webhook`), que consulta el pago a la API de Mercado Pago con la
 *      credencial del comercio. Ese camino no depende de que el comprador vuelva.
 *   3. La barra no media nada: era un `setInterval` que sumaba 10 cada 500 ms.
 *
 * Lo unico que queda por hacer al volver es local: vaciar el carrito de esta pestaña, porque el
 * de la base ya quedo atado al pedido (`carts.order_id`) y `CartController@lastCart` no lo va a
 * devolver mas.
 */
export default {
	created() {
		this.limpiar_carrito_local()
	},
	methods: {
		/**
		 * Vacia el carrito de esta pestaña. El pedido ya existe desde antes de ir a pagar y el
		 * pago lo registra el webhook, asi que no hay ningun request que hacer.
		 */
		limpiar_carrito_local() {
			this.$store.commit('cart/setCart', null)
			this.$store.commit('cart/set_buyer_id', null)
			this.$store.commit('cart/set_selected_buyer', null)
			this.$store.commit('cart/setPaymentMethod', null)
			localStorage.cart = null
		},
	},
}
