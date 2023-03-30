import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true
export default {
	namespaced: true,
	state: {
		messages: [],
		messages_not_read: 0,
		loading: false,	
	},
	getters: {

	},
	mutations: {
		setMessages(state, value) {
			state.messages = value
		},
		setMessagesNotRead(state) {
			state.messages_not_read = 0
			state.messages.forEach(message => {
				if (!message.from_buyer && !message.read) {
					state.messages_not_read++
				}
			})
		},
		setMessagesRead(state) {
			state.messages.forEach(message => {
				if (!message.from_buyer && !message.read) {
					message.read = 1
				}
			})
		},
		addMessage(state, message) {
			let repeated = state.messages.findIndex(m => {
				return m.id == message.id
			})
			if (repeated == -1) {
				state.messages.push(message) 
			}
		},
		setLoading(state, value) {
			state.loading = value
		},
	},
	actions: {
		getMessages({ commit }) {
			commit('setLoading', true)
			return axios.get('api/messages')
			.then(res => {
				commit('setLoading', false)
				commit('setMessages', res.data.messages)
				commit('setMessagesNotRead')
				console.log(res.data.messages)
			})
			.catch(err => {
				console.log(err)
				commit('setLoading', false)
			})
		},
		setMessagesRead({ state }) {
			return axios.get('api/messages/set-read')
			.catch(err => {
				console.log(err)
			})
		}
	}
}