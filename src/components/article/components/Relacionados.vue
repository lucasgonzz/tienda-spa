<template>
	<!--
		Los productos relacionados van ADENTRO de la tarjeta blanca del articulo, separados por
		una linea arriba. Sin datos no se dibuja nada, ni el titulo.
	-->
	<div
	v-if="relacionados.length"
	class="relacionados">
		<p class="relacionados__titulo">
			Productos relacionados
		</p>

		<div class="relacionados__grilla">
			<article-card
			v-for="article in relacionados"
			:key="'relacionado-'+article.id"
			full_width
			:article="article"></article-card>
		</div>
	</div>
</template>
<script>
export default {
	name: 'Relacionados',
	components: {
		ArticleCard: () => import('@/components/common/article-card/Index'),
	},
	computed: {
		/**
		 * Los similares que ya carga la vista del articulo (`articles/getSimilars`). Aca no se
		 * pide nada a la API: solo se lee lo que ya esta.
		 *
		 * @returns {Array}
		 */
		similars() {
			return this.$store.state.articles.similars
		},
		/**
		 * Cuantas tarjetas entran por fila. Es el mismo corte que usa la grilla de mas abajo en
		 * el CSS, y tiene que estar tambien en JS porque el tope son TRES FILAS: sin saber
		 * cuantas entran por fila no hay forma de saber donde cortar.
		 *
		 * @returns {number}
		 */
		por_fila() {
			if (this.ancho_pantalla >= 992) {
				return 3
			}
			return 2
		},
		/**
		 * Hasta tres filas. No hay carrusel ni scroll infinito: el que quiere ver mas se va al
		 * listado, esto es un remate de la ficha.
		 *
		 * @returns {Array}
		 */
		relacionados() {
			if (!Array.isArray(this.similars)) {
				return []
			}
			return this.similars.slice(0, this.por_fila * 3)
		},
	},
}
</script>
<style lang="sass">
.relacionados
	margin-top: 24px
	padding-top: 20px
	border-top: 1px solid rgba(0, 0, 0, .12)
	text-align: left

	.relacionados__titulo
		margin: 0 0 16px 0
		font-size: 20px
		font-weight: 600
		line-height: 1.3
		color: rgba(0, 0, 0, .9)

	// Grilla propia y no `.cont-models`: esa clase toma el ancho de las tarjetas de
	// `cantidad_tarjetas_en_escritorio` (la configuracion del comercio, que va de 1 a 8), y aca
	// el ancho lo manda el diseno de la ficha: 3 por fila en escritorio y 2 en tablet y
	// telefono.
	.relacionados__grilla
		display: grid
		grid-template-columns: repeat(2, minmax(0, 1fr))
		gap: 16px
		@media screen and (min-width: 992px)
			grid-template-columns: repeat(3, minmax(0, 1fr))

	// La tarjeta ya trae `width: 100%` por `full_width`; esto le saca el margen de 50px de
	// abajo que le pone `.cont-models .model`, que aca lo pone el `gap` de la grilla.
	.relacionados__grilla .model
		margin: 0
</style>
