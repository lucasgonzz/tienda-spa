export default {
	computed: {
		cant_cart_articles() {
			let cant_articles = 0
			let cart = this.$store.state.cart.cart
			if (cart) {
				cart.articles.forEach(article => {
					cant_articles += article.amount
				})
			}
			return cant_articles
		},
		loading_last_cart() {
			return this.$store.state.cart.loading_last_cart
		},
		articles() {
			let cart = this.$store.state.cart.cart
			if (cart) {
				return cart.articles
			}
			return []
		},
		cart() {
			return this.$store.state.cart.cart
		},
		delivery_zones() {
			return this.$store.state.delivery_zones.models
		},
		deliver() {
			return this.$store.state.cart.cart.deliver
		},
		cupon: {
			get() {
				return this.$store.state.cart.cupon
			},
			set(value) {
				this.$store.commit('cart/setCupon', value)
			}
		},
		cart_payment_method: {
			get() {
				return this.$store.state.cart.payment_method
			},
			set(value) {
				this.$store.commit('cart/setPaymentMethod', value)
			}
		},
		cart_delivery_zone: {
			get() {
				return this.$store.state.cart.delivery_zone
			},
			set(value) {
				this.$store.commit('cart/setDeliveryZone', value)
			}
		},
		order() {
			return this.$store.state.orders.order
		},
		total() {
			let total = 0
			this.articles.forEach(article => {
				console.log(this.articlePriceEfectivo(article, false))
				total += this.articlePriceEfectivo(article, false) * Number(article.pivot.amount)
			})
			return total
		},
		total_with_discount() {
			let total = this.total 
			if (this.cupon) {
				if (this.cupon.amount) {
					total -= this.cupon.amount
				} else {
					total = total - (total * this.percentageToMultiply(this.cupon.percentage))
				}
			}
			return total
		},
		total_with_deliver() {
			return this.total_with_discount + Number(this.cart_delivery_zone.price)
		},
		total_final() {
			return this.total_with_deliver
			// if (!this.cart.deliver && this.cart.payment_method == 'efectivo') {
			// 	return this.total_efectivo
			// }
			// if (!this.cart.deliver && this.cart.payment_method == 'tarjeta') {
			// 	return this.total_tarjeta
			// }
			// if (this.cart.deliver && this.cart.payment_method == 'efectivo') {
			// 	return this.total_efectivo + this.deliver_price
			// }
			// if (this.cart.deliver && this.cart.payment_method == 'tarjeta') {
			// 	return this.total_tarjeta + this.deliver_price
			// }
		}
	},
	methods: {
		setBtnMpVisible(set_visible) {
			let btn = document.getElementsByClassName('mp-btn')
			console.log(btn)
			if (btn.length) {
				if (set_visible) {
					btn[0].style.display = 'block'
					console.log('se hizo visible')
				} else {
					btn[0].style.display = 'none'
					let child = document.getElementsByClassName('mercadopago-button')
					console.log('se hizo no visible')
					if (child.length) {
						child[0].remove()
						console.log('se removio btn')
					}
				}
			}
		},
		discountCupon(total) {
			if (this.cupon) {
				if (this.cupon.amount) {
					total -= this.cupon.amount
				} else {
					total = total - (total * this.percentageToMultiply(this.cupon.percentage))
				}
			}
			return total
		},
		makeOrder() {
			if (this.canMakeOrder()) {
				this.$store.commit('auth/setLoading', true)
				this.$store.commit('auth/setMessage', 'Enviando pedido')
				this.$store.dispatch('cart/save')
				.then(() => {
					return this.$api.post('/orders', {
						commerce_id 	: process.env.VUE_APP_COMMERCE_ID,
						cart_id         : this.cart.id,
						dolar_blue      : this.dolar_blue,
					})
					.then(() => {
						this.$store.commit('auth/setLoading', false)
						this.$store.commit('auth/setMessage', '')
						this.$store.commit('cart/setCart', null)
						this.$store.dispatch('orders/getCurrentOrder')
						// this.$store.dispatch('notifications/getUnreadNotifications')
						this.$router.push({name: 'Thanks'})
					})
					.catch(err => {
						this.$store.commit('auth/setLoading', false)
						this.$store.commit('auth/setMessage', '')
						console.log(err)
					})
				})
			} 
		},
		canMakeOrder() {
			return true 
			if (!this.order || this.order.status == 'delivered' || this.order.status == 'canceled') {
				return true
			} else {
				this.$toast.error('Estamos procesando tu pedido actual, cuando terminemos podras hacer uno nuevo')
				return false
			}
		},
	}
}