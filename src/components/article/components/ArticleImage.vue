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
				:key="image.id ? 'preview-'+image.id : 'preview-index-'+index"
				class="apretable shadow-1"
				:class="selectedImage(index)"
				:src="image.hosting_url"
				@click="setImage(index)">
			</div>
			<carousel
			loop
			:navigationEnabled="!is_mobile"
			navigationNextLabel="<i class='bi bi-chevron-right'></i>"
			navigationPrevLabel="<i class='bi bi-chevron-left'></i>"
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
					<!-- En móvil: contenedor con gestos de pellizco y arrastre para ampliar la imagen -->
					<div
					v-if="is_mobile"
					class="pinch-zoom-wrap"
					:style="pinch_zoom_wrap_style"
					@touchstart="on_pinch_touch_start"
					@touchmove="on_pinch_touch_move"
					@touchend="on_pinch_touch_end"
					@touchcancel="on_pinch_touch_end">
						<vue-load-image>
							<img
							class="img-carrousel pinch-zoom-img"
							slot="image"
							:style="pinch_zoom_style"
							:src="image.hosting_url"
							:alt="article.name">
					        <b-spinner
							slot="preloader"
					        variant="success"></b-spinner>
							<div slot="error">Imagen no encontrada</div>
						</vue-load-image>
					</div>
					<vue-load-image
					v-else>
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
		/**
		 * Estilo del contenedor según si hay zoom activo (bloquea swipe del carrusel al ampliar).
		 *
		 * @returns {Object}
		 */
		pinch_zoom_wrap_style() {
			if (this.pinch_zoom_scale > 1 || this.pinch_touch_is_pinching) {
				return {
					touchAction: 'none',
				}
			}
			return {}
		},
		/**
		 * Transformación CSS aplicada a la imagen en móvil (escala y desplazamiento).
		 *
		 * @returns {Object}
		 */
		pinch_zoom_style() {
			return {
				transform: 'translate(' + this.pinch_zoom_translate_x + 'px, ' + this.pinch_zoom_translate_y + 'px) scale(' + this.pinch_zoom_scale + ')',
				transformOrigin: 'center center',
				transition: this.pinch_touch_is_pinching || this.pinch_touch_is_panning ? 'none' : 'transform 0.2s ease',
			}
		},
	},
	data() {
		return {
			interval: 1000,
			pinch_zoom_scale: 1,
			pinch_zoom_translate_x: 0,
			pinch_zoom_translate_y: 0,
			pinch_zoom_min: 1,
			pinch_zoom_max: 4,
			pinch_touch_start_distance: 0,
			pinch_touch_start_scale: 1,
			pinch_touch_last_distance: 0,
			pinch_touch_is_pinching: false,
			pinch_touch_is_panning: false,
			pinch_touch_start_x: 0,
			pinch_touch_start_y: 0,
			pinch_touch_last_translate_x: 0,
			pinch_touch_last_translate_y: 0,
		}
	},
	watch: {
		index() {
			this.reset_pinch_zoom()
		},
		article() {
			this.reset_pinch_zoom()
		},
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
		/**
		 * Distancia entre dos dedos en pantalla (para gesto de pellizco).
		 *
		 * @param {TouchList} touches
		 * @returns {number}
		 */
		get_touch_distance(touches) {
			let delta_x = touches[0].clientX - touches[1].clientX
			let delta_y = touches[0].clientY - touches[1].clientY
			return Math.sqrt(delta_x * delta_x + delta_y * delta_y)
		},
		/**
		 * Inicia pellizco (2 dedos) o arrastre (1 dedo con zoom activo).
		 *
		 * @param {TouchEvent} event
		 * @returns {void}
		 */
		on_pinch_touch_start(event) {
			if (!this.is_mobile) {
				return
			}
			if (event.touches.length === 2) {
				this.pinch_touch_is_pinching = true
				this.pinch_touch_start_distance = this.get_touch_distance(event.touches)
				this.pinch_touch_start_scale = this.pinch_zoom_scale
				this.pinch_touch_last_distance = this.pinch_touch_start_distance
				return
			}
			if (event.touches.length === 1 && this.pinch_zoom_scale > 1) {
				this.pinch_touch_is_panning = true
				this.pinch_touch_start_x = event.touches[0].clientX
				this.pinch_touch_start_y = event.touches[0].clientY
				this.pinch_touch_last_translate_x = this.pinch_zoom_translate_x
				this.pinch_touch_last_translate_y = this.pinch_zoom_translate_y
			}
		},
		/**
		 * Actualiza escala o posición según el gesto táctil en curso.
		 *
		 * @param {TouchEvent} event
		 * @returns {void}
		 */
		on_pinch_touch_move(event) {
			if (!this.is_mobile) {
				return
			}
			if (this.pinch_touch_is_pinching && event.touches.length === 2) {
				event.preventDefault()
				let distance = this.get_touch_distance(event.touches)
				if (!this.pinch_touch_start_distance) {
					return
				}
				let scale_ratio = distance / this.pinch_touch_start_distance
				let new_scale = this.pinch_touch_start_scale * scale_ratio
				if (new_scale < this.pinch_zoom_min) {
					new_scale = this.pinch_zoom_min
				}
				if (new_scale > this.pinch_zoom_max) {
					new_scale = this.pinch_zoom_max
				}
				this.pinch_zoom_scale = new_scale
				this.pinch_touch_last_distance = distance
				if (this.pinch_zoom_scale <= 1) {
					this.pinch_zoom_translate_x = 0
					this.pinch_zoom_translate_y = 0
				}
				return
			}
			if (this.pinch_touch_is_panning && event.touches.length === 1 && this.pinch_zoom_scale > 1) {
				event.preventDefault()
				let delta_x = event.touches[0].clientX - this.pinch_touch_start_x
				let delta_y = event.touches[0].clientY - this.pinch_touch_start_y
				this.pinch_zoom_translate_x = this.pinch_touch_last_translate_x + delta_x
				this.pinch_zoom_translate_y = this.pinch_touch_last_translate_y + delta_y
			}
		},
		/**
		 * Finaliza gestos táctiles y restablece zoom si quedó casi al tamaño original.
		 *
		 * @param {TouchEvent} event
		 * @returns {void}
		 */
		on_pinch_touch_end(event) {
			if (!this.is_mobile) {
				return
			}
			if (event.touches.length < 2) {
				this.pinch_touch_is_pinching = false
				this.pinch_touch_start_distance = 0
			}
			if (event.touches.length === 0) {
				this.pinch_touch_is_panning = false
				if (this.pinch_zoom_scale <= 1.05) {
					this.reset_pinch_zoom()
				}
			}
		},
		/**
		 * Restablece zoom y desplazamiento al cambiar de imagen o artículo.
		 *
		 * @returns {void}
		 */
		reset_pinch_zoom() {
			this.pinch_zoom_scale = 1
			this.pinch_zoom_translate_x = 0
			this.pinch_zoom_translate_y = 0
			this.pinch_touch_start_distance = 0
			this.pinch_touch_start_scale = 1
			this.pinch_touch_last_distance = 0
			this.pinch_touch_is_pinching = false
			this.pinch_touch_is_panning = false
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
			background-color: color-mix(in srgb, $green 80%, white 20%)
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
		.pinch-zoom-wrap
			width: 100%
			display: flex
			justify-content: center
			align-items: center
			overflow: hidden
		.pinch-zoom-img
			will-change: transform
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