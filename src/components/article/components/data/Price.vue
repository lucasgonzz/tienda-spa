<template>
	<p 
	v-if="commerce.online_configuration.online_price_type && article_to_show && articlePriceEfectivo(article_to_show)"
	class="price">
		{{ articlePriceEfectivo(article_to_show) }}
	</p>
</template>
<script>
export default {
	name: 'Price',
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