<template>
	<div
	v-if="flag_activo(commerce.online_configuration.register_to_buy)"
	class="m-l-15 d-none d-lg-block auth-btn">
		<div 
		v-if="authenticated && !is_mobile">
			<b-dropdown 
			class="auth-dropdown"
			right>
				<template v-slot:button-content>
					{{ user_name }}
					<b-badge
                    v-show="cupons_not_read > 0"
                    class="badge"
                    variant="danger"
                    size="sm">
                        {{ cupons_not_read }}
                    </b-badge>
				</template>
			<b-dropdown-item 
			@click="toOrders">
				<i class="bi bi-bag"></i>
				Mis pedidos
			</b-dropdown-item>
			<b-dropdown-item
			v-if="user.comercio_city_client_id"
			@click="toCuentaCorriente">
				<i class="bi bi-person"></i>
				Mi cuenta corriente
			</b-dropdown-item>
			<b-dropdown-item 
			@click="logout">
					<i class="bi bi-box-arrow-right icon-black"></i>
					Salir
				</b-dropdown-item>
			<!--
				Debajo de "Salir", los descuentos y recargos que el comerciante le vinculo al
				cliente del comprador (mision descuentos-recargos-por-cliente). Salen de
				`user.ajustes_de_cliente`; sin ninguno no se dibuja ni el separador.
			-->
			<template
			v-if="ajustes_del_comprador().length">
				<b-dropdown-divider></b-dropdown-divider>
				<!-- tag="div": por defecto es un <p>, y adentro va un <div> con una <ul> (HTML invalido). -->
				<b-dropdown-text tag="div">
					<ajustes-de-cliente
					titulo="Se te están aplicando estos descuentos y recargos en tus precios:"
					:ajustes="ajustes_del_comprador()"></ajustes-de-cliente>
				</b-dropdown-text>
			</template>
			</b-dropdown>
		</div>
		<div
		v-else>
			<div 
			class="c-p"
			:class="active('Login')"
			@click="toLogin">
				<span>
					Ingresar
				</span>
			</div>
		</div>
	</div>
</template>
<script>
import mixin from '@/mixins/nav'
import auth from '@/mixins/auth'
export default {
	mixins: [mixin, auth],
	components: {
		AjustesDeCliente: () => import('@/components/common/AjustesDeCliente'),
	},
}
</script>
<style lang="sass">
@import '@/sass/_custom.scss'
.auth-dropdown
	.dropdown-toggle
		background: none !important
		border: none !important
		box-shadow: none !important
		color: $color_text
	// El bloque de ajustes del cliente debajo de "Salir": el menu es angosto y el titulo
	// quedaria partido en cinco renglones. Ancho propio, sin pasarse del de un telefono.
	.ajustes-de-cliente
		min-width: 240px
		max-width: 300px

.auth-btn
	span, .dropdown-toggle
		color: $color_text !important
	// La regla de arriba pinta TODO span del boton con el color del texto del nav (claro, para ir
	// sobre la barra de color), y el nombre de cada ajuste del cliente es un span que vive adentro
	// del menu blanco: sin esta excepcion quedaba blanco sobre blanco. Mismo !important para ganarle.
	.ajustes-de-cliente__nombre
		color: rgba(0, 0, 0, .8) !important

.active-link
	.nav-link
		font-weight: bold
		
.badge 
	left: 5%
	// top: 20px
	font-size: .8em
.dropdown-item
	position: relative
	.badge 
		// left: 7px
		top: -2px
		font-size: .8em
.active-link
	// a
	// 	font-weight: bold
	// 	color: rgba(0, 0, 0, 1) !important
.dropdown-menu 
	.active-link
		a
			font-weight: bold
			color: $color_text
</style>