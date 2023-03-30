<template>
	<div
	class="maps">
		<address-details
		:previus_route="previus_route"></address-details>
		<select-city></select-city>
		<mapa></mapa>
	</div>
</template>
<script>
import AddressDetails from "@/components/maps/modals/AddressDetails"
import SelectCity from "@/components/maps/components/SelectCity"
import Mapa from "@/components/maps/components/Mapa"
export default {
	components: {
		AddressDetails,
		SelectCity,
		Mapa,
	},
	data() {
		return {
			previus_route: '',
		}
	},
	beforeRouteEnter(to, from, next) {
		next(vm => {
			vm.previus_route = from
		})
	},
}
</script>
<style lang="sass">
.maps 
	.row 
		margin-bottom: 0 !important
</style>