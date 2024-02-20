import Vue from 'vue'
import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true
import preguntar from '@/store/articles/preguntar'
import categories from '@/store/categories'
export default {
	namespaced: true,
	state: {
		images: [],
		similars: [],
		article_to_show: null,
		amount: 1,
		notes: '',
		selected_article_variant: null,
		image_index: 0,
		articles_names: [],
		searcheds: [],
		search_query: '',
		loading: false,
		loading_similars: false,
		loading_questions: false,
		loading_article_to_show: false,
	},
	mutations: {
		setArticles(state, articles) {
			state.articles = articles
		},
		setImages(state, value) {
			if (value) {
				state.images = value
			} else {
				state.images = state.article_to_show.images
			}
		},
		setSelectedArticleVariant(state, value) {
			state.selected_article_variant = value 
		},
		setImageIndex(state, value) {
			state.image_index = value 
		},
		setSimilars(state, articles) {
			state.similars = articles
		},
		addSimilars(state, value) {
			state.similars = state.similars.concat(value)
		},
		addArticles(state, articles) {
			state.articles = state.articles.concat(articles)
		},
		setLoading(state, value) {
			state.loading = value
		},
		setLoadingSimilars(state, value) {
			state.loading_similars = value
		},
		setArticlesNames(state, value) {
			let articles_names = []
			let index
			value.forEach(article => {
				index = articles_names.findIndex(art => {
					return article.name == art.name
				})
				if (index == -1) {
					articles_names.push(article)
				} else {
					articles_names[index].repeated = true
				}
			})
			state.articles_names = articles_names
		},
		setSearcheds(state, value) {
			state.searcheds = value
		},
		addTags(state, value) {
			state.articles_names = state.articles_names.concat(value)
		},
		setArticleToShow(state, article) {
			// if (article && article.variants && article.variants.length) {
			// 	article.variant = article.variants[0]	
			// 	article.key += '-'+article.variants[0].id	
			// } else if (article) {
			// 	article.image = article.images[0]
			// }
			if (article) {
				article.image = article.images[0]
				state.amount = 1
				state.selected_article_variant = null
				if (article.article_properties.length) {
					article.selected_article_properties = {}
					article.article_properties.forEach(article_property => {
						article.selected_article_properties[article_property.article_property_type.name] = 0
						// article.selected_article_properties[article_property.id] = 0
					})
				}
				// if (article.sizes && article.sizes.length) {
				// 	article.size = 0
				// }
			}
			state.article_to_show = article
		},
		setAmount(state, value) {
			state.amount = value
		},
		incrementAmount(state) {
			state.amount++
		},
		decrementAmount(state) {
			state.amount--
		},
		setNotes(state, value) {
			state.notes = value
		},
		setArticleToShowVariant(state, value) {
			state.article_to_show = Object.assign({}, state.article_to_show, { variant: value })
			state.article_to_show.key = state.article_to_show.id+'-'+state.article_to_show.variant.id	
		},
		setArticleToShowImage(state, value) {
			state.article_to_show = Object.assign({}, state.article_to_show, { image: value })
			// state.article_to_show.key = state.article_to_show.id+'-'+state.article_to_show.variant.id	
		},
		setArticleToShowQuestions(state, value) {
			state.article_to_show.questions = value
		},
		setLoadingQuestions(state, value) {
			state.loading_questions = value
		},
		setLoadingArticleToShow(state, value) {
			state.loading_article_to_show = value
		},
		setArticleColor(state, value) {
			state.article_to_show.color = Object.assign({}, state.article_to_show, { color: value })
		}
	},
	actions: {
		getArticlesNames({ commit }) {
			return axios.get(`/api/articles/names/${process.env.VUE_APP_COMMERCE_ID}`)
			.then(res => {
				commit('setArticlesNames', res.data.articles_names) 
				commit('addTags', res.data.tags) 
			})
			.catch(err => {
				console.log(err)
			})
		},
		// Se llama cuando se recarga la pagina article
		getArticleToShow({ commit }, params) {
			let url = `/api/articles/${params.slug}/${params.commerce_id}`
			commit('setLoadingArticleToShow', true)
			return axios.get(url)
			.then(res => {
				console.log('getArticleToShow')
				console.log(res.data.article)
				commit('setLoadingArticleToShow', false)
				commit('setArticleToShow', res.data.article)
			})
			.catch(err => {
				commit('setLoadingArticleToShow', false)
				console.log(err)
			})
		},
		// Se llama cuando se hace click a un articulo desde el inicio
		getArticleToShowQuestions({ commit, state }) {
			commit('setLoadingQuestions', true)
			return axios.get(`/api/articles/questions/answered/${state.article_to_show.id}`)
			.then(res => {
				commit('setLoadingQuestions', false)
				commit('setArticleToShowQuestions', res.data.questions)
			})
			.catch(err => {
				commit('setLoadingQuestions', false)
				console.log(err)
			})
		},
		getSimilars({ commit, state }) {
			commit('setLoadingSimilars', true)
			return axios.get(`/api/articles/similars/${state.article_to_show.id}/${process.env.VUE_APP_COMMERCE_ID}?page=1`)
			.then(res => {
				console.log(res)
				commit('setLoadingSimilars', false)
				commit('setSimilars', res.data.models.data)
			})
			.catch(err => {
				commit('setLoadingSimilars', false)
				console.log(err)
			})
		},
	},
	modules: {
		preguntar
	}
}