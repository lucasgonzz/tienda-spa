import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true
export default {
	namespaced: true,
	state: {
		titles: [],
		loading: false,
	},
	mutations: {
		setTitles(state, value) {
			state.titles = value
		},
		setLoading(state, value) {
			state.loading = value
		},
	},
	actions: {
		getTitles({ commit }) {
			commit('setLoading', true)
			return axios.get(`/api/titles/${process.env.VUE_APP_COMMERCE_ID}`)
			.then(res => {
				commit('setLoading', false)
				console.log(res.data.titles)
				commit('setTitles', res.data.titles)
			})
			.catch(err => {
				commit('setLoading', false)
				console.log(err)
			})
		}
	}
}