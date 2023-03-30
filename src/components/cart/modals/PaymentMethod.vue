<template>
<b-modal id="payment-method" title="Metodo de Pago" size="sm" hide-footer hide-header>
	<p>Seleccione el metodo de pago</p>
	<b-form-group
	:description="efectivo_description">
		<b-form-radio
		value="efectivo"
		v-model="payment_method">
			Efectivo
		</b-form-radio>
	</b-form-group>
	<b-form-group
	:description="tarjeta_description">
		<b-form-radio
		value="tarjeta"
		v-model="payment_method">
			Con tarjeta
		</b-form-radio>
	</b-form-group>
	<b-form-group>
		<b-button
		@click="run"
		block
		variant="success">
			{{ text }}
		</b-button>
	</b-form-group>
</b-modal>
</template>
<script>
import CartMixin from '@/mixins/cart'
export default {
	name: 'PaymentMethod',
	mixins: [CartMixin],
	computed: {
		text() {
			if (this.payment_method == 'efectivo') {
				return 'Hacer pedido'
			}
			return 'Siguiente'
		},
		payment_method: {
			get() {
				return this.$store.state.cart.cart.payment_method
			},
			set(value) {
				this.$store.commit('cart/setPaymentMethod', value)
			} 
		},
		tarjeta_description() {
			if (this.cart.deliver) {
				return `${this.efectivo_description}, mas ${this.commerce.percentage_card}% de interes: ${this.price(this.total_efectivo + (this.total_efectivo * this.percentage_card_formated))}` 
			}
			return `Mas ${this.commerce.percentage_card}% de interes: ${this.price(this.total_efectivo + (this.total_efectivo * this.percentage_card_formated))}` 
		},
		efectivo_description() {
			if (this.cart.deliver) {
				return `Mas ${this.price(this.commerce.delivery_price)} de envio: ${this.price(this.total_efectivo)}`
			}
			return null
		},
		total_efectivo() {
			if (this.cart.deliver) {
				return this.total + parseFloat(this.commerce.delivery_price)
			}
			return this.total
		}
	},
	methods: {
		run() {
			this.$bvModal.hide('payment-method')
			this.$store.dispatch('cart/save')
			if (this.payment_method == 'tarjeta') {
				this.$store.commit('cart/setVicibility', false)
				this.$router.push({name: 'PaymentGateway'})
				this.$scrollToTop()
			} else { 
				this.makeOrder()
			}
		}
	}
}
</script>