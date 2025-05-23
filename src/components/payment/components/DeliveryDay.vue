<template>
	<div
	class="background">
		<h5>
			Seleccione el dia de entrega para su pedido
		</h5>
		<b-select 
		:options="options"
		v-model="fecha_entrega">
			<option v-for="date in delivery_days" :key="date.value" :value="date.value">
				{{ date.label }}
			</option>
		</b-select>
	</div>
</template>
<script>
export default {
	created() {
        this.$store.dispatch('delivery_day/getModels')
		// this.get_delivery_days()
	},	
	computed: {
		fecha_entrega: {
			get() {
				let fecha_entrega = this.$store.state.cart.fecha_entrega
				if (!fecha_entrega) {
					return 0
				}
				return fecha_entrega
			},
			set(value) {
				console.log(value)
				this.$store.commit('cart/set_fecha_entrega', value)
			}
		},	
		delivery_days() {
			return this.$store.state.delivery_day.models
		},
		options() {
			let options = [{
				value: 0,
				text: 'Seleccione el dia de entrega'
			}]
			this.delivery_days.forEach(day => {
				options.push({
					value: day.value,
					text: day.label
				})
			})
			return options
		}
	},
	methods: {
		get_delivery_days() {
			this.$api.get('delivery-day/'+this.commerce.id)
			.then(res => {
				this.delivery_days = res.data.models 
			})
		}
	}
}
</script>