<template>
	<b-row
	class="view">
		<b-col
		lg="12">
			<mapa></mapa>
		</b-col>
	</b-row>
</template>
<script>
import Mapa from "@/components/location/components/Mapa"
export default {
	components: {
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