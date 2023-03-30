export default {
	computed: {
		notifications() {
			return this.$store.state.notifications.notifications
		},
		unread_notifications() {
			return this.$store.state.notifications.unread_notifications
		},
		unread_notifications_count() {
			return this.$store.state.notifications.unread_notifications_count
		},
		loading() {
			return this.$store.state.notifications.loading
		},
		notifications_length() {
			return this.notifications.length || this.unread_notifications.length
		},
	},
	methods: {
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
		isOrderCanceled(notification) {
			if (notification.message.type) {
				return notification.type.includes('order_cenceled')
			}
			return false
		},
		isOrderDelivered(notification) {
			console.log('notification/isOrderDelivered')
			console.log(notification)
			if (notification.type) {
				return notification.type.includes('orderDelivered')
			}
			return false
		},
		isPaymentError(notification) {
			if (notification.message.type) {
				return notification.message.type.includes('payment_error')
			}
			return false
		},
		clickMessage(message) {
			if (this.isQuestionAnswered(message)) {
				this.goToArticle(message)
			}
		},
		goToArticle(notification) {
			let slug = notification.message.article_slug
			this.$router.push({name: 'Article', params: {slug: slug}})
		},
	}
}