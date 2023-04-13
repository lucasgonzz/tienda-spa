<template>
	<p 
	v-if="articlePriceEfectivo(article_to_show)"
	class="price">
		{{ articlePriceEfectivo(article_to_show) }}
	</p>
</template>
<script>
export default {
	name: 'Price',
}
</script>
<style scoped lang="sass">
.price
	font-size: 2em
	font-weight: 500
	text-align: left
</style>