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
					<!-- En escritorio: lente interna. El wrapper es inline-block a proposito, asi mide
					exactamente lo que mide la imagen (que tiene max-width 100% y max-height 70vh, o
					sea que casi nunca ocupa todo el slide) y la lente, que va absoluta sobre el, cae
					clavada sobre la foto y no sobre el espacio vacio del slide. -->
					<div
					v-else
					class="cc-zoom"
					@mouseenter="on_zoom_enter(index)"
					@mousemove="on_zoom_move($event, index)"
					@mouseleave="on_zoom_leave">
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
						<div
						class="cc-zoom__lens"
						v-if="zoom_is_active(index)"
						:style="zoom_lens_style(image)"></div>
					</div>
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
			/* Zoom con mouse (solo escritorio): indice del slide donde esta el cursor, o null si no hay ninguno. */
			zoom_index: null,
			/* Posicion del cursor dentro de la imagen, en porcentaje, para mapearla a background-position. */
			zoom_x: 50,
			zoom_y: 50,
			/* Cuanto se amplia la foto dentro del marco. 2.5 = 250%. */
			zoom_scale: 2.5,
		}
	},
	watch: {
		index() {
			this.reset_pinch_zoom()
			/* Sin esto, al cambiar de foto con las flechas la lente sigue mostrando la anterior
			   hasta que llegue el proximo mousemove. */
			this.on_zoom_leave()
		},
		article() {
			this.reset_pinch_zoom()
			this.on_zoom_leave()
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
		/**
		 * Indica si hay que dibujar la lente sobre este slide. En móvil nunca: ahí el zoom se hace
		 * con el pinch de dos dedos que ya existe, y el nodo de la lente ni siquiera se renderiza.
		 *
		 * @param {number} index Índice del slide.
		 * @returns {boolean}
		 */
		zoom_is_active(index) {
			return !this.is_mobile && this.zoom_index === index
		},
		/**
		 * Estilo de la lente: la misma foto, ampliada, posicionada según dónde está el cursor.
		 *
		 * La posición va en PORCENTAJE y no en píxeles a propósito. Con un background-size mayor
		 * que el contenedor, el porcentaje de CSS ya hace el mapeo proporcional correcto (0%
		 * alinea los bordes izquierdos, 100% los derechos). Calcularlo a mano en píxeles obligaría
		 * a conocer el tamaño natural de la imagen, que acá no se sabe hasta que termina de
		 * cargar. Lo demás (repeat, fondo, radio) vive en el <style>, no acá.
		 *
		 * @param {Object} image Imagen del slide.
		 * @returns {Object}
		 */
		zoom_lens_style(image) {
			return {
				backgroundImage: 'url(' + image.hosting_url + ')',
				backgroundSize: (this.zoom_scale * 100) + '%',
				backgroundPosition: this.zoom_x + '% ' + this.zoom_y + '%',
			}
		},
		/**
		 * Enciende la lente al entrar el mouse en la foto.
		 *
		 * @param {number} index Índice del slide.
		 * @returns {void}
		 */
		on_zoom_enter(index) {
			if (this.is_mobile) {
				return
			}
			this.zoom_index = index
		},
		/**
		 * Mapea la posición del cursor dentro de la foto a la posición del fondo de la lente.
		 *
		 * @param {MouseEvent} event Evento de movimiento del mouse.
		 * @param {number} index Índice del slide.
		 * @returns {void}
		 */
		on_zoom_move(event, index) {
			if (this.is_mobile) {
				return
			}
			let rect = event.currentTarget.getBoundingClientRect()
			/* Si el wrapper todavía no tiene tamaño (imagen sin cargar), no hay nada que mapear. */
			if (!rect.width || !rect.height) {
				return
			}
			let x = ((event.clientX - rect.left) / rect.width) * 100
			let y = ((event.clientY - rect.top) / rect.height) * 100
			/* Acotado a 0-100: con background-position en %, 0 alinea el borde izquierdo de la
			   imagen ampliada con el del marco y 100 el derecho, así que fuera de ese rango se
			   vería franja vacía. */
			this.zoom_x = Math.min(100, Math.max(0, x))
			this.zoom_y = Math.min(100, Math.max(0, y))
			this.zoom_index = index
		},
		/**
		 * Apaga la lente y devuelve la posición al centro, para que el próximo hover no arranque
		 * con la posición vieja durante un frame.
		 *
		 * @returns {void}
		 */
		on_zoom_leave() {
			this.zoom_index = null
			this.zoom_x = 50
			this.zoom_y = 50
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
		// Lente de zoom con mouse (escritorio). Ojo: este bloque NO cuelga de
		// .plantilla-comerciocity, a diferencia de todo el resto del grupo 346. Es a proposito: el
		// zoom es usabilidad, no estetica. En reposo la pantalla se ve igual que siempre en
		// cualquier plantilla y el efecto solo existe mientras el mouse esta encima, asi que
		// dejarlo afuera de Moderno y Clasico seria negarles una funcion util sin ninguna razon.
		.cc-zoom
			position: relative
			// inline-block para que el wrapper mida lo mismo que la imagen, y line-height 0 porque
			// la imagen es inline: sin eso queda el espacio bajo la linea base, el wrapper sale
			// mas alto que la foto y la lente sobresale por abajo.
			display: inline-block
			line-height: 0
			max-width: 100%
			cursor: zoom-in
		.cc-zoom__lens
			position: absolute
			top: 0
			left: 0
			right: 0
			bottom: 0
			background-repeat: no-repeat
			background-color: #FFF
			// El mismo radio que .img-carrousel, para no mostrar esquinas cuadradas sobre una
			// imagen redondeada.
			border-radius: 7px
			// Sin esto la lente se interpone entre el cursor y el wrapper, el mousemove deja de
			// llegar y el zoom queda congelado en el primer punto.
			pointer-events: none
			z-index: 2
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