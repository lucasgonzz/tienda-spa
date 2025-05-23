<template>
	<div
	v-if="commerce.online_configuration.usar_cupones">
		<h5>
			Cupones
		</h5>
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
		<div
		class="m-t-20"
		v-if="cart.cupons.length">
			<p>
				Cupones en uso
			</p>
			<cupon-card
			v-for="cupon in cart.cupons"
			class="c-p"
			:class="activeCupon(cupon)"
			:cupon="cupon"></cupon-card>	
		</div>
		<hr>
	</div>
	<!-- <b-card
	class="m-b-15 s"
	title="Cupones"
	v-if="active_cupons.length">
		<div
		@click="addCupon(cupon)"
		v-for="cupon in active_cupons"
		:key="cupon.id">
			<cupon-card
			class="c-p"
			:class="activeCupon(cupon)"
			:cupon="cupon"></cupon-card>		
		</div>
	</b-card> -->
</template>
<script>
import CuponCard from '@/components/cupons/components/CuponCard'
import BtnLoader from '@/components/common/BtnLoader'

import cupons from '@/mixins/cupons'
import cart from '@/mixins/cart'
export default {
	mixins: [cupons, cart],
	components: {
		CuponCard,
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
					if (cupon.min_amount && !this.total_efectivo < cupon.min_amount) {
						this.$toast.error('El monto minimo para este cupon es de: '+this.price(cupon.min_amount))
					} else {
						this.cart.cupons.push(cupon)
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
		addCupon(cupon) {
			if (this.checkMinAmount(cupon)) {
				if (this.isActiveCupon(cupon) != -1) {
					this.cart.cupons.splice(this.isActiveCupon(cupon), 1)
				} else {
					this.cart.cupons.push(cupon)
				}
				console.log(this.cart.cupons)
			}
		},
		checkMinAmount(cupon) {
			if (cupon.min_amount && this.total_efectivo < cupon.min_amount) {
				this.$toast.error('Tu pedido no cumple con el monto minimo')
				return false
			}
			return true
		},
		activeCupon(cupon) {
			let index = this.cart.cupons.findIndex(c => {
				return c.id == cupon.id
			})
			if (this.isActiveCupon(cupon) != -1) {
				return ' outline-success '
			}
			return ' asd '
		},
		isActiveCupon(cupon) {
			return this.cart.cupons.findIndex(c => {
				return c.id == cupon.id
			})
		}
	}
}
</script>