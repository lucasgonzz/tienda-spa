import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true
export default {
	namespaced: true,
	state: {
		form: {
			text: '',
		},
	},
	mutations: {
		setForm(state, value) {
			state.form = value
		}
	}
}