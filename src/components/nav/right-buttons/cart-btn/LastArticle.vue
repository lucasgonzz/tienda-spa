<template>
	<div 
	class="last-article">
		<div 
		class="data">
			<img 
			:src="articleImage(article)">
			<div>
				<p>
					{{ article.name }}
				</p>
				<p>
					{{ article.pivot.amount }} x {{ price(article.final_price) }}
				</p>
				<div
				v-if="show_added_info">
					<p>
						<strong>
							¡Agregado al carrito con exito!
						</strong>
					</p>
					<p>
						<strong>
							Total 
						</strong>
						({{ cart.articles.length }} productos): {{ price(total) }}
					</p>
				</div>
			</div>	
		</div>
		<hr>
		<b-button
		v-if="show_added_info"
		@click="_toCart"
		block
		variant="primary">
			VER CARRITO
		</b-button>
	</div>
</template>
<script>
import cart from '@/mixins/cart'
import nav from '@/mixins/nav'
export default {
	mixins: [nav, cart],
	props: {
		article: Object,
		show_added_info: {
			type: Boolean, 
			default: true,
		}
	},
	methods: {
		_toCart() {
			document.getElementById('added-article-info').classList.remove('added-article-info-active')
			this.toCart()
		}
	}
}
</script>
<style lang="sass">
.last-article
	.data
		display: flex 
		flex-direction: row 
		img 
			width: 50px
			height: 50px
			margin-right: 15px
		p 
			text-align: left
			font-size: 15px
			margin-bottom: 7px
			&:last-child
				margin-bottom: 0
</style>