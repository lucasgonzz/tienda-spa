<template>
	<p 
	v-if="is_order_details"
	class="amount">
		Cantidad: {{ article.pivot.amount }}
	</p>
</template>
<script>
export default {
	props: {
		article: Object,
	},
	computed: {
		is_order_details() {
			return this.$route.name == 'Orders'
		},
	}
}
</script>