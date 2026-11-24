<template> 
	
	<div class="cont-images">

		<a
		class="seo-link seo-link--bloque"
		:href="href_articulo(article)"
		@click.prevent.stop="toArticle(article)">
			<vue-load-image
			class="img-fluid">
				<img 
				slot="image"
				:src="articleImage(article)"
				:alt="article.name">
		        <b-spinner
				slot="preloader"
		        variant="success"></b-spinner>
				<div slot="error">Imagen no encontrada</div>
			</vue-load-image>
		</a>
	</div>
	
</template>
<script>
import VueLoadImage from 'vue-load-image'
import articles from '@/mixins/articles'
export default {
	name: 'ArticleCard',
	mixins: [articles],
	props: {
		article: Object,
	},
	components: {
		VueLoadImage,
	},
}
</script>
 