import axios from 'axios'
import { env } from '@/runtime_config'
import { normalizar_direccion } from '@/helpers/direcciones'
axios.defaults.baseURL = env('VUE_APP_API_URL')
axios.defaults.withCredentials = true

/*
 * Direcciones guardadas del comprador logueado (misión formas-envio-direcciones-maps, 19/10/2026).
 *
 * Endpoints de tienda-api (auth:buyer, cada comprador ve solo las suyas):
 *   GET    /api/buyer/addresses       → {models: [...]} (la principal primero, después las más nuevas)
 *   POST   /api/buyer/addresses       → {model} 201 (la primera queda principal)
 *   PUT    /api/buyer/addresses/{id}  → {model} (`is_default: true` desmarca las otras)
 *   DELETE /api/buyer/addresses/{id}  → 200 {models} (si era la principal, la más reciente pasa a serlo)
 * Errores: 404 si la dirección no es suya, 422 `{codigo: 'sin_direcciones'}` si la base del
 * cliente todavía no tiene la tabla, 422 `{codigo: 'direccion', message, errors?}` si los datos no
 * pasan la validación o si ya tiene 20.
 *
 * Las acciones RECHAZAN con el error de axios: quien llama decide qué decirle al comprador (ver
 * `mensaje_de_error`). Solo la usan el bloque "¿A dónde te lo enviamos?" del checkout y "Mis
 * direcciones"; las dos solo se montan con `commerce.direcciones_de_envio`.
 *
 * La lista se carga una vez por comprador (`cargada_para` = su id): si cierra sesión y entra
 * otro en la misma pestaña, se vuelve a pedir.
 */

/**
 * Una fila del servidor con los tipos que espera la pantalla: el snapshot normalizado más `id`,
 * `is_default` como booleano (MySQL puede mandar "1"/"0") y `updated_at` para ordenar.
 *
 * @param {object} model
 * @returns {object}
 */
export function direccion_guardada(model) {
	let direccion = normalizar_direccion(model)
	direccion.id = model && model.id ? Number(model.id) : null
	direccion.buyer_address_id = direccion.id
	direccion.is_default = !!(model && (model.is_default === true || Number(model.is_default) === 1))
	direccion.updated_at = model && model.updated_at ? model.updated_at : null
	return direccion
}

/**
 * Mismo orden que el servidor: la principal primero y después la más reciente.
 *
 * @param {Array} lista
 * @returns {Array}
 */
function ordenar(lista) {
	return lista.slice().sort((a, b) => {
		if (a.is_default !== b.is_default) {
			return a.is_default ? -1 : 1
		}
		return String(b.updated_at || '').localeCompare(String(a.updated_at || ''))
	})
}

/**
 * El texto para el comprador de un error de estos endpoints. Nunca el detalle técnico.
 *
 * @param {object} err Error de axios.
 * @returns {string}
 */
export function mensaje_de_error(err) {
	let data = err && err.response && err.response.data ? err.response.data : {}
	let status = err && err.response ? err.response.status : null
	if (data.codigo == 'sin_direcciones') {
		return 'Por ahora no podemos guardar direcciones en tu cuenta. Cargá la dirección para este pedido.'
	}
	if (status == 404) {
		return 'Esa dirección ya no está en tu cuenta.'
	}
	if (status == 401 || status == 419) {
		return 'Tu sesión se cerró. Volvé a iniciar sesión para usar tus direcciones.'
	}
	if (status == 422 && data.message) {
		return String(data.message)
	}
	return 'No pudimos guardar la dirección. Probá de nuevo en un rato.'
}

/**
 * Lo que viaja en POST/PUT: el snapshot del contrato sin `buyer_address_id` (el id va en la URL).
 *
 * @param {object} direccion
 * @returns {object}
 */
function cuerpo(direccion) {
	let datos = normalizar_direccion(direccion)
	delete datos.buyer_address_id
	if (direccion && direccion.is_default !== undefined) {
		datos.is_default = !!direccion.is_default
	}
	return datos
}

export default {
	namespaced: true,
	state: {
		models: [],
		loading: false,
		/* Id del comprador para el que se cargó `models` (null: todavía no se cargó). */
		cargada_para: null,
	},
	mutations: {
		set_models(state, value) {
			state.models = ordenar(value)
		},
		set_loading(state, value) {
			state.loading = !!value
		},
		set_cargada_para(state, value) {
			state.cargada_para = value
		},
		/**
		 * Agrega una dirección o reemplaza la que tiene el mismo id. Si quedó principal, las otras
		 * dejan de serlo (lo mismo que hace el servidor).
		 *
		 * @param {object} state
		 * @param {object} direccion Ya pasada por `direccion_guardada`.
		 */
		guardar(state, direccion) {
			let lista = state.models.filter(model => model.id !== direccion.id)
			if (direccion.is_default) {
				lista.forEach(model => {
					model.is_default = false
				})
			}
			lista.push(direccion)
			state.models = ordenar(lista)
		},
		limpiar(state) {
			state.models = []
			state.cargada_para = null
		},
	},
	actions: {
		/**
		 * Trae las direcciones del comprador logueado.
		 *
		 * @param {object} context
		 * @returns {Promise<Array>}
		 */
		fetch({ commit, rootState }) {
			commit('set_loading', true)
			return axios.get('/api/buyer/addresses')
			.then(res => {
				commit('set_loading', false)
				let models = res.data && Array.isArray(res.data.models) ? res.data.models : []
				commit('set_models', models.map(direccion_guardada))
				commit('set_cargada_para', rootState.auth.user ? rootState.auth.user.id : null)
				return rootState.buyer_addresses.models
			})
			.catch(err => {
				commit('set_loading', false)
				throw err
			})
		},
		/**
		 * Guarda una dirección nueva en la cuenta.
		 *
		 * @param {object} context
		 * @param {object} direccion
		 * @returns {Promise<object>} la dirección guardada (con `id`)
		 */
		create({ commit }, direccion) {
			return axios.post('/api/buyer/addresses', cuerpo(direccion))
			.then(res => {
				let guardada = direccion_guardada(res.data.model)
				commit('guardar', guardada)
				return guardada
			})
		},
		/**
		 * Edita una dirección guardada (todos los campos).
		 *
		 * @param {object} context
		 * @param {object} direccion Con `id`.
		 * @returns {Promise<object>}
		 */
		update({ commit }, direccion) {
			return axios.put('/api/buyer/addresses/' + direccion.id, cuerpo(direccion))
			.then(res => {
				let guardada = direccion_guardada(res.data.model)
				commit('guardar', guardada)
				return guardada
			})
		},
		/**
		 * Borra una dirección. Si era la principal, el servidor elige otra, y la pantalla tiene que
		 * mostrar la misma: el 200 trae la lista que queda (`{models}`) y se usa esa; si no la
		 * trajera, se vuelve a pedir.
		 *
		 * @param {object} context
		 * @param {number} id
		 * @returns {Promise}
		 */
		delete({ commit, dispatch }, id) {
			return axios.delete('/api/buyer/addresses/' + id)
			.then(res => {
				if (res.data && Array.isArray(res.data.models)) {
					commit('set_models', res.data.models.map(direccion_guardada))
					return null
				}
				return dispatch('fetch')
			})
		},
		/**
		 * Marca una dirección como la principal (la que el checkout elige solo).
		 *
		 * @param {object} context
		 * @param {object} direccion
		 * @returns {Promise<object>}
		 */
		set_default({ dispatch }, direccion) {
			return dispatch('update', Object.assign({}, direccion, { is_default: true }))
		},
	},
}
