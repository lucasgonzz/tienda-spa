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
				class="apretable shadow-1"
				:src="image.hosting_url"
				@click="setImage(index)">
			</div>
			<carousel
			loop
			:navigationEnabled="!is_mobile"
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
						class="shadow-1"
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
	box-sizing: border-box
	display: flex
	flex-direction: row 
	.images-preview
		padding: 30px 0
		img 
			width: 100px
			margin: 15px 
			border-radius: 7px
			cursor: pointer
			&:first-child
				margin: 0 15px
	.VueCarousel
		width: 100%
		// height: 50vh
		// border: 4px solid green

	.VueCarousel-navigation-button
		border: none
	.VueCarousel-navigation-next
		right: 7%
	.VueCarousel-navigation-prev
		left: 7%
	.VueCarousel-wrapper, .VueCarousel-inner
		width: 100%
		// height: 50vh !important
	.VueCarousel-wrapper
		// border: 4px solid red
	.VueCarousel-inner
		// border: 4px solid yellow
	.VueCarousel-slide 
		width: 100%
		max-height: 50vh
		@media screen and (min-width: 992px)
			max-height: 70vh
		// border: 4px solid blue
		@media screen and (max-width: 992px)
			padding: 15px	
		@media screen and (min-width: 992px)
			padding: 30px	
		img
			max-height: 50vh
			@media screen and (min-width: 992px)
				max-height: 70vh
			border-radius: 7px	
			max-width: 100%
			// border: 4px solid black
			width: auto 

</style>