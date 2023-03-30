<template>
	<b-col
	v-if="show"
	cols="11"
	lg="5">
		<b-card
		class="s">
			<p
			class="text-justify">
				Por favor, ingresa tu numero de teléfono para que podamos ponernos en contacto con vos y coordinar los detalles de tu compra. 
			</p>
			<b-button
			:to="{name: 'Configuration'}"
			variant="primary"
			block>
				Ingresar teléfono
			</b-button>
		</b-card>
	</b-col>
</template>
<script>
export default {
	computed: {
		order() {
			return this.$store.state.orders.order
		},
		show() {
			return this.order && !this.user.phone
		},
	}
}
</script>