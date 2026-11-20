// Contexto efímero: sólo el observer del commit propio puede conservar el resumen.
const cierres_propios = new WeakMap()

// La generación identifica un borrador, aunque el usuario siga autenticado.
export function comprador_vacio() {
	return { name: '', email: '', phone: '', ciudad: '', barrio: '', address: '' }
}

export function identidad_checkout(state) {
	const comercio = state.commerce && state.commerce.commerce
	const usuario = state.auth && state.auth.user
	return JSON.stringify([
		comercio && comercio.id || null,
		comercio && comercio.owner_id || null,
		usuario && usuario.id || null,
		!!(state.auth && state.auth.authenticated),
		state.cart.selected_buyer && state.cart.selected_buyer.id || null,
	])
}

export function capturar_checkout(state) {
	return JSON.stringify([identidad_checkout(state), state.cart.checkout_generation, String(state.cart.buyer.email || '').trim().toLowerCase()])
}

export function checkout_vigente(state, token) {
	return capturar_checkout(state) === token
}

// Calcula la transición antes del commit; nunca captura el estado que dejó un subscriber.
export function captura_reset_checkout(state) {
	return capturar_checkout({ ...state, cart: { ...state.cart,
		checkout_generation: state.cart.checkout_generation + 1,
		buyer: comprador_vacio(), selected_buyer: null } })
}

// Una sola frontera para logout, cambio de comprador, cliente del vendedor y comercio.
export function observar_checkout(store) {
	let identidad = identidad_checkout(store.state)
	let usuario = store.state.auth && store.state.auth.user
	let comercio = store.state.commerce && store.state.commerce.commerce
	store.subscribe(mutation => {
		if (!['auth/setUser', 'auth/setAuthenticated', 'cart/set_selected_buyer', 'commerce/setCommerce'].includes(mutation.type)) return
		const nueva = identidad_checkout(store.state)
		if (nueva === identidad) return
		const actual = store.state.auth && store.state.auth.user
		const nuevo_comercio = store.state.commerce && store.state.commerce.commerce
		const cambio_comercio = mutation.type === 'commerce/setCommerce'
		// POST buyer identifica al invitado sin abrir otro borrador.
		const invitado_identificado = mutation.type === 'auth/setUser' && !usuario && actual &&
			!store.state.auth.authenticated &&
			String(actual.email || '').trim().toLowerCase() === String(store.state.cart.buyer.email || '').trim().toLowerCase() &&
			!!actual.email
		const primera_carga = cambio_comercio && !comercio
		identidad = nueva
		usuario = actual
		comercio = nuevo_comercio
		if (invitado_identificado || primera_carga) return
		const cierre = cierres_propios.get(store)
		const conservar_resumen = !!(cierre && cierre.tipo === mutation.type &&
			cierre.valor === mutation.payload && checkout_vigente(store.state, cierre.esperada))
		// Consumir antes del reset: un commit anidado no puede reutilizar la excepción.
		cierres_propios.delete(store)
		store.commit('cart/reset_checkout', { conservar_lineas: !cambio_comercio, conservar_cliente: mutation.type === 'cart/set_selected_buyer', conservar_resumen })
		store.commit('buyer_addresses/limpiar')
		identidad = identidad_checkout(store.state)
	})
}

// Predice únicamente el reset síncrono que observar_checkout hace por este logout.
// Comparar el estado esperado evita adoptar una identidad externa surgida en un subscriber.
function captura_logout(state, cambios) {
	const siguiente = { ...state, auth: { ...state.auth, ...cambios } }
	if (identidad_checkout(siguiente) !== identidad_checkout(state)) {
		siguiente.cart = { ...state.cart, checkout_generation: state.cart.checkout_generation + 1,
			buyer: comprador_vacio(), selected_buyer: null }
	}
	return capturar_checkout(siguiente)
}

export function cerrar_invitado_checkout(store, continuacion) {
	if (!checkout_vigente(store.state, continuacion.sesion)) return
	const sin_auth = captura_logout(store.state, { authenticated: false })
	commit_cierre(store, 'auth/setAuthenticated', false, { authenticated: false })
	if (!checkout_vigente(store.state, sin_auth)) return
	const sin_usuario = captura_logout(store.state, { user: null })
	commit_cierre(store, 'auth/setUser', null, { user: null })
	// Sólo el logout propio esperado puede renovar la continuación hacia Gracias.
	if (checkout_vigente(store.state, sin_usuario)) continuacion.sesion = sin_usuario
}

function commit_cierre(store, tipo, valor, cambios) {
	const siguiente = { ...store.state, auth: { ...store.state.auth, ...cambios } }
	cierres_propios.set(store, { tipo, valor, esperada: capturar_checkout(siguiente) })
	try {
		store.commit(tipo, valor)
	} finally {
		cierres_propios.delete(store)
	}
}
