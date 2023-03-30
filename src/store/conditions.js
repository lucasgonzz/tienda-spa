import axios from 'axios'
export default {
	namespaced: true,
	state: {
		conditions: [],
	},
	mutations: {
		setConditions(state, value) {
			state.conditions = value
		},
	},
	actions: {
		getConditions({ commit }) {
			return axios.get('api/conditions')
			.then(res => {
				commit('setConditions', res.data.conditions)
			})
			.catch(err => {
				console.log(err)
			})
		}
	}
}