<template>
	<b-row
	v-if="!pedido_a_consultar"
	class="view">
		<b-col
		md="8"
		lg="6"
		cols="12">
			<payway></payway>	
		</b-col>
	</b-row>
</template>
<script>
import cart from '@/mixins/cart'
export default {
	mixins: [cart],
	components: {
		Payway: () => import('@/components/payment-card/components/Payway'),
	},
	watch: {
		pedido_a_consultar: {
			immediate: true,
			handler(valor) {
				if (valor) {
					this.$router.replace({ name: 'Payment' })
				}
			},
		},
	},
}
</script>
