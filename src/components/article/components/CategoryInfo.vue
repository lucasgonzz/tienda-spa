<template>
	<b-col
	class="d-none d-md-flex"
	cols="12"
	lg="10">
		
		<div class="category-info">
			
			<div 
			@click="home"
			class="item">
				<i class="bi bi-house-door p-r-5"></i>
				Volver al inicio
			</div>
			<div 
			@click="setSelectedCategory(category)"
			class="item"
			v-if="category">
				{{ category.name }}
			</div>
			<div 
			@click="setSubCategory(category, sub_category)"
			class="item"
			v-if="sub_category">
				{{ sub_category.name }}
			</div>
		</div>

	</b-col>
</template>
<script>
import nav from '@/mixins/nav'
import _categories from '@/mixins/_categories'
export default {
	mixins: [nav, _categories],
	computed: {
		article() {
			return this.$store.state.articles.article_to_show
		},
		categories() {
			return this.$store.state.categories.categories
		},
		category() {
			if (this.article.category_id) {
				return this.categories.find(category => {
					return category.id == this.article.category_id
				})
			}
			return null
		},
		sub_category() {
			if (this.article.sub_category_id && this.category) {
				return this.category.sub_categories.find(sub_category => {
					return sub_category.id == this.article.sub_category_id
				})
			}
			return null
		},
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.category-info
	margin-top: 25px
	display: flex
	flex-direction: row
	align-items: center
	// 🔴 ERA EL TEXTO MAS PESADO DE LA MITAD DE ARRIBA SALVO EL PRECIO. Medido en la ficha
	// corriendo: 16px, peso 700, `rgb(33, 37, 41)` -- mas pesado que el NOMBRE del producto, que
	// es 22px/600 en `rgba(0, 0, 0, .9)`. Y vive AFUERA de la tarjeta, flotando sobre el fondo,
	// asi que es lo primero que se lee al entrar. Es navegacion, no es el producto.
	//
	// En Mercado Libre estas migas son ~12px en gris al 55%. Va 13px/400 porque 12px sobre el
	// fondo que elige cada comercio se lee peor que en ML, que tiene su gris fijo.
	//
	// El gris es .6 y no .55: sobre blanco los dos pasan AA (4,74 el de .55), pero el fondo de
	// fabrica de esta plantilla es #EDEDED, y ahi .55 cae a 4,05 -- debajo de 4,5. Con .6 da
	// 4,90 sobre el gris y 5,74 sobre blanco. Se ve igual y pasa en los dos.
	font-weight: 400
	font-size: 13px
	color: rgba(0, 0, 0, .6)

	.item
		display: inline-flex
		align-items: center
		// Sin los 20px por lado ni el borde de 2px: la separacion la hace el chevron de abajo.
		padding: 0
		border-right: none
		cursor: pointer

		// Antes $green fijo: en un comercio con otro color de marca el breadcrumb pasaba a
		// verde al pasar el mouse, sin relacion con el resto de la tienda. var(--secondary-
		// color) es la misma variable que ya usa el boton "Calcular" y el link del modal de
		// envio en la ficha del articulo.
		&:hover
			color: var(--secondary-color, $green)

		// El separador es un caracter, no un borde de 2px al 40% de negro: esa barra pesaba mas
		// que el texto que separaba. `pointer-events: none` porque `.item` lleva un @click y el
		// separador no es parte de ese destino.
		&:not(:last-child)::after
			content: '›'
			margin: 0 .5rem
			color: rgba(0, 0, 0, .35)
			pointer-events: none
</style>
