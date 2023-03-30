import axios from 'axios'
export default {
	namespaced: true,
	state: {
		dolar: {
			compra: 0,
			venta: 0,
			promedio: 0,
		},
	},
	mutations: {
		setDolar(state, value) {
			let dolar_blue = value.find(data => {
				return data.casa.nombre == "Dolar Blue"
			})
			let compra = Number(dolar_blue.casa.compra.replace(',', '.'))
			let venta = Number(dolar_blue.casa.venta.replace(',', '.'))
			state.dolar.compra = compra
			state.dolar.venta = venta
			state.dolar.promedio = (compra + venta) / 2
			console.log('dolar:')
			console.log(state.dolar)
		},
	},
	actions: {
		getCoins({ commit }) {
			return fetch('https://www.dolarsi.com/api/api.php?type=valoresprincipales')
			.then(res => {
				res.json()
				.then(data => {
					commit('setDolar', data)
				})
			})
			.catch(err => {
				console.log(err)
			})
		}
	}
}