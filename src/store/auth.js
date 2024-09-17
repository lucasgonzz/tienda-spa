import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true
export default {
	namespaced: true,
	state: {
		authenticated: false,
		user: null,
		
		loading_login: false,
		error: null,

		loading: false,	
		message: '',

		mobile_sidebar_visibility: false,
	},
	getters: {

	},
	mutations: {
		setAuthenticated(state, value) {
			state.authenticated = value
		},
		setUserDocument(state, value) {
			state.user.document = value
		},
		setUser(state, user) {
			state.user = user
		},
		addAddress(state, value) {
			state.user.addresses.push(value)
		},
		setLoading(state, value) {
			state.loading = value
		},
		setMessage(state, value) {
			state.message = value
		},
		setLoadingLogin(state, value) {
			state.loading_login = value
		},
		setError(state, value) {
			state.error = value
		},
		setMobileSidebarVisibility(state, value) {
			state.mobile_sidebar_visibility = value
		},
	},
	actions: {
		logout({ commit }) {
			commit('setMessage', 'Cerrando sesion')
			commit('setLoading', true)
			return axios.post('/logout')
			.then(() => {
				commit('setMessage', '')
				commit('setLoading', false)
				commit('setAuthenticated', false)
				commit('setUser', null)
			})
			.catch(err => {
				commit('setMessage', '')
				commit('setLoading', false)
				console.log(err)
			})
		},
		login({ commit }, user) {
			// commit('setLoadingLogin', true)
			return axios.post('/login', user)
			.then(res => {
				commit('setLoadingLogin', false)
				if (res.status == 200) {
					commit('setAuthenticated', true)
					console.log(res.data.buyer)
					commit('setUser', res.data.buyer)
				} else {
					commit('setError', 'Los datos no coinciden')
				}
			})
			.catch(err => {
				commit('setLoadingLogin', false)
				console.log(err)
			})
		},
		csrf({ commit }) {
			commit('setAuthenticated', false)
			commit('setLoadingLogin', true)
			return axios.get('/sanctum/csrf-cookie')
			.catch(err => {
				commit('setLoadingLogin', false)
				commit('setAuthenticated', false)
				console.log(err)
			})
		},
		me({ commit }) {
			axios.get('/sanctum/csrf-cookie')
			.then(() => {
				return axios.get('/api/user')
				.then(res => {
					commit('setAuthenticated', true)
					commit('setUser', res.data.buyer)
				})
				.catch(() => {
					commit('setAuthenticated', false)
					commit('setUser', null)
				})
			})
			// .catch(err => {
			// 	commit('setLoadingLogin', false)
			// 	commit('setAuthenticated', false)
			// 	console.log(err)
			// })
		},
	}
}