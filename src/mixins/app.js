export default {
	computed: {
		cart() {
			return this.$store.state.cart.cart
		}
	},
	methods: {
		getLastCart() {
			if (this.cart.articles.length) {
				this.$store.dispatch('cart/save')
				.then(() => {
					this.clearCartCookies()
					this.$store.dispatch('cart/getLastCart')
				}) 
			} else {
				this.$store.dispatch('cart/getLastCart')
				.then(() => {
					this.checkCartPaymentStatus()
				})
			}
		},
		setCartFromCookies() {
			let cart = localStorage.cart
			if (typeof cart != 'undefined') {
				this.$store.commit('cart/setCart', JSON.parse(cart))
			}
			console.log('se seteo cart con las cookies, quedo asi:')
			console.log(this.$store.state.cart.cart)
		},
		clearCartCookies() {
			localStorage.cart = null
		},
		checkCartPaymentStatus() {
			if (this.cart.payment_id && this.cart.payment_status) {
				if (this.cart.payment_status == 'approved') {
					this.$router.push({name: 'PaymentSuccess'})
				} else if (this.cart.payment_status == 'in_process') {
					this.$router.push({name: 'PaymentPending'})
				}
				return true
			} else {
				return false
			}
		},
		checkLastCart() {
			if (this.cart.payment_method == 'tarjeta' && this.$route.name != 'PaymentGateway') {
				this.$router.push({name: 'PaymentGateway'})
			} else if (this.cart.payment_method != 'tarjeta' && this.$route.name == 'PaymentGateway') {
				this.$router.replace({name: 'Home'})
			}
		},
		setLoaders() {
			this.$store.commit('articles/setLoading', true)
			this.$store.commit('categories/setLoading', true)
			this.$store.commit('cart/setLoadingLastCart', true)
			if (this.authenticated) {
				this.$store.commit('cart/setLoadingLastCart', true)
				this.$store.commit('notifications/setLoading', true)
				this.$store.commit('notifications/setLoading', true)
			}
		},
		checkHomeRoute() {
			if (this.$route.path == '/') {
				this.$router.replace({name: 'Home', params: {category: 'ultimos-ingresados'}})
			}
		},
		checkAddress() {
			if (!this.user.addresses.length && this.route_name != 'Maps') {
				this.$router.push({name: 'Maps'})
			}
		}
	}
}