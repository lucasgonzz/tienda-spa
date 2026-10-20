import axios from 'axios'
import { env } from '@/runtime_config'
axios.defaults.baseURL = env('VUE_APP_API_URL')
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