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

</style>