import axios from 'axios'
axios.defaults.withCredentials = true
axios.defaults.baseURL = process.env.VUE_APP_API_URL
export default {
	namespaced: true,
	state: {
		active_cupons: [],
		new_cupon: {
			amount: '',
			percentage: '',
			// all_buyers: false,
			buyers: [],
			expiration_date: '',
		},
		cupons_not_read: 0,
		loading: false,
	},
	mutations: {
		setActiveCupons(state, value) {
			state.active_cupons = value
		},
		addActiveCupons(state, cupons) {
			cupons.forEach(cupon => {
				state.active_cupons.push(cupon)
			})
		},
		setLoading(state, value) {
			state.loading = value
		},
		setCuponsRead(state) {
			state.active_cupons.forEach(cupon => {
				if (!cupon.read) {
					cupon.read = 1
				}
			})
		},
		setCuponsNotRead(state) {
			state.cupons_not_read = 0
			state.active_cupons.forEach(cupon => {
				if (!cupon.read) {
					state.cupons_not_read++
				}
			})
		},
		checkActiveCupons(state, cart_cupons) {
			cart_cupons.forEach(cupon => {
				let index = state.active_cupons.indexOf(active_cupon => {
					return active_cupon.id == cupon.id
				})
				if (index != -1) {
					state.active_cupon.splice(index, 1)
					console.log('Se quito el cupon id: '+cupon.id)
				}
			})
		}
	},
	actions: {
		getActiveCupons({ commit }) {
			commit('setLoading', true)
			axios.get('/api/cupons')
			.then(res => {
				commit('setLoading', false)
				commit('setActiveCupons', res.data.cupons)
				commit('setCuponsNotRead')
				console.log('getActiveCupons', res.data.cupons)
			})
			.catch(err => {
				commit('setLoading', false)
				console.log(err)
			})
		},
		setCuponsRead({ state }) {
			return axios.get('api/cupons/set-read')
			.catch(err => {
				console.log(err)
			})
		}
	},
	modules: {
	}
}
