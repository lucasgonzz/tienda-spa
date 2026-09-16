<template>
	<!--
		El renglon de cuotas de la captura, pegado abajo del precio de 36px: texto plano,
		SIN caja, sin sombra, sin icono.
	-->
	<div
	v-if="article_to_show && !flag_activo(article_to_show.precio_pausado)"
	class="payment-methods-info">
		<p
		v-for="payment_method in payment_methods_to_show"
		:key="'payment-method-'+payment_method.id"
		class="payment-methods-info__renglon">
			Con {{ payment_method.name }}: <strong>{{ priceWith(payment_method) }}</strong> {{ info(payment_method) }}
		</p>
	</div>
</template>
<script>
export default {
	name: 'PaymentMethodsInfo',
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
<style scoped lang="sass">
// El verde es el mismo #00A650 del badge de descuento: el unico color que Lucas pidio
// copiar literal de Mercado Libre.
//
// 🔴 Cero marca ajena: no se agrega "Ver los medios de pago" porque hoy no hay adonde
// llevarlo -no existe una pagina ni un ancla de medios de pago en la tienda:
// `common/footer/MediosDePago.vue` esta en el repo pero no esta montado en ningun
// lado-. El dia que exista un destino real, se agrega el link aca.
.payment-methods-info
	text-align: left

	.payment-methods-info__renglon
		margin: 0 0 4px 0
		font-size: 14px
		line-height: 1.35
		font-weight: 400
		color: #00A650

		&:last-child
			margin-bottom: 0

		strong
			font-weight: 600
</style>
