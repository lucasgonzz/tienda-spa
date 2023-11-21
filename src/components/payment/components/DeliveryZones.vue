<template>
	<div
	class="m-b-15 background"
	v-if="deliver && delivery_zones.length">
		<h5>
			Precios de envio
		</h5>
		<b-form-group
		v-for="delivery_zone in delivery_zones"
		:key="delivery_zone.id">
			<b-form-radio
			class="m-b-15"
			name="delivery-zone"
			v-model="cart_delivery_zone"
			:value="delivery_zone">
				<p
				class="m-0">
					<strong>{{ delivery_zone.name }}</strong>
					<span
					v-if="delivery_zone.description">
						({{ delivery_zone.description }})
					</span>
				</p>	
				<p>
					{{ price(delivery_zone.price) }}
				</p>
			</b-form-radio>
		</b-form-group>
	</div>
</template>
<script>
import cart from '@/mixins/cart'
export default {
	mixins: [cart],
}
</script>