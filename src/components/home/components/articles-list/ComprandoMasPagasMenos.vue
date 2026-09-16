<template>
	<div
	class="featured-list"
	v-if="!selected_category && !selected_sub_category && !selected_bodega && !selected_cepa && !is_from_search && articulos_con_rangos.length">
		<p
		class="title">
			Comprando más, pagás menos
		</p>
		<vue-horizontal-list
		:items="articulos_con_rangos" :options="options">
			<template v-slot:default="{ item }">
				<article-card
				full_width
				:article="item"></article-card>
			</template>
		</vue-horizontal-list>
	</div>
</template>
<script>
/*
 * Los artículos que tienen rangos de precio por cantidad (`article_price_ranges`), en un
 * carrusel propio debajo de Novedades.
 *
 * ⚠️ NO es la sección "Ofertas" que ya existe (InOffer.vue, alimentada por el check `in_offer`
 * del artículo y ubicada ARRIBA de Novedades). Son dos mecanismos distintos y conviven: aquélla
 * no se toca ni se mueve. El nombre lo eligió Lucas justamente para que no se confundan.
 *
 * La sección se esconde entera si hay categoría, subcategoría, bodega, cepa o búsqueda activa —
 * mismo criterio que Novedades y Promociones —, y si el array está vacío. Ese array queda vacío
 * también cuando la API todavía no manda la clave `articulos_con_rangos`, así que una tienda
 * nueva contra una API vieja simplemente no muestra la sección.
 */
import ArticleCard from '@/components/common/article-card/Index'
import VueHorizontalList from "vue-horizontal-list"
import categories from "@/mixins/categories"
import VueScreenSize from 'vue-screen-size'
export default {
	name: 'ComprandoMasPagasMenos',
	mixins: [categories],
	components: {
		ArticleCard,
		VueHorizontalList,
	},
	computed: {
		options() {
			let options = {
				responsive: [
					{ end: 576, size: 2 },
					{
						start: 768,
						end: 992,
						size: this.commerce.online_configuration.cantidad_tarjetas_en_notebook },
					{
						start: 992,
						size: this.commerce.online_configuration.cantidad_tarjetas_en_escritorio
					},
				],
				list: {
					// 1200 because @media (min-width: 1200px) and therefore I want to switch to windowed mode
					windowed: 0,

					// Because: #app {padding: 80px 24px;}
					padding: 100,
				},
				position: {
					start: 1,
				},
				autoplay: { play: true, repeat: true, speed: 4000 },
			}

			return options
		}
	}
}
</script>
