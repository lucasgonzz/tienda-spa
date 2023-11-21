<template>
	<div
	class="payment-view">
		<b-row>
			<b-col
			id="first-col"
			md="7"
			xl="6"
			offset-xl="1"
			cols="12">
				<buyer
				v-if="!commerce.online_configuration.register_to_buy"></buyer>	
				<deliver
				v-else></deliver>
			</b-col>
			<b-col
			id="col-cart-resum"
			v-if="!is_mobile"
			class="col-cart-articles"
			md="5"
			xl="4"
			cols="12">
				<cart-resume></cart-resume>
			</b-col>
			<b-col
			v-if="show_content"
			id="3rt-col"
			md="7"
			xl="6"
			offset-xl="1"
			cols="12">
				<deliver
				v-if="!commerce.online_configuration.register_to_buy"></deliver>
				<addresses></addresses>
				<delivery-zones></delivery-zones>
				<cupon></cupon>
				<payment-method></payment-method>
				<description></description>
				<!-- <btn-save></btn-save> -->
			</b-col>
			<b-col
			v-if="is_mobile"
			cols="12">
				<cart-resume></cart-resume>
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
import payment_set_height from '@/mixins/payment_set_height' 
export default {
	mixins: [payment_set_height],
	components: {
		CartResume: () => import('@/components/payment/components/CartResume'),
		Buyer: () => import('@/components/payment/components/Buyer'),
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
		this.setFirstColHeigth()
	},
	computed: {
		show_content() {
			if (!this.commerce.online_configuration.register_to_buy) {
				if (this.user) {
					return true 
				}
				return false
			} 
			return true 
		},
		cart_buyer() {
			return this.$store.state.cart.buyer 
		},
	},
	methods: {
	}
	
}	
</script>
<style lang="sass">
.payment-view
	padding: 130px 0
	.row 
		justify-content: flex-start
	.col-cart-articles
		@media screen and (min-width: 768px)
			position: sticky
			position: -webkit-sticky
			top: 100px
			// right: 25px
	h5
		text-align: left !important
		margin: 10px 0 25px !important
		font-weight: bold

	.background 
		background: #FFF
		border-radius: 5px
		padding: 15px
		width: 100%
		margin-bottom: 15px
</style>