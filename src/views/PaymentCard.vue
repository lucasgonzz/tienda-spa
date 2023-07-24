<template>
	<b-row
	class="view">
		<b-col
		md="8"
		lg="6"
		cols="12">
			<payway></payway>	
		</b-col>
	</b-row>
</template>
<script>
export default {
	components: {
		Payway: () => import('@/components/payment-card/components/Payway'),
	},
}
</script>