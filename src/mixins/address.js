export default {
	computed: {
		city() {
			return this.$store.state.address.city	
		},
		is_city_selected() {
			return this.city != ''	
		},
		address() {
			return this.$store.state.address.address
		},
	},
	methods: {

	}
}