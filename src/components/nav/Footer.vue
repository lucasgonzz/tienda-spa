<template>
	<div
	class="footer-nav">
		<buscador	
		class="d-lg-none"></buscador>
	</div>
</template>
<script>
export default {
	components: {
		Buscador: () => import('@/components/nav/Buscador')
	}
}
</script>
<style lang="sass">
.footer-nav
	height: 50px
</style>