<template>
	<div
	v-if="user.seller_id"
	class="background">
		<h5>
			Asignar Cliente para este Pedido
		</h5>

		<div class="j-between">
			
			<b-form-input
			@keyup.enter="search_buyer"
			v-model="query"
			placeholder="Buscar perfil de Cliente"></b-form-input>

			<b-button
			@click="search_buyer"
			class="m-l-10"
			variant="primary">
				<i class="icon-search"></i>
			</b-button>
		</div>

		<div 
		class="buyer b-r s"
		v-for="buyer in buyers"
		:key="buyer.id">
			<b-form-radio
			v-model="buyer_id"
			:value="buyer.id">
				<p>
					<strong>{{ buyer.name }}</strong>
				</p>	
				<p>
					{{ buyer.email }}
				</p>	
			</b-form-radio>
		</div>
	</div>
</template> 
<script>
export default { 
	data() {
		return {
			query: '',
			buyers: [],
		}
	},
	computed: {
		buyer_id: {
			get() {
				return this.$store.state.cart.buyer_id
			},
			set(value) {
				this.$store.commit('cart/set_buyer_id', value)

				let buyer = this.buyers.find(_b => _b.id == value)
				this.$store.commit('cart/set_selected_buyer', buyer)
			}
		}
 	},
	methods: {
		search_buyer() {
			this.$store.commit('auth/setMessage', 'Buscando Cliente')
			this.$store.commit('auth/setLoading', true)
			
			this.$store.commit('cart/set_buyer_id', null)
			this.$store.commit('cart/set_selected_buyer', null)


			this.$api.get('buyer/search/'+this.query+'/'+this.commerce.id) 
			.then(res => {
				this.$store.commit('auth/setLoading', false)
				this.buyers = res.data.buyers 
				if (!this.buyers.length) {
					this.$toast.error('No se encontraron resultados')
				} 
			})
			.catch(err => {
				console.log(err)
				this.$store.commit('auth/setLoading', false)
			})
			
		}
	}
}
</script>
<style lang="sass">
.buyer
	padding: 1em
	margin: 15px 0
</style>