<template>
	<div class="view">
		<order-details></order-details>
		<b-row>
			<b-col
			sm="7"
			md="6"
			lg="4">
				<orders-list></orders-list>
			</b-col>
		</b-row>
	</div>
</template>
<script>
import OrderDetails from '@/components/orders/modals/OrderDetails'
import OrdersList from '@/components/orders/components/OrdersList'
export default {
	name: 'Orders',
	components: {
		OrderDetails,
		OrdersList,
	},
	created() {
		this.setTitle('Compras')
	}
}
</script>
<style scoped lang="sass">
// .title
// 	color: rgba(0,0,0,.4)
// 	margin-bottom: .5em
// a 
// 	&:hover
// 		text-decoration: none
</style>