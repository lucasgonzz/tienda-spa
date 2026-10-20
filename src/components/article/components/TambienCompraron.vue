<template>
	<!--
		🔴 Sin datos no se dibuja NADA, ni el titulo ni el bloque. Es una seccion de prueba
		social: un titulo que dice "quienes compraron este producto tambien compraron" sobre un
		carrusel vacio es peor que no tenerla.

		El mismo componente dibuja las dos secciones (vistas y compras): lo unico que cambia es
		el titulo y la lista que le pasan.
	-->
	<section
	v-if="articulos.length"
	class="tambien-compraron">
		<p class="tambien-compraron__titulo">
			{{ titulo }}
		</p>

		<carousel
		class="tambien-compraron__carousel"
		:navigationEnabled="!is_mobile"
		navigationNextLabel="<i class='bi bi-chevron-right'></i>"
		navigationPrevLabel="<i class='bi bi-chevron-left'></i>"
		:paginationEnabled="false"
		:spacePadding="0"
		:perPage="2"
		:perPageCustom="[[0, 2], [768, 3], [992, 5]]">
			<slide
			v-for="(article, index) in articulos"
			:key="'tambien-'+article.id"
			:data-index="index">
				<div class="tambien-compraron__item">
					<article-card
					full_width
					:article="article"></article-card>
				</div>
			</slide>
		</carousel>
	</section>
</template>
<script>
import { Carousel, Slide } from 'vue-carousel'
export default {
	name: 'TambienCompraron',
	components: {
		Carousel,
		Slide,
		ArticleCard: () => import('@/components/common/article-card/Index'),
	},
	props: {
		/**
		 * El titulo de la seccion.
		 */
		titulo: {
			type: String,
			required: true,
		},
		/**
		 * Los articulos a mostrar. Array PLANO (no paginado): estas dos secciones no tienen
		 * scroll infinito. Vacio significa que la seccion entera no se dibuja.
		 */
		articulos: {
			type: Array,
			default() {
				return []
			},
		},
	},
}
</script>
<style lang="sass">
.tambien-compraron
	margin-top: 2rem
	text-align: left

	.tambien-compraron__titulo
		margin: 0 0 16px 0
		font-size: 24px
		font-weight: 600
		line-height: 1.3
		color: rgba(0, 0, 0, .9)
		@media screen and (max-width: 576px)
			font-size: 20px

	.tambien-compraron__item
		padding: 0 8px

	// La tarjeta ya viene con `width: 100%` por `full_width`; el margen de 50px de abajo que le
	// pone `.cont-models .model` aca no corresponde, el carrusel no lo necesita.
	.tambien-compraron__item .model
		margin: 0

	// La flecha redonda blanca con sombra sobre el borde, como en la captura.
	.tambien-compraron__carousel
		.VueCarousel-navigation-button
			width: 36px
			height: 36px
			border: none
			border-radius: 50%
			background: #FFF
			box-shadow: 0 1px 6px rgba(0, 0, 0, .25)
			color: rgba(0, 0, 0, .75)
			display: inline-flex
			align-items: center
			justify-content: center
			padding: 0

		.VueCarousel-navigation-next
			right: 8px !important

		.VueCarousel-navigation-prev
			left: 8px !important
</style>
