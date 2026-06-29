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
		v-model="buyer.email"
		placeholder="Correo electronico"></b-form-input>
		<b-form-input
		class="m-b-15"
		v-model="buyer.phone"
		placeholder="Numero de Telefono"></b-form-input>
	</div>
</template>
<script>
import payment_set_height from '@/mixins/payment_set_height'
export default {
	mixins: [payment_set_height],
	computed: {
		buyer() {
			return this.$store.state.cart.buyer
		},
	},
}
</script>
