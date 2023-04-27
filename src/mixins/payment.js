import cart from '@/mixins/cart'
export default {
	mixins: [cart],
    watch: {
    	cart() {
	    	console.log('watch de cart')
            if (this.isCartInProccess()) {
                if (!this.cart_updated) {
    	    		this.setCartPaymentProps()
        		}
            } else {
                this.$router.replace({name: 'Home'})
            }
    	}
    },
    created() {
        this.sendOrder()
    },
    data() {
    	return {
            progress: 10,
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
    	},
    	isCartInProccess() {
            return this.cart.id
    	},
        sendOrder() {
            console.log('esperando para enviar pedido')
            this.interval = window.setInterval(() => {
                this.progress += 10
                console.log('se aumento a '+this.progress)
                if (this.progress == 100) {
                    if (this.cart_updated) {
                        window.clearInterval(this.interval)
                        this.makeOrder()
                        console.log('se envio pedido')
                    } else {
                        this.progress = 40 
                    }
                }
            }, this.time)
        },
    }
}