// import Vue from 'vue'
// import axios from 'axios'
// axios.defaults.baseURL = process.env.VUE_APP_API_URL
// axios.defaults.withCredentials = true
export default {
	namespaced: true,
	state: {
		deferred_prompt: null,
	},
	mutations: {
		setDeferredPrompt(state, value) {
			state.deferred_prompt = value
		},
	},
	actions: {
	}
}