<template>
<div
@click="_toArticle"
@mouseenter="$emit('hover')"
class="nav-search-result">
	<!-- Miniatura: si no hay imagen se muestra un placeholder con icono en vez de un <img> roto -->
	<div class="nav-search-result__thumb">
		<img
		v-if="imagen"
		:src="imagen">
		<i
		v-else
		class="bi bi-image"></i>
	</div>
	<div class="nav-search-result__info">
		<p class="nav-search-result__name">
			{{ model.name }}
		</p>
		<!-- Indicador de stock discreto: punto + texto, no reemplaza al mixin hasStock (ver metodo hay_stock) -->
		<p
		class="nav-search-result__meta"
		:class="{'nav-search-result__meta--out': !hay_stock}">
			<span
			class="nav-search-result__dot"
			:class="{'nav-search-result__dot--out': !hay_stock}"></span>
			{{ hay_stock ? 'Disponible' : 'Sin stock' }}
		</p>
	</div>
	<!-- El precio solo se renderiza cuando hay un unico precio de operacion para este usuario -->
	<p
	v-if="mostrar_precio && precio_texto"
	class="nav-search-result__price">
		{{ precio_texto }}
	</p>
	<i class="bi bi-chevron-right nav-search-result__chevron"></i>
</div>
</template>
<script>
import articles from '@/mixins/articles'
export default {
	mixins: [articles],
	props: {
		model: Object,
	},
	computed: {
		/* Solo hay un unico precio de operacion cuando el comercio NO usa precios por rango de cantidad. */
		mostrar_precio() {
			return this.puede_ver_precios() && !this.commerce_has_extencion('lista_de_precios_por_rango_de_cantidad_vendida')
		},
		/* Mismo calculo que usa la tarjeta de producto (Price.vue), para que el buscador nunca muestre un precio distinto. */
		precio_texto() {
			return this.articlePriceEfectivo(this.model)
		},
		/*
			No se usa hasStock() del mixin articles a proposito: esa funcion lee
			this.selected_article_variant desde el store (la variante elegida en la ficha de
			producto abierta), lo cual tiene sentido en una sola ficha pero no en una lista de
			resultados: contaminaria todas las filas con el estado de un unico articulo.
			Esta version es propia y pura, en base solo a los datos de "model".
		*/
		hay_stock() {
			// Configuracion opcional del comercio: si esta prendida, un stock null se interpreta como 0.
			let stock_null_equal_0 = this.commerce
				&& this.commerce.online_configuration
				&& this.commerce.online_configuration.stock_null_equal_0

			if (this.model.article_variants && this.model.article_variants.length) {
				// Con variantes: hay stock si alguna variante tiene stock disponible.
				return this.model.article_variants.some(variant => {
					if (stock_null_equal_0 && variant.stock === null) {
						return false
					}
					return variant.stock === null || variant.stock > 0
				})
			}

			if (stock_null_equal_0 && this.model.stock == null) {
				return false
			}
			return this.model.stock === null || this.model.stock > 0
		},
		imagen() {
			return this.articleImage(this.model)
		},
	},
	methods: {
		_toArticle() {
			this.$emit('clearResults')
			this.toArticle(this.model)
		}
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.nav-search-result
	display: flex
	flex-direction: row
	align-items: center
	gap: 12px
	padding: 10px 12px
	width: 100%
	cursor: pointer
	border-radius: 10px
	transition: background .15s
	&:hover
		background: #f5f5f7
	&__thumb
		flex-shrink: 0
		width: 56px
		height: 56px
		border-radius: 10px
		background: #f5f5f7
		display: flex
		align-items: center
		justify-content: center
		overflow: hidden
		img
			width: 100%
			height: 100%
			object-fit: cover
		i
			color: #c7c7cc
			font-size: 1.4em
	&__info
		flex: 1
		min-width: 0
	&__name
		margin: 0
		text-align: left
		color: #1d1d1f
		overflow: hidden
		text-overflow: ellipsis
		white-space: nowrap
	&__meta
		margin: 4px 0 0 0
		display: flex
		align-items: center
		gap: 6px
		font-size: 12px
		color: #6e6e73
		&--out
			color: #86868b
	&__dot
		width: 6px
		height: 6px
		border-radius: 50%
		background: #34c759
		flex-shrink: 0
		&--out
			background: #c7c7cc
	&__price
		margin: 0
		flex-shrink: 0
		text-align: right
		font-weight: 600
		color: #1d1d1f
	&__chevron
		flex-shrink: 0
		color: #c7c7cc
		font-size: .9em
</style>
