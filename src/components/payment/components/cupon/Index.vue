<template>
	<div
	v-if="flag_activo(commerce.online_configuration.usar_cupones)"
	class="checkout-section">
		<h2 class="checkout-section__title">
			<i class="bi bi-ticket-perforated"></i>
			¿Tenés un cupón?
		</h2>
		<search-component></search-component>
		<cupon-card
		v-if="cupon"
		:cupon="cupon"></cupon-card>
	</div>
</template>
<script>
import SearchComponent from '@/components/payment/components/cupon/Search'
import CuponCard from '@/components/cupons/components/CuponCard'

import cart from '@/mixins/cart'
export default {
	mixins: [cart],
	components: {
		SearchComponent,
		CuponCard,
	},
}
</script>