<template>
	<b-card
	v-if="order"
	@click="quitOrderInfo"
	no-body
	class="card-orders-info shadow-2 c-p">
		<div 
		class="card-orders-info-body">
			<span 
			v-show="order.status != 'canceled'"
			class="icon-check icon text-success"></span>
			<span 
			v-show="order.status == 'canceled'"
			class="icon-cancel icon text-danger"></span>
			<p
			v-show="order.status == 'canceled'">
				Lo sentimos pero no podemos cumplir con tu pedido
			</p>
			<p
			v-show="order.status == 'unconfirmed'">
				¡Ya recivimos tu pedido, te avisaremos cuando lo confirmemos!
			</p>
			<p
			v-show="order.status == 'confirmed'">
				¡Ya confirmamos tu pedido, te avisaremos cuando este listo!
			</p>
			<p
			v-show="order.status == 'finished'">
				Tu pedido ya esta listo
				<span
				v-if="order.deliver">
					¡El repartidor va en camino!
				</span>
				<span
				v-else>
					¡Podes retirarlo cuando quieras!
				</span>
			</p>
			<p
			v-show="order.status == 'delivered'">
				<span
				v-if="order.deliver">
					¡Tu pedido ya fue entregado, Gracias por tu compra!
				</span>
				<span
				v-else>
					¡Tu pedido ya fue retirado, Gracias por tu compra!
				</span>
			</p>
		</div>
	</b-card>
</template>
<script>
export default {
	name: 'OrderInfo',
	computed: {
		order() {
			return this.$store.state.orders.order
		},
		authenticated() {
			return this.$store.state.auth.authenticated
		}
	},
	methods: {
		quitOrderInfo() {
			if (this.order.status == 'canceled' || this.order.status == 'delivered') {
				this.$store.commit('orders/setOrder', null)
			}
		}
	}
}
</script>
<style scoped lang="sass">
.card-orders-info
	width: 100%
	margin-bottom: 1em
	border-left: .3em solid #28a745 !important
	b-r: .2em !important
	.card-orders-info-body
		padding: .3em
		.icon 
			font-size: 2em
			display: block
		p 
			margin-bottom: 0
</style>