import Vue from 'vue'
import Vuex from 'vuex'
import generals from './generals'
import categories from './categories'
import notifications from './notifications'
import last_searchs from './last_searchs'
import auth from './auth'
import cart from './cart'
import articles from './articles/articles'
import orders from './orders'
import questions from './questions'
import favorites from './favorites'
import titles from './titles'
import payment_gateway from './payment_gateway'
import messages from './messages'
import address from './address'
import coins from './coins'
import political from './political'
import conditions from './conditions'
import commerce from './commerce'
import install_btn from './install_btn'
import ws from './ws'
import platelets from './platelets'
import payment_methods from './payment_methods'
import delivery_zones from './delivery_zones'
import delivery_day from './delivery_day'
// Direcciones guardadas del comprador (misión formas-envio-direcciones-maps, 19/10/2026).
import buyer_addresses, { limpiar_al_cambiar_de_comprador } from './buyer_addresses'

import client_offers from './client_offers'

import bodegas from './bodegas'
import cepas from './cepas'
import current_acount from './current_acount'

Vue.use(Vuex)

export default new Vuex.Store({
	state: {
	},
	mutations: {
	},
	actions: {
	},
	modules: {
		generals,
		categories,
		notifications,
		last_searchs,
		auth,
		cart,
		articles,
		orders,
		questions,
		favorites,
		titles,
		payment_gateway,
		messages,
		address,
		coins,
		political,
		conditions,
		commerce,
		install_btn,
		ws,
		platelets,
		payment_methods,
		delivery_zones,
		client_offers,

		bodegas,
		delivery_day,
		cepas,
		current_acount,
		buyer_addresses,
	},
	plugins: [
		// Logout o cambio de comprador: limpia sus direcciones guardadas y la elegida en el carrito.
		limpiar_al_cambiar_de_comprador,
	],
})
