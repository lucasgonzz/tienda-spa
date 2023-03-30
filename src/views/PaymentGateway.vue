<template>
<div>
	<cards></cards>
	<b-row
	class="view payment-gateway">
		<b-col
		cols="12"
		lg="6">
			<h5 
			class="text-center">
				Procesaremos el pago despues de confirmar que podemos cumplir con tu pedido
			</h5>
			<payment-form></payment-form>
		</b-col>
	</b-row>
</div>
</template>
<script>
import PaymentForm from '@/components/payment_gateway/components/Form' 
import Cards from '@/components/payment_gateway/modals/Cards' 
export default {
	name: 'PaymentGateway',
    metaInfo: {
        titleTemplate: 'Pagar con tarjeta',
    },
	components: {
		PaymentForm,
		Cards,
	},
	computed: {
		cart() {
			return this.$store.state.cart.cart
		}
	},
	created() {
		if (this.cart.payment_method != 'tarjeta') {
			this.$router.replace({name: 'Home'})
		}
		this.setTitle('Pago')
	}
}
</script>
<style lang="sass">
.payment-gateway
	h5 
		margin: 1em 0
</style>