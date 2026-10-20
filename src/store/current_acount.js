import axios from 'axios'
import { env } from '@/runtime_config'
axios.defaults.baseURL = env('VUE_APP_API_URL')
axios.defaults.withCredentials = true

export default {
	namespaced: true,
	state: {
		credit_accounts: [],
		current_credit_account: null,
		models: [],
		loading: false,
		cantidad_movimientos: 50,
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
		/**
		 * Solicita a tienda-api un token de un solo uso para imprimir el PDF de una venta
		 * de la cuenta corriente del buyer autenticado.
		 *
		 * @param {Object} context Contexto Vuex del módulo current_acount
		 * @param {number} sale_id ID de la venta cuyo PDF se va a abrir
		 * @returns {Promise<string>} Token de acceso temporal
		 */
		getSalePdfToken(context, sale_id) {
			return axios.get(`/api/current-acount/sale-pdf-token/${sale_id}`)
				.then(res => res.data.token)
		},
		/**
		 * Pide a tienda-api el token del link de un PDF de cuenta corriente (misión
		 * pdf-de-venta-publico, 10/10/2026): el estado de cuenta (`credit_account`) o el
		 * comprobante de un pago o una nota de crédito (`current_acount`).
		 *
		 * empresa-api deja de servir esos PDF sin sesión ni token, y el comprador no tiene sesión
		 * de empresa: el link tiene que llevar `?t=<token>`. tienda-api valida que el recurso sea
		 * del comprador y reusa (o crea) la fila de `pdf_links` en la base compartida.
		 *
		 * Resuelve null si la base del cliente todavía no tiene `pdf_links` (empresa sin
		 * actualizar): ahí la ruta del PDF sigue pública y se abre el link de siempre. Rechaza si
		 * el pedido falla (sin sesión, no es suyo, red caída); el que llama abre el link de
		 * siempre igual.
		 *
		 * @param {Object} context Contexto Vuex del módulo current_acount
		 * @param {Object} payload { tipo: 'credit_account'|'current_acount', id }
		 * @returns {Promise<string|null>} Token del link, o null si no hay tabla
		 */
		getPdfLinkToken(context, payload) {
			let segmento = payload.tipo == 'credit_account' ? 'credit-account' : 'movement'
			return axios.get(`/api/current-acount/pdf-token/${segmento}/${payload.id}`)
				.then(function (res) {
					return res.data && res.data.token ? res.data.token : null
				})
		},
	}
}
