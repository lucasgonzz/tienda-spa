import Vue from 'vue'
import axios from 'axios'
axios.defaults.baseURL = env('VUE_APP_API_URL')
axios.defaults.withCredentials = true
import preguntar from '@/store/articles/preguntar'
import categories from '@/store/categories'
import { env } from '@/runtime_config'

/**
 * Si `article` es un Article de verdad y no una PromocionVinoteca.
 *
 * 🔴 Mismo criterio que `is_promocion_vinoteca()` en `article-card/body/Price.vue`:
 * las promociones de vinoteca no traen `bar_code`. Hace falta aca porque
 * `ArticleController@show` devuelve una PromocionVinoteca en el mismo campo `article`
 * cuando el slug no es el de un Article, y las dos tablas arrancan su id en 1 -el id de
 * una promo choca con el de un articulo cualquiera-. Sin este chequeo las dos secciones
 * de "tambien compraron" pedirian recomendaciones por un article_id que en realidad es
 * el id de la promo, y mostrarian productos de otro articulo cualquiera bajo un titulo
 * que afirma que alguien los compro.
 *
 * @param {Object|null} article
 * @returns {boolean}
 */
function es_articulo_real(article) {
	return !!article && typeof article.bar_code != 'undefined'
}

export default {
	namespaced: true,
	state: {
		images: [],
		similars: [],
		/*
		 * Las dos secciones de recomendacion de la ficha. Son arrays PLANOS (no paginados):
		 * estas secciones no tienen scroll infinito. Vacio significa que la seccion entera no
		 * se dibuja.
		 */
		tambien_compraron_vistas: [],
		tambien_compraron_compras: [],
		article_to_show: null,
		amount: '',
		// amount: 1,
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
		/*
		 * 🔴 Número del último pedido de la FICHA (`getArticleToShow`). Cada llamada lo
		 * incrementa al salir y se guarda el suyo; ni el `.then` ni el `catch` de un pedido que
		 * ya no es el último tocan el artículo que hay en pantalla ni el loading.
		 *
		 * Por qué: al ir de ficha en ficha rápido (A -> B -> C) hay varios pedidos en vuelo a
		 * la vez. Si C vuelve bien y DESPUÉS falla B, el `catch` de B soltaba el artículo y la
		 * pantalla mostraba "No pudimos cargar este producto" con la URL de C; y si B vuelve
		 * bien DESPUÉS de C, su `.then` ponía el artículo de B bajo la URL de C. Mismo patrón que
		 * `pedido_del_listado` en store/categories.js.
		 */
		pedido_de_la_ficha: 0,
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
		set_tambien_compraron_vistas(state, value) {
			state.tambien_compraron_vistas = Array.isArray(value) ? value : []
		},
		set_tambien_compraron_compras(state, value) {
			state.tambien_compraron_compras = Array.isArray(value) ? value : []
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
			if (article) {
				article.image = article.images[0]
				// state.amount = 1

				state.selected_article_variant = null
				
				if (article.article_properties && article.article_properties.length) {
					article.selected_article_properties = {}
					article.article_properties.forEach(article_property => {
						article.selected_article_properties[article_property.article_property_type.name] = 0
						// article.selected_article_properties[article_property.id] = 0
					})
				}
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
		/**
		 * Un pedido nuevo de la ficha: ver `pedido_de_la_ficha` en el state.
		 *
		 * @param {object} state
		 */
		nuevo_pedido_de_la_ficha(state) {
			state.pedido_de_la_ficha++
		},
		setArticleColor(state, value) {
			state.article_to_show.color = Object.assign({}, state.article_to_show, { color: value })
		}
	},
	actions: {
		getArticlesNames({ commit }) {
			return axios.get(`/api/articles/names/${env('VUE_APP_COMMERCE_ID')}`)
			.then(res => {
				commit('setArticlesNames', res.data.articles_names) 
				commit('addTags', res.data.tags) 
			})
			.catch(err => {
				console.log(err)
			})
		},
		// Se llama cuando se recarga la pagina article
		getArticleToShow({ commit, state }, params) {
			let url = `/api/articles/${params.slug}/${params.commerce_id}`
			commit('setLoadingArticleToShow', true)
			/* Guarda del catch: ver `pedido_de_la_ficha` en el state. */
			commit('nuevo_pedido_de_la_ficha')
			const pedido = state.pedido_de_la_ficha
			return axios.get(url)
			.then(res => {
				/*
				 * 🔴 Llegó tarde: ya salió otro pedido de la ficha (A -> B -> C rápido). Lo que hay en el
				 * store es de un pedido más nuevo, y esta respuesta —de otro artículo— no puede pisarlo
				 * ni apagar el loading del pedido vigente. Misma guarda que el `catch` de abajo.
				 */
				if (pedido !== state.pedido_de_la_ficha) {
					return
				}
				console.log('getArticleToShow')
				console.log(res.data.article)
				commit('setLoadingArticleToShow', false)
				commit('setArticleToShow', res.data.article)
			})
			.catch(err => {
				console.log(err)
				/*
				 * 🔴 Se suelta el artículo que hubiera, salvo en dos casos. Esta acción también corre
				 * desde el watcher de `$route` de views/Article.vue, al ir de una ficha a otra: si el
				 * pedido falla, sin soltarlo quedaba en pantalla la ficha ANTERIOR con la URL de la
				 * nueva. Con null, la vista muestra su pantalla de "No pudimos cargar este producto"
				 * (con Reintentar).
				 *
				 * Los dos casos en que NO se suelta son del ir de ficha a ficha:
				 *   - Este pedido ya no es el último (A -> B -> C rápido): lo que hay en pantalla es
				 *     de un pedido más nuevo, y soltarlo dejaba "No pudimos cargar este producto" con
				 *     la URL de C aunque C hubiera cargado bien. Lo decide `pedido_de_la_ficha`.
				 *   - Lo que hay en pantalla ya es el artículo pedido: `toArticle()`
				 *     (mixins/articles.js) lo puso en el store desde la tarjeta antes de navegar. La
				 *     ficha está armada, y un corte de red pasajero de este pedido (que solo la
				 *     completa) no tiene por qué tirársela abajo.
				 *
				 * Este catch es solo para errores de red y 4xx/5xx. El catálogo por lista
				 * (5/10/2026) NO pasa por acá: un artículo no habilitado para la lista del comprador
				 * responde 200 con `article: null`, igual que un slug que no existe, y eso ya lo
				 * maneja el `.then` de arriba, que deja el artículo en null y la vista muestra la
				 * misma pantalla.
				 */
				if (pedido !== state.pedido_de_la_ficha) {
					return
				}
				// El loading lo apaga solo el pedido vigente: uno viejo que falla no tiene que dejar
				// "cargado" a la ficha que todavía está pidiendo.
				commit('setLoadingArticleToShow', false)
				let en_pantalla = state.article_to_show
				if (en_pantalla && en_pantalla.slug === params.slug) {
					return
				}
				commit('setArticleToShow', null)
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
		/*
		 * 🔴 Se vacia ANTES de pedir y tambien en el .catch(): esta vista se reusa al ir de
		 * un articulo a otro, y sin esto se veian los relacionados del articulo anterior
		 * mientras volaba la request -y PARA SIEMPRE si la request fallaba-. Mismo
		 * tratamiento que ya usan get_tambien_compraron_vistas/compras de mas abajo.
		 */
		getSimilars({ commit, state }) {
			commit('setSimilars', [])
			/*
			 * 🔴 Misma guarda que las dos secciones de recomendacion, y por el mismo motivo:
			 * article_to_show puede ser una PromocionVinoteca, cuyo id choca con el de un
			 * Article cualquiera (las dos tablas arrancan en 1). Sin esto se le pedian los
			 * similares del articulo con ESE id -productos que no tienen nada que ver- y
			 * ademas `similars/{promo_id}` tira 500 cuando no existe un Article con ese id.
			 * Importa mas que antes: los relacionados ahora viven ADENTRO de la tarjeta
			 * blanca del producto y se leen como parte de su ficha.
			 */
			if (!es_articulo_real(state.article_to_show)) {
				return Promise.resolve()
			}
			commit('setLoadingSimilars', true)
			return axios.get(`/api/articles/similars/${state.article_to_show.id}/${env('VUE_APP_COMMERCE_ID')}?page=1&per_page=9`)
			.then(res => {
				console.log(res)
				commit('setLoadingSimilars', false)
				commit('setSimilars', res.data.models.data)
			})
			.catch(err => {
				commit('setLoadingSimilars', false)
				console.log(err)
				commit('setSimilars', [])
			})
		},
		/*
		 * "Quienes vieron este producto también compraron".
		 *
		 * 🔴 El `.catch()` deja el array VACIO y no muestra nada al comprador. Es lo que
		 * permite que esta version del SPA siga andando contra una API vieja que todavia no
		 * tiene el endpoint: un 404 o un 500 se traducen en una seccion que no se dibuja, no en
		 * una pantalla rota. Lo mismo vale para un comercio sin la extension `tracking_buyers`,
		 * donde el endpoint contesta 200 con la lista vacia.
		 *
		 * Se vacia ANTES de pedir: esta vista se reusa al ir de un articulo a otro y si no,
		 * mientras llega la respuesta, se verian las recomendaciones del articulo anterior.
		 */
		get_tambien_compraron_vistas({ commit, state }) {
			commit('set_tambien_compraron_vistas', [])
			if (!es_articulo_real(state.article_to_show)) {
				return Promise.resolve()
			}
			return axios.get(`/api/articles/tambien-compraron/vistas/${state.article_to_show.id}/${env('VUE_APP_COMMERCE_ID')}`)
			.then(res => {
				commit('set_tambien_compraron_vistas', res.data.models)
			})
			.catch(err => {
				console.log('tambien-compraron/vistas no devolvio nada:')
				console.log(err)
				commit('set_tambien_compraron_vistas', [])
			})
		},
		/*
		 * "Quienes compraron este producto también compraron". Mismo criterio de tolerancia que
		 * la de arriba: sin datos o sin endpoint, array vacio y seccion oculta.
		 */
		get_tambien_compraron_compras({ commit, state }) {
			commit('set_tambien_compraron_compras', [])
			if (!es_articulo_real(state.article_to_show)) {
				return Promise.resolve()
			}
			return axios.get(`/api/articles/tambien-compraron/compras/${state.article_to_show.id}/${env('VUE_APP_COMMERCE_ID')}`)
			.then(res => {
				commit('set_tambien_compraron_compras', res.data.models)
			})
			.catch(err => {
				console.log('tambien-compraron/compras no devolvio nada:')
				console.log(err)
				commit('set_tambien_compraron_compras', [])
			})
		},
	},
	modules: {
		preguntar
	}
}