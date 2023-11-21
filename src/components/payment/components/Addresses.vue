<template>
	<div
	class="addresses background"
	v-if="deliver && user">
		<h5>
			Direccion
		</h5>
		<div
		v-if="user.addresses.length">
			<div 
			class="address b-r s"
			v-for="address in user.addresses"
			:key="address.id">
				<b-form-radio
				v-model="address_id"
				:value="address.id">
					<p class="street">
						{{ address.street }} {{ address.street_number }}
					</p>	
					<p class="details">
						{{ address.city }}, {{ address.province }}
					</p>
				</b-form-radio>
			</div>
		</div>
		<div
		v-else>
			<div class="text-muted">
				No tenes ninguna direccion
			</div>			
		</div>
		<b-form-group
		class="m-t-15">
			<b-button
			block
			size="sm"
			variant="success"
			:to="{name: 'Maps'}">
				Agregar una direccion
			</b-button>
		</b-form-group>
	</div>
</template>
<script>
export default {
	computed: {
		address_id: {
			get() {
				return this.$store.state.cart.cart.address_id
			},
			set(value) {
				this.$store.commit('cart/setAddressId', value)
			}
		},
		deliver() {
			return this.$store.state.cart.cart.deliver
		}
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.addresses
	.address
		margin-bottom: 1em
		padding: 1em 
		background: lighten($green, 20)
		.street 
			font-weight: bold
			margin-bottom: .5em
		.details 
			color: rgba(0,0,0,.7)
</style>