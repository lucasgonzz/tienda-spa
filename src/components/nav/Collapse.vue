<template>
	<b-collapse id="nav-collapse" is-nav>
		<b-navbar-nav>

			<template 
			v-if="authenticated">
				<b-nav-item 
				:class="active('Messages')"
				:to="{name: 'Messages'}">
					Mensajes
					<b-badge
					v-show="messages_not_read > 0"
					variant="danger">
						{{ messages_not_read }}
					</b-badge>
				</b-nav-item>	
				<b-nav-item-dropdown right>
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
					:class="active('Cupons')"
					@click="cupons">
						<i class="icon-cupon icon-black"></i>
                        <b-badge
                        v-show="cupons_not_read > 0"
                        class="badge"
                        variant="danger"
                        size="sm">
                            {{ cupons_not_read }}
                        </b-badge>
						Cupones
					</b-dropdown-item>
					<b-dropdown-item 
					:class="active('Questions')"
					@click="questions">
						<i class="icon-comment icon-black"></i>
						Preguntas
					</b-dropdown-item>
					<b-dropdown-item 
					:class="active('Favorites')"
					@click="favorites">
						<i class="icon-heart icon-black"></i>
						Favoritos
					</b-dropdown-item>
					<b-dropdown-item 
					:class="active('Orders')"
					@click="orders">
						<i class="icon-bag-o icon-black"></i>
						Compras
					</b-dropdown-item>
	                <b-dropdown-item 
	                v-b-modal="'workdays'">
	                    <i class="icon-clock"></i>
	                    Horarios
	                </b-dropdown-item>
	                <b-dropdown-item 
	                :to="{name: 'Location'}"
	                :class="active('Location')">
	                    <i class="icon-location"></i>
	                    Nuestro local
	                </b-dropdown-item>
					<b-dropdown-item 
					:class="active('Configuration')"
					:to="{name: 'Configuration'}">
						<i class="icon-config icon-black"></i>
						Configuracion
					</b-dropdown-item>
					<b-dropdown-item 
					v-if="!is_verified"
					:to="{name: 'Register', params: {view: 'codigo-de-verificacion'}}">
						<i class="icon-right"></i>
						Verificar cuenta
					</b-dropdown-item>
					<b-dropdown-item 
					@click="logout">
						<i class="icon-logout icon-black"></i>
						Salir
					</b-dropdown-item>
				</b-nav-item-dropdown>
			</template>
			<template
			v-else>
				<b-nav-item 
				:class="active('Login')"
				@click="toLogin">
					Ingresar
				</b-nav-item>
			</template>
		</b-navbar-nav>
	</b-collapse>
</template>
<script>
import mixin from '@/mixins/nav'
import auth from '@/mixins/auth'
export default {
	mixins: [mixin, auth],
}
</script>
<style lang="sass">
@import '@/sass/_custom.scss'
#nav-collapse
	justify-content: flex-end
	width: 10% !important

	@if ($theme == dark) 
		.nav-item
			.nav-link
				color: #FFF
				&:hover 
					font-weight: bold
	@else if ($theme == ligth)
		.nav-item
			.nav-link
				color: rgba(0,0,0,.8)

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
				color: #000 !important
</style>