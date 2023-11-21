<template>
	<div 
	class="background">
		<h5>
			Identificación
		</h5>	
		<b-form-input
		class="m-b-15"
		v-model="buyer.name"
		placeholder="Nombre y apellido"></b-form-input>
		<b-form-input
		class="m-b-15"
		v-model="buyer.email"
		placeholder="Correo electronico"></b-form-input>
		<b-form-input
		class="m-b-15"
		v-model="buyer.phone"
		placeholder="Numero de Telefono"></b-form-input>
		<b-button
		@click="next"
		block 
		variant="success">
			<btn-loader
			:loader="loading"
			text="Siguiente"></btn-loader>
		</b-button>
	</div>
</template>
<script>
import payment_set_height from '@/mixins/payment_set_height' 
export default {
	mixins: [payment_set_height],
	components: {
		BtnLoader: () => import('@/components/common/BtnLoader'),
	},
	computed: {
		buyer() {
			return this.$store.state.cart.buyer 
		},
	},
	data() {
		return {
			loading: false,
		}
	},
	methods: {
		next() {
			if (this.check()) {
				this.loading = true
				this.$api.post('buyer', {
					...this.buyer,
					commerce_id: this.commerce.id
				}) 
				.then(res => {
					this.loading = false 
					this.$store.commit('auth/setUser', res.data.model)
					this.$store.dispatch('cart/save')
					setTimeout(() => {
						this.setFirstColHeigth()
					}, 500)
				})
				.catch(err => {
					this.loading = false 
					console.log(err)
					this.$toast.error('Hubo un error')
				})
			}
		},
		check() {
			if (this.buyer.name == '') {
				this.$toast.error('Ingrese su number')
				return false
			}
			if (this.buyer.email == '') {
				this.$toast.error('Ingrese su correo')
				return false
			}
			if (this.buyer.phone == '') {
				this.$toast.error('Ingrese su telefono')
				return false
			}
			return true 
		},
	}
}
</script>
