<template>
	<div>
		<p>
			Detalles del pago
		</p>
		{{ res }}
	</div>
</template>
<script>
import cart from '@/mixins/cart'
export default {
	mixins: [cart],
	computed: {
		payment_id() {
			return this.$route.query.payment_id
		},
		payment_method_id() {
			return this.$route.query.payment_method_id
		},
	},
	created() {
		this.getPayment()
	},
	data() {
		return {
			res: null,
		}
	},
	methods: {
		getPayment() {
			this.$api.get('mercado-pago/payment/'+this.payment_id+'/'+this.payment_method_id)
			.then(res => {
				console.log(res)
				this.res = res.data.json_data
			})
			.catch(err => {
				console.log(err)
			})
		}
	}
}
</script>