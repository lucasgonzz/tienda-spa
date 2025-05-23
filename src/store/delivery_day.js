import axios from 'axios'
axios.defaults.withCredentials = true
axios.defaults.baseURL = process.env.VUE_APP_API_URL
export default {
	namespaced: true,
	state: {
		models: [],
		loading: false,
	},
	mutations: {
		setLoading(state, value) {
			state.loading = value
		},
		setModels(state, value) {
			state.models = value
		},
	},
	actions: {
		getModels({ commit }) {
			commit('setLoading', true)
			return axios.get(`/api/delivery-day/${ process.env.VUE_APP_COMMERCE_ID }`)
			.then(res => {
				commit('setLoading', false)
				commit('setModels', res.data.models)
				// commit('setIndexAsSelectedCategory')
			})
			.catch(err => {
				commit('setLoading', false)
				console.log(err)
			})
		},
	},
	modules: {
	}
}
