<template>
	<div
	class="m-b-15">
		<card-payment-method
		v-for="payment_method in payment_methods"
		:key="payment_method.id"
		:payment_method="payment_method"></card-payment-method>
		<!-- <b-form-group
		v-for="payment_method in payment_methods"
		:key="payment_method.id">
			<b-form-radio
			v-model="cart_payment_method"
			:value="payment_method">
				{{ payment_method.name }}
				<p 
				v-if="payment_method.description"
				class="text-muted">
					{{ payment_method.description }}
				</p>
			</b-form-radio>
		</b-form-group> -->
	</div>
</template>
<script>
import CardPaymentMethod from '@/components/payment/components/payment-method/CardPaymentMethod'
// import CartMixin from '@/mixins/cart'
export default {
	// mixins: [CartMixin],
	components: {
		CardPaymentMethod,
	},
	computed: {
		payment_methods() {
			return this.$store.state.payment_methods.models
		},
	},
	// data() {
	// 	return {
	// 		cart_saved: false,
	// 	}
	// },
	// watch: {
	// 	cart_payment_method() {
	// 		if (!this.cart_saved && this.cart_payment_method.type && this.cart_payment_method.type.name == 'MercadoPago') {
	// 			this.cart_saved = true 
	// 			this.$store.dispatch('cart/save')
	// 			this.initMp()
	// 		} else if (this.cart_saved && !this.cart_payment_method.type) {
	// 			let btn = document.getElementsByClassName('mp-btn')
	// 			console.log(btn)
	// 			if (btn.length) {
	// 				btn[0].remove()
	// 			}
	// 			this.cart_saved = false
	// 		}
	// 	}
	// },
	// methods: {
	// 	initMp() {
	// 		const mp = new MercadoPago(this.cart_payment_method.public_key, {
	// 			locale: "es-AR",
	// 		});
	// 		this.$store.commit('auth/setMessage', 'Iniciando MercadoPago')
	// 		this.$store.commit('auth/setLoading', true)
	// 		this.$api.post('mercado-pago/preference', {
	// 			payment_method: this.cart_payment_method,
	// 			cupon: this.cupon,
	// 			delivery_zone: this.cart_delivery_zone,
	// 			articles: this.articles
	// 		})
	// 		.then(res => {
	// 			this.$store.commit('auth/setMessage', '')
	// 			this.$store.commit('auth/setLoading', false)
	// 			// Inicializa el checkout
	// 			console.log(res.data)
	// 			mp.checkout({
	// 				preference: {
	// 					id: res.data.preference_id,
	// 				},
	// 				render: {
	// 					container: ".mp-btn", // Indica el nombre de la clase donde se mostrará el botón de pago
	// 					label: "Pagar", // Cambia el texto del botón de pago (opcional)
	// 				},
	// 			});
	// 		})
	// 		.catch(err => {
	// 			console.log(err)
	// 			this.$store.commit('auth/setMessage', '')
	// 			this.$store.commit('auth/setLoading', false)
	// 		})

	// 	}
	// }
}
</script>