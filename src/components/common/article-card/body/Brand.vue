<template>
	<p 
	v-if="article.brand"
	class="product-brand">
		{{ article.brand.name }}
	</p>
</template>
<script>
export default {
	props: {
		article: Object,
	},
}
</script>