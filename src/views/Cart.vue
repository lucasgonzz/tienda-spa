<template>
	<div class="cart view m-t-15 p-b-50">
		
		<div
		v-if="loading_last_cart">
			<loading></loading>
		</div>

		<div
		v-else>
			
			<b-row>
				<b-col
				cols="12">
					<list
					class="m-t-15"></list>
				</b-col>
			</b-row>

			<b-row>
				<b-col
				cols="6">
					<footer-component></footer-component>
				</b-col>
			</b-row>
		</div>
	</div>
</template>
<script>
import Workdays from '@/components/common/Workdays'
import List from '@/components/cart/components/List'
import cart from '@/mixins/cart' 
export default {
	mixins: [cart],
	name: 'Cart',
	components: {
		Workdays,
		List,
		FooterComponent: () => import('@/components/cart/components/Footer'),
		Loading: () => import('@/components/cart/components/Loading'),
	},
	created() {
		this.setTitle('Carrito')
	}
}	
</script>