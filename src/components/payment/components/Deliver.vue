<template>
	<div
	class="background">
		<h5>
			Entrega del pedido
		</h5>
		<b-form-group
		v-for="deliver_option in deliver_options"
		:key="deliver_option.value">
			<b-form-radio
			button-variant="success"
			v-model="deliver"
			:value="deliver_option.value">
				{{ deliver_option.name }}
			</b-form-radio>
		</b-form-group>
	</div>
</template>
<script>
export default {
	computed: {
		deliver_options() {
			let options = []
			if (this.commerce.online_configuration.has_delivery) {
				options.push({
					name: 'Envio a domicilio',
					icon: 'check',
					value: 1,
				})
			}
			options.push({
				name: 'Retiro por local',
				icon: 'poniter',
				value: 0,
			})
			return options
		},
		deliver: {
			get() {
				return this.$store.state.cart.cart.deliver
			},
			set(value) {
				this.$store.commit('cart/setDeliver', value)
			}
		}
	}
}
</script>