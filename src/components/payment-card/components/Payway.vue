<template>
	<div class="form-payway">
		<form 
		id="formulario"
		@submit.prevent="sendForm">
			<checkout-captcha @ready="captcha_listo = $event" />
			<fieldset :disabled="procesando || pedido_enviado">
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
				:disabled="!captcha_listo || procesando || pedido_enviado"
				:aria-busy="procesando ? 'true' : 'false'"
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
import CheckoutCaptcha from '@/components/payment/components/CheckoutCaptcha.vue'
import { contexto_captcha } from '@/store/cart'
export default {
	mixins: [cart, payment_methods],
	components: { CheckoutCaptcha },
	data() {
		return {
			decidir: null,
			captcha_listo: false,
			procesando: false,
			pedido_enviado: false,
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
		this.tarjeta_guardada = null
		this.intento_payway = 0
		this.init()
	},
	beforeDestroy() {
		this.intento_payway++
		this.tarjeta_guardada = null
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
			this.decidir = new window.Decidir(urlSandbox);

			this.decidir.setPublishableKey(publicApiKey);
			this.decidir.setTimeout(5000);//timeout de 5 segundos
		},
		sendForm(event) {
			if (event) event.preventDefault()
			if (!this.captcha_listo || this.procesando || this.pedido_enviado || !this.check()) return Promise.resolve(null)
			this.procesando = true
			const intento = ++this.intento_payway
			const contexto = contexto_captcha(this.$store.state)
			const revision = this.$store.state.cart.captcha_revision
			const firma = JSON.stringify([this.titular, this.numero_tarjeta, this.codigo_seguridad, this.mes, this.ano,
				this.documento, this.selected_installments, this.payment_method_id])
			let self = this
			const vigente = function() {
				return !self._isDestroyed && intento === self.intento_payway && contexto === contexto_captcha(self.$store.state)
			}
			const comprobar = function() {
				if (!vigente() || !self.captcha_listo) throw new Error('verificacion_pendiente')
			}
			// Si sólo falló orders, renovar CAPTCHA no vuelve a guardar la misma tarjeta.
			const guardada = this.tarjeta_guardada
			const guardar = Promise.resolve().then(function() {
				comprobar()
				if (guardada && guardada.firma === firma && guardada.contexto === contexto) return guardada.id
				return new Promise(function(resolve, reject) {
					let respondido = false
					self.decidir.createToken(self.$el.querySelector('#formulario'), function(status, response) {
						if (respondido) return
						respondido = true
						if (status != 200 && status != 201) return reject(new Error('tarjeta_invalida'))
						resolve(response)
					})
				}).then(function(response) {
					comprobar()
					return self.savePaymentCardInfo(response)
				}).then(function(id) {
					comprobar()
					self.tarjeta_guardada = { firma, contexto, id }
					return id
				})
			})
			return guardar.then(function(id) {
				comprobar()
				self.$store.commit('cart/setPaymentCardInfoId', id)
				return self.makeOrder()
			}).then(function(ok) {
				if (ok === true) self.pedido_enviado = true
				else if (vigente() && ok !== false) self.$toast.error('No pudimos guardar tu pedido. Verificá de nuevo para reintentar.')
				return ok
			}).catch(function() {
				// No registrar respuestas de tarjeta ni errores HTTP con comprobantes.
				if (vigente()) self.$toast.error('No pudimos completar el pago. Tus datos siguen en el formulario; probá de nuevo.')
				return null
			}).finally(function() {
				self.procesando = false
				if (vigente() && !self.pedido_enviado && revision === self.$store.state.cart.captcha_revision) {
					self.$store.commit('cart/renovar_captcha')
				}
			})
		},
		savePaymentCardInfo(response) {
			return this.$api.post('payment-card-info', {
				token: response.id,
				bin: response.bin,
				installments: this.selected_installments,
				payment_method_id: this.payment_method_id,
			}).then(function(res) {
				const id = res.data && res.data.model && res.data.model.id
				if (!id) throw new Error('tarjeta_sin_guardar')
				return id
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