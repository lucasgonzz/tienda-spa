import Vue from 'vue'

import VueAxios from 'vue-axios'
import axios from 'axios'
import { env } from '@/runtime_config'

Vue.use(VueAxios, axios)
/*
 * Login social (vue-social-auth, Google y Facebook): se saco el 14/10/2026 (mision
 * tiendas-demo-y-limpieza-tienda). La tienda ya no ofrece "Continuar con Google" y tienda-api
 * ya no tiene POST /sociallogin/{provider}/{commerce_id}. El paquete vue-social-auth se sacó de
 * package.json y del package-lock (misión sacar-cupones-y-login-google).
 */

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
import { limpiar_head_del_servidor, soltar_ld_del_servidor } from '@/utils/seo_servidor'
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
			baseURL : env('VUE_APP_API_URL'),
			withCredentials : true
		})
	}
})
Vue.use({
	install (Vue) {
		Vue.prototype.$api = axios.create({
			baseURL : env('VUE_APP_API_URL')+'/api',
			withCredentials : true
		})
	}
})

// Laravel-echo / Pusher: desde el 28/9/2026 NO se conecta al arrancar. Conectaba a cada visitante
// (anónimos y bots incluidos) contra un tope de conexiones de Pusher que comparte toda la flota.
// Ahora conecta solo el comprador logueado, con carga diferida: src/helpers/echo.js, que usa
// src/mixins/WebSockets.js. La key y el cluster siguen saliendo del build (VUE_APP_PUSHER_*).

// Mixins
import images from './mixins/images'
Vue.mixin(images)
import dates from './mixins/dates'
Vue.mixin(dates)
import generals from './mixins/generals'
Vue.mixin(generals)
import whatsapp from './mixins/whatsapp'
Vue.mixin(whatsapp)
import seo from './mixins/seo'
Vue.mixin(seo)

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
	/*
	 * SEO (mision seo-tiendas): las etiquetas del head que vienen del HTML del servidor llevan
	 * data-seo y vue-meta no las administra. Titulo, descripcion, canonica y Open Graph se sacan
	 * ya (vue-meta los repone); los JSON-LD se quedan hasta la primera navegacion interna. El
	 * detalle, en src/utils/seo_servidor.js.
	 */
	limpiar_head_del_servidor()
	router.afterEach((to, from) => {
		/* from.matched vacio = la navegacion inicial (incluido el redirect de / a la home). */
		if (from.matched.length && from.path !== to.path) {
			soltar_ld_del_servidor()
		}
	})

	new Vue({
		router,
		store,
		render: h => h(App)
	}).$mount('#app')
})
