import axios from 'axios'
axios.defaults.withCredentials = true
axios.defaults.baseURL = process.env.VUE_APP_API_URL
import last_searchs from '@/store/last_searchs'
export default {
	namespaced: true,
	state: {
		categories: [],
		sub_categories: [],
		articles: [],
		featured: [],

		selected_category: null,
		selected_sub_category: null,
		is_from_search: false,

		sub_categories_to_show: [],
		order_by: 'fecha-mayor-menor',

		page: 1,
		per_page: null,

		search_query: '',
		loading_categories: false,
		loading_sub_categories: false,
		loading_articles: false,
	},
	mutations: {
		setCategories(state, categories) {
			state.categories = categories
		},
		setSubCategories(state, value) {
			state.sub_categories = value
			console.log(state.sub_categories)
		},
		setOrderBy(state, value) {
			state.order_by = value
		},
		setOrder(state) {
			console.log('setOrder')
			if (state.order_by == 'precio-mayor-menor') {
				state.articles.sort((a, b) => (a.price - b.price))
			}
			if (state.order_by == 'precio-menor-mayor') {
				state.articles.sort((a, b) => (b.price - a.price))
			}
			if (state.order_by == 'a-z') {
				state.articles.sort((a, b) => (a.name > b.name) ? 1 : -1)
			}
			if (state.order_by == 'z-a') {
				state.articles.sort((a, b) => (b.name > a.name) ? 1 : -1)
			}
			if (state.order_by == 'fecha-menor-mayor') {
				state.articles.sort((a, b) => (new Date(a.created_at) - new Date(b.created_at)))
			}
			if (state.order_by == 'fecha-mayor-menor') {
				state.articles.sort((a, b) => (new Date(b.created_at) - new Date(a.created_at)))
			}
		},
		setArticles(state, value) {
			state.articles = value
		},
		setFeatured(state, value) {
			state.featured = value
		},
		addArticles(state, value) {
			state.articles = state.articles.concat(value)
		},
		setSelectedCategory(state, category) {
			state.selected_category = category
		},
		setIndexAsSelectedCategory(state) {
			state.selected_category = state.categories[0]
			state.selected_sub_category = {id: 0, name: 'Ultimos Ingresados'}
		},
		setSelectedSubCategory(state, value) {
			state.selected_sub_category = value
		},
		setIsFromSearch(state, value) {
			state.is_from_search = value 
		},
		setPage(state, value) {
			state.page = value
		},
		incrementPage(state) {
			state.page++
		},
		setSearchQuery(state, value) {
			state.search_query = value
		},
		setLoadingCategories(state, value) {
			state.loading_categories = value
		},
		setLoadingSubCategories(state, value) {
			state.loading_sub_categories = value
		},
		setLoadingArticles(state, value) {
			state.loading_articles = value
		},
	},
	actions: {
		getCategories({ commit }) {
			commit('setLoadingCategories', true)
			return axios.get(`/api/categories/${ process.env.VUE_APP_COMMERCE_ID }`)
			.then(res => {
				commit('setLoadingCategories', false)
				commit('setCategories', res.data.categories)
				// commit('setIndexAsSelectedCategory')
			})
			.catch(err => {
				commit('setLoadingCategories', false)
				console.log(err)
			})
		},
		getSubCategories({ commit, state }) {
			commit('setLoadingSubCategories', true)
			commit('setLoadingArticles', true)
			return axios.get('api/sub-categories/'+state.selected_category.id)
			.then(res => {
				commit('setLoadingSubCategories', false)
				commit('setLoadingArticles', false)
				commit('setSubCategories', res.data.sub_categories)
				// commit('setSubCategoriesToShow')
			})
			.catch(err => {
				commit('setLoadingSubCategories', false)
				commit('setLoadingArticles', false)
				console.log(err)
			})
		},
		getArticles({ commit, state }) {
			commit('setPage', 1)
			commit('setLoadingArticles', true)
			let category_id = 0
			if (state.selected_category) {
				category_id = state.selected_category.id
			}
			let sub_category_id = 0
			if (state.selected_sub_category) {
				sub_category_id = state.selected_sub_category.id
			}
			return axios.get('api/articles/from-category/'+category_id+'/'+sub_category_id+'/'+process.env.VUE_APP_COMMERCE_ID+'?page=1')
			.then(res => {
				commit('setLoadingArticles', false)
				commit('setArticles', res.data.articles.data)
				commit('setOrder')
			})
			.catch(err => {
				commit('setLoadingArticles', false)
				console.log(err)
			})
		},
		getIndex({ commit, state }) {
			commit('setPage', 1)
			commit('setIsFromSearch', false)
			commit('setSelectedCategory', null)
			commit('setSelectedSubCategory', null)
			commit('setLoadingArticles', true)
			return axios.get(`api/articles/featured-last-uploads/${ process.env.VUE_APP_COMMERCE_ID }?page=1`)
			.then(res => {
				console.log(res)
				commit('setLoadingArticles', false)
				commit('setArticles', res.data.articles.data)
				commit('setFeatured', res.data.featured)
			})
			.catch(err => {
				commit('setLoadingArticles', false)
				console.log(err)
			})
		},
		searchArticles({ commit, state }) {
			commit('setPage', 1)
			commit('setIsFromSearch', true)
			commit('setSelectedCategory', null)
			commit('setSelectedSubCategory', null)
			commit('setLoadingArticles', true)
			// commit('setSelectedCategory', {id: -1, is_results: true})
			// commit('setSelectedSubCategory', {id: -1, name: 'Resultados'})
			return axios.get(`/api/articles/search/${state.search_query}/${process.env.VUE_APP_COMMERCE_ID}`)
			.then(res => {
				commit('setLoadingArticles', false)
				console.log(res)
				let last_search = res.data.last_search
				if (last_search) {
					last_searchs.state.last_searchs.unshift(last_search)
				}
				commit('setArticles', res.data.articles.data)
			})
			.catch(err => {
				commit('setLoadingArticles', false)
				console.log(err)
			})
		},
	},
	modules: {
	}
}
