<template>
	<div>
		<div
		class="d-lg-none buttons-mobile"
		v-if="!isSearchView">
			<btn-login></btn-login>
			<btn-buscador></btn-buscador>
			<btn-messages></btn-messages>
		</div>
		<div
		class="d-none d-lg-flex buttons-desktop m-l-15">
			<btn-carrito></btn-carrito>
		</div>
	</div>
</template>
<script>
import nav_mixin from '@/mixins/nav'
// Mobile
import BtnLogin from '@/components/nav/buttons/mobile/BtnLogin'
import BtnBuscador from '@/components/nav/buttons/mobile/BtnBuscador'
import BtnMessages from '@/components/nav/buttons/mobile/BtnMessages'
// Desktop
import BtnCarrito from '@/components/nav/buttons/desktop/BtnCarrito'
export default {
	mixins: [nav_mixin],
	components: {
		BtnLogin,
		BtnBuscador,
		BtnMessages,
		BtnCarrito,
	}
}
</script>
<style scoped lang="sass">
@import '@/sass/_custom'
.buttons-mobile
	@media screen and (max-width: 992px)
		display: flex !important
		justify-content: space-between
		.btn-nav
			@if ($theme == dark) 
				color: rgba(255, 255, 255, 0.8)
			@else if ($theme == ligth) 
				color: rgba(0, 0, 0, .7) !important

.buttons-desktop
	@media screen and (min-width: 992px)
		width: 100px
		display: flex !important
		justify-content: space-between
		.btn-nav
			@if ($theme == dark) 
				color: rgba(255, 255, 255, 0.8)
			@else if ($theme == ligth) 
				color: rgba(0, 0, 0, .7) !important
</style>