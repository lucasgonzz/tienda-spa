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
import SeleccionEspecial from '../views/SeleccionEspecial.vue'
import PromocionesVinoteca from '../views/PromocionesVinoteca.vue'
import CuentaCorriente from '../views/CuentaCorriente.vue'
import Catalogo from '../views/Catalogo.vue'
import NotFound from '../views/NotFound.vue'

Vue.use(VueRouter)

/*
 * SEO (mision seo-tiendas, 23/9/2026):
 * - `meta.noindex` marca las rutas privadas o funcionales (carrito, login, checkout, cuenta...):
 *   App.vue les pone robots "noindex,follow" con vue-meta. Es la misma tabla que usa tienda-api
 *   (/api/seo/pagina) y la misma lista de Disallow de robots.txt. Si se agrega una ruta privada
 *   nueva, va en los tres lados.
 * - `/` tiene ruta propia (redirect a la home): antes no matcheaba nada y lo resolvia
 *   checkHomeRoute() (mixins/app.js); con el comodin `*` del final habria mostrado NotFound.
 * - `*` va SIEMPRE al final: toda URL que no existe muestra NotFound (noindex) en vez de una
 *   pantalla en blanco. El servidor ya responde 404 para esas URLs (seo.php + tienda-api).
 */
    const routes = [
    {
        path: '/',
        redirect: { name: 'Home', params: { category: 'ultimos-ingresados' } },
    },
    {
        path: '/inicio/:category?/:sub_category?',
        name: 'Home',
        component: Home
    },
    {
        path: '/buscar',
        name: 'Search',
        component: Search,
        meta: { noindex: true },
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
        component: Notifications,
        meta: { noindex: true },
    },
    {
        path: '/mensajes',
        name: 'Messages',
        component: Messages,
        meta: { noindex: true },
    },
    {
        path: '/carrito',
        name: 'Cart',
        component: Cart,
        meta: { noindex: true },
    },
    {
        path: '/compras',
        name: 'Orders',
        component: Orders,
        meta: { noindex: true },
    },
    {
        path: '/favoritos',
        name: 'Favorites',
        component: Favorites,
        meta: { noindex: true },
    },
    {
        path: '/articulos/:slug/:commerce_id',
        name: 'Article',
        component: Article
    },
    {
        path: '/preguntas',
        name: 'Questions',
        component: Questions,
        meta: { noindex: true },
    },
    {
        path: '/configuracion',
        name: 'Configuration',
        component: Configuration,
        meta: { noindex: true },
    },
    {
        path: '/registro/:view',
        name: 'Register',
        component: Register,
        meta: { noindex: true },
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { noindex: true },
    },
    {
        path: '/recuperar-clave',
        name: 'PasswordReset',
        component: PasswordReset,
        meta: { noindex: true },
    },
    {
        path: '/confirmar-compra',
        name: 'Payment',
        component: Payment,
        meta: { noindex: true },
    },
    {
        path: '/pagar',
        name: 'PaymentCard',
        component: PaymentCard,
        meta: { noindex: true },
    },
    {
        path: '/pago-exitoso',
        name: 'PaymentSuccess',
        component: PaymentSuccess,
        meta: { noindex: true },
    },
    {
        path: '/pago-pendiente',
        name: 'PaymentPending',
        component: PaymentPending,
        meta: { noindex: true },
    },
    {
        path: '/pago-rechazado',
        name: 'PaymentFailure',
        component: PaymentFailure,
        meta: { noindex: true },
    },

    {
        path: '/tarjetas',
        name: 'Cards',
        component: Cards,
        meta: { noindex: true },
    },
    {
        path: '/ubicacion',
        name: 'Location',
        component: Location,
        meta: { noindex: true },
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
        component: Thanks,
        meta: { noindex: true },
    },
    {
        path: '/mapas',
        name: 'Maps',
        component: Maps,
        meta: { noindex: true },
    },
    {
        path: '/social-login',
        name: 'SocialLogin',
        component: SocialLogin,
        meta: { noindex: true },
    },
    {
        path: '/auth/:provider/callback',
        name: 'Callback',
        component: Callback,
        meta: { noindex: true },
    },
    {
        path: '/cupones',
        name: 'Cupons',
        component: Cupons,
        meta: { noindex: true },
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
    {
        path: '/seleccion-especial/:articles_id',
        name: 'SeleccionEspecial',
        component: SeleccionEspecial,
        meta: { noindex: true },
    },
    {
        path: '/promociones',
        name: 'PromocionesVinoteca',
        component: PromocionesVinoteca,
    },
    {
        path: '/cuenta-corriente',
        name: 'CuentaCorriente',
        component: CuentaCorriente,
        meta: { noindex: true },
    },
    {
        path: '/catalogo',
        name: 'Catalogo',
        component: Catalogo,
    },
    {
        path: '*',
        name: 'NotFound',
        component: NotFound,
        meta: { noindex: true },
    },
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

Vue.use(VueRouterBackButton, { router })

export default router
