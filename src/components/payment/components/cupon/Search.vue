<template>
	<div
	v-if="!cupon">
		<div class="checkout-field">
			<b-form-input
			v-model="code"
			@keyup.enter="searchCupon"
			placeholder="Escribí tu código de cupón"></b-form-input>
		</div>
		<b-button
		block 
		variant="primary"
		@click="searchCupon">
			<btn-loader
			text="Buscar"
			:loader="loading"></btn-loader>
		</b-button>
	</div>
</template>
<script>
import BtnLoader from '@/components/common/BtnLoader'

import cupons from '@/mixins/cupons'
import cart from '@/mixins/cart'
export default {
	mixins: [cupons, cart],
	components: {
		BtnLoader,
	},
	computed: {
		cart() {
			return this.$store.state.cart.cart
		}
	},
	data() {
		return {
			code: '',
			loading: false,
		}
	},
	methods: {
		searchCupon() {
			this.loading = true 
			this.$api.get('cupons/search/'+process.env.VUE_APP_COMMERCE_ID+'/'+this.code)
			.then(res => {
				this.loading = false
				this.code = ''
				let cupon = res.data.cupon 
				if (cupon) {
					if (this.checkMinAmount(cupon)) {
						this.$store.commit('cart/setCupon', cupon)
						// Se limpia la forma de pago porque el cupon cambia el total y el
						// comprador tiene que volver a elegir sobre el precio nuevo.
						//
						// Antes aca tambien se escondia a mano el boton que dibujaba el SDK de
						// Mercado Pago (setBtnMpVisible(false)): ese boton pedia su preferencia al
						// elegir la forma de pago, o sea ANTES del cupon, y quedaba con el precio
						// viejo. Desde el 7/9/2026 la preferencia se pide recien al confirmar, con
						// el total que el comprador esta viendo, asi que no hay nada que esconder.
						this.$store.commit('cart/setPaymentMethod', null)
						this.$toast.success('Cupon agregado')
					}
				} else {
					this.$toast.error('Codigo incorrecto')
				}
			})
			.catch(err => {
				this.loading = false
				console.log(err)
				this.$toast.error('Error al buscar cupon')
			})
		},
		checkMinAmount(cupon) {
			if (cupon.min_amount && this.total < cupon.min_amount) {
				this.$toast.error('El monto minimo para este cupon es de: '+this.price(cupon.min_amount))
				return false
			}
			return true
		},
	}
}
</script>