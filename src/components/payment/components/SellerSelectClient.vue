<template>
	<!--
		El "user &&" no sobra: Payment.vue monta este componente SIN condicion, asi que se
		renderiza tambien cuando no hay sesion (navegacion directa a /confirmar-compra, o
		sesion caida). Con user en null esto tiraba un TypeError en tiempo de RENDER, con el
		mismo mensaje que el del boton -- "Cannot read properties of null (reading
		'seller_id')" --, y Vue se comia el componente sin romper la pagina, asi que el
		defecto quedaba solo como una linea roja en la consola.
	-->
	<div
	v-if="user && user.seller_id"
	class="checkout-section">
		<h2 class="checkout-section__title">
			<i class="bi bi-person-badge"></i>
			Cliente de este pedido
		</h2>

		<div class="j-between">
			
			<b-form-input
			@keyup.enter="search_buyer"
			v-model="query"
			placeholder="Buscar perfil de Cliente"></b-form-input>

			<b-button
			@click="search_buyer"
			class="m-l-10"
			variant="primary">
				<i class="bi bi-search"></i>
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