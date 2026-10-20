<template>
	<b-card
	class="card-compra shadow-1 b-r"
	no-body>
		<div class="card-compra-body">
			<p>
				N° {{ order.num }}
			</p>
			<p>
				{{ order.order_status.name }}
			</p>
			<p>{{ cantArticles }}</p>

			<!-- Envío por correo (Zipnova): estado del envío y seguimiento -->
			<div
			v-if="order.envio || order.envio_opcion"
			class="order-envio">
				<p class="order-envio__estado">
					<i class="bi bi-truck"></i>
					{{ texto_envio }}
				</p>
				<a
				v-if="order.envio && order.envio.tracking_url"
				:href="order.envio.tracking_url"
				target="_blank"
				rel="noopener noreferrer"
				class="order-envio__link"
				@click.stop>
					Seguir el envío
					<i class="bi bi-box-arrow-up-right"></i>
				</a>
			</div>

			<p
			class="total-order">Total: {{ price(total(order)) }}</p>
			<p class="since">
				{{  since(order.updated_at) }}
			</p>
		</div>
	</b-card>
</template>
<script>
import OrdersMixin from '@/mixins/orders'
export default {
	props: ['order'],
	mixins: [OrdersMixin],
	computed: {
		/*
			🔴 El `Number()` es el mismo arreglo que el de `cant_cart_items()` en mixins/cart.js, y
			esta roto por el mismo motivo: `pivot.amount` llega como STRING desde la API, asi que
			`0 + "1"` da `"01"` y cada vuelta concatena en vez de sumar. Un pedido de tres renglones
			de 1, 2 y 3 unidades mostraba "0123 productos" en vez de "6 productos".

			⚠️ Se veia menos que el del carrito porque el `== 1` de abajo es comparacion floja:
			`"1" == 1` da true, asi que el caso de un solo renglon de una unidad salia bien y
			tapaba el defecto.

			El `|| 0` cubre el renglon sin `amount`: `Number(undefined)` da NaN y contagiaria el
			total a "NaN productos".
		*/
		/**
		 * "Andreani · En camino" si el ERP ya generó el envío en Zipnova; si todavía no, el correo
		 * elegido y "en preparación". El estado es el `status_name` que manda Zipnova, sin traducir.
		 *
		 * @returns {string}
		 */
		texto_envio() {
			let envio = this.order.envio
			if (envio) {
				let correo = envio.carrier_name ? envio.carrier_name : 'Envío por correo'
				if (envio.status == 'error') {
					return correo + ' · el negocio está gestionando el envío'
				}
				return correo + (envio.status_name ? ' · ' + envio.status_name : '')
			}
			let opcion = this.order.envio_opcion
			if (opcion) {
				return (opcion.carrier_name ? opcion.carrier_name : 'Envío por correo') + ' · en preparación'
			}
			return ''
		},
		cantArticles() {
			if (this.order.articles) {
				let cant_articles = 0
				this.order.articles.forEach(article => {
					cant_articles += Number(article.pivot.amount) || 0
				})
				if (cant_articles == 1) {
					return '1 producto'
				}
				return cant_articles+ ' productos'
			}
			return null
		},
	}
}
</script>
<style scoped lang="sass">
.card-compra 
	cursor: pointer
	margin-bottom: 1em
	.card-compra-body
		padding: 1em
		display: flex
		flex-direction: column
		align-items: flex-start
		background: #FFF
		border-radius: 5px
		p 
			margin-bottom: 1em
			&:last-child
				margin-bottom: 0
		.total-order 
			font-weight: bold
			margin-bottom: 0
		.since 
			width: 100%
			color: rgba(0,0,0,.7)
			text-align: right
		.order-envio
			width: 100%
			margin-bottom: 1em
			padding: .6em .8em
			border-radius: 8px
			background: rgba(0,0,0,.04)
			text-align: left
			p
				margin-bottom: 0
		.order-envio__estado
			font-size: .92em
			i
				margin-right: .35em
				color: var(--secondary-color, #0d6efd)
		.order-envio__link
			display: inline-block
			margin-top: .35em
			font-size: .9em
			font-weight: 600
			color: var(--secondary-color, #0d6efd)
			text-decoration: underline
			i
				font-size: .85em
				margin-left: .2em

</style>