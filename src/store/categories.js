import axios from 'axios'
axios.defaults.withCredentials = true
axios.defaults.baseURL = process.env.VUE_APP_API_URL
import last_searchs from '@/store/last_searchs'
import { trackear, TIPOS_EVENTO } from '@/utils/tracking'
export default {
	namespaced: true,
	state: {
		categories: [],
		sub_categories: [],
		articles: [],
		featured: [],
		promociones_vinoteca: [],
		in_offer: [],
		novedades: [],
		/*
		 * Artículos con al menos un rango de precio por cantidad (`article_price_ranges`), para
		 * la sección "Comprando más, pagás menos" de la home. Arranca en [] y se queda en [] si
		 * la API todavía no manda la clave: la sección no se renderiza y no hay error.
		 */
		articulos_con_rangos: [],
		/* Combos publicados en la tienda (`combos.online = 1`). Mismo criterio que arriba. */
		combos: [],

		selected_category: null,
		selected_sub_category: null,
		selected_bodega: null,
		selected_cepa: null,
		selected_brand: null,
		is_from_search: false,

		brands: [],
		sub_categories_to_show: [],
		order_by: 'fecha-mayor-menor',

		page: 1,
		per_page: null,

		search_query: '',
		loading_categories: false,
		loading_sub_categories: false,
		loading_articles: false,
		loading_brands: false,

		/*
		 * 🔴 Número del último pedido del LISTADO de artículos (getIndex, getArticles y
		 * searchArticles). Cada una de esas acciones lo incrementa al salir y se guarda el suyo;
		 * a la vuelta, si ya no es el último, la respuesta se descarta entera: no commitea nada
		 * ni toca el loading, que es del pedido vigente.
		 *
		 * Por qué (Fenix, 23/9/2026): el getIndex anónimo del arranque —o una búsqueda— puede
		 * tardar mucho, y si el comprador se loguea antes de que vuelva, la recarga de
		 * `recargar_articulos_con_la_sesion()` vuelve primero y la vieja la pisaba después con
		 * los precios en null. Mismo patrón que store/client_offers.js, que descarta cuando
		 * cambió el comprador.
		 */
		pedido_del_listado: 0,
		/*
		 * Lo mismo, pero solo de getIndex: los carruseles de la home (destacados, ofertas,
		 * novedades, promociones, rangos y combos) solo los trae getIndex. Una búsqueda que sale
		 * después descarta el LISTADO de un getIndex en vuelo, pero no sus carruseles: esos solo
		 * los reemplaza un getIndex más nuevo (el de después del login).
		 */
		pedido_de_la_home: 0,
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
		set_promociones_vinoteca(state, value) {
			state.promociones_vinoteca = value
		},
		setInOffer(state, value) {
			state.in_offer = value
		},
		setNovedades(state, value) {
			state.novedades = value
		},
		/**
		 * 🔴 El `|| []` es el guard del contrato con la API, no una costumbre: las dos claves
		 * son OPCIONALES. Una tienda desplegada contra una `tienda-api` vieja —o contra un
		 * cliente al que todavía no le llegó la columna `combos.online`— recibe la respuesta
		 * sin ellas, y `res.data.combos` llega `undefined`. Sin el `|| []` el estado quedaría
		 * en undefined y el `v-if` de la sección reventaría al leerle el `.length`.
		 *
		 * @param {object} state
		 * @param {Array|undefined} value
		 */
		set_articulos_con_rangos(state, value) {
			state.articulos_con_rangos = Array.isArray(value) ? value : []
		},
		/**
		 * Ver set_articulos_con_rangos: misma clave opcional, mismo guard.
		 *
		 * @param {object} state
		 * @param {Array|undefined} value
		 */
		set_combos(state, value) {
			state.combos = Array.isArray(value) ? value : []
		},
		addArticles(state, value) {
			state.articles = state.articles.concat(value)
		},
		setSelectedCategory(state, category) {
			state.selected_brand = null
			state.selected_category = category
		},
		setIndexAsSelectedCategory(state) {
			state.selected_category = state.categories[0]
			state.selected_sub_category = {id: 0, name: 'Ultimos Ingresados'}
		},
		setSelectedSubCategory(state, value) {
			state.selected_brand = null
			state.selected_sub_category = value
		},
		setSelectedBodega(state, value) {
			state.selected_brand = null
			state.selected_bodega = value
		},
		setSelectedCepa(state, value) {
			state.selected_brand = null
			state.selected_cepa = value
		},
		/**
		 * Marca activa en el catálogo; si se pasa un objeto limpia categoría, sub, bodega y cepa.
		 * Si es null solo limpia la marca (p. ej. al ir al índice o a búsqueda).
		 */
		setSelectedBrand(state, brand) {
			state.selected_brand = brand
			if (brand) {
				state.selected_category = null
				state.selected_sub_category = null
				state.selected_bodega = null
				state.selected_cepa = null
			}
		},
		setBrands(state, brands) {
			state.brands = brands
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
		setLoadingBrands(state, value) {
			state.loading_brands = value
		},
		/**
		 * Un pedido nuevo del listado de artículos: ver `pedido_del_listado` en el state.
		 *
		 * @param {object} state
		 */
		nuevo_pedido_del_listado(state) {
			state.pedido_del_listado++
		},
		/**
		 * Un pedido nuevo de la home: ver `pedido_de_la_home` en el state.
		 *
		 * @param {object} state
		 */
		nuevo_pedido_de_la_home(state) {
			state.pedido_de_la_home++
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
		getBrands({ commit }) {
			commit('setLoadingBrands', true)
			return axios.get('/api/brands/' + process.env.VUE_APP_COMMERCE_ID)
				.then(res => {
					commit('setLoadingBrands', false)
					commit('setBrands', res.data.brands)
				})
				.catch(err => {
					commit('setLoadingBrands', false)
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
			commit('nuevo_pedido_del_listado')
			const pedido = state.pedido_del_listado
			if (state.selected_brand) {
				return axios.get(
					'api/articles/from-brand/'
					+ state.selected_brand.id + '/' + state.order_by + '/' + process.env.VUE_APP_COMMERCE_ID
					+ '?page=1'
				)
					.then(res => {
						/* Llegó tarde: otro pedido del listado ya salió después. */
						if (pedido !== state.pedido_del_listado) {
							return
						}
						commit('setLoadingArticles', false)
						let articles = res.data.articles.data
						commit('setArticles', articles)
						commit('setOrder')
					})
					.catch(err => {
						console.log(err)
						if (pedido !== state.pedido_del_listado) {
							return
						}
						commit('setLoadingArticles', false)
					})
			}
			let category_id = 0
			if (state.selected_category) {
				category_id = state.selected_category.id
			}
			let sub_category_id = 0
			if (state.selected_sub_category) {
				sub_category_id = state.selected_sub_category.id
			}

			let bodega_id = 0
			if (state.selected_bodega) {
				bodega_id = state.selected_bodega.id
			}

			let cepa_id = 0
			if (state.selected_cepa) {
				cepa_id = state.selected_cepa.id
			}

			return axios.get('api/articles/from-category/'+category_id+'/'+sub_category_id+'/'+bodega_id+'/'+cepa_id+'/'+state.order_by+'/'+process.env.VUE_APP_COMMERCE_ID+'?page=1')
			.then(res => {
				/* Llegó tarde: otro pedido del listado ya salió después. */
				if (pedido !== state.pedido_del_listado) {
					return
				}
				commit('setLoadingArticles', false)
				let articles = res.data.articles.data 
				// let articles_ordenados = []
				
				// console.log('Antes del sort')
				// articles.forEach(article => {
				// 	console.log(article.name+' $'+article.final_price)
				// })

				// if (state.order_by == 'precio-mayor-menor') {
				// 	console.log('precio-mayor-menor')
				// 	articles_ordenados = articles.sort((a, b) => Number(a.final_price) - Number(b.final_price))
				// } else if (state.order_by == 'precio-menor-mayor') {
				// 	console.log('precio-menor-mayor')
				// 	articles_ordenados = articles.sort((a, b) => Number(b.final_price) - Number(a.final_price))
				// } else {
				// 	articles_ordenados = articles
				// }
				// console.log('________________________________')
				// console.log('despues del sort')
				// articles_ordenados.forEach(article => {
				// 	console.log(article.name+' $'+article.final_price)
				// })

				// commit('setArticles', articles_ordenados)
				commit('setArticles', articles)
				commit('setOrder')
			})
			.catch(err => {
				console.log(err)
				if (pedido !== state.pedido_del_listado) {
					return
				}
				commit('setLoadingArticles', false)
			})
		},
		getIndex({ commit, state }) {
			commit('setPage', 1)
			commit('setIsFromSearch', false)
			commit('setSelectedCategory', null)
			commit('setSelectedSubCategory', null)
			commit('setLoadingArticles', true)
			commit('nuevo_pedido_del_listado')
			commit('nuevo_pedido_de_la_home')
			const pedido = state.pedido_del_listado
			const pedido_home = state.pedido_de_la_home
			return axios.get(`api/articles/featured-last-uploads/${ process.env.VUE_APP_COMMERCE_ID }?page=1`)
			.then(res => {
				console.log(res)
				/* Un getIndex más nuevo (el de después del login) ya salió: esta respuesta no
				   vale nada, ni el listado ni los carruseles. */
				if (pedido_home !== state.pedido_de_la_home) {
					return
				}
				/* El listado solo si ningún otro pedido del listado salió después (una búsqueda,
				   una categoría); los carruseles son solo de getIndex y van igual. */
				if (pedido === state.pedido_del_listado) {
					commit('setLoadingArticles', false)
					commit('setArticles', res.data.articles.data)
				}
				commit('setFeatured', res.data.featured)
				commit('set_promociones_vinoteca', res.data.promociones_vinoteca)
				commit('setInOffer', res.data.in_offer)
				commit('setNovedades', res.data.novedades)
				/* Claves nuevas y opcionales: si no vienen, las mutaciones dejan []. */
				commit('set_articulos_con_rangos', res.data.articulos_con_rangos)
				commit('set_combos', res.data.combos)
			})
			.catch(err => {
				console.log(err)
				if (pedido !== state.pedido_del_listado) {
					return
				}
				commit('setLoadingArticles', false)
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
			/*
			 * 🔴 El término se captura ACÁ, cuando sale la búsqueda, y no adentro del .then.
			 * state.search_query es reactivo y el visitante puede escribir otra búsqueda antes
			 * de que ésta resuelva: leyéndolo a la vuelta, el evento de "zapatillas" saldría
			 * con search_term "camperas" y el results_count de "zapatillas". Un dato cruzado
			 * es peor que no tenerlo, porque nadie lo puede detectar después.
			 */
			const termino_buscado = state.search_query
			commit('nuevo_pedido_del_listado')
			const pedido = state.pedido_del_listado
			return axios.get(`/api/articles/search/${termino_buscado}/${process.env.VUE_APP_COMMERCE_ID}`)
			.then(res => {
				/* Si llegó tarde (otro pedido del listado ya salió después) no toca ni el loading
				   ni el listado. La búsqueda igual existió: el servidor ya la registró como última
				   búsqueda y el evento de tracking se manda igual, con sus propios datos. */
				const vigente = pedido === state.pedido_del_listado
				if (vigente) {
					commit('setLoadingArticles', false)
				}
				console.log(res)
				let last_search = res.data.last_search
				if (last_search) {
					last_searchs.state.last_searchs.unshift(last_search)
				}
				if (vigente) {
					commit('setArticles', res.data.articles.data)
				}
				/*
				 * El evento de búsqueda va acá, en la búsqueda COMPLETA, y no en el
				 * autocomplete del navbar (components/nav/buscador/Index.vue), que dispara
				 * cada ~1000 ms de tecleo e inundaría la tabla con términos a medio escribir.
				 *
				 * results_count sale del total del paginador, no del largo de la página: lo
				 * que le sirve al motor de ofertas es cuántos resultados hubo, y un 0 —"buscó
				 * y no encontró nada"— es el dato más valioso de toda la tabla.
				 */
				let paginador = res.data.articles
				let results_count = typeof paginador.total == 'number'
					? paginador.total
					: (paginador.data ? paginador.data.length : 0)
				trackear(TIPOS_EVENTO.BUSQUEDA, {
					search_term: termino_buscado,
					results_count: results_count,
				})
			})
			.catch(err => {
				console.log(err)
				if (pedido !== state.pedido_del_listado) {
					return
				}
				commit('setLoadingArticles', false)
			})
		},
	},
	modules: {
	}
}
