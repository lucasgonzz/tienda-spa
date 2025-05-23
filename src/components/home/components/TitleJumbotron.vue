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
				navigationNextLabel="<i class='icon-right'></i>"
				navigationPrevLabel="<i class='icon-left'></i>"
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
						<div
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
									:src="ancho_pantalla < 400 ? title.crop_image_url : title.image_url">
							        <b-spinner
									slot="preloader"
							        variant="link"></b-spinner>
									<div slot="error">Imagen no encontrada</div>
								</vue-load-image>
							</div>
						</div>
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
export default {
	components: {
		VueLoadImage,
	    Carousel,
	    Slide,
	},
	methods: {
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
	.title-image
		display: flex
		flex-direction: row
		align-items: center
		position: relative
		
		@media screen and (max-width: 300px)
			height: 50vh 
		@media screen and (min-width: 301px) and (max-width: 400px)
			height: 65vh 
		@media screen and (min-width: 401px) and (max-width: 1206px)
			height: 50vh 
		@media screen and (min-width: 1206px)
			height: 55vh 
		
		.title
			text-align: center
			position: absolute
			width: 100% 
			.header
				font-size: 15px
			.lead 
				font-size: 50px
				font-weight: 600 
		.cont-image 
			overflow-x: hidden
			width: 100vw
			height: 100%
			display: flex 
			justify-content: center
			align-items: center
			.vue-load-image
				height: 100%
				img 
					padding: 0
					height: 100%
					min-width: 100%
					// @media screen and (max-width: 992px)
					// 	max-width: 100%
					// @media screen and (min-width: 992px)
					// 	min-width: 100%
				.spinner-border 
					margin: 27vh 0
</style>