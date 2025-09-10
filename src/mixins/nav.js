import VueScreenSize from 'vue-screen-size'
import app from '@/mixins/app'
export default {
	mixins: [VueScreenSize.VueScreenSizeMixin, app],
	computed: {
		isSearchView() {
			return this.$route.name == 'Search'
		},
		current_page() {
			return this.$route.name
		},
		messages_not_read() {
			return this.$store.state.messages.messages_not_read
		},
		cupons_not_read() {
			return this.$store.state.cupons.cupons_not_read
		},
		user_name() {
			if (this.user.name.indexOf(' ') != -1) {
				return this.user.name.substring(0, this.user.name.indexOf(' '))
			}
			return this.user.name
		},
	},
	methods: {
		toLogin() {
			this.$cookies.set('redirect_to', 'Home')
			this.$router.push({name: 'Login'})
		},
		getIconActive(page_name, icon) {
			icon = 'icon-' + icon
			if (this.active(page_name) != '') {
				return icon
			}
			return icon + '-o'
		},
		active(page_name) {
			return page_name == this.current_page ? 'active-link' : ''
		},
		home() {
			// this.$store.commit('categories/setIndexAsSelectedCategory')
			this.$store.commit('auth/setMobileSidebarVisibility', false)
			
			this.$store.commit('categories/setIsFromSearch', false)
			this.$store.commit('categories/setSelectedBodega', null)
			this.$store.commit('categories/setSelectedCategory', null)
			this.$store.commit('categories/setSelectedSubCategory', null)
			this.$store.dispatch('categories/getIndex')


			if (this.$route.params.category != 'ultimos-ingresados') {
				this.$router.push({name: 'Home', params: {category: 'ultimos-ingresados'}})
			}
			this.$scrollToTop()
			this.setTitle(this.commerce.name)
		},
		toRegister() {
			this.$router.push({name: 'Register', params: {view: 'formulario'}})
			this.$scrollToTop()
		},
		toCart() {
			if (this.$route.name == 'Cart') {
				if (this.commerce.online_configuration.register_to_buy) {
					console.log('se llamo getLastCart desde toCart')
					this.$store.dispatch('cart/getLastCart')
				}
			} else {
				if (!this.checkCartPaymentStatus()) {
					if (this.cant_cart_items > 0) {
						this.$router.push({name: 'Cart'})
						this.$scrollToTop()
					} else {
						this.$toast.warning('Tu carrito esta vacio')
					}
				}
			}
		},
		toMessages() {
			if (this.$route.name != 'Messages') {
				this.$router.push({name: 'Messages'})
				this.$store.dispatch('messages/setMessagesRead')
				this.$store.commit('messages/setMessagesRead')
				this.$store.commit('messages/setMessagesNotRead')
			}
		},
		questions() {
			if (this.$route.path == '/preguntas') {
				this.$store.dispatch('questions/getQuestions')
			} else {
				this.$router.push({name: 'Questions'})
				if (this.$store.state.questions.questions.length == 0) {
					this.$store.dispatch('questions/getQuestions')
				}
			}
		},
		cupons() {
			if (this.$route.name == 'Cupons') {
				this.$store.dispatch('cupons/getActiveCupons')
			} else {
				this.$router.push({name: 'Cupons'})
				if (this.$store.state.cupons.active_cupons.length == 0) {
					this.$store.dispatch('cupons/getActiveCupons')
				}
			}
		},
		favorites() {
			if (this.$route.name == 'Favorites') {
				this.$store.dispatch('favorites/getFavorites')
			} else {
				this.$router.push({name: 'Favorites'})
				if (this.$store.state.favorites.favorites.length == 0) {
					this.$store.dispatch('favorites/getFavorites')
				}
			}
		},
		toOrders() {
			if (this.$route.name == 'Orders') {
				this.$store.dispatch('orders/getOrders')
			} else {
				this.$router.push({name: 'Orders'})
				if (this.$store.state.orders.orders.length == 0) {
					this.$store.dispatch('orders/getOrders')
				}
			}
		}
	}
}