import axios from 'axios'
axios.defaults.withCredentials = true
axios.defaults.baseURL = process.env.VUE_APP_API_URL
export default {
	namespaced: true,
	state: {
		commerce: {},
		workdays: [],
	},
	mutations: {
		setCommerce(state, value) {
			state.commerce = value
			console.log(state.commerce)
		},
		setWorkdays(state, value) {
			state.workdays = value
		},
	},
	actions: {
		getCommerce({ commit }) {
			return axios.get('/api/commerce/'+process.env.VUE_APP_COMMERCE_ID)
			.then(res => {
				commit('setCommerce', res.data.commerce)
			})
			.catch(err => {
				console.log(err)
			})
		},
		getWorkdays({commit}) {
			return axios.get('api/commerce/workdays/'+process.env.VUE_APP_COMMERCE_ID)
			.then(res => {
				commit('setWorkdays', res.data.workdays)
			})
			.catch(err => {
				console.log(err)
			})
		}
	}
}