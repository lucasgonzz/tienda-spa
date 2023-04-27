<template>
	<div 
	class="items-list s">
		<div 
		@click="home"
		class="item">
			Inicio	
		</div>
		<div 
		class="item p-0 item-categories">
			<div
			@click="showCategories"
			class="cont-item">
				Productos	
				<i class="icon-down"></i>
			</div>
			<categories
			:show="show"></categories>
		</div>	
		<div 
		class="item">
			<router-link 
			:to="{name: 'Contacto'}">
				Contacto	
			</router-link>
		</div>
		<div 
		class="item">
			<router-link 
			:to="{name: 'QuienesSomos'}">
				Quienes somos	
			</router-link>
		</div>
		<div
		v-if="is_mobile">
			<div 
			v-if="!authenticated"
			@click="toLogin"
			class="item">
				Iniciar sesion	
			</div>
			<div
			@click="logout"
			class="item"
			v-else>
				Cerrar sesion	
			</div>
		</div>
	</div>
</template>
<script>
import nav from '@/mixins/nav'
import auth from '@/mixins/auth'
export default {
	mixins: [nav, auth],
	components: {
		Categories: () => import('@/components/nav/categories/Index'),
	},
	data() {
		return {
			show: false,
		}
	},
	methods: {
		showCategories() {
			this.show = !this.show
		},
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.items-list
	display: flex
	justify-content: center
	height: 100%
	@media screen and (max-width: 992px)
		width: 100%
		flex-direction: column 
		justify-content: flex-start 
		text-align: left
	@media screen and (min-width: 992px)
		border-top: 1px solid rgba(0,0,0,.1) 
		flex-direction: row 
		align-items: center
	.item
		cursor: pointer 
		margin: 0 1em	
		position: relative
		color: $color_text !important
		&:hover
			font-weight: bold  
		@media screen and (max-width: 992px)
			padding: 15px 0
		a 
			color: $color_text

	.item-categories
		@media (hover: hover) 
			&:hover
				& > #cont-categories
					opacity: 100
					display: block
		@media screen and (max-width: 992px)
			.cont-item
				padding: 15px 0 
				display: flex
				flex-direction: row 
				justify-content: space-between
</style>