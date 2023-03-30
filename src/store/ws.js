import Vue from 'vue'
import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true
export default {
	namespaced: true,
	state: {
        refreshing: false,
        registration: null,
        update_exists: false,
        update_app: false,
	},
	mutations: {
		setRegistration(state, value) {
			state.registration = value
		},
		setUpdateExist(state, value) {
			state.update_exists = value
		},
		setUpdateApp(state, value) {
			state.update_app = value
		}
	},
	actions: {
	}
}