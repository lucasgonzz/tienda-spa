<template>
	<div
	v-if="!cupon">
		<b-form-group
		label="Busca un cupon para obtener tu descuento">
			<b-form-input
			v-model="code"
			@keyup.enter="searchCupon"
			placeholder="Ingrese el codigo del cupon"></b-form-input>
		</b-form-group>
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
						this.$store.commit('cart/setPaymentMethod', null)
						this.setBtnMpVisible(false)
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