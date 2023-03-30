import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true 
export default {
	namespaced: true,
	state: {
		favorites: [],
		loading: false,
		page: 2,
	},
	mutations: {
		setFavorites(state, favorites) {
			state.favorites = favorites
		},
		setLoading(state, value) {
			state.loading = value
		},
		addFavorites(state, favorites) {
			state.favorites = state.favorites.concat(favorites)
		},
		incrementPage(state) {
			state.page++
		},
		setPage(state, page) {
			state.page = page
		}
	},
	actions: {
		getFavorites({ commit }) {
			commit('setLoading', true)
			axios.get('/api/favorites')
			.then(res => {
				commit('setLoading', false)
				commit('setFavorites', res.data.articles.data)
				commit('setPage', 2)
			})
			.catch(err => {
				commit('setLoading', false)
				console.log(err)
			})
		}
	}
}