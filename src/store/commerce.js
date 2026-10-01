import axios from 'axios'
import { apply_online_configuration_theme } from '@/helpers/online_configuration_theme'
import { env } from '@/runtime_config'
axios.defaults.withCredentials = true
axios.defaults.baseURL = env('VUE_APP_API_URL')
export default {
	namespaced: true,
	state: {
		commerce: null,
		workdays: [],
	},
	mutations: {
		setCommerce(state, value) {
			state.commerce = value
			/* Aplica variables CSS de tema al persistir el comercio desde el API. */
			if (value && value.online_configuration) {
				apply_online_configuration_theme(value.online_configuration)
			}
			console.log(state.commerce)
		},
		setWorkdays(state, value) {
			state.workdays = value
		},
	},
	actions: {
		getCommerce({ commit }) {
			return axios.get('/api/commerce/'+env('VUE_APP_COMMERCE_ID'))
			.then(res => {
				commit('setCommerce', res.data.commerce)
			})
			.catch(err => {
				console.log(err)
			})
		},
		getWorkdays({commit}) {
			return axios.get('api/commerce/workdays/'+env('VUE_APP_COMMERCE_ID'))
			.then(res => {
				commit('setWorkdays', res.data.workdays)
			})
			.catch(err => {
				console.log(err)
			})
		}
	}
}