 import Vue from 'vue'
import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true
export default {
	namespaced: true,
	state: {
		cart: {
			articles: [],
			promociones_vinoteca: [],
			deliver: 0,
			description: '',
			payment_id: '',
			payment_status: '',
			address_id: '',
			payment_card_info_id: null,
			fecha_entrega: 0,
		},
		buyer: {
			name: '',
			email: '',
			phone: '',
		},
		buyer_id: null,
		selected_buyer: null,
		payment_method: null,
		delivery_zone: null,
		cupon: null,
		loading_last_cart: false,
		saving: false,

		added_item: null,
	},
	mutations: {
		set_added_item(state, value) {
			state.added_item = value
		},
		setBuyer(state, value) {
			state.buyer = value 
		},
		set_buyer_id(state, value) {
			state.buyer_id = value 
		},
		set_selected_buyer(state, value) {
			state.selected_buyer = value 
		},
		setDeliver(state, value) {
			state.cart.deliver = value
		},
		setAddressId(state, value) {
			state.cart.address_id = value
		},
		setPaymentCardInfoId(state, value) {
			state.cart.payment_card_info_id = value
		},
		set_fecha_entrega(state, value) {
			state.cart.fecha_entrega = value
		},
		setPaymentMethod(state, value) {
			state.payment_method = value
		},
		setDeliveryZone(state, value) {
			state.delivery_zone = value
		},
		setCardId(state, value) {
			state.cart.card_id = value
		},
		setDescription(state, value) {
			state.cart.description = value
		},
		setPaymentId(state, value) {
			state.cart.payment_id = value
		},
		setPaymentStatus(state, value) {
			state.cart.payment_status = value
		},
		setCupon(state, value) {
			state.cupon = value
		},
		addItem(state, item) {

			let is_promocion_vinoteca = item.is_promocion_vinoteca
			let index

			if (is_promocion_vinoteca) {

				index = state.cart.promociones_vinoteca.findIndex(promo => {
					return promo.id == item.id
				})

			} else {

				index = state.cart.articles.findIndex(article => {
					return article.id == item.id && (!article.pivot.variant_id || article.pivot.variant_id == item.variant_id)
				})

			}

			if (index != -1) {
				if (is_promocion_vinoteca) {
					state.cart.promociones_vinoteca.splice(index, 1)
				} else {
					state.cart.articles.splice(index, 1)
				}
			} else {
				if (is_promocion_vinoteca) {
					state.cart.promociones_vinoteca.push(item)
				} else {
					state.cart.articles.push(item)
				}
			}
		},
		removeArticle(state, {item, remove_only_one_amount }) {
			if (remove_only_one_amount == undefined) {
				remove_only_one_amount = true
			}

			let is_promocion_vinoteca = item.is_promocion_vinoteca

			let index 
			if (is_promocion_vinoteca) {
				console.log('eliminado promocion vinoteca')
				index = state.cart.promociones_vinoteca.findIndex(promo => {
					return promo.id == item.id
				})
			} else {
				console.log('eliminado article')
				index = state.cart.articles.findIndex(article => {
					return article.id == item.id
				})
			}
			
			if (item.amount > 1 && remove_only_one_amount) {
				let new_amount = item.amount
				new_amount--
				delete item.amount

				if (is_promocion_vinoteca) {
					Vue.set(state.cart.promociones_vinoteca[index], 'amount', new_amount)
				} else {
					Vue.set(state.cart.articles[index], 'amount', new_amount)
				}
			} else {
				if (is_promocion_vinoteca) {
					console.log('se lo eliminio promo')
					state.cart.promociones_vinoteca.splice(index, 1)
				} else {
					console.log('se lo eliminio article')
					state.cart.articles.splice(index, 1)
				}
			}
		},	
		setCart(state, cart = null) {
			if (cart) {
				state.cart = cart
				cart.articles.forEach(article => {
					article.amount = article.pivot.amount
					article.price = article.pivot.price
					article.notes = article.pivot.notes
				})
				cart.promociones_vinoteca.forEach(promo => {
					promo.amount = promo.pivot.amount
					promo.price = promo.pivot.price
					promo.notes = promo.pivot.notes
				})
				state.payment_method = cart.payment_method 
				state.delivery_zone = cart.delivery_zone 
				state.cupon = cart.cupon 
			} else {
				state.cart = {
					articles: [],
					promociones_vinoteca: [],
					deliver: 0,
					description: '',
					payment_id: '',
					address_id: '',
					payment_card_info_id: null,
					fecha_entrega: 0,
				}
				state.payment_method = null
				state.delovery_zone = null
				state.cupon = null
			}
			console.log(state.cart)
		},
		setLoadingLastCart(state, value) {
			state.loading_last_cart = value
		},
		setSaving(state, value) {
			state.saving = value
		},
	},
	actions: {
		save({ state, commit }) {
			if (state.payment_method) {
				state.cart.payment_method_id = state.payment_method.id
			} else {
				state.cart.payment_method_id = null
			}
			if (state.cupon) {
				state.cart.cupon_id = state.cupon.id
			} else {
				state.cart.cupon_id = null
			}
			if (state.delivery_zone) {
				state.cart.delivery_zone_id = state.delivery_zone.id
			} else {
				state.cart.delivery_zone_id = null
			}
			console.log('carrito antes de guardar:')
			console.log(state.cart)
			if (!state.cart.id) {
				commit('setSaving', true)
				return axios.post('/api/carts', {
					cart	    : state.cart,
					commerce_id : process.env.VUE_APP_COMMERCE_ID 
				})
				.then(res => {
					commit('setSaving', false)
					console.log('Carrito creado')
					commit('setCart', res.data.cart)
				})
				.catch(err => {
					commit('setSaving', false)
					console.log(err)
				})
			} else {
				commit('setSaving', true)
				return axios.put('/api/carts', state.cart)
				.then(res => {
					commit('setSaving', false)
					console.log('Carrito actualizado')
					commit('setCart', res.data.cart)
				})
				.catch(err => {
					commit('setSaving', false)
					console.log(err)
				})
			}
		},
		getLastCart({ commit, state }) {
			commit('setLoadingLastCart', true)
			return axios.get(`/api/carts/last-cart/${process.env.VUE_APP_COMMERCE_ID}`)
			.then(res => {
				console.log('getLastCart')
				commit('setLoadingLastCart', false)
				if (res.data.has_last_cart) {
					commit('setCart', res.data.last_cart)
				} else {
					console.log('no tenia getLastCart')
				}
			})
			.catch(err => {
				commit('setLoadingLastCart', false)
				console.log(err)
			})
		},
		removeArticle({ state, commit }, article_param) {
			if (
				state.cart.articles.length
				|| state.cart.promociones_vinoteca.length
			) {
				axios.put('/api/carts', state.cart)
				.then(res => {
					console.log('Carrito actualizado')
					commit('setCart', res.data.cart)
				})
				.catch(err => {
					console.log(err)
				})
			} else {
				axios.delete(`/api/carts/${state.cart.id}`)
				.then(() => {
					commit('setCart', null)
					console.log('Carrito eliminado')
				})
				.catch(err => {
					console.log(err)
				})
			}
		},	
	}
}