<template> 
	
	<div class="cont-images">
		
		<vue-load-image
		class="img-fluid">
			<img 
			slot="image"
			:src="articleImage(article)">
	        <b-spinner
			slot="preloader"
	        variant="success"></b-spinner>
			<div slot="error">Imagen no encontrada</div>
		</vue-load-image>
		
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
 