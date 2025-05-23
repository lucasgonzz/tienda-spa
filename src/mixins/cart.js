export default {
	computed: {
		cant_cart_items() {
			let cant_items = 0
			let cart = this.$store.state.cart.cart
			if (cart) {
				cart.articles.forEach(article => {
					cant_items += article.amount
				})

				cart.promociones_vinoteca.forEach(promo => {
					cant_items += promo.amount
				})
			}
			return cant_items
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
		promociones_vinoteca() {
			let cart = this.$store.state.cart.cart
			if (cart) {
				return cart.promociones_vinoteca
			}
			return []
		},
		cart() {
			return this.$store.state.cart.cart
		},
		// cart_buyer() {
		// 	return this.$store.state.cart.buyer
		// },
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
			return this.$store.state.cart.cart.total
			// let total = 0
			// this.articles.forEach(article => {
			// 	total += article.pivot.price * Number(article.pivot.amount)
			// })
			// return total
		},
		total_with_payment_method_discount() {
			if (this.cart_payment_method && this.cart_payment_method.discount) {
				return this.total - (this.total * this.cart_payment_method.discount / 100)
			}
			return this.total
		},
		total_with_payment_method_surchage() {
			if (this.cart_payment_method && this.cart_payment_method.surchage) {
				return this.total + (this.total * this.cart_payment_method.surchage / 100)
			}
			return this.total
		},
		total_with_payment_method() {
			if (this.cart_payment_method && this.cart_payment_method.discount) {
				return this.total_with_payment_method_discount
			}
			if (this.cart_payment_method && this.cart_payment_method.surchage) {
				return this.total_with_payment_method_surchage
			}
			return this.total
		},
		total_with_cupon() {
			let total = this.total_with_payment_method 
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
			return this.total_with_cupon + Number(this.cart_delivery_zone.price)
		},
		total_final() {
			return this.total_with_deliver
		},
		buyer_id() {
			return this.$store.state.cart.buyer_id
		},
		selected_buyer() {
			return this.$store.state.cart.selected_buyer
		},
		fecha_entrega() {
			return this.$store.state.cart.fecha_entrega
		},
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
		makeOrder(from_mercadopago = false) {
			if (this.canMakeOrder()) {
				this.$store.commit('auth/setLoading', true)
				if (from_mercadopago) {
					this.$store.commit('auth/setMessage', 'Guardando pedido para luego pagar con Mercado Pago')
				} else {
					this.$store.commit('auth/setMessage', 'Enviando pedido')
				}
				this.$store.dispatch('cart/save')
				.then(() => {
					return this.$api.post('/orders', {
						commerce_id 	: process.env.VUE_APP_COMMERCE_ID,
						cart_id         : this.cart.id,
						dolar_blue      : this.dolar_blue,
						buyer_id		: this.buyer_id,
						seller_id		: this.user.seller_id,
						buyer 			: this.user,
						selected_buyer 	: this.selected_buyer,
						fecha_entrega 	: this.fecha_entrega,
					})
					.then(() => {
						this.$store.commit('auth/setLoading', false)
						this.$store.commit('auth/setMessage', '')
						if (!from_mercadopago) {
							this.$store.commit('cart/setCart', null)
							this.$store.commit('cart/set_buyer_id', null)
							this.$store.commit('cart/set_selected_buyer', null)

							localStorage.cart = JSON.stringify(this.cart) 
							this.$store.dispatch('orders/getCurrentOrder')
							this.$router.push({name: 'Thanks'})
						} 
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
		},
	}
}