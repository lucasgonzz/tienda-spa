<template>
	<div class="form-payway">
		<form 
		id="formulario">
			<fieldset>
				<input 
				class="input-100"
				v-model="titular"
				type="text" data-decidir="card_holder_name" placeholder="Nombre del titular"/>

				<input 
				type="text" 
				class="input-100"
				v-model="numero_tarjeta"
				data-decidir="card_number" placeholder="Numero de tarjeta"/>

				<div class="cont-input">
					<input 
					class="input-30"
					v-model="codigo_seguridad"
					type="text"  data-decidir="security_code" placeholder="XXX"/>

					<input 
					class="input-30"
					v-model="mes"
					type="text"  data-decidir="card_expiration_month" placeholder="Mes"/>

					<input 
					v-model="ano"
					class="input-30"
					type="text"  data-decidir="card_expiration_year" placeholder="Año"/>
				</div>

				<div class="cont-input">
					<!-- <label for="card_holder_doc_type">Tipo de documento:</label> -->
					<select 
					class="input-50"
					data-decidir="card_holder_doc_type">
						<option value="dni">DNI</option>
					</select>

					<input 
					class="input-50"
					v-model="documento"
					type="text"data-decidir="card_holder_doc_number" placeholder="Numero de documento"/>
				</div>

				<select
				class="input-100"
				v-model="payment_method_id">
					<option 
					:value="0">
						Seleccione tarjeta
					</option>
					<option 
					v-for="payment_method in payment_methods"
					:value="payment_method.id_medio_pago">
						{{ payment_method.descripcion }}
					</option>
				</select>


				<!-- <label for="card_holder_doc_type">Cuotas:</label> -->
				<select
				class="input-100"
				v-model="selected_installments">
					<option 
					:value="0">
						Seleccione las cuotas
					</option>
					<option 
					v-for="installment in installments"
					:value="installment.installments">
						{{ installmentName(installment) }}
					</option>
				</select>

				<b-button
				block 
				variant="success"
				@click="sendForm">
					Enviar Pedido
				</b-button>
			</fieldset>
		</form>
	</div>
</template>
<script>
import cart from '@/mixins/cart'
import payment_methods from '@/mixins/payment_methods'
export default {
	mixins: [cart, payment_methods],
	data() {
		return {
			decidir: null,
			titular: 'TITULAR',
			numero_tarjeta: '4507990000004905',
			codigo_seguridad: '123',
			mes: '12',
			ano: '30',
			documento: '27859328',
			selected_installments: 0,
			nacimiento: null,
			payment_method_id: 0,
		}
	},
	created() {
		this.init()
	},
	computed: {
		installments() {
			return this.cart_payment_method.payment_method_installments
		},
	},
	methods: {
		installmentName(installment) {
			let text = installment.installments 
			if (installment.name) {
				text += ' - '+installment.name 
			}
			return text
		},
		init() {
			const publicApiKey = "5HMK6GtWtUKyPhmeJo95DHtdvpJCT2G6";
			const urlSandbox = "https://developers.decidir.com/api/v2";
			this.decidir = new Decidir(urlSandbox);

			this.decidir.setPublishableKey(publicApiKey);
			this.decidir.setTimeout(5000);//timeout de 5 segundos
			console.log('decidir')
			console.log(this.decidir)
		},
		sendForm(event) {
			if (this.check()) {
				console.log('enviando')
				event.preventDefault();
				// this.getToken()
			
				var form = document.querySelector('#formulario');
				this.decidir.createToken(form, this.sdkResponseHandler);//formulario y callback
				return false;
			}
		},
		// getToken() {
		// 	this.$api.post('payway/token', {
		// 		payment_method_id: this.cart_payment_method.id, 
		// 		card_number: this.numero_tarjeta, 
		// 		card_expiration_month: this.mes, 
		// 		card_expiration_year: this.ano, 
		// 		card_holder_name: this.titular, 
		// 		card_holder_birthday: this.nacimiento, 
		// 		card_holder_door_number: null, 
		// 		security_code: this.codigo_seguridad, 
		// 		number: this.documento, 
		// 		payment_method_id: this.payment_method_id, 
		// 	})
		// 	.then(res => {
		// 		console.log('se guardo payment-card-info, llego esto:')
		// 		console.log(res.data.model)
		// 		this.$store.commit('cart/setPaymentCardInfoId', res.data.model.id)
		// 		this.makeOrder()
		// 	})
		// 	.catch(err => {
		// 		console.log('Error al guardar Pago')
		// 	})
		// },
		sdkResponseHandler(status, response) {
			console.log('getCardType: '+this.getCardType())
			console.log('response')
			console.log(status)
			console.log(response)
			if (status != 200 && status != 201) {
				this.$toast.error('Hubo un error')
				response.error.forEach(error => {
					if (error.error.param == 'card_holder_name') {
						this.$toast.error('Revise el nombre del titular')
					}
					console.log(error.error.message)
				})
			} else {
				this.savePaymentCardInfo(response)
			}
		},
		savePaymentCardInfo(response) {
			// console.log('getCardType: '+this.getCardType())
			// return
			this.$api.post('payment-card-info', {
				token: response.id, 
				bin: response.bin, 
				installments: this.selected_installments,
				payment_method_id: this.payment_method_id,
			})
			.then(res => {
				console.log('se guardo payment-card-info, llego esto:')
				console.log(res.data.model)
				this.$store.commit('cart/setPaymentCardInfoId', res.data.model.id)
				this.makeOrder()
			})
			.catch(err => {
				console.log('Error al guardar Pago')
			})
		},
		check() {
			if (this.titular == '') {
				this.$toast.error('Indique el TITULAR')
				return false
			}
			if (this.numero_tarjeta == '') {
				this.$toast.error('Indique el NUMERO DE TARJETA')
				return false
			}
			if (this.codigo_seguridad == '') {
				this.$toast.error('Indique el CODIGO DE SEGURIDAD')
				return false
			}
			if (this.mes == '') {
				this.$toast.error('Indique el MES DE VENCIMIENTO')
				return false
			}
			if (this.ano == '') {
				this.$toast.error('Indique el AÑO DE VENCIMIENTO')
				return false
			}
			if (this.documento == '') {
				this.$toast.error('Indique el DOCUMENTO')
				return false
			}
			if (this.selected_installments == 0) {
				this.$toast.error('Seleccione las cuotas')
				return false
			}
			return true
		},
		getCardType() {
			const re = {
				electron: /^(4026|417500|4405|4508|4844|4913|4917)\d+$/,
				maestro: /^(5018|5020|5038|5612|5893|6304|6759|6761|6762|6763|0604|6390)\d+$/,
				dankort: /^(5019)\d+$/,
				interpayment: /^(636)\d+$/,
				unionpay: /^(62|88)\d+$/,
				visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
				mastercard: /^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/,
				amex: /^3[47][0-9]{13}$/,
				diners: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
				discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
				jcb: /^(?:2131|1800|35\d{3})\d{11}$/
			}

			for (var key in re) {
				if (re[key].test(this.numero_tarjeta)) {
					return key
				}
			}

			return 'unknown'
		}
	}
}
</script>	
<style lang="sass">
.form-payway
	input, select
		padding: 10px 15px
		margin-bottom: 15px
		border: 1px solid rgba(0,0,0,.5)
		border-radius: 7px
		background: #FFF

	.input-100
		width: 100%

	.input-50
		width: 49%

	.input-30
		width: 32%

	.cont-input
		display: flex 
		flex-direction: row 
		justify-content: space-between
</style>