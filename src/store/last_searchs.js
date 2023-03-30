import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true
export default {
	namespaced: true,
	state: {
		last_searchs: [],
		last_searchs_for_search_page: [],
		loading: false,	
		loading_for_search_page: false,	
	},
	mutations: {
		setLastSearchs(state, value) {
			state.last_searchs = value
		},
		setLastSearchsForSearchPage(state, value) {
			state.last_searchs_for_search_page = value
		},
		setLoading(state, value) {
			state.loading = value
		},
		setLoadingForSearchPage(state, value) {
			state.loading_for_search_page = value
		},
	},
	actions: {
		getLastSearchs({ commit }) {
			commit('setLoading', true)
			return axios.get('/api/last-searchs')
			.then(res => {
				commit('setLoading', false)
				commit('setLastSearchs', res.data.last_searchs)
			})
			.catch(err => {
				commit('setLoading', false)
				console.log(err)
			})
		},
		getLastSearchsForSearchPage({ commit }) {
			commit('setLoadingForSearchPage', true)
			return axios.get('/api/last-searchs/for-search-page/'+process.env.VUE_APP_COMMERCE_ID)
			.then(res => {
				console.log(res.data.articles)
				commit('setLoadingForSearchPage', false)
				commit('setLastSearchsForSearchPage', res.data.articles)
			})
			.catch(err => {
				commit('setLoadingForSearchPage', false)
				console.log(err)
			})
		},
	}
}