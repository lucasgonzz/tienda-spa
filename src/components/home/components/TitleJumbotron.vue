<template>
<b-row
class="m-t-0 m-b-0 row-title-jumbotron">
	<b-col
	cols="12">
		<div
		class="al-borde">
			<div
			v-if="!loading">
				<carousel
				v-if="titles.length"
				centerMode
				autoplay
				navigationNextLabel="<i class='bi bi-chevron-right'></i>"
				navigationPrevLabel="<i class='bi bi-chevron-left'></i>"
				paginationPosition="bottom"
				:paginationActiveColor="variant_color"
				paginationColor="#A9A9A9"
				:paginationPadding="5"
				loop
				:autoplayTimeout="4000"
				:perPage="1">
					<slide
					:data-index="index"
					v-for="(title, index) in titles"
					:key="title.id">
						<component
						:is="banner_link(title) ? 'a' : 'div'"
						:href="banner_link(title) ? banner_link(title).href : null"
						:target="banner_link(title) && banner_link(title).external ? '_blank' : null"
						:rel="banner_link(title) && banner_link(title).external ? 'noopener noreferrer' : null"
						:aria-label="banner_link(title) ? banner_label(title) : null"
						@pointerdown="start_banner_gesture"
						@click="click_banner"
						@auxclick="click_banner"
						@dragstart.prevent
						class="title-image">
							<div
							v-if="title.header"
							class="title animate__animated animate__fadeIn">
								<p
								:style="getStyles(title)"
								class="header">
									{{ title.header }}
								</p>
								<p
								:style="getStyles(title)"
								class="lead">
									{{ title.lead }}
								</p>
							</div>
							<div
							:style="backgroundColor(title)"
							class="cont-image">
								<vue-load-image>
									<img
									slot="image"
									class="slide-img"
									alt=""
									:draggable="false"
									:src="ancho_pantalla < 700 ? title.crop_image_url : title.image_url">
									<b-spinner
									slot="preloader"
									variant="primary"></b-spinner>
									<div slot="error">Imagen no encontrada</div>
								</vue-load-image>
							</div>
						</component>
					</slide>
				</carousel>
			</div>
			<b-skeleton-img
			class="animate__animated animate__fadeIn"
			height="60vh"
			no-aspect
			v-else></b-skeleton-img>
		</div>
	</b-col>
</b-row>
</template>
<script>
import VueLoadImage from 'vue-load-image'
import { Carousel, Slide } from 'vue-carousel'
import { bannerLink } from '@/helpers/banner_link'
export default {
	components: {
		VueLoadImage,
		Carousel,
		Slide,
	},
	data() {
		return { banner_gesture: null, banner_moved: false, banner_last_click: null }
	},
	beforeDestroy() {
		this.clear_banner_gesture()
	},
	methods: {
		banner_link(title) {
			return bannerLink(title.link)
		},
		banner_label(title) {
			let label = title.header || title.lead || 'Ver más'
			return label + (this.banner_link(title).external ? ' (abre en una pestaña nueva)' : '')
		},
		clear_banner_gesture() {
			if (!this.banner_gesture) return
			let doc = this.banner_gesture.doc
			doc.removeEventListener('pointermove', this.move_banner_gesture, true)
			doc.removeEventListener('pointerup', this.end_banner_gesture, true)
			doc.removeEventListener('pointercancel', this.end_banner_gesture, true)
			this.banner_gesture = null
		},
		start_banner_gesture(event) {
			this.clear_banner_gesture()
			this.banner_moved = false
			let doc = event.currentTarget.ownerDocument
			this.banner_gesture = { x: event.clientX, y: event.clientY, id: event.pointerId, doc: doc }
			doc.addEventListener('pointermove', this.move_banner_gesture, true)
			doc.addEventListener('pointerup', this.end_banner_gesture, true)
			doc.addEventListener('pointercancel', this.end_banner_gesture, true)
		},
		move_banner_gesture(event) {
			let start = this.banner_gesture
			if (!start || start.id !== event.pointerId) return
			if (Math.abs(event.clientX - start.x) > 5 || Math.abs(event.clientY - start.y) > 5) this.banner_moved = true
		},
		end_banner_gesture(event) {
			if (!this.banner_gesture || this.banner_gesture.id !== event.pointerId) return
			this.move_banner_gesture(event)
			if (event.type === 'pointercancel') this.banner_moved = true
			this.clear_banner_gesture()
		},
		click_banner(event) {
			// Navegación nativa única, sin sumar router.push ni window.open.
			// detail=0 corresponde al teclado o tecnología de asistencia.
			if (event.detail !== 0 && (this.banner_moved || event.detail > 1 ||
				(this.banner_last_click !== null && event.timeStamp - this.banner_last_click < 500))) {
				event.preventDefault()
				return
			}
			this.banner_last_click = event.timeStamp
		},
		getStyles(title) {
			if (title.text_color) {
				return 'color: '+title.text_color
			}
			return 'color: rgba(255,255,255,.9)'
		},
		backgroundColor(title) {
			return 'background-color: '+title.color
		}
	},
	computed: {
		is_cropped() {
			return this.is_mobile
		},
		titles() {
			return this.$store.state.titles.titles
		},
		loading() {
			return this.$store.state.titles.loading
		},
	}
}
</script>
<style lang="sass">
.row-title-jumbotron
	a.title-image
		display: block
		color: inherit
		text-decoration: none
		// Las reglas globales .tarjetas-*-N a le ponen ancho en porcentaje a TODO <a>: el banner enlazado ocupa el ancho completo
		width: 100%
		max-width: 100%
		&:focus-visible
			outline: 3px solid #26262b
			outline-offset: -5px
			box-shadow: inset 0 0 0 7px #fff
	.slide-img
		width: 100vw


	.vue-load-image
		height: 100%
		.spinner-border
			margin: 27vh 0


	.VueCarousel
		.VueCarousel-navigation-button
			border: 1px solid #333
			border-radius: 50%
			font-size: 30px
			width: 50px
			height: 50px
			display: flex
			justify-content: center
			align-items: center
		.VueCarousel-navigation-next
			right: 70px
		.VueCarousel-navigation-prev
			left: 70px
		.VueCarousel-slide
			width: 100%
</style>
