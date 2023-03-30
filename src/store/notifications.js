import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true
export default {
	namespaced: true,
	state: {
		notifications: [],
		unread_notifications: [],
		unread_notifications_count: 0,
		page: 2,
		loading: false
	},
	mutations: {
		setNotifications(state, value) {
			state.notifications = value
		},
		addNotifications(state, value) {
			state.notifications = state.notifications.concat(value)
		},
		setUnreadNotifications(state, value = null) {
			if (value) {
				state.unread_notifications = value
			} else {
				state.unread_notifications = []
				let index = 0
				state.notifications.forEach(noti => {
					if (!noti.read_at) {
						state.unread_notifications.push(noti)
						state.notifications.splice(index, 1)
					}
					index++
				})
			}
		},
		setUnreadNotificationsCount(state, mark_0 = false) {
			if (mark_0) {
				state.unread_notifications_count = 0
			} else {
				state.unread_notifications_count = state.unread_notifications.length
			}
		},
		markAsRead(state) {
			let unread_notifications_reversed = state.unread_notifications.reverse()
			unread_notifications_reversed.forEach(noti => {
				state.notifications.unshift(noti)
			})
			state.unread_notifications = []
		},
		setLoading(state, value) {
			state.loading = value
		},
		incrementPage(state) {
			state.page++
		},
		setPage(state, value) {
			state.page = value
		},
	},
	actions: {	
		getNotifications({ commit }) {
			commit('setLoading', true)
			return axios.get(`/api/notifications?page=1`)
			.then(res => {
				commit('setLoading', false)
				commit('setNotifications', res.data.notifications.data)
				commit('setUnreadNotifications')
				commit('setUnreadNotificationsCount')
				commit('setPage', 2)
			})
			.catch(err => {
				console.log(err)
				commit('setLoading', false)
			})
		},
		getUnreadNotifications({ commit }) {
			commit('setLoading', true)
			return axios.get(`/api/notifications/unread`)
			.then(res => {
				commit('setLoading', false)
				commit('setUnreadNotifications', res.data.notifications)
				commit('setUnreadNotificationsCount')
			})
			.catch(err => {
				console.log(err)
				commit('setLoading', false)
			})
		},
		markAsRead({ state }) {
			if (state.unread_notifications.length) {
				axios.post('/api/notifications/mark-as-read')
				.catch(err => {
					console.log(err)
				})
			}
		}
	}
}