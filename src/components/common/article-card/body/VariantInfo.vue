<template> 
	<div 
	v-if="is_cart_view && article.selected_variant"
	class="amount">
		<p
		class="m-b-0"
		v-for="article_property_value in article.selected_variant.article_property_values">
			{{ article_property_value.article_property_type.name }}: {{ article_property_value.name }}
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