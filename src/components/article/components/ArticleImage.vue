<template>
	<b-skeleton-wrapper :loading="loading">
		<template v-slot:loading>
			<b-skeleton-img :height="height"></b-skeleton-img>
		</template>
		<div
		class="al-borde cont-article-image"
		v-if="article">
			<div
			v-if="!is_mobile"
			class="images-preview">
				<img 
				v-for="(image, index) in images"
				class="apretable"
				:src="image.hosting_url"
				@click="setImage(index)">
			</div>
			<carousel
			loop
			navigationNextLabel="<i class='icon-right'></i>"
			navigationPrevLabel="<i class='icon-left'></i>"
			:spacePadding="space_padding"
			:paginationPadding="5"
			:paginationActiveColor="variant_color"
			:perPage="1"
			:navigateTo="index"
			:adjustableHeight="true">
				<slide
				:data-index="index"
				v-for="(image, index) in images"
				:key="image.id">
					<vue-load-image>
						<img
						slot="image"
						:src="image.hosting_url" 
						:alt="article.name">
				        <b-spinner
						slot="preloader"
				        variant="success"></b-spinner>
						<div slot="error">Imagen no encontrada</div>
					</vue-load-image>
				</slide>
			</carousel>
		</div>
	</b-skeleton-wrapper>
	
</template>
<script>
import VueLoadImage from 'vue-load-image'
import { Carousel, Slide } from 'vue-carousel'
// import VueScreenSize from 'vue-screen-size'
export default {
	name: 'ArticleImage',
	// mixins: [VueScreenSize.VueScreenSizeMixin],
	components: {
		VueLoadImage,
	    Carousel,
	    Slide
	},
	computed: {
		space_padding() {
			// if (this.is_mobile) {
			// 	return 15
			// } 
			return 0
		},
		article() {
			return this.$store.state.articles.article_to_show
		},
		color() {
			return this.$store.state.articles.color
		},
		images() {
			if (this.article.colors.length) {
				console.log('imagenes del color')
				let images = this.article.images.filter(image => {
					return image.color_id && image.color_id == this.color.id 
				})
				return images
			}
			if (this.article.images.length) {
				return this.article.images
			} else if (this.commerce.default_article_image_url) {
				return [
					{
						hosting_url: this.commerce.default_article_image_url	
					}
				]
			}
		},
		loading() {
			return this.$store.state.articles.loading_article_to_show
		},
		variantSrc() {
			if (this.is_mobile) {
				return this.imageCropedUrlFromVariant(this.article)
			}
			return this.imageUrlFromVariant(this.article)
		},
		height() {
			if (this.is_mobile) {
				return '300px'
			}
			return '500px'
		}
	},
	data() {
		return {
			interval: 1000,
			index: 0,
		}
	},
	methods: {
		setInterval() {
			setTimeout(() => {
				this.interval = 0
			}, 1100)
		},
		imageSrc(image) {
			return this.image(image, false, true)
		},
		setImage(index) {
			this.index = index 
		},
	},
	created(){
		this.setInterval()
	}
}
</script>
<style lang="sass">
.cont-article-image
	display: flex
	flex-direction: row 
	.images-preview
		img 
			width: 100px
			margin: 15px 
			border-radius: 10px
			cursor: pointer
	.VueCarousel-slide 
		padding: 50px
		img, .vue-load-image
			max-width: 100%
			max-height: calc(100vh - 250px)
			border-radius: 10px
			padding: 0 5px
			// @media screen and (min-width: 992px)
			// 	width: 600px	
		

</style>