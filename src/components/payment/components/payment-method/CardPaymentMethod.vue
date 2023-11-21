<template>
	<div 
	@click="setSelected"
	:class="is_selected"
	class="payment-method shadow-1 b-r-1 m-b-15 c-p">
		<p class="name">
			{{ payment_method.name }}
		</p>
		<p 
		v-if="payment_method.discount"
		class="discount">
			<i class="icon-right"></i>
			Descuento del 
			{{ payment_method.discount }}%
		</p>
		<p 
		v-if="payment_method.surchage"
		class="discount">
			<i class="icon-right"></i>
			Recargo del 
			{{ payment_method.surchage }}%
		</p>
		<p 
		v-if="payment_method.description"
		class="description">
			<i class="icon-right"></i>
			{{ payment_method.description }}
		</p>
	</div>
</template>
<script>
import cart from '@/mixins/cart'
export default {
	props: ['payment_method'],
	mixins: [cart],
	data() {
		return {
			cart_saved: false,
		}
	},
	computed: {
		is_selected() {
			if (this.cart_payment_method && this.cart_payment_method.id == this.payment_method.id) {
				return 'selected'
			}
			return ''
		}
	},
	methods: {
		setSelected() {
			if (!this.cart_payment_method || (this.cart_payment_method.id != this.payment_method.id)) {
				this.$store.commit('cart/setPaymentMethod', this.payment_method)
				this.$store.dispatch('cart/save')
				.then(() => {
					if (this.cart_payment_method.type && this.cart_payment_method.type.name == 'MercadoPago') {
						this.makeOrder(true)
						this.initMp()
					} else {
						this.setBtnMpVisible(false)
					}
				})
			}
		},
		initMp() {
			console.log('initMp')
			const mp = new MercadoPago(this.cart_payment_method.public_key, {
				locale: "es-AR",
			});
			this.$api.post('mercado-pago/preference', {
				payment_method: this.cart_payment_method,
				cupon: this.cupon,
				delivery_zone: this.cart_delivery_zone,
				articles: this.articles
			})
			.then(res => {
				// Inicializa el checkout
				console.log(res.data)
				mp.checkout({
					preference: {
						id: res.data.preference_id,
					},
					render: {
						container: ".mp-btn", // Indica el nombre de la clase donde se mostrará el botón de pago
						label: "Pagar a través de Mercado Pago"
					},
				});
				this.setBtnMpVisible(true)
			})
			.catch(err => {
				console.log(err)
				this.$store.commit('auth/setMessage', '')
				this.$store.commit('auth/setLoading', false)
			})

		},
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.payment-method
	transition: all .2s
	background: #FFF
	padding: 1em
	width: 90%
	margin: auto
	@if ($theme == dark) 
		background: #000
	p 
		text-align: left
	.name 
		font-weight: bold
	&.selected
		width: 100%
		border-left: 5px solid $green
		box-shadow: 0px 5px 10px -1px $green !important
		-webkit-box-shadow: 0px 5px 10px -1px $green !important
		-moz-box-shadow: 0px 5px 10px -1px $green !important
</style>