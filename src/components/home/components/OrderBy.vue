<template>
	<div
	class="cont-order-by-btn-filter">
		<div
		class="order-by">
			<p
			class="title sm m-b-10">
				Ordenar por:
			</p>
			<b-form-select
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
					value: 'precio-mayor-menor',
					text: 'Precio: Menor a Mayor',
				},
				{
					value: 'precio-menor-mayor',
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
.cont-order-by-btn-filter
	display: flex
	align-items: flex-end
	justify-content: space-between
	margin-top: .7em
	.order-by 
		display: flex
		p 
			margin-bottom: 0
			font-weight: bold
@media screen and (max-width: 992px)
	.order-by 
		width: 60%
		flex-direction: column
		align-items: flex-start
		p 
			text-align: left
@media screen and (min-width: 992px)
	.order-by
		flex-direction: row
		width: 350px
		align-items: center
		margin: auto
		margin-top: 10px
		p 
			width: 35%
		select
			width: 65%
</style>