import axios from 'axios'
import { apply_online_configuration_theme } from '@/helpers/online_configuration_theme'
import { env } from '@/runtime_config'
import { es_marca_actualizando } from '@/utils/tienda_actualizando'
axios.defaults.withCredentials = true
axios.defaults.baseURL = env('VUE_APP_API_URL')
export default {
	namespaced: true,
	state: {
		commerce: null,
		workdays: [],
		/* true mientras tienda-api responde la marca de "sistema actualizando" (503). Lo lee
		   App.vue para dibujar TiendaActualizando fuera del v-if del comercio. */
		actualizando: false,
	},
	mutations: {
		/**
		 * Guarda el comercio que devolvió `GET /api/commerce/{id}`.
		 *
		 * Misión envios-andreani (25/11/2026): el cotizador de envíos por correo ya no depende sólo
		 * de Zipnova, así que acá se normalizan dos claves que el resto de la SPA lee en un único
		 * lugar:
		 *  - `envios_correo`: hay envío por correo (Zipnova y/o Andreani).
		 *  - `envios_correo_config`: su configuración (`{envio_gratis_desde}`).
		 * Una tienda-api NUEVA las manda; una VIEJA no, y entonces caen a `envios_zipnova` y
		 * `envios_zipnova_config` (que es lo único que existía). Un comercio sólo-Andreani tiene
		 * `envios_correo` en true y `envios_zipnova` en false. Las claves que mandó la API no se
		 * pisan ni se pierden.
		 *
		 * @param {object} state
		 * @param {object|null} value Comercio de la API (o null).
		 * @returns {void}
		 */
		setCommerce(state, value) {
			if (value) {
				value = Object.assign({}, value)
				if (typeof value.envios_correo == 'undefined' || value.envios_correo === null) {
					value.envios_correo = !!value.envios_zipnova
				}
				if (typeof value.envios_correo_config == 'undefined' || value.envios_correo_config === null) {
					value.envios_correo_config = value.envios_zipnova_config ? value.envios_zipnova_config : null
				}
			}
			state.commerce = value
			/* Aplica variables CSS de tema al persistir el comercio desde el API. */
			if (value && value.online_configuration) {
				apply_online_configuration_theme(value.online_configuration)
			}
			console.log(state.commerce)
		},
		setWorkdays(state, value) {
			state.workdays = value
		},
		/**
		 * Prende o apaga el aviso de "estamos actualizando la tienda".
		 *
		 * @param {object} state
		 * @param {boolean} value true cuando llegó la marca de tienda-api; false cuando se liberó.
		 * @returns {void}
		 */
		set_actualizando(state, value) {
			state.actualizando = !!value
		},
	},
	actions: {
		/**
		 * Pide el comercio. Sigue tragando el error (main.js y App.vue dependen de eso), pero ahora
		 * distingue la marca de "sistema actualizando": con la marca prende el aviso; si el comercio
		 * llega bien lo apaga (así la pantalla de actualización se entera de que ya se liberó).
		 * El interceptor de main.js también prende el aviso; acá queda cubierto aunque el pedido
		 * se haga por una instancia sin interceptor.
		 *
		 * @param {object} context Contexto de Vuex ({commit}).
		 * @returns {Promise<void>} Siempre resuelve (nunca rechaza).
		 */
		getCommerce({ commit }) {
			return axios.get('/api/commerce/'+env('VUE_APP_COMMERCE_ID'))
			.then(res => {
				commit('setCommerce', res.data.commerce)
				if (res.data.commerce) {
					commit('set_actualizando', false)
				}
			})
			.catch(err => {
				if (es_marca_actualizando(err)) {
					commit('set_actualizando', true)
				}
				console.log(err)
			})
		},
		getWorkdays({commit}) {
			return axios.get('api/commerce/workdays/'+env('VUE_APP_COMMERCE_ID'))
			.then(res => {
				commit('setWorkdays', res.data.workdays)
			})
			.catch(err => {
				console.log(err)
			})
		}
	}
}