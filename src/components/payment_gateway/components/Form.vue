<template>
	<form id="form-checkout">
		<input
		type="hidden"
		v-model="user.email"
		id="form-checkout__cardholderEmail"
		name="cardholderEmail"></input>
		<b-card
		v-if="!user.document"
		class="m-b-15 shadow"
		title="Datos del comprador">
			<div
			v-if="!user.document">
				<b-form-group
				label="Tipo de documento">
					<b-form-select
					:options="doc_type_options"
					v-model="form.doc_type"
					ref="docType"
					name="identificationType"
					id="form-checkout__identificationType"></b-form-select>
				</b-form-group>
				<b-form-group
				label="Numero de documento">
					<b-form-input
					v-model="form.doc_number"
					name="identificationNumber"
					type="number"
					id="form-checkout__identificationNumber"></b-form-input>
				</b-form-group>
			</div>
		</b-card>
		<div
		v-else>
			<input
			type="hidden"
			v-model="user.document.type"
			ref="docType"
			name="identificationType"
			id="form-checkout__identificationType"></input>
			<input
			type="hidden"
			v-model="user.document.number"
			name="identificationNumber"
			id="form-checkout__identificationNumber"></input>
		</div>
		<b-card
		class="shadow"
		title="Datos de la tarjeta">
			<b-form-group
			label="Titular de la tarjeta">
				<b-form-input
				v-model="form.titular"
				name="cardholderName"
				id="form-checkout__cardholderName"></b-form-input>
			</b-form-group>
			<b-form-group
			label="Numero de la tarjeta">
				<b-form-input
				v-model="form.card_number"
				type="number"
				name="cardNumber"
				id="form-checkout__cardNumber"></b-form-input>
			</b-form-group>
			<b-form-group
			label="Fecha de vencimineto">
				<div class="card-expiration">
					<b-form-input
					@change="setMonth"
					@keyup="checkMonth"
					type="number"
					v-model="form.month"
					id="form-checkout__cardExpirationMonth"
					name="cardExpirationMonth"></b-form-input>
					<span>
						/
					</span>
					<b-form-input
					@keyup="checkYear"
					v-model="form.year"
					type="number"
					id="form-checkout__cardExpirationYear"
					name="cardExpirationYear"></b-form-input>
				</div>
			</b-form-group>
			<b-form-group
			label="Código de seguridad">
				<b-form-input
				name="securityCode"
				id="form-checkout__securityCode"></b-form-input>
			</b-form-group>
			<b-form-group
			label="Banco emisor">
				<b-form-select
				v-model="form.issuer"
				name="issuer"
				id="form-checkout__issuer"></b-form-select>
			</b-form-group>
			<b-form-group
			label="Cuotas">
				<b-form-select
				v-model="form.installments"
				name="installments"
				id="form-checkout__installments"></b-form-select>
			</b-form-group>
			<b-form-group>
				<b-button
				block
				id="form-checkout__submit"
				class="m-b-15"
				variant="success"
				type="submit">
					<btn-loader
					text="Hacer pedido"
					:loader="loading"></btn-loader>
				</b-button>
				<b-button
				@click="changePaymentMethod"
				block
				variant="outline-success">
					Cambiar metodo de pago
				</b-button>
			</b-form-group>
		</b-card>
	</form>
