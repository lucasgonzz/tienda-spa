import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true
export default {
	namespaced: true,
	state: {
		questions: [],
		page: 1,
		loading: false
	},
	mutations: {
		setQuestions(state, questions) {
			state.questions = questions
		},
		addQuestion(state, question) {
			state.questions.push(question)
		},
		addQuestions(state, questions) {
			state.questions = state.questions.concat(questions)
		},
		incrementsPage(state) {
			state.page++
		},
		setLoading(state, value) {
			state.loading = value
		}
	},
	actions: {
		getQuestions({ commit }) {
			commit('setLoading', true)
			axios.get(`/api/questions?page=1`)
			.then(res => {
				commit('setLoading', false)
				commit('setQuestions', res.data.questions.data)
			})
			.catch(err => {
				commit('setLoading', false)
				console.log(err)
			})
		}
	}
}