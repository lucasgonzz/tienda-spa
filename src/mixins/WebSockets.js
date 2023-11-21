import messages from '@/mixins/messages'
export default {
    mixins: [messages],
	methods: {
		listenChannels() {
            this.Echo.channel('order.'+this.user.id)
            .notification((notification) => {
                this.$store.commit('orders/setOrder', notification.order)
                // this.$store.dispatch('notifications/getUnreadNotifications')
                if (this.isOrderDelivered(notification)) {
                    this.$store.dispatch('orders/getCurrentOrder')
                    this.$store.dispatch('orders/getOrders')
                }
            });
            this.Echo.channel('message.from_commerce.'+this.user.id)
            .notification((notification) => {
                this.$store.commit('messages/addMessage', notification.message)
                this.$store.commit('messages/setMessagesNotRead')
                console.log(notification)
                if (this.isOrderDelivered(notification.message)) {
                    console.log('es order delivered')
                    this.$store.dispatch('orders/getCurrentOrder')
                    this.$store.dispatch('orders/getOrders')
                }
                if (this.isCartAmountUpdated(notification.message)) {
                    console.log('es cart amount updated')
                    this.$store.dispatch('cart/getLastCart')
                }
                this.checkIfIsMessagesView()
            });
            this.Echo.channel('question.'+this.user.id)
            .notification((notification) => {
                this.$store.dispatch('notifications/getUnreadNotifications')
            });
            this.Echo.channel('payment.'+this.user.id)
            .notification((notification) => {
                this.$store.dispatch('notifications/getUnreadNotifications')
            });
		},
        checkIfIsMessagesView() {
            if (this.$route.name == 'Messages') {
                this.$store.dispatch('messages/setMessagesRead')
                this.$store.commit('messages/setMessagesRead')
                this.$store.commit('messages/setMessagesNotRead')
                this.scrollBottom('messages-list')
            }
        }
	}
}