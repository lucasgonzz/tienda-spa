import axios from 'axios'
axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.withCredentials = true
/**
 * Ofertas personalizadas del comprador logueado.
 *
 * La API devuelve ARTICULOS (no ofertas), con la misma forma que cualquier listado de la
 * tienda y la oferta colgada en `article.oferta_personalizada`. Por eso el estado guarda
 * articulos: el overlay los muestra y navega a ellos con lo que el SPA ya tiene.
 *
 * 🔴 TODO lo que hay en este modulo es DE UN COMPRADOR, y por eso `buyer_id` vive al lado de
 * `articles`. Cerrar sesion en esta tienda es una accion de Vue, SIN recarga de pagina: sin
 * atar el estado a la identidad, el comprador A cargaba sus ofertas, se iba, entraba B en la
 * misma pestaña y veia el producto, el porcentaje y el precio de A.
 */
export default {
	namespaced: true,
	state: {
		/* De QUE comprador son las ofertas cargadas. null = de ninguno (no hay sesion). */
		buyer_id: null,
		/* Articulos con oferta vigente, tal cual los manda la API. */
		articles: [],
		/* Ya se consulto al menos una vez PARA ESE comprador (haya traido algo o no). */
		loaded: false,
		loading: false,
		/* El overlay de bienvenida esta abierto. */
		mensaje_visible: false,
		/* Que oferta se esta mostrando. */
		indice: 0,
		/* Cantidad a precargar en la ficha cuando el comprador usa una promocion por cantidad. */
		cantidad_pendiente: null,
	},
	getters: {
		/**
		 * Los articulos con oferta, y SOLO si son del comprador que esta logueado AHORA.
		 *
		 * 🔴 Es la unica puerta por la que el overlay y el boton del navbar leen la lista, y
		 * existe para que mostrarle a alguien la oferta de otro sea imposible por construccion
		 * y no apenas improbable por orden de ejecucion. `sincronizar_comprador` limpia el
		 * estado, si — pero corre cuando un componente se entera del cambio de sesion, y entre
		 * el `setUser` del modulo auth y ese aviso hay un instante en el que `state.articles`
		 * todavia es del comprador anterior. Este getter tapa ese instante comparando contra
		 * la sesion de ahora y no contra lo que se cargo alguna vez.
		 *
		 * No lo cambies por `state.articles` en ningun componente: ahi es donde vuelve el bug.
		 *
		 * @returns {Array}
		 */
		articles_vigentes(state, getters, rootState) {
			if (!rootState.auth.authenticated || !rootState.auth.user || !rootState.auth.user.id) {
				return []
			}
			if (state.buyer_id === null || Number(rootState.auth.user.id) !== state.buyer_id) {
				return []
			}
			return state.articles
		},
	},
	mutations: {
		/**
		 * Ata el estado a la identidad del comprador y, cuando esa identidad cambia, lo limpia
		 * ENTERO. Pasar a ninguno (cerrar sesion) tambien es un cambio.
		 *
		 * 🔴 Se limpia todo y no solo `articles`, y cada campo tiene su motivo:
		 *   - `loaded`, porque la guarda de carga del overlay corta justamente por ahi: si
		 *     quedara en true, el comprador nuevo no pediria nunca las suyas y se quedaria
		 *     con las del anterior.
		 *   - `indice`, porque apunta a una posicion de la lista vieja.
		 *   - `mensaje_visible`, porque el overlay de uno no puede quedar abierto para el otro
		 *     (ni para un visitante anonimo, que es el caso de "cierro sesion y vuelvo atras").
		 *   - `cantidad_pendiente`, porque son unidades que pidio otro y se las comeria la
		 *     proxima ficha que abra este.
		 *   - `loading`, porque el pedido que estuviera en vuelo ya no es de este comprador:
		 *     su respuesta se descarta en getModels y el pedido nuevo maneja su propio flag.
		 *
		 * @param {object} state
		 * @param {number|string|null} buyer_id comprador de la sesion, o null si no hay ninguno
		 * @returns {void}
		 */
		sincronizar_comprador(state, buyer_id) {
			let nuevo = (buyer_id === null || typeof buyer_id == 'undefined' || buyer_id === '')
				? null
				: Number(buyer_id)
			if (state.buyer_id === nuevo) {
				return
			}
			state.buyer_id = nuevo
			state.articles = []
			state.loaded = false
			state.loading = false
			state.indice = 0
			state.mensaje_visible = false
			state.cantidad_pendiente = null
		},
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
		 * Tiene dos llamadores y a proposito: el overlay, que la pide una vez por comprador
		 * (corta por `loaded`), y el boton del navbar, que la vuelve a pedir cada vez que el
		 * comprador abre el mensaje a mano — ahi el `loaded` no corta nada porque justamente
		 * lo que se busca es refrescar. Por eso la unica guarda contra pedidos encimados es
		 * `loading`.
		 *
		 * 🔴 `loaded` se marca en LAS DOS ramas. Si solo se marcara en el then, un 401 (sesion
		 * vencida) o un 500 dejarian al overlay reintentando para siempre, porque su guarda de
		 * carga es justamente `!loaded`.
		 *
		 * 🔴 Y las dos ramas comparan el comprador ANTES de commitear nada. Entre que sale el
		 * pedido y vuelve la respuesta la sesion puede haber cambiado (cerro sesion, entro
		 * otro), y commitear ahi seria meterle a uno las ofertas del otro por la ventana de la
		 * promesa — el mismo bug que arregla `sincronizar_comprador`, pero por la puerta de
		 * atras. Cuando no coincide se descarta la respuesta entera, `loading` incluido: de
		 * ese flag ya se hace cargo el pedido del comprador nuevo.
		 *
		 * @returns {Promise}
		 */
		getModels({ commit, state, rootState }) {
			let comprador = rootState.auth.user && rootState.auth.user.id
				? Number(rootState.auth.user.id)
				: null
			/* Si cambio el comprador, el estado del anterior se va ANTES de pedir nada. */
			commit('sincronizar_comprador', comprador)
			/* Sin sesion no hay a quien pedirle ofertas, y la ruta es auth:buyer: seria un 401
			   seguro. Y con un pedido en vuelo no se encima otro. */
			if (comprador === null || state.loading) {
				return Promise.resolve()
			}
			commit('setLoading', true)
			return axios.get('/api/client-offers/' + process.env.VUE_APP_COMMERCE_ID)
			.then(res => {
				if (state.buyer_id !== comprador) {
					return
				}
				commit('setLoading', false)
				commit('setLoaded', true)
				commit('setArticles', res.data.articles)
			})
			.catch(err => {
				console.log(err)
				if (state.buyer_id !== comprador) {
					return
				}
				commit('setLoading', false)
				commit('setLoaded', true)
			})
		},
	},
}
