<template>
	<div class="payment-methods-info">
		<div 
		v-for="payment_method in payment_methods_to_show"
		class="payment-method-info shadow-1">
			<i class="icon-check"></i>
			<p>
				Con {{ payment_method.name }}: <strong>{{ priceWith(payment_method) }}</strong> {{ info(payment_method) }}
			</p>
		</div>
	</div>
</template>
<script>
export default {
	computed: {
		payment_methods() {
			return this.$store.state.payment_methods.models
		},
		payment_methods_to_show() {	
			return this.payment_methods.filter(model => {
				return model.surchage || model.discount 
			})
		},
	},
	methods: {
		priceWith(payment_method) {
			let price = this.articlePriceEfectivo(this.article_to_show, false)
			if (payment_method.discount) {
				price -= price * payment_method.discount / 100
			} else {
				price += price * payment_method.surchage / 100
			}
			price = Math.round(price)
			return this.price(price)
		},
		info(payment_method) {
			if (payment_method.discount) {
				return payment_method.discount+'% off'
			} else {
				return payment_method.surchage+'% mas'
			}
		}
	}
}
</script>
<style lang="sass">
.payment-method-info
	background: #FDFDFD 
	margin-bottom: 15px
	padding: 15px
	border-radius: 7px
	display: flex 
	flex-direction: row 
	align-items: center
	i 
		padding-right: 15px
		font-size: 22px
		color: #3FBB6D
	p 
		text-align: left
</style>
