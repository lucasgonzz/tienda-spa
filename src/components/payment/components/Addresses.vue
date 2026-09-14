<template>
	<!--
		Con envio por correo (opcion de Zipnova elegida) este bloque no se muestra: la direccion
		completa la pide DireccionEnvio.vue, con calle, numero, localidad y provincia por separado.
	-->
	<div
	class="checkout-section"
	v-if="deliver && user && !envio_zipnova_elegido">
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
import cart from '@/mixins/cart'
export default {
	mixins: [cart],
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
