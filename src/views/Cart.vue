<template>
	<div class="cart view p-b-50">
		<!-- <b-row
		v-if="!is_open">
			<b-col
			md="8"
			lg="6">
				<b-card
				class="s">
					<workdays></workdays>
				</b-card>
			</b-col>
		</b-row> -->
		<b-row>
			<b-col
			cols="12"
			lg="10"
			xl="8">
				<list
				class="m-t-15"></list>
			</b-col>
		</b-row>
	</div>
</template>
<script>
import Workdays from '@/components/common/Workdays'
import List from '@/components/cart/components/List'
export default {
	name: 'Cart',
	components: {
		Workdays,
		List,
	},
	created() {
		this.setTitle('Carrito')
	}
}	
</script>