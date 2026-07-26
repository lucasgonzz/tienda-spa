import Vue from 'vue'

import VueAxios from 'vue-axios'
import VueSocialauth from 'vue-social-auth'
import axios from 'axios'

Vue.use(VueAxios, axios)
/*
 * Configuracion de vue-social-auth (login social).
 *
 * Repositorio publico: la mitad secreta del par de credenciales OAuth (lo que Google/
 * Facebook llaman "client secret") NUNCA puede vivir en este archivo (ni siquiera en
 * variables de entorno del build, porque VUE_APP_* termina igual dentro del bundle que se
 * descarga cada visitante). Se saco por completo, incluidos los bloques comentados de
 * otros comercios: un secreto comentado sigue publicado en el historial de git igual que
 * uno activo.
 *
 * Ademas, vue-social-auth (version instalada: 1.4.3) nunca leyo ni uso ese valor desde el
 * navegador: la libreria solo junta clientId + redirectUri + code del popup de OAuth y
 * resuelve con eso (responseType 'code' por default). El intercambio real de code por
 * token ya lo hace tienda-api en POST /sociallogin/{provider}/{commerce_id}
 * (AuthController@social, via Laravel Socialite), usando ese secreto guardado del lado del
 * servidor (.env para Facebook, tabla online_configurations por comercio para Google). Por
 * eso sacar ese valor de aca no cambia el comportamiento del login: nunca cumplio ninguna
 * funcion en el frontend.
 */
Vue.use(VueSocialauth, {
	providers: {
		facebook: {
			clientId: '369275451245680',
			redirectUri: 'https://kioscoverde.com/auth/facebook/callback' // Your client app URL
		},
		google: {

			// ComercioCity
			clientId: '986563485547-vt27uakkeqiachchbjp0f0h45lfuifaf.apps.googleusercontent.com',

			// NebulaStore
			// clientId: '948578513354-b7t5mv02b8aegju603ui740rroj75rsi.apps.googleusercontent.com',

			// Pinocho
			// clientId: '155655053035-t8gcff3733ahefb4a5n6dr0qia21o2qv.apps.googleusercontent.com',

			// Kas aberturas
			// clientId: '496981463433-ivm5vbh49idfkrhvvgjkrrd531vcri84.apps.googleusercontent.com',


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

// Iconos vectoriales (clases .bi) para vistas como Contacto (Instagram, Facebook, etc.)
import 'bootstrap-icons/font/bootstrap-icons.css'

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
import whatsapp from './mixins/whatsapp'
Vue.mixin(whatsapp)

Vue.config.productionTip = false

/*
|--------------------------------------------------------------------------
| Bootstrap de la app: carga el comercio antes del primer render para aplicar
| colores y variables de online_configuration sin valores hardcodeados en SASS.
|--------------------------------------------------------------------------
*/
store.dispatch('commerce/getCommerce')
.catch(err => {
	console.log(err)
})
.finally(() => {
	new Vue({
		router,
		store,
		render: h => h(App)
	}).$mount('#app')
})
