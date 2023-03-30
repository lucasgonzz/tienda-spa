import Vue from 'vue'
import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true
export default {
	namespaced: true,
	state: {
		city: '',
		province: '',
		address: {
			street: '',
			street_number: '',
			lat: '',
			lng: '',
			formated: '',
			depto: '',
			description: '',
		},
	},
	mutations: {
		setCity(state, value) {
			state.city = value
		},
		setProvince(state, value) {
			state.province = value
		},
	},
	actions: {
	}
}