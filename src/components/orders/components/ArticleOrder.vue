<template>
	<b-card
	@click="toArticle(article)"
	class="apretable c-p article-order">
		<div class="card-body">
			<div class="img-container">
				<img :src="articleImageUrl(article, user)" alt="imagen-producto">
			</div>
			<div class="product-data-container">
				<p class="product-name">{{ article.name }}</p>
				<p class="product-name">Cantidad: {{ amount(article.pivot.amount) }}</p>
				<p class="product-price">
					{{ price(article.pivot.price) }}
				</p>
				<p 
				v-show="article.pivot.amount > 1"
				class="product-total">
					Total: {{ price(article.pivot.price * article.pivot.amount) }}
				</p>
			</div>
		</div>
	</b-card>
</template>
<script>
import OrdersMixin from '@/mixins/orders'
import articlesMixin from '@/mixins/articles'
export default {
	name: 'ArticleOrder',
	props: ['article'],
	mixins: [OrdersMixin, articlesMixin],
	computed: {
		user() {
			return this.$store.state.auth.user
		}
	},
	methods: {
	}
}
</script>
<style scoped lang="sass">
.article-order
	// .card 
	// 	border: none
	// 	margin-bottom: 1em
	.card-body
		background: #FFF
		padding: 0
		display: flex
		flex-wrap: wrap
		border-radius: .2em
		.img-container
			width: 35%
			min-height: 50px
		.product-data-container
			width: 65%
			display: flex
			flex-direction: column
			justify-content: space-around
			padding: 1em
			@media screen and (max-width: 576px)
				padding: 1em
		.product-name, .product-price
			font-size: 1em
		.product-total
			font-size: 1em
			font-weight: 500
		p 
			text-align: left
			margin-bottom: 0
		img 
			width: 100%	
</style>