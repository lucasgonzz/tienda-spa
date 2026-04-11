import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true

export default {
	namespaced: true,
	state: {
		credit_accounts: [],
		current_credit_account: null,
		models: [],
		loading: false,
		cantidad_movimientos: 500,
	},
	mutations: {
		setCreditAccounts(state, value) {
			state.credit_accounts = value
		},
		setCurrentCreditAccount(state, value) {
			state.current_credit_account = value
		},
		setModels(state, value) {
			state.models = value
		},
		setLoading(state, value) {
			state.loading = value
		},
		setCantidadMovimientos(state, value) {
			state.cantidad_movimientos = value
		},
	},
	actions: {
		getCreditAccounts({ commit }) {
			commit('setLoading', true)
			return axios.get('/api/credit-accounts')
			.then(res => {
				commit('setCreditAccounts', res.data.credit_accounts)
				if (res.data.credit_accounts.length) {
					commit('setCurrentCreditAccount', res.data.credit_accounts[0])
				}
				commit('setLoading', false)
			})
			.catch(err => {
				commit('setLoading', false)
				console.log(err)
			})
		},
		getMovements({ commit, state }) {
			if (!state.current_credit_account) return
			commit('setLoading', true)
			return axios.get(`/api/current-acount/${state.current_credit_account.id}/${state.cantidad_movimientos}`)
			.then(res => {
				commit('setModels', res.data.models)
				commit('setLoading', false)
			})
			.catch(err => {
				commit('setLoading', false)
				console.log(err)
			})
		},
	}
}
