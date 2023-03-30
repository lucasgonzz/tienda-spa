<template>
<div
v-show="show"
class="cart-button shadow-2 d-lg-none">
	<template>
		<b-button 
		block
		variant="success"
		:to="{name: 'Cart'}">
			Ver carrito
			({{ cant_cart_articles }})
		</b-button>
	</template>
</div>
</template>
<script>
import cart from '@/mixins/cart'
export default {
	name: 'NavMobile',
	mixins: [cart],
	computed: {
		show() {
			let route = this.$route.name
			if (route != 'Home' || this.cant_cart_articles == 0) {
				return false
			}
			return true
		}
	},
}
</script>
<style scpoed lang="sass">
@import '@/sass/_custom.scss'
.cart-button 
	display: flex
	justify-content: center
	align-items: center
	z-index: 100
	position: fixed
	bottom: 0
	width: 100%
	height: 70px
	padding: 1em
	@if ($theme == dark) 
		background: #000
	@else if ($theme == ligth) 
		background: #fff
	.btn 
		// width: 50%
</style>