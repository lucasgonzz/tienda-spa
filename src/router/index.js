import Vue from 'vue'
import VueRouter from 'vue-router'
import VueRouterBackButton from 'vue-router-back-button'

import Home from '../views/Home.vue'
import Search from '../views/Search.vue'
// import Categories from '../views/Categories.vue'
// import SubCategories from '../views/SubCategories.vue'
import Notifications from '../views/Notifications.vue'
import Messages from '../views/Messages.vue'
import Cart from '../views/Cart.vue'
import Orders from '../views/Orders.vue'
import Favorites from '../views/Favorites.vue'
import Article from '../views/Article.vue'
import Questions from '../views/Questions.vue'
import Configuration from '../views/Configuration.vue'
import Register from '../views/Register.vue'
import Login from '../views/Login.vue'
import PasswordReset from '../views/PasswordReset.vue'
import Payment from '../views/Payment.vue'
import PaymentCard from '../views/PaymentCard.vue'
import PaymentSuccess from '../views/PaymentSuccess.vue'
import PaymentPending from '../views/PaymentPending.vue'
import PaymentFailure from '../views/PaymentFailure.vue'
import Cards from '../views/Cards.vue'
import Location from '../views/Location.vue'
import Help from '../views/Help.vue'
import TerminosCondiciones from '../views/TerminosCondiciones.vue'
import PoliticaDePrivacidad from '../views/PoliticaDePrivacidad.vue'
import Thanks from '../views/Thanks.vue'
import Maps from '../views/Maps.vue'
import SocialLogin from '../views/SocialLogin.vue'
import Callback from '../views/Callback.vue'
import Cupons from '../views/Cupons.vue'
import Contacto from '../views/Contacto.vue'
import QuienesSomos from '../views/QuienesSomos.vue'

Vue.use(VueRouter)

    const routes = [
    {
        path: '/inicio/:category?',
        name: 'Home',
        component: Home
    },
    {
        path: '/buscar',
        name: 'Search',
        component: Search
    },
    // {
    //     path: '/categorias',
    //     name: 'Categories',
    //     component: Categories
    // },
    // {
    //     path: '/subcategorias',
    //     name: 'SubCategories',
    //     component: SubCategories
    // },
    {
        path: '/notificaciones',
        name: 'Notifications',
        component: Notifications
    },
    {
        path: '/mensajes',
        name: 'Messages',
        component: Messages
    },
    {
        path: '/carrito',
        name: 'Cart',
        component: Cart
    },
    {
        path: '/compras',
        name: 'Orders',
        component: Orders
    },
    {
        path: '/favoritos',
        name: 'Favorites',
        component: Favorites
    },
    {
        path: '/articulos/:slug/:commerce_id',
        name: 'Article',
        component: Article
    },
    {
        path: '/preguntas',
        name: 'Questions',
        component: Questions
    },
    {
        path: '/configuracion',
        name: 'Configuration',
        component: Configuration
    },
    {
        path: '/registro/:view',
        name: 'Register',
        component: Register
    },
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/recuperar-clave',
        name: 'PasswordReset',
        component: PasswordReset
    },
    {
        path: '/confirmar-compra',
        name: 'Payment',
        component: Payment
    },
    {
        path: '/pagar',
        name: 'PaymentCard',
        component: PaymentCard
    },
    {
        path: '/pago-exitoso',
        name: 'PaymentSuccess',
        component: PaymentSuccess
    },
    {
        path: '/pago-pendiente',
        name: 'PaymentPending',
        component: PaymentPending
    },
    {
        path: '/pago-rechazado',
        name: 'PaymentFailure',
        component: PaymentFailure
    },

    {
        path: '/tarjetas',
        name: 'Cards',
        component: Cards
    },
    {
        path: '/ubicacion',
        name: 'Location',
        component: Location
    },
    {
        path: '/ayuda/:selected_option?',
        name: 'Help',
        component: Help
    },
    {
        path: '/terminos-y-condiciones',
        name: 'TerminosCondiciones',
        component: TerminosCondiciones
    },
    {
        path: '/politica-de-privacidad',
        name: 'PoliticaDePrivacidad',
        component: PoliticaDePrivacidad
    },
    {
        path: '/gracias-por-tu-compra',
        name: 'Thanks',
        component: Thanks
    },
    {
        path: '/mapas',
        name: 'Maps',
        component: Maps
    },
    {
        path: '/social-login',
        name: 'SocialLogin',
        component: SocialLogin
    },
    {
        path: '/auth/:provider/callback',
        name: 'Callback',
        component: Callback,
    },
    {
        path: '/cupones',
        name: 'Cupons',
        component: Cupons,
    },
    {
        path: '/contacto',
        name: 'Contacto',
        component: Contacto,
    },
    {
        path: '/quienes-somos',
        name: 'QuienesSomos',
        component: QuienesSomos,
    },

]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

Vue.use(VueRouterBackButton, { router })

export default router
