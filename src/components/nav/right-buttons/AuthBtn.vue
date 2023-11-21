<template>
	<div
	v-if="commerce.online_configuration.register_to_buy"
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
					<i class="icon-bag"></i>
					Mis pedidos
				</b-dropdown-item>
				<b-dropdown-item 
				@click="logout">
					<i class="icon-logout icon-black"></i>
					Salir
				</b-dropdown-item>
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

.auth-btn
	span, .dropdown-toggle
		color: $color_text !important

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