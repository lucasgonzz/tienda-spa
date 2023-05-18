<template>
	<div
	class="discounts"
	v-if="article_to_show.discounts.length">
		<b-badge
		variant="danger"
		v-for="discount in article_to_show.discounts"
		v-if="discount.show_in_online">
			{{ formatDecimals(discount.percentage) }}% de descuento
		</b-badge>
	</div>
</template>
<script>
export default {
	name: 'Discounts',
}
</script>
<style scoped lang="sass">
.discounts
	margin-bottom: 10px
	display: flex
	font-weight: bold
	font-size: 1.5em
	.badge 
		z-index: 1
</style>