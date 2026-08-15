<template>
	<div
	v-if="commerce.online_configuration.online_price_type && article_to_show && (article_to_show.precio_pausado || articlePriceEfectivo(article_to_show))">
		<template v-if="article_to_show.precio_pausado">
			<p class="price">
				{{ articlePriceEfectivo(article_to_show) }}
			</p>
		</template>
		<template v-else>
			<price-ranges
			is_from_article_page
			:article="article_to_show"></price-ranges>
			
			<p
			v-if="!article_to_show.ranges"
			class="price">
				{{ articlePriceEfectivo(article_to_show) }}
				<!--
					El precio original, tachado al lado del descontado. Solo aparece cuando la
					oferta personalizada del comprador hizo que la API dejara final_price ya
					descontado; en cualquier otro caso precio_sin_oferta() devuelve null y esto
					no se renderiza.
				-->
				<span
				v-if="precio_sin_oferta(article_to_show)"
				class="price__tachado">
					{{ precio_sin_oferta(article_to_show) }}
				</span>
			</p>
		</template>
	</div>
</template>
<script>
export default {
	name: 'Price',
	components: {
		PriceRanges: () => import('@/components/article/components/data/PriceRanges'),
	},
	computed: {
		article_to_show() {
			return this.$store.state.articles.article_to_show
		}
	},
}
</script>
<style scoped lang="sass">
.price
	font-size: 2em
	font-weight: 500
	text-align: left
	// El precio original tachado va al lado del descontado, nunca en rojo: es informacion,
	// no una alarma. Un escalon mas chico y bajado de opacidad, para que el precio con
	// descuento siga siendo lo unico que grita.
	.price__tachado
		font-size: .6em
		font-weight: 400
		margin-left: .4em
		opacity: .45
		text-decoration: line-through
		// El importe no se parte a la mitad; si no entra, cae entero al renglon de abajo.
		white-space: nowrap
		@media screen and (max-width: 576px)
			font-size: .55em
			margin-left: .3em
</style>	