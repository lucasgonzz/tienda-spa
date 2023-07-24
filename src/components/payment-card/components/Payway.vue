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
export default {
	mixins: [cart],
	data() {
		return {
			decidir: null,
			titular: 'TITULAR',
			numero_tarjeta: '4507990000004905',
			codigo_seguridad: '123',
			mes: '12',
			ano: '30',
			documento: '27859328',
			selected_installments: 1,
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
			
				var form = document.querySelector('#formulario');
				this.decidir.createToken(form, this.sdkResponseHandler);//formulario y callback
				return false;
			}
		},
		sdkResponseHandler(status, response) {
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
			this.$api.post('payment-card-info', {
				token: response.id, 
				bin: response.bin, 
				bin: response.bin, 
				installments: this.selected_installments,
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