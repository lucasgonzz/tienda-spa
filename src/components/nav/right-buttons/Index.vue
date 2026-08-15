<template>
	<div
	class="right-buttons">
		<promocion-btn></promocion-btn>
		<cart-btn></cart-btn>
		<messages-btn></messages-btn>
		<auth-btn></auth-btn>
	</div>
</template>
<script>
export default {
	components: {
		PromocionBtn: () => import('@/components/nav/right-buttons/PromocionBtn'),
		CartBtn: () => import('@/components/nav/right-buttons/cart-btn/Index'),
		MessagesBtn: () => import('@/components/nav/right-buttons/MessagesBtn'),
		AuthBtn: () => import('@/components/nav/right-buttons/AuthBtn'),				
	},
}
</script>
<style lang="sass">
.right-buttons
	position: absolute
	right: 35px
	display: flex
	flex-direction: row
	align-items: center 
</style>