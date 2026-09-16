import Vue from 'vue'
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

		categories_sidebar_visibility: false,
		bodegas_sidebar_visibility: false,
		cepas_sidebar_visibility: false,
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
		/**
		 * Último código postal (y localidad/provincia) con el que el buyer cotizó un envío en la
		 * tienda. Vue.set porque un buyer que venía de una base sin la migración de empresa-api
		 * puede no traer estas tres claves.
		 * @param {object} state
		 * @param {object} payload { zipcode, city, state }
		 */
		setUserEnvioZipcode(state, payload) {
			Vue.set(state.user, 'envio_zipcode', payload.zipcode)
			Vue.set(state.user, 'envio_city', payload.city)
			Vue.set(state.user, 'envio_state', payload.state)
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
		set_categories_sidebar_visibility(state, value) {
			state.categories_sidebar_visibility = value
		},
		set_bodegas_sidebar_visibility(state, value) {
			state.bodegas_sidebar_visibility = value
		},
		set_cepas_sidebar_visibility(state, value) {
			state.cepas_sidebar_visibility = value
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
		/**
		 * Restaura la sesión Sanctum: cookie CSRF y luego consulta /api/user.
		 * Debe devolver la promesa para que dispatch('auth/me') pueda encadenarse con .then().
		 *
		 * @returns {Promise<void>}
		 */
		me({ commit }) {
			return axios.get('/sanctum/csrf-cookie')
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
			.catch(err => {
				commit('setAuthenticated', false)
				commit('setUser', null)
				console.log(err)
			})
		},
		/**
		 * Guarda en el perfil el último código postal cotizado, para la próxima visita. Guardado
		 * de conveniencia: si falla (sin sesión, o el cliente todavía no tiene la migración de
		 * empresa-api y la API respondió 204 igual) no interrumpe la compra, solo queda en el log.
		 *
		 * @param {object} context
		 * @param {object} payload { zipcode, city, state }
		 * @returns {Promise}
		 */
		guardar_envio_zipcode({ commit }, payload) {
			return axios.put('/api/buyer/envio-zipcode', payload)
			.then(() => {
				commit('setUserEnvioZipcode', payload)
			})
			.catch(err => {
				console.log(err)
			})
		},
	}
}