<template>
	<div
	v-if="article.ranges">
		<div
		class="price-range"
		v-for="range in article.ranges"
		v-if="mostrar_precio(range)">
			<span
			class="price">
				{{ price(range.price) }} 
			</span>
			<span
			class="p-l-10"
			v-if="range.min && range.min > 1">
				desde {{ range.min }} unid.
			</span>
		</div>
	</div>
</template>
<script>
export default {
	props: {
		article: Object,
		is_from_article_page: {
			type: Boolean, 
			default: false
		}
	},
	methods: {
		mostrar_precio(range) {
			return range.min
		}
	}
}
</script>
<style lang="sass">

.price-range
	display: flex  
	flex-direction: row  
	align-items: center
	justify-content: flex-start
	.price
		font-size: 1.5em
		font-weight: bold

.article-card-add-to-cart
	
	.price
		font-size: 1em
</style>