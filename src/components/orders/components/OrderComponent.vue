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
		cantArticles() {
			if (this.order.articles) {
				let cant_articles = 0
				this.order.articles.forEach(article => {
					cant_articles += article.pivot.amount
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