<template>
	<div
	class="payment-view">
		<b-row>
			<b-col
			md="8"
			lg="6"
			cols="12">
				<deliver></deliver>
				<addresses></addresses>
				<delivery-zones></delivery-zones>
				<cupon></cupon>
				<payment-method></payment-method>
				<description></description>
				<btn-save></btn-save>
			</b-col>
		</b-row>
	</div>
</template>
<script>
import Deliver from '@/components/payment/components/Deliver'
import PaymentMethod from '@/components/payment/components/payment-method/Index'
import Addresses from '@/components/payment/components/Addresses'
import DeliveryZones from '@/components/payment/components/DeliveryZones'
import Cupon from '@/components/payment/components/cupon/Index'
import Description from '@/components/payment/components/Description'
import BtnSave from '@/components/payment/components/BtnSave'
export default {
	components: {
		Deliver,
		PaymentMethod,
		Addresses,
		DeliveryZones,
		Cupon,
		Description,
		BtnSave,
	},
	created() {
		this.setTitle('Pedido')
		this.$store.commit('cart/setPaymentMethod', null)
	}
}	
</script>
<style lang="sass">
.payment-view
	padding: 130px 0
	h5
		text-align: left !important
		margin: 35px 0 !important
</style>