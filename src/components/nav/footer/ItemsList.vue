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
			class="cont-item">
				<span class="item-text">
					Productos
				</span>
			</div>
		</div>

		<div
		class="item">
			<div
			@click="show_marcas"
			class="cont-item">
				<span class="item-text">
					Marca
				</span>
			</div>
		</div>

		<div
		v-if="Number(commerce.online_configuration.mostrar_catalogo) == 1"
		class="item">
			<router-link 
			:to="{name: 'Catalogo'}">
				<span class="item-text">
					Catalogo	
				</span>
			</router-link>
		</div>

		<div 
		v-if="commerce_has_extencion('vinoteca')"
		@click="to_promociones_vinotecas"
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
			class="cont-item">
				<span class="item-text">
					Bodegas
				</span>
			</div>
		</div>	

		<div
		v-if="commerce_has_extencion('vinoteca')"
		class="item">
			<div
			@click="show_cepas"
			class="cont-item">
				<span class="item-text">
					Cepas
				</span>
			</div>
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
				<!--
					Debajo de "Cerrar sesion", el mismo bloque que el desplegable del nombre en
					escritorio: los descuentos y recargos del cliente del comprador.
				-->
				<div
				v-if="ajustes_del_comprador().length"
				class="item item--ajustes-de-cliente">
					<ajustes-de-cliente
					titulo="Se te están aplicando estos descuentos y recargos en tus precios:"
					:ajustes="ajustes_del_comprador()"></ajustes-de-cliente>
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
		AjustesDeCliente: () => import('@/components/common/AjustesDeCliente'),
	},
	methods: {
		/**
		 * Abre o cierra el sidebar de categorías vía store (sin v-b-toggle).
		 * Cierra otros paneles y el menú móvil al abrir.
		 */
		showCategories() {
			this.$store.commit('auth/set_bodegas_sidebar_visibility', false)
			this.$store.commit('auth/set_cepas_sidebar_visibility', false)
			this.$store.commit('auth/set_brands_sidebar_visibility', false)
			let will_open = !this.$store.state.auth.categories_sidebar_visibility
			if (will_open) {
				this.$store.commit('auth/setMobileSidebarVisibility', false)
			}
			this.$store.commit('auth/set_categories_sidebar_visibility', will_open)
		},
		/**
		 * Abre o cierra el sidebar de bodegas vía store.
		 */
		show_bodegas() {
			this.$store.commit('auth/set_categories_sidebar_visibility', false)
			this.$store.commit('auth/set_cepas_sidebar_visibility', false)
			this.$store.commit('auth/set_brands_sidebar_visibility', false)
			let will_open = !this.$store.state.auth.bodegas_sidebar_visibility
			if (will_open) {
				this.$store.commit('auth/setMobileSidebarVisibility', false)
			}
			this.$store.commit('auth/set_bodegas_sidebar_visibility', will_open)
		},
		/**
		 * Abre o cierra el sidebar de cepas vía store.
		 */
		show_cepas() {
			this.$store.commit('auth/set_categories_sidebar_visibility', false)
			this.$store.commit('auth/set_bodegas_sidebar_visibility', false)
			this.$store.commit('auth/set_brands_sidebar_visibility', false)
			let will_open = !this.$store.state.auth.cepas_sidebar_visibility
			if (will_open) {
				this.$store.commit('auth/setMobileSidebarVisibility', false)
			}
			this.$store.commit('auth/set_cepas_sidebar_visibility', will_open)
		},
		/**
		 * Abre o cierra el sidebar de marcas vía store. Mismo patrón que las tres
		 * anteriores: cierra los otros tres paneles antes de togglear el propio, para
		 * que los cuatro sidebars del nav sigan siendo mutuamente excluyentes.
		 */
		show_marcas() {
			this.$store.commit('auth/set_categories_sidebar_visibility', false)
			this.$store.commit('auth/set_bodegas_sidebar_visibility', false)
			this.$store.commit('auth/set_cepas_sidebar_visibility', false)
			let will_open = !this.$store.state.auth.brands_sidebar_visibility
			if (will_open) {
				this.$store.commit('auth/setMobileSidebarVisibility', false)
			}
			this.$store.commit('auth/set_brands_sidebar_visibility', will_open)
		},
		to_promociones_vinotecas() {
			this.$router.push({name: 'PromocionesVinoteca'})
			this.$scrollToTop()
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
		color: $color_text 
		font-weight: bold  
		/* Aplica el color de texto hover configurado para cada item del nav. */
		&:hover
			color: $hover_color_text
			.item-text
				color: $hover_color_text
			a
				color: $hover_color_text
		@media screen and (max-width: 992px)
			padding: 15px 0
		a 
			color: $color_text
		/* Mantiene consistencia de color hover en links del nav. */
		&:hover
			color: $hover_color_text
	// El bloque de los ajustes del cliente no es un link: sin negrita, sin puntero y sin el
	// color de hover de los items de arriba.
	.item--ajustes-de-cliente
		cursor: default
		font-weight: normal
		&:hover
			color: $color_text
</style>