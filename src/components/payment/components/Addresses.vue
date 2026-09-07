<template>
	<div
	class="checkout-section"
	v-if="deliver && user">
		<h2 class="checkout-section__title">
			<i class="bi bi-geo-alt"></i>
			¿Dónde te lo llevamos?
		</h2>

		<div class="checkout-field">
			<label class="checkout-field__label">
				Dirección de entrega
			</label>

			<b-form-input
			v-if="user.seller_id && selected_buyer"
			v-model="selected_buyer.comercio_city_client.address"
			placeholder="Calle, número, piso o departamento"></b-form-input>

			<b-form-input
			v-else-if="user.address"
			v-model="user.address"
			placeholder="Calle, número, piso o departamento"></b-form-input>

			<b-form-input
			v-else-if="user.comercio_city_client"
			v-model="user.comercio_city_client.address"
			placeholder="Calle, número, piso o departamento"></b-form-input>
		</div>
	</div>
</template>
<script>
export default {
	computed: {
		address_id: {
			get() {
				return this.$store.state.cart.cart.address_id
			},
			set(value) {
				this.$store.commit('cart/setAddressId', value)
			}
		},
		deliver() {
			return this.$store.state.cart.cart.deliver
		},
		selected_buyer() {
			return this.$store.state.cart.selected_buyer
		},
	}
}
</script>
