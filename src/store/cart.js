 import Vue from 'vue'
import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true
export default {
	namespaced: true,
	state: {
		cart: {
			articles: [],
			deliver: 0,
			description: '',
			payment_id: '',
			payment_status: '',
			address_id: '',
		},
		payment_method: null,
		delivery_zone: null,
		cupon: null,
		loading_last_cart: false,
		saving: false,
	},
	mutations: {
		setDeliver(state, value) {
			state.cart.deliver = value
		},
		setAddressId(state, value) {
			state.cart.address_id = value
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
		addArticle(state, article_param) {
			let article_repeated_index = state.cart.articles.findIndex(article => {
				return article.id == article_param.id
			})
			if (article_repeated_index != -1) {
				state.cart.articles.splice(article_repeated_index, 1)
			}
			state.cart.articles.push(article_param)
		},
		removeArticle(state, {article_param, remove_only_one_amount }) {
			console.log(article_param)
			console.log(remove_only_one_amount)
			if (remove_only_one_amount == undefined) {
				remove_only_one_amount = true
			}
			console.log(remove_only_one_amount)
			let index = state.cart.articles.findIndex(article => {
				return article.id == article_param.id
			})
			if (article_param.amount > 1 && remove_only_one_amount) {
				let new_amount = article_param.amount
				new_amount--
				delete article_param.amount
				Vue.set(state.cart.articles[index], 'amount', new_amount)
			} else {
				console.log('se lo eliminio por completo')
				state.cart.articles.splice(index, 1)
			}
		},	
		setCart(state, cart = null) {
			if (cart) {
				state.cart = cart
				cart.articles.forEach(article => {
					article.amount = article.pivot.amount
					article.price = article.pivot.price
				})
				state.payment_method = cart.payment_method 
				state.delivery_zone = cart.delivery_zone 
				state.cupon = cart.cupon 
			} else {
				state.cart = {
					articles: [],
					deliver: 0,
					description: '',
					payment_id: '',
					address_id: '',
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
			if (state.cart.articles.length) {
				axios.put('/api/carts', state.cart)
				.then(() => {
					console.log('Carrito actualizado')
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