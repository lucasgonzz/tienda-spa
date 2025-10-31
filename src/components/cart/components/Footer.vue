<template>
	<div
	v-if="cant_cart_items > 0">
		<p class="total title m-t-20 m-lg-t-0">
			<strong>
				Total: {{ price(total) }}
			</strong>
		</p>
		<b-button
		block
		class="m-b-15 btn-pay"
		size="lg"
		@click="next">
			Iniciar compra
		</b-button>
		<b-button
		block
		size="lg"
		class="w-100"
		:to="{name: 'Home'}"
		variant="primary">
			Ver mas productos
		</b-button>
		<b-button
		block
		@click="limpiar"
		size="lg"
		class="w-100"
		variant="outline-danger">
			Limpiar carrito
		</b-button>
	</div>
</template>
<script>
import cart from '@/mixins/cart' 
export default {
	name: 'CartList',
	mixins: [cart],
	methods: {
		next() {
			if (this.authenticated) {
				if (this.canMakeOrder()) {
					this.$router.push({name: 'Payment'})
					this.$scrollToTop()
				}
			} else {
				if (this.commerce.online_configuration.register_to_buy) {
					this.$cookies.set('redirect_to', 'Payment')
					this.$router.push({name: 'Login'})
				} else {
					this.$router.push({name: 'Payment'})
				}
			}
		},
		limpiar() {
			if (confirm('¿Seguro que quiere limpiar el carrito?')) {
				this.$store.commit('auth/setMessage', 'Cargando')
				this.$store.commit('auth/setLoading', true)
				this.$api.delete('carts/'+this.cart.id)
				.then(() => {
					this.$store.commit('cart/setCart', null)
					this.$store.commit('auth/setLoading', false)
					this.$toast.success('Carrito eliminado')
				})
				.catch(err => {
					this.$store.commit('auth/setLoading', false)
					this.$toast.error(err)
				})
			}
		}
	}
}
</script>
<style lang="sass">
.total 
	text-align: left
	font-size: 25px
</style>