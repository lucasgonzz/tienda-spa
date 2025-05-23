<template> 
	<div
	class="m-t-15"
	v-if="is_cart_view && article.amount > 1">
		<hr
		class="m-t-0">
		<p
		class="text-left m-b-5">
			Las {{ article.amount }} unidades
		</p>
		<p 
		class="product-price">
			{{ price(article.pivot.price * article.amount) }}
		</p>
	</div>
</template>
<script>
export default {
	props: {
		article: Object,
	},
	computed: {
		is_cart_view() {
			return this.$route.name == 'Cart'
		},
	}
}
</script>
 