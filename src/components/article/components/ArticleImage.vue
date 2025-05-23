<template>
	<b-skeleton-wrapper :loading="loading">
		<template v-slot:loading>
			<div class="m-t-20">
				<b-skeleton-img 
				:height="height"></b-skeleton-img>
			</div>
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
				:class="selectedImage(index)"
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
			@page-change="handleSlideClick"
			:navigateTo="index"
			:adjustableHeight="true">
				<!-- <img
				:src="commerce.image_url" 
				v-if="commerce.online_configuration.show_article_image"
				class="imagen-logo-empresa"></img> -->
				<slide
				:data-index="index"
				v-for="(image, index) in images"
				:key="image.id">
					<!-- <div
					style="width:400px">
						{{image.hosting_url}}
						<zoom-on-hover 
						:img-normal="image.hosting_url"
						:img-zoom="image.hosting_url"
						:scale="1.5"></zoom-on-hover>
					</div> -->
					<vue-load-image>
						<img
						class="img-carrousel"
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
import ZoomOnHover from 'vue-zoom-on-hover'
import { Carousel, Slide } from 'vue-carousel'
export default {
	name: 'ArticleImage',
	components: {
		VueLoadImage,
		ZoomOnHover,
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
			// if (this.article.colors.length) {
			// 	console.log('imagenes del color')
			// 	let images = this.article.images.filter(image => {
			// 		return image.color_id && image.color_id == this.color.id 
			// 	})
			// 	return images
			// }
			if (this.article.images.length) {
				return this.article.images
			} else if (this.commerce.online_configuration.default_article_image_url) {
				return [
					{
						hosting_url: this.commerce.online_configuration.default_article_image_url	
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
		},
		index() {
			return this.$store.state.articles.image_index
		},
	},
	data() {
		return {
			interval: 1000,
		}
	},
	methods: {
		handleSlideClick(index) {
			this.$store.commit('articles/setImageIndex', Number(index))
		},
		selectedImage(index) {
			return this.index == index ? 'selected-image' : '-'
		},
		setInterval() {
			setTimeout(() => {
				this.interval = 0
			}, 1100)
		},
		imageSrc(image) {
			return this.image(image, false, true)
		},
		setImage(index) {
			this.$store.commit('articles/setImageIndex', index)
		},
	},
	created(){
		this.setInterval()
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.cont-article-image
	box-sizing: border-box
	display: flex
	flex-direction: row 
	background: #FFF
	margin: 20px 0
	border-radius: 10px
	border: 2px solid #DDDDDD
	position: relative

	.imagen-logo-empresa
		position: absolute
		bottom: 5px
		// left: 35%
		// width: 30%
		left: 50%
		transform: translateX(-50%)
		// width: 200px
		height: auto 
		z-index: 1000
		@media screen and (max-width: 992px)
			width: 120px
		@media screen and (min-width: 992px)
			width: 200px


	.images-preview
		// padding: 30px 0
		width: 150px
		overflow-y: auto
		@media screen and (max-width: 992px)
			max-height: 50vh
		@media screen and (min-width: 992px)
			max-height: 70vh 


		scrollbar-width: thin
		scrollbar-color: $green #ffffff


		&::-webkit-scrollbar 
			@media screen and (max-width: 992px)
				width: 6px
			@media screen and (min-width: 992px)
				width: 8px
			height: 12px

		&::-webkit-scrollbar-track 
			background: rgba(0,0,0,0)

		&::-webkit-scrollbar-thumb 
			background-color: lighten($green, 20)
			border-radius: 10px
			border: 2px solid #ffffff

		img 
			width: 80%
			margin: 15px 0 
			border-radius: 7px
			cursor: pointer
		.selected-image
			border: 2px solid #333
			transition: all .2s

	.VueCarousel
		padding: 30px 0
		@media screen and (max-width: 992px)
			width: 100%
			padding: 15px	
			// height: 50vh
		@media screen and (min-width: 992px)
			width: calc(100% - 150px)
			// height: 70vh
	.VueCarousel-navigation-button
		border: none
	.VueCarousel-navigation-next
		right: 7% !important
	.VueCarousel-navigation-prev
		left: 7% !important
	.VueCarousel-wrapper, .VueCarousel-inner
		width: 100%
		// height: 100% !important
	.VueCarousel-slide 
		width: 100% 
		.img-carrousel
			max-width: 100%
			border-radius: 7px	
			@media screen and (max-width: 992px)
				max-height: 50vh
			@media screen and (min-width: 992px)
				max-height: 70vh 

#add-to-cart-modal
	@media screen and (max-width: 800px)
		.cont-article-image
			margin: 0
			.VueCarousel
				margin: auto
				width: 50%
				.VueCarousel-inner
					height: auto
					.VueCarousel-slide
						width: 50%
						.img-carrousel
							height: auto


</style>