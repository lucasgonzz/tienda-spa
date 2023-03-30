import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true
export default {
	namespaced: true,
	state: {
		models: [],
		loading: false,
	},
	mutations: {
		setModels(state, value) {
			state.models = value
			console.log(state.models)
		},
		setLoading(state, value) {
			state.loading = value
		},
	},
	actions: {
		getModels({ commit }) {
			commit('setLoading', true)
			return axios.get(`/api/platelets/${process.env.VUE_APP_COMMERCE_ID}`)
			.then(res => {
				commit('setLoading', false)
				commit('setModels', res.data.platelets)
			})
			.catch(err => {
				commit('setLoading', false)
				console.log(err)
			})
		}
	}
}