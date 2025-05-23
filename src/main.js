import Vue from 'vue'

import VueAxios from 'vue-axios'
import VueSocialauth from 'vue-social-auth'
import axios from 'axios'

Vue.use(VueAxios, axios)
Vue.use(VueSocialauth, {
	providers: {
		facebook: {
			clientId: '369275451245680',
			client_secret: '79a33ac58e4f628b3437463b13d2084a',
			redirectUri: 'https://kioscoverde.com/auth/facebook/callback' // Your client app URL
		},
		google: {
			
			// ComercioCity
			clientId: '986563485547-vt27uakkeqiachchbjp0f0h45lfuifaf.apps.googleusercontent.com',
			client_secret: 'dUdYJBzFgI164aQqxzqNujju',

			// NebulaStore
			// clientId: '948578513354-b7t5mv02b8aegju603ui740rroj75rsi.apps.googleusercontent.com',
			// client_secret: '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',

			// Pinocho
			// clientId: '155655053035-t8gcff3733ahefb4a5n6dr0qia21o2qv.apps.googleusercontent.com',
			// client_secret: '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',

			// Kas aberturas
			// clientId: '496981463433-ivm5vbh49idfkrhvvgjkrrd531vcri84.apps.googleusercontent.com',
			// client_secret: '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',

			
		},
	}
})

// Vue Scrool
Vue.prototype.$scrollToTop = (() => {
	setTimeout(() => {
	 	window.scrollTo({
			top: 0,
			behavior: 'smooth'
		})
	}, 300)
}) 

// Metadata
import VueMeta from 'vue-meta'
Vue.use(VueMeta, {
	// optional pluginOptions
	refreshOnceOnNavigation: true
})

/*
|--------------------------------------------------------------------------
| COOKIES
|--------------------------------------------------------------------------
*/
import VueCookies from 'vue-cookies'
Vue.use(VueCookies, { expire: '7d'})

import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'

// Notifications
import VueToast from 'vue-toast-notification'
import 'vue-toast-notification/dist/theme-sugar.css'
 
Vue.use(VueToast, {
	position: 'bottom'
})

// Install BootstrapVue
import { BootstrapVue } from 'bootstrap-vue'
Vue.use(BootstrapVue)

// import VueClazyLoad from 'vue-clazy-load'
// Vue.use(VueClazyLoad)

// Bucador autocomplete
import '@trevoreyre/autocomplete-vue/dist/style.css'

// Install Axios
Vue.use({
	install (Vue) {
		Vue.prototype.$axios = axios.create({
			baseURL : process.env.VUE_APP_API_URL,
			withCredentials : true
		})
	}
})
Vue.use({
	install (Vue) {
		Vue.prototype.$api = axios.create({
			baseURL : process.env.VUE_APP_API_URL+'/api',
			withCredentials : true
		})
	}
})

// Laravel-echo
window.Pusher = require('pusher-js')
import Echo from "laravel-echo"
Vue.prototype.Echo = new Echo({
    broadcaster: 'pusher',
    key: '7fc3a66cec31239fc44e',
    cluster: 'sa1',
    forceTLS: false
})

// Mixins
import images from './mixins/images'
Vue.mixin(images)
import dates from './mixins/dates'
Vue.mixin(dates)
import generals from './mixins/generals'
Vue.mixin(generals)

Vue.config.productionTip = false

new Vue({
	router,
	store,
	render: h => h(App)
}).$mount('#app')
