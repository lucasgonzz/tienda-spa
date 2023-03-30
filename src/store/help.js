import axios from 'axios'
axios.defaults.withCredentials = true
axios.defaults.baseURL = process.env.VUE_APP_API_URL
export default {
	namespaced: true,
	state: {
		selected_option: '',
		message: '',
		waiting_call: false,
	},
	mutations: {
		setSelectedOption(state, value) {
			state.selected_option = value
		},
		setMessage(state, value) {
			state.message = value
		},
		setWaitingCall(state, value) {
			if (value) {
				state.selected_option = 'llamada'
			}
			state.waiting_call = value
		},
	},
	actions: {
		setWaitingCall({commit}) {
			return axios.get('api/calls/waiting-call')
			.then(res => {
				commit('setWaitingCall', res.data.waiting_call)
			})
			.catch(err => {
				console.log(err)
			})
		}
	}
}