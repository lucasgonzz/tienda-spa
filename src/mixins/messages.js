import articlesMixin from '@/mixins/articles'
export default {
	mixins: [articlesMixin],
	computed: {
	},
	methods: {
		hasArticle(message) {
			return message.article
		},
		markAsRead() {
			this.$store.dispatch('notifications/markAsRead')
			this.$store.commit('notifications/markAsRead')
			this.$store.commit('notifications/setUnreadNotificationsCount', true)
		},
		isQuestionAnswered(message) {
			if (message.type) {
				return message.type.includes('question_answered')
			}
			return false
		},
		isOrderCanceled(message) {
			console.log('messages/isOrderDelivered')
			if (message.type) {
				return message.type.includes('order_canceled')
			}
			return false
		},
		isOrderDelivered(message) {
			if (message.type) {
				console.log('essasdsada')
				return message.type.includes('order_delivered')
			}
			return false
		},
		isPaymentError(message) {
			if (message.type) {
				return message.type.includes('payment_error')
			}
			return false
		},
		clickMessage(message) {
			if (this.hasArticle(message)) {
				this.toArticle(message.article)
			}
		},
		goToArticle(message) {
			let slug = message.article.slug
			this.$router.push({name: 'Article', params: {slug: slug}})
			this.$scrollToTop()
		},
		getCartOrder(message) {
			let order_id = message.order_id
			this.$store.commit('auth/setLoading', true)
			this.$api.get('/carts/from-order/'+order_id)
			.then(res => {
				this.$store.commit('auth/setLoading', false)
				this.$store.commit('cart/setCart', res.data.cart)
				this.$store.commit('orders/setOrder', null)
				this.$router.push({name: 'Cart'})
				this.$scrollToTop()
			})
			.catch(err => {
				this.$toast.error('Error al cargar carrito')
				this.$store.commit('auth/setLoading', false)
				console.log(err)
			})
		}
	}
}