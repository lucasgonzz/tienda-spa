<template>
<b-modal
v-if="order"
id="order-details"
size="lg"
title="Detalle de la compra"
hide-footer>
	<div class="cont-models">
		<article-card
		v-for="article in order.articles"
		:key="article.id"
		:article="article"></article-card>
	</div>
	<p class="order-total">
		Total: {{ price(total(order)) }}
	</p>

	<!-- Envío por correo (Zipnova): correo, estado, seguimiento y destino -->
	<div
	v-if="order.envio || order.envio_opcion"
	class="order-details-envio">
		<p class="order-details-envio__titulo">
			<i class="bi bi-truck"></i>
			Envío
		</p>
		<p v-if="order.envio_opcion">
			{{ order.envio_opcion.carrier_name }} · {{ order.envio_opcion.service_name }}
			<span v-if="order.envio_precio !== null && order.envio_precio !== undefined">
				· {{ Number(order.envio_precio) === 0 ? 'Gratis' : price(order.envio_precio) }}
			</span>
		</p>
		<p v-if="order.envio && order.envio.status_name">
			Estado: <strong>{{ order.envio.status_name }}</strong>
			<span v-if="order.envio.substatus_name">({{ order.envio.substatus_name }})</span>
		</p>
		<p v-if="order.envio && order.envio.carrier_tracking_id">
			N° de seguimiento: {{ order.envio.carrier_tracking_id }}
		</p>
		<p v-if="order.address">
			Entrega: {{ order.address }}
		</p>
		<a
		v-if="order.envio && order.envio.tracking_url"
		:href="order.envio.tracking_url"
		target="_blank"
		rel="noopener noreferrer"
		class="order-details-envio__link">
			Seguir el envío
			<i class="bi bi-box-arrow-up-right"></i>
		</a>
	</div>
</b-modal>
</template>
<script>
import ArticleCard from '@/components/common/article-card/Index'
import OrdersMixin from '@/mixins/orders'
export default {
	mixins: [OrdersMixin],
	components: {
		ArticleCard
	},
	computed: {
		order() {
			return this.$store.state.orders.details
		},
	},
}
</script>
<style scoped lang="sass">
.order-total
	font-size: 1.2em
	margin-bottom: 0
	margin-top: 1em
	font-weight: bold
.order-details-envio
	margin-top: 1em
	padding: .8em 1em
	border-radius: 8px
	background: rgba(0,0,0,.04)
	text-align: left
	p
		margin-bottom: .3em
.order-details-envio__titulo
	font-weight: bold
	i
		margin-right: .35em
		color: var(--secondary-color, #0d6efd)
.order-details-envio__link
	display: inline-block
	margin-top: .3em
	font-weight: 600
	color: var(--secondary-color, #0d6efd)
	text-decoration: underline
</style>