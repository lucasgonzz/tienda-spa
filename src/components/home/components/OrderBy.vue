<template>
<b-row
v-if="selected_category || selected_sub_category">
	<b-col
	cols="12">
		<div
		class="cont-order-by-btn-filter">
			<div
			class="order-by">
				<label
				class="order-by__label"
				for="order-by-select">
					Ordenar por
				</label>
				<b-form-select
				id="order-by-select"
				class="order-by__select"
				:options="options"
				v-model="order_by"></b-form-select>
			</div>
			<b-button
			v-if="sub_categories.length"
			v-b-toggle.sub-categories-sidebar
			class="d-lg-none"
			variant="success">
				Categorias
			</b-button>
		</div>
	</b-col>
</b-row>
</template>
<script>
import categories from '@/mixins/categories'
export default {
	mixins: [categories],
	computed: {
		order_by: {
			set(value) {
				this.$store.commit('categories/setOrderBy', value)
				this.$store.commit('categories/setOrder')
				this.$store.dispatch('categories/getArticles')
			},
			get() {
				return this.$store.state.categories.order_by
			},
		},
		options() {
			return [
				{
					value: 'fecha-mayor-menor',
					text: 'Fecha: Nuevo al mas viejo',
				},
				{
					value: 'fecha-menor-mayor',
					text: 'Fecha: Viejo al mas nuevo',
				},
				{
					value: 'precio-menor-mayor',
					text: 'Precio: Menor a Mayor',
				},
				{
					value: 'precio-mayor-menor',
					text: 'Precio: Mayor a Menor',
				},
				{
					value: 'a-z',
					text: 'A-Z',
				},
				{
					value: 'z-a',
					text: 'Z-A',
				},
			]
		},
	}, 
}
</script>
<style lang="sass">
@import '@/sass/_custom'
// Rediseño completo (antes: select nativo de 70px de alto / 350px de ancho / fuente 25px, sin
// radio, heredado del ".title" global de 50px de _text.sass -- ninguno de los dos con relación
// al resto del sistema). Fila compacta con label + select angosto, mismo lenguaje que el resto
// de los controles: radio 10px, borde sutil, foco en el color del comercio.
.cont-order-by-btn-filter
	display: flex
	align-items: center
	justify-content: center
	flex-wrap: wrap
	gap: 0.75rem
	margin: 1.5rem 0
	width: 100%
	.order-by
		display: flex
		align-items: center
		gap: 0.6rem
		&__label
			margin: 0
			font-size: 0.85rem
			font-weight: 600
			color: rgba(0, 0, 0, 0.55)
			white-space: nowrap
		&__select
			-webkit-appearance: none
			-moz-appearance: none
			appearance: none
			height: 42px
			min-width: 220px
			max-width: 100%
			padding: 0 2.25rem 0 0.9rem
			font-size: 0.9rem
			font-weight: 500
			color: rgba(0, 0, 0, 0.85)
			background-color: #fff
			// Flecha propia en vez de la que trae bootstrap-vue en ".custom-select": misma
			// tecnica que el resto de los selects a medida del sistema (chevron SVG inline).
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23666666' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' d='M4 6l4 4 4-4'/%3E%3C/svg%3E")
			background-repeat: no-repeat
			background-position: right 0.85rem center
			background-size: 12px
			border: 1px solid rgba(0, 0, 0, 0.14)
			border-radius: 10px
			cursor: pointer
			transition: border-color 0.15s ease, box-shadow 0.15s ease
			// _form.sass pone "select { box-shadow: ... !important }" para TODO el sistema; acá
			// se pisa con la misma arma (!important) y más especificidad (dos clases contra un
			// selector de tag), así que gana sin depender del orden en que se compilen las hojas.
			box-shadow: none !important
			&:hover
				border-color: rgba(0, 0, 0, 0.3)
			&:focus
				outline: none
				border-color: $blue
				box-shadow: 0 0 0 3px color-mix(in srgb, $blue 18%, transparent) !important
</style>