<template>
	<div>
		<cart-btn></cart-btn>
		<nav-mobile-sidebar></nav-mobile-sidebar>
		<informacion-legal></informacion-legal>
		<workdays></workdays>
		<b-navbar 
		v-if="show_nav_content"
		toggleable="lg" 
		type="dark">
			<template
			v-if="show_nav_content">
				<brand-btn></brand-btn>
				<buscador-mobile></buscador-mobile>
				<buscador-desktop></buscador-desktop>
				<buttons></buttons>

				<collapse></collapse>
			</template>
			<back-button
			v-else></back-button>
		</b-navbar>
	</div>
</template>
<script>
// Mixins
import nav from '@/mixins/nav'

// Modals
import InformacionLegal from '@/components/nav/modals/InformacionLegal'
import Workdays from '@/components/nav/modals/Workdays'

// Fixed
import CartBtn from '@/components/nav/btn-fixed/CartBtn'

import BackButton from '@/components/common/BackButton'

import BrandBtn from '@/components/nav/BrandBtn'
import NavMobileSidebar from '@/components/nav/mobile-sidebar/NavComponent'
import BuscadorMobile from '@/components/nav/buscador/Mobile'
import BuscadorDesktop from '@/components/nav/buscador/Desktop'
import Buttons from '@/components/nav/buttons/Index'
import Collapse from '@/components/nav/Collapse'
export default {
	components: { 
		NavMobileSidebar,
		InformacionLegal,
		Workdays,
		CartBtn,
		BackButton,
		BrandBtn,
		BuscadorMobile,
		BuscadorDesktop,
		Buttons,
		Collapse,
	},
	mixins: [nav],
	computed: {
        show_nav_content() {
            let path = this.$route.name
            return path != 'Register' 
                    && path != 'Login' 
                    && path != 'PasswordReset' 
                    && path != 'CondicionesDeUso' 
                    && (path != 'Maps' || (path == 'Maps' && this.city == ''))
        },
        show_nav() {
        	return this.route_name != 'Maps' || this.city == ''
        },
        city() {
        	return this.$store.state.address.city
        },
		showMobileNav() {
			if (this.$route.name == 'PaymentGateway') {
				return false
			}
			return true
		},
		notifications_not_viewed() {
			let no_viewed = 0
			this.user.notifications.forEach(notification => {
				if (notification.viewed == 0) {
					no_viewed++
				}	
			})
			return no_viewed
		},
		articles_names() {
			return this.$store.state.articles.articles_names
		},
	},
	methods: {
		envio() {
			this.$refs.cart.envio()
		},
	},
}
</script>
<style scoped lang="sass">
@import '@/sass/_custom.scss'
.navbar

	@if ($theme == dark) 
		background: #111111
		.nav-link
			color: red !important
	@else if ($theme == ligth) 
		background: $green

	// @media screen and (max-width: 992px)
	// 	height: 50px 
	// @media screen and (min-width: 992px)
	// 	height: 80px
	height: 80px

	padding: .3em 1.5em
	display: flex
	justify-content: space-between
	position: fixed
	top: 0
	left: 0
	width: 100%
	z-index: 100

	.collapse
		padding: 0 1em

	// Estilos para link de escritrio
	.navbar-nav 
		align-items: center
		// .aa
		// 	&:hover
		// 		color: $green
		// 		text-decoration: none
	.notification
		position: absolute
		top: 30%
		right: 0px
.form-group
	margin: 0
	@media screen and (max-width: 576px) and (max-width: 778px)
		width: 78%
	@media screen and (min-width: 576px) and (max-width: 778px)
		width: 85%
	@media screen and (min-width: 778px) and (max-width: 998px)
		width: 50%
	@media screen and (min-width: 998px)
		width: 50%

[class^='icon-']
	color: rgba(255,255,255,.8)
	font-size: 1.4em
	margin-left: 0
	margin-right: 0
.icon-black
	margin-right: .2em
	font-size: 1em
	color: rgba(51,51,51,.9)
</style>