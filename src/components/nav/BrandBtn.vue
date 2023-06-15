<template>
	<b-navbar-brand>
		<span 	
		v-b-toggle.nav-sidebar
		class="icon-bars p-r-5 d-lg-none"></span> 
        </b-badge>
		<img 
		@click="home"
		class="img-brand-mobile apretable c-p"
        src="@/assets/icon.png"
		alt="logo">
	</b-navbar-brand>
</template>
<script>
import nav_mixin from '@/mixins/nav'
export default {
	mixins: [nav_mixin],
}
</script>
<style lang="sass">
@import '@/sass/_custom.scss'
.icon-bars
	color: $color_text
.navbar-brand
	padding: 0
	position: absolute
	left: 15px
	// display: flex 
	// flex-direction: row 
	// justify-content: left
	// align-items: center
	img 
		transition: width 0.25s ease-in
		width: 120px
		margin-left: 5px	
	@media screen and (max-width: 992px) 
		width: calc(100% - 2rem)
		span
			position: absolute
			left: 0	
			top: calc(50% - 15px)
		img 
			margin: 0

</style>