import axios from 'axios'
import { env } from '@/runtime_config'
axios.defaults.baseURL = env('VUE_APP_API_URL')
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