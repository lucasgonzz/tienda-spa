<template>
	<div class="mapa-location" ref="mapa"></div>
</template>
<script>
import { configMapa } from "@/constants/configMapa"
export default {
	data() {
		return {
			map: null,
			marker: null,
			has_error: false,
			loading: false,
			query: '',
		} 
	},
	mounted() {
		this.initializeMap()
	},
	computed: {
		configMapa() {
			return {
				...configMapa,
				zoom: 12,
				center: { lat: 0, lng: 0}
			}
		},
	},
	methods: {
		initializeMap() {
			const mapContainer = this.$refs.mapa
			if (window.google && mapContainer) {
				this.map = new window.google.maps.Map(mapContainer, this.configMapa)
				this.setCommerceLocations()
			} else {
				setTimeout(() => {
					this.initializeMap()
				}, 100)
			}
		},
		setCommerceLocations() {
			this.commerce.addresses.forEach(address => {
				this.setMarker({
					lat: Number(address.lat),
					lng: Number(address.lng),
				})
			})
		},
		setMarker(location) {
			// if (this.marker) {
			// 	this.marker.setMap(null) 
			// }
			this.map.setCenter(location)
	        this.marker = new window.google.maps.Marker({
	            map: this.map,
	            position: location
	        })
		},
	}
}
</script>
<style lang="sass">
.mapa-location 
	position: absolute !important
	top: -15px
	left: 0
	width: 100%
	height: calc(100vh - 50px)
</style>