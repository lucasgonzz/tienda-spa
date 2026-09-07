<template>
	<div class="checkout-section">
		<h2 class="checkout-section__title">
			<i class="bi bi-chat-left-text"></i>
			¿Algo que tengamos que saber?
		</h2>

		<div class="checkout-field">
			<b-form-textarea
			rows="3"
			:placeholder="placeholder"
			v-model="description"></b-form-textarea>
		</div>
	</div>
</template>
<script>
export default {
	computed: {
		placeholder() {
			if (this.commerce.online_configuration.order_description) {
				return this.commerce.online_configuration.order_description
			}
			return 'Contanos lo que necesitemos saber para prepararlo o entregarlo'
		},
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