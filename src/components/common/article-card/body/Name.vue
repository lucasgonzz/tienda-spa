<template>
	<p 
	translate="no"
	class="product-name">
		{{ article_name }}
	</p>
</template>
<script>
export default {
	props: {
		article: Object,
	},
	computed: {
		article_name() {
			if (this.article.variant) {
				return this.article.name + ' ' + this.article.variant.description
			} else {
				return this.article.name
			}
		},
	}
}
</script>