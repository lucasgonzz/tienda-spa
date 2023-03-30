export default {
	data() {
		return {
			transition_name: 'slide-left'
		}
	},
	watch: {
		'$route' (to, from) {
			const toDepth = to.path.split('/').length
			const fromDepth = from.path.split('/').length
			this.transition_name = toDepth < fromDepth ? 'slide-right' : 'slide-left'
		}
	}
}