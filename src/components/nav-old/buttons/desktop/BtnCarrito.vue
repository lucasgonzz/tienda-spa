<template>
	<button 
	@click="toCart()"
	class="btn-nav btn-carrito">
		<i 
		:class="getIconActive('Cart', 'shopping-cart')"></i>
		<b-badge 
		v-show="cant_cart_articles > 0"
		variant="danger"
		class="badge">
			{{ cant_cart_articles }}
		</b-badge>
	</button>
</template>
<script>
import cart from '@/mixins/cart'
import nav from '@/mixins/nav'
export default {
	name: 'BtnCarrito',
	mixins: [cart, nav],
	computed: {
		vicibility() {
			return this.$store.state.cart.vicibility
		},
		iconClass() {
			if (this.vicibility) {
				return 'icon-shopping-cart'
			}
			return 'icon-shopping-cart-o'
		}
	}
}
</script>
<style lang="sass">
.btn-carrito
	i 
		font-size: 1.6em
	.badge
		padding: .5em
		font-size: .9em
</style>