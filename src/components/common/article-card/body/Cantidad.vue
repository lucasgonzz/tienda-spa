<template>
	<p 
	v-if="is_cart_view"
	class="amount">
		Cantidad: {{ article.amount }}
	</p>
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