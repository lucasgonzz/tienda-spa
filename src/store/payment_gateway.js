import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true
export default {
	namespaced: true,
	state: {
		cards: [],
	},
	mutations: {
		setCards(state, value) {
			state.cards = value
		},
	},
	actions: {
	}
}