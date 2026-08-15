import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true
/**
 * Ofertas personalizadas del comprador logueado.
 *
 * La API devuelve ARTICULOS (no ofertas), con la misma forma que cualquier listado de la
 * tienda y la oferta colgada en `article.oferta_personalizada`. Por eso el estado guarda
 * articulos: el overlay los muestra y navega a ellos con lo que el SPA ya tiene.
 */
export default {
	namespaced: true,
	state: {
		/* Articulos con oferta vigente, tal cual los manda la API. */
		articles: [],
		/* Ya se consulto al menos una vez en esta sesion de SPA (haya traido algo o no). */
		loaded: false,
		loading: false,
		/* El overlay de bienvenida esta abierto. */
		mensaje_visible: false,
		/* Que oferta se esta mostrando. */
		indice: 0,
		/* Cantidad a precargar en la ficha cuando el comprador usa una promocion por cantidad. */
		cantidad_pendiente: null,
	},
	mutations: {
		setArticles(state, value) {
			state.articles = value ? value : []
		},
		setLoaded(state, value) {
			state.loaded = value
		},
		setLoading(state, value) {
			state.loading = value
		},
		set_mensaje_visible(state, value) {
			state.mensaje_visible = value
		},
		set_indice(state, value) {
			state.indice = value
		},
		set_cantidad_pendiente(state, value) {
			state.cantidad_pendiente = value
		},
	},
	actions: {
		/**
		 * Trae los articulos con oferta vigente del comprador logueado.
		 *
		 * 🔴 `loaded` se marca en LAS DOS ramas. Si solo se marcara en el then, un 401 (sesion
		 * vencida) o un 500 dejarian al overlay reintentando para siempre, porque su guarda de
		 * carga es justamente `!loaded`.
		 *
		 * @returns {Promise}
		 */
		getModels({ commit }) {
			commit('setLoading', true)
			return axios.get('/api/client-offers/' + process.env.VUE_APP_COMMERCE_ID)
			.then(res => {
				commit('setLoading', false)
				commit('setLoaded', true)
				commit('setArticles', res.data.articles)
			})
			.catch(err => {
				console.log(err)
				commit('setLoading', false)
				commit('setLoaded', true)
			})
		},
	},
}
