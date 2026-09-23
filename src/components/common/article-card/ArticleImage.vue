<template> 
	
	<div class="cont-images">
		<!--
			Link real a la ficha para los buscadores (mision seo-tiendas). @click.prevent sin
			handler: el click sigue subiendo a la tarjeta (article-card/Index.vue::set_article),
			que decide como siempre si navega segun la plantilla.
		-->
		<a
		class="seo-link seo-link--bloque"
		:href="href_articulo(article)"
		@click.prevent>
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
export default {
	name: 'ArticleCard',
	props: {
		article: Object,
	},
	components: {
		VueLoadImage,
	},
}
</script>
 