</template>
<script>
import CartMixin from '@/mixins/cart' 
import payment_gateway from '@/mixins/payment_gateway' 
import BtnLoader from '@/components/common/BtnLoader' 
export default {
	name: 'PaymentGatewayForm',
	mixins: [CartMixin, payment_gateway],
	components: {
		BtnLoader,
	},
	created() {
		this.setTitle('Tarjeta')
		this.setTransactionAmount()
		this.setDescription()
		setTimeout(() => {
			this.initMercadoPago()
		}, 500)
	},
	computed: {
		url() {
			return process.env.VUE_APP_API_URL+'/procesar-pago'
		},
		doc_type_options() {
			return [
				{ value: 'DNI', text: 'DNI' },
				{ value: 'CI', text: 'Cédula' },
				{ value: 'LC', text: 'L.C' },
				{ value: 'LE', text: 'L.E' },
			]
		},
	},
	data() {
		return {
			form: {
				titular: '',
				month: '',
				year: '',
				token: '',
				description: '',
				installments: 0,
				transaction_amount: 0,
				payment_method_id: 0,
				email: '',
				card_number: '',
				card_id: 0,
				customer_id: null,
				doc_type: 'DNI',
				doc_number: '',
				issuer: 0,
			},
			cards: [],
			use_customer_card: false,
			loading_cards: false,
			loading: false,
			mp: null,
		}
	},
	methods: {
		setMonth() {
			if (this.form.month.length == 1) {
				this.form.month = '0'+this.form.month
			}
		},
		checkMonth() {
			if (this.form.month.length == 2) {
				document.getElementById('form-checkout__cardExpirationYear').focus()
			}
		},
		checkYear() {
			if (this.form.year.length == 2) {
				document.getElementById('form-checkout__securityCode').focus()
			}
		},
		changePaymentMethod() {
			this.$router.push({name: 'Payment'})
			// this.$router.go(-1)
		},
		setTransactionAmount() {
			this.form.transaction_amount = this.total_with_deliver.toString()
		},
		setDescription() {
			let description = 'Compra de '
			this.articles.forEach(article => {
				description += article.name += ' '
			})
			this.form.description = description
		},
		initMercadoPago() {
			this.mp = new MercadoPago(process.env.VUE_APP_MERCADO_PAGO_PUBLIC_KEY)
			const cardForm = this.mp.cardForm({
				amount: this.form.transaction_amount,
				autoMount: true,
				form: {
					id: "form-checkout",
					cardholderName: {
						id: "form-checkout__cardholderName",
						placeholder: "Titular de la tarjeta",
					},
					cardholderEmail: {
						id: "form-checkout__cardholderEmail",
						placeholder: "Correo electronico",
					},
					cardNumber: {
						id: "form-checkout__cardNumber",
						placeholder: "Número de la tarjeta",
					},
					cardExpirationMonth: {
						id: "form-checkout__cardExpirationMonth",
						placeholder: "Mes de vencimiento",
					},
					cardExpirationYear: {
						id: "form-checkout__cardExpirationYear",
						placeholder: "Año de vencimiento",
					},
					securityCode: {
						id: "form-checkout__securityCode",
						placeholder: "Código de seguridad",
					},
					installments: {
						id: "form-checkout__installments",
						placeholder: "Cuotas",
					},
					identificationType: {
						id: "form-checkout__identificationType",
						placeholder: "Tipo de documento",
					},
					identificationNumber: {
						id: "form-checkout__identificationNumber",
						placeholder: "Número de documento",
					},
					issuer: {
						id: "form-checkout__issuer",
						placeholder: "Banco emisor",
					},
				},
				callbacks: {
					onFormMounted: error => {
						if (error) {
							console.warn("Form Mounted handling error: ")	
							console.warn(error)
							return	
						} 
						console.log("Form mounted")
					},
					onSubmit: event => {
						event.preventDefault()

						let card_data = cardForm.getCardFormData()
						console.log('card_data:')
						console.log(card_data)
						
						this.form.transaction_amount = card_data.amount
						this.form.installments = card_data.installments
						this.form.issuer = card_data.issuerId
						this.form.payment_method_id = card_data.paymentMethodId
						this.form.token = card_data.token

						this.savePayment(this.form)
					},
					onFetching: (resource) => {
						console.log("Fetching resource: ")
						console.log(resource)
					},
				},
			})
		},
	}
}
</script>
<style lang="sass">
#form-checkout
	.col-form-label
		text-align: left
		// padding-left: 1em
	.card-expiration
		display: flex 
		justify-content: space-between
		input
			width: 47%
		span 
			font-size: 1.5em
</style>