<template>
	<div
	class="footer-nav">
		<buscador	
		class="d-lg-none"></buscador>

		<items-list
		class="d-none d-lg-flex"></items-list>
	</div>
</template>
<script>
export default {
	components: {
		Buscador: () => import('@/components/nav/buscador/Index'),			
		ItemsList: () => import('@/components/nav/footer/ItemsList'),
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.footer-nav
	background: $green 
	height: 50px
</style>