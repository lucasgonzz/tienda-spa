<template>
<b-row
v-if="selected_category || selected_sub_category">
	<b-col
	cols="12"
	lg="10"
	xl="8">
		<div
		class="cont-order-by-btn-filter">
			<div
			class="order-by">
				<p
				class="title sm m-b-10">
					Ordenar por
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
.cont-order-by-btn-filter
	display: flex
	align-items: flex-end
	justify-content: center
	margin-top: .7em
	width: 100%
	.order-by 
		display: flex
		flex-direction: column
		justify-content: center
		align-items: center
		p 
			margin-bottom: 0
			font-weight: bold
			font-size: 20px
			text-align: center
		select 
			height: 70px
			width: 350px
			font-size: 25px
</style>