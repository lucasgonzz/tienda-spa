<template>
	<div>
		<div
		v-if="active_cupons.length">
			<h1 class="title">
				Cupones
			</h1>
			<div class="cont-models">
				<cupon-card
				v-for="cupon in active_cupons"
				:key="cupon.id"
				:cupon="cupon"></cupon-card>
			</div>
		</div>
		<div
		v-else
		class="text-with-icon">
			<i class="icon-cupon"></i>
			No tienes ningun cupon
		</div>
	</div>
</template>
<script>
import cupons from '@/mixins/cupons'
import CuponCard from '@/components/cupons/components/CuponCard'
export default {
	mixins: [cupons],
	components: {
		CuponCard,
	},
	methods: {
	}
}
</script>