export default {
    created() {
        this.sendOrder()
    },
    data() {
    	return {
            progress: 10,
            redirect_time: 7,
            interval: null,
    		cart_updated: false,
    	}
    },
    computed: {
        time() {
            if (this.route_name == 'PaymentPending') {
                return 2000
            }
            return 500
        }
    },
    methods: {
    	setCartPaymentProps() {
	    	console.log('setCartPaymentProps')
    		this.$store.commit('cart/setPaymentId', this.$route.query.payment_id)
    		this.$store.commit('cart/setPaymentStatus', this.$route.query.status)
    		this.$store.dispatch('cart/save')
        	this.cart_updated = true 
            this.$store.commit('cart/setCart', null)
            this.redirect()
    	},
    	isCartInProccess() {
            return this.cart.id
    	},
        sendOrder() {
            console.log('esperando para actualizar')
            this.interval = window.setInterval(() => {
                this.progress += 10
                if (this.progress == 100) {
                    window.clearInterval(this.interval)
                    this.setCartPaymentProps()
                }
            }, this.time)
        },
        redirect() {
            console.log('esperando para redirect')
            this.interval = window.setInterval(() => {
                this.redirect_time -= 1
                if (this.redirect_time == 0) {
                    window.clearInterval(this.interval)
                    this.$router.push({name: 'Thanks'})
                }
            }, 1000)
        }
    }
}