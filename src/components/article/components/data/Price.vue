<template>
	<div
	v-if="commerce.online_configuration.online_price_type && article_to_show && articlePriceEfectivo(article_to_show)">
		<price-ranges
		is_from_article_page
		:article="article_to_show"></price-ranges>
		
		<p 
		v-if="!article_to_show.ranges"
		class="price">
			{{ articlePriceEfectivo(article_to_show) }}
		</p>
	</div>
</template>
<script>
export default {
	name: 'Price',
	components: {
		PriceRanges: () => import('@/components/article/components/data/PriceRanges'),
	},
	computed: {
		article_to_show() {
			return this.$store.state.articles.article_to_show
		}
	},
}
</script>
<style scoped lang="sass">
.price
	font-size: 2em
	font-weight: 500
	text-align: left
</style>	