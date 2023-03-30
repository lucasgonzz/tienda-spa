<template>
<div>
	{{ notification.data.message }}
	<b-button
	block
	@click="getCartOrder(notification, true)"
	variant="success"
	class="m-t-15 m-b-15 d-md-none"
	size="sm"
	v-if="isOrderCanceled(notification) || isPaymentError(notification)">
		Volver al pedido.
	</b-button>
	<b-button
	block
	@click="getCartOrder(notification, false)"
	variant="success"
	class="m-t-15 m-b-15 d-none d-md-block"
	size="sm"
	v-if="isOrderCanceled(notification) || isPaymentError(notification)">
		Volver al pedido.
	</b-button>
	<p class="time">
		{{ since(notification.created_at) }}
	</p>
</div>
</template>
<script>
import notifications from '@/mixins/notifications'
export default {
	props: ['notification'],
	mixins: [notifications],
}
</script>