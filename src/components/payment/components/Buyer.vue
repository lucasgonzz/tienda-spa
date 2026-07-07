<template>
	<div class="background">
		<h5>
			Identificación
		</h5>
		<b-form-input
		class="m-b-15"
		v-model="buyer.name"
		placeholder="Nombre y apellido"></b-form-input>
		<b-form-input
		class="m-b-15"
		v-model="buyer.phone"
		placeholder="Telefono sin 0 ni 15. Ej: 3444622139"></b-form-input>
		<b-form-input
		class="m-b-15"
		v-model="buyer.email"
		placeholder="Correo electronico"></b-form-input>
		<b-form-input
		class="m-b-15"
		v-model="buyer.ciudad"
		placeholder="Ciudad"></b-form-input>
		<b-form-input
		v-if="commerce.online_configuration.pedir_barrio_al_registrarse"
		class="m-b-15"
		v-model="buyer.barrio"
		placeholder="Barrio"></b-form-input>
		<b-form-input
		class="m-b-15"
		v-model="buyer.address"
		placeholder="Direccion"></b-form-input>
	</div>
</template>
<script>
import payment_set_height from '@/mixins/payment_set_height'
export default {
	mixins: [payment_set_height],
	computed: {
		/**
		 * Datos del comprador invitado persistidos en el store del carrito.
		 *
		 * @returns {object}
		 */
		buyer() {
			return this.$store.state.cart.buyer
		},
	},
}
</script>
