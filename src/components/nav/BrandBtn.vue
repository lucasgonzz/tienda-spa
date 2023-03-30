<template>
	<b-navbar-brand>
		<span 	
		v-b-toggle.nav-sidebar
		class="icon-bars p-r-5 d-lg-none"></span> 
        </b-badge>
		<img 
		@click="home"
		class="img-brand-mobile m-l-5 apretable c-p"
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
	@if ($theme == dark) 
		color: #fff
	@else if ($theme == ligth) 
		color: rgba(0, 0, 0, .7)
.navbar-brand
	padding: 0
	position: absolute
	left: 15px
	justify-content: center
	align-items: center
	img 
		transition: width 0.25s ease-in
		width: 60px
</style>