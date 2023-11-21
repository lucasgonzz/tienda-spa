import axios from 'axios'
axios.defaults.baseUrl = process.env.VUE_APP_API_URL	
axios.defaults.withCredentials = true
export default {
	namespaced: true,
	state: {
		order: null,
		orders: [],
		details: {},
		page: 2,
		loading: false,
	},
	mutations: {
		setOrder(state, order) {
			// order = articles_mixin.methods.setArticlesVariant(order)
			state.order = order
		},
		setOrders(state, orders) {
			state.orders = orders
		},
		setDetails(state, value) {
			state.details = value
		},
		addOrders(state, orders) {
			state.orders = state.orders.concat(orders)
		},
		incrementPage(state) {
			state.page++
		},
		setPage(state, value) {
			state.page = value
		},
		setLoading(state, value) {
			state.loading = value
		},
	},
	actions: {
		getOrders({ commit }) {
			commit('setLoading', true)
			return axios.get(`/api/orders?page=1`)
			.then(res => {
				console.log(res)
				commit('setLoading', false)
				commit('setOrders', res.data.orders.data)
				commit('setPage', 2)
			})
			.catch(err => {
				commit('setLoading', false)
				console.log(err)
			})
		},
		getCurrentOrder({ commit }) {
			return axios.get(`/api/orders/current/${process.env.VUE_APP_COMMERCE_ID}`)
			.then(res => {
				commit('setOrder', res.data.order)
			})
			.catch(err => {
				console.log(err)
			})
		}
	}
}