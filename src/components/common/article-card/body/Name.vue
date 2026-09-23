<template>
	<p 
	translate="no"
	class="product-name">
		<!-- Link real a la ficha (mision seo-tiendas); el click sube a la tarjeta como antes. -->
		<a
		class="seo-link"
		:href="href_articulo(article)"
		@click.prevent>{{ article_name }}</a>
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