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
import help from './help'
import coins from './coins'
import political from './political'
import conditions from './conditions'
import cupons from './cupons'
import commerce from './commerce'
import install_btn from './install_btn'
import ws from './ws'
import platelets from './platelets'
import payment_methods from './payment_methods'
import delivery_zones from './delivery_zones'

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
		help,
		coins,
		political,
		conditions,
		cupons,
		commerce,
		install_btn,
		ws,
		platelets,
		payment_methods,
		delivery_zones,
	}
})
