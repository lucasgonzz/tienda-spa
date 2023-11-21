<template>
	<div
	class="background">
		<h5>
			Cupones
		</h5>
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