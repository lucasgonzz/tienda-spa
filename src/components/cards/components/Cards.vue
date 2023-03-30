<template>
	<b-row>
		<b-col
		cols="12"
		lg="6">
			<b-card
			class="m-b-15 shadow"
			title="Selecciona una tarjeta">
				<b-form-group>
					<b-form-select
					id="cardId"
					name="cardId"
					:options="card_options">
					</b-form-select>
				</b-form-group>
				<b-button
				block
				:to="{name: 'PaymentGateway'}"
				variant="success">
					Agregar nueva tarjeta
				</b-button>
			</b-card>
			<b-card
			class="shadow"
			title="Ingresa el codigo de seguridad">
				<b-form-group
				v-if="card_id != ''">
					<b-form-input
					id="cvv"
					placeholder="Codigo de seguridad"
					v-model="security_code"></b-form-input>
				</b-form-group>
				<b-button
				block
				@click="getCardToken"
				variant="success">
					<btn-loader
					:laoder="loading"
					text="Hacer pedido"></btn-loader>
				</b-button>
				<b-button
				block
				:to="{name: 'Payment'}"
				variant="outline-success">
					Volver al pedido
				</b-button>
			</b-card>
		</b-col>
	</b-row>
</template>
<script>
import BtnLoader from '@/components/common/BtnLoader'
export default {
	components: {
		BtnLoader,
	},
	data() {
		return {
			security_code: '',
			loading: false,
		}
	},
	computed: {
		card_options() {
			let options = []
			options.push({
				value: '',
				text: 'Selecciona una tarjeta'
			})
			this.user.cards.forEach(card => {
				options.push({
					value: card.id,
					text: card.payment_method.name+' terminada en '+card.last_four_digits
				})
			})
			return options
		},
		btn_disabled() {
			if (this.card_id != '' && this.security_code != '') {
				return true
			}
			return false
		},
		card_id: {
			get() {
				return this.$store.state.cart.cart.card_id
			},
			set(value) {
				console.log(value)
				this.$store.commit('cart/setCardId', value)
			}
		},
	},
	methods: {
		async getCardToken() {
			if (this.check()) {
				try {
					let mp = new MercadoPago(process.env.VUE_APP_MERCADO_PAGO_PUBLIC_KEY)
					const token = await mp.createCardToken({
						cardId: this.card_id,
						securityCode: this.security_code,
					})

					let form = {
						transaction_amount
					}

					this.savePayment(this.form)

					// Use the received token to make a POST request to your backend
					console.log('token received: ')
					console.log(token)
					// console.log('token received: ', token.id)
				} catch(e) {
					console.error('error creating token: ', e)
				}
			}
		},
		check() {
			if (this.card_id == '') {
				this.$toast.error('Seleccione una tarjeta')
				return false
			}
			if (this.security_code == '') {
				this.$toast.error('Ingrese el codigo de seguridad')
				return false
			}
			return true
		}
	}
}
</script>
<style lang="sass">
.card-img 
	width: 20px
	height: 20px
</style>
	