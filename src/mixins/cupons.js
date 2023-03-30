export default {
	computed: {
		active_cupons() {
			return this.$store.state.cupons.active_cupons
		}
	}
}