<template>
	<div>
		<card-payment-method
		v-for="payment_method in payment_methods"
		:key="payment_method.id"
		:payment_method="payment_method"></card-payment-method>
	</div>
</template>
<script>
import CardPaymentMethod from '@/components/payment/components/payment-method/CardPaymentMethod'
export default {
	components: {
		CardPaymentMethod,
	},
	computed: {
		payment_methods() {
			return this.$store.state.payment_methods.models
		},
	},
}
</script>
