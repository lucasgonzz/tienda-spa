<template>
	<div>
		<h5>
			Notas para el pedido
		</h5>
		<b-form-group>
			<b-form-textarea
			:placeholder="commerce.order_description"
			v-model="description"></b-form-textarea>
		</b-form-group>
	</div>
</template>
<script>
export default {
	computed: {
		description: {
			get() {
				return this.$store.state.cart.cart.description
			},
			set(value) {
				this.$store.commit('cart/setDescription', value)
			}
		},
	},
}
</script>