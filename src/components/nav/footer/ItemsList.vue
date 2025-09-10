<template>
	<div 
	class="items-list s">
		<div 
		@click="home"
		class="item">
			<span class="item-text">
				Inicio	
			</span>
		</div>
		<div 
		class="item">
			<div
			@click="showCategories"
			v-b-toggle.cont-categories
			class="cont-item">
				<span class="item-text">
					Productos	
				</span>
			</div>
			<categories
			:show="show"></categories>
		</div>	

		<div 
		v-if="commerce_has_extencion('vinoteca')"
		@click="home"
		class="item">
			<span class="item-text">
				Promociones	
			</span>
		</div>

		<div
		v-if="commerce_has_extencion('vinoteca')"
		class="item">
			<div
			@click="show_bodegas"
			v-b-toggle.cont-bodegas
			class="cont-item">
				<span class="item-text">
					Bodegas
				</span>
			</div>
			<bodegas></bodegas>
		</div>	

		<div 
		v-if="commerce.online_configuration.mensaje_contacto"
		class="item">
			<router-link 
			:to="{name: 'Contacto'}">
				<span class="item-text">
					Contacto	
				</span>
			</router-link>
		</div>
		<div 
		v-if="commerce.online_configuration.quienes_somos"
		class="item">
			<router-link 
			:to="{name: 'QuienesSomos'}">
				<span class="item-text">
					{{ commerce.online_configuration.titulo_quienes_somos }}	
				</span>
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
			v-else>
				<div
				@click="toOrders"
				class="item">
					Mis Pedidos	
				</div>
				<div
				@click="logout"
				class="item">
					Cerrar sesion	
				</div>
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
		Bodegas: () => import('@/components/nav/bodegas/Index'),
	},
	data() {
		return {
			show: false,
		}
	},
	methods: {
		showCategories() {
			console.log('mostrando categories')

			// this.$store.commit('auth/setMobileSidebarVisibility', false)
			// this.$store.commit('auth/set_categories_sidebar_visibility', )
			this.$store.commit('auth/set_bodegas_sidebar_visibility', false)
		},
		show_bodegas() {
			// this.$store.commit('auth/setMobileSidebarVisibility', false)
			this.$store.commit('auth/set_categories_sidebar_visibility', false)
			// this.$store.commit('auth/set_bodegas_sidebar_visibility', false)
		}
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
		color: $color_text 
		font-weight: bold  
			// .item-text
		// &:hover 
		@media screen and (max-width: 992px)
			padding: 15px 0
		a 
			color: $color_text
</style>