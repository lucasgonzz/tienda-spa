<template>
	<div
	v-if="show_nav"
	class="cont-nav">
		<b-navbar 
		:class="scroll_bottom ? 'navbar-small' : ''"
		toggleable="lg" 
		type="dark">
			<brand-btn></brand-btn>

			<buscador
			v-if="!is_mobile"></buscador>	
			
			<right-buttons></right-buttons>
		</b-navbar>
		
		<footer-nav></footer-nav>
		
		<mobile></mobile>
	</div>
</template>
<script>
export default {
	data() {
		return {
			scroll: 0,
			scroll_bottom: false,
		}
	},
	created() {
		window.addEventListener('scroll', () => {
			if (this.scroll < window.scrollY) {
				if (window.scrollY >= 150) {
					this.scroll_bottom = true
				}
			} else {
				this.scroll_bottom = false
			} 
			this.scroll = window.scrollY
		})
	},
	components: { 
		BrandBtn: () => import('@/components/nav/BrandBtn'),
		RightButtons: () => import('@/components/nav/right-buttons/Index'),
		Collapse: () => import('@/components/nav/Collapse'),
		FooterNav: () => import('@/components/nav/footer/Index'),
		Buscador: () => import('@/components/nav/buscador/Index'),			
		Mobile: () => import('@/components/nav/Mobile'),			
	},
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
        	return this.route_name != 'Maps'
        },
	},
}
</script>
<style lang="sass">
@import '@/sass/_custom.scss'
.cont-nav 
	position: fixed
	top: 0
	left: 0
	width: 100%
	z-index: 100

.navbar-small
	height: 60px !important
	.navbar-brand
		img 
			width: 40px !important

.navbar

	@if ($theme == dark) 
		background: #111111
		.nav-link
			color: red !important
	@else if ($theme == ligth) 
		background: $green

	transition: height 0.25s ease-in
	
	height: 90px

	padding: .3em 15px
	display: flex
	justify-content: center !important

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

</style>