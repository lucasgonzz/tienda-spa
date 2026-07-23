<template>
    <div id="app">
        <logo-loading></logo-loading>
        <div
        v-if="commerce">
            <pausar-tienda-online
            v-if="tienda_pausada"></pausar-tienda-online>
            <div
            v-else>
                <nav-component></nav-component>
                <b-container 
                fluid 
                :class="_class">
                    <transition name="slide-left">
                        <router-view/>
                    </transition>
                    <btn-whats-app></btn-whats-app>
                    <footer-component></footer-component>

                    <buyer-messages></buyer-messages>

                </b-container>
            </div>
        </div>
    </div>
</template>
<script>
import PausarTiendaOnline from '@/components/common/PausarTiendaOnline'
import NavComponent from '@/components/nav/Index'
import UpdateButton from '@/components/common/UpdateButton'
import BtnWhatsApp from '@/components/common/BtnWhatsApp'
import LogoLoading from '@/components/common/LogoLoading'
import FooterComponent from '@/components/common/footer/Index'
import WebSockets from '@/mixins/WebSockets'
import transitions from '@/mixins/transitions'
import firebase from '@/mixins/firebase'
import articles from '@/mixins/articles'
// import NotificationsPermissions from '@/components/nav/modals/NotificationsPermissions'
import app from '@/mixins/app'
import update_app from '@/mixins/update_app'
import VueScreenSize from 'vue-screen-size'
export default {
    components: {
        PausarTiendaOnline,
        NavComponent,
        UpdateButton,
        BtnWhatsApp,
        // NotificationsPermissions,
        LogoLoading,
        FooterComponent,

        BuyerMessages: () => import('@/components/buyer-messages/Index'),
    },
    mixins: [WebSockets, transitions, update_app, app, firebase, articles, VueScreenSize.VueScreenSizeMixin],
    computed: {
        authenticated() {
            return this.$store.state.auth.authenticated
        },
        user() {
            return this.$store.state.auth.user
        },
        route() {
            return this.$route.name
        },
        deferred_prompt() {
            return this.$store.state.install_btn.deferred_prompt
        },
        /**
         * Indica si la tienda debe mostrarse pausada según online_configuration.
         * El API devuelve flags booleanos como string ("0" / "1"); "0" es truthy en JS.
         *
         * @returns {boolean}
         */
        tienda_pausada() {
            /* Fallback defensivo: si todavía no cargó el comercio o su online_configuration, no pausar. */
            if (!this.commerce || !this.commerce.online_configuration) {
                return false
            }
            /* La pausa la controla siempre el flag pausar_tienda_online del online_configuration. */
            /* Solo pausar cuando el flag viene activo (1, "1" o true). */
            return Number(this.commerce.online_configuration.pausar_tienda_online) == 1
        },
        _class() {
            let _class = 'plantilla-'+this.commerce.online_configuration.online_template.slug 
            
            _class += ' tarjetas-telefono-'+this.commerce.online_configuration.cantidad_tarjetas_en_telefono

            _class += ' tarjetas-tablet-'+this.commerce.online_configuration.cantidad_tarjetas_en_tablet

            _class += ' tarjetas-notebook-'+this.commerce.online_configuration.cantidad_tarjetas_en_notebook

            _class += ' tarjetas-escritorio-'+this.commerce.online_configuration.cantidad_tarjetas_en_escritorio

            return _class
        },
    },
    watch: {
        authenticated() {
            if (this.authenticated) {
                this.callAuthMethods()

                this.escuchar_mensajes()
            }
        },
    },
    data() {
        return {
            data_loaded: false,
            refreshing: false,
            new_version: false,
            registration: null,
        }
    },
    created() {
        if (location.href.indexOf("www.") > -1) {
            console.log('tiene www')
            location.replace(process.env.VUE_APP_APP_URL);
        }

        this.checkHomeRoute()

        // this.clearCartCookies()

        this.instalar_app()

        // Obtengo el comercio, despues ollamo a callMethods
        this.get_commerce()

        this.$scrollToTop()
    },
    methods: {
        escuchar_mensajes() {
            setInterval(() => {
                if (this.$route.name != 'Messages') {
                    
                    this.$store.dispatch('messages/getMessages')
                }
            }, 20000)
        },
        get_commerce() {
            /* Si main.js ya cargó el comercio, solo continúa el flujo inicial. */
            if (this.commerce) {
                this.callMethods()
                return
            }

            this.$store.commit('auth/setLoading', true)
            this.$store.dispatch('commerce/getCommerce')
            .then(() => {
                this.$store.commit('auth/setLoading', false)
                this.callMethods()
            })
            .catch(err => {
                console.log(err)
            })
        },
        instalar_app() {
            window.addEventListener("beforeinstallprompt", e => {
                e.preventDefault();
                // Stash the event so it can be triggered later.
                this.$store.commit('install_btn/setDeferredPrompt', e)
            });

            window.addEventListener("appinstalled", () => {
                this.$store.commit('install_btn/setDeferredPrompt', null)
            });
        },
        /**
         * Carga inicial tras obtener el comercio: sesión, catálogo y artículos de home.
         * getIndex no depende de categorías/marcas/bodegas/cepas; antes se encadenaba con await
         * y en producción retrasaba la home ~50s.
         *
         * @returns {Promise<void>}
         */
        callMethods() {
            console.log('callMethods')

            /* Sesión en segundo plano; callAuthMethods reacciona al watcher de authenticated. */
            this.$store.dispatch('auth/me')

            if (!this.data_loaded) {

                this.data_loaded = true

                this.$store.dispatch('titles/getTitles')

                /*
                 | Últimos ingresados / promos vinoteca: pedir artículos de inmediato
                 | (no esperar metadatos del menú lateral).
                 */
                this.getIndex()

                /*
                 | Metadatos del catálogo en paralelo; getCategory los necesita para rutas
                 | con categoría, bodega, cepa o marca en la URL.
                 */
                Promise.all([
                    this.$store.dispatch('categories/getCategories'),
                    this.$store.dispatch('categories/getBrands'),
                    this.$store.dispatch('bodegas/getModels'),
                    this.$store.dispatch('cepas/getModels'),
                ])
                .then(() => {
                    this.getCategory()
                })
                .catch(err => {
                    console.log(err)
                })

                this.$store.dispatch('payment_methods/getModels')
                this.$store.dispatch('delivery_zones/getModels')
            }
        },
        getIndex() {
            if (
                (
                    this.$route.name == 'Home'
                    && this.$route.params.category == 'ultimos-ingresados'
                )
                || this.$route.name == 'PromocionesVinoteca'
            ) {
                console.log('Llamando a los articulos')
                return this.$store.dispatch('categories/getIndex')
            }
            console.log('No se llamo a los articulos')
            return null
        },
        getCategory() {
            if (
                this.$route.name == 'Home'
                && this.$route.params.category != 'ultimos-ingresados'
            ) {

                let category_param = this.$route.params.category.toLowerCase()

                if (category_param == 'bodega') {

                    console.log('parametro de bodega:')

                    let bodega = this.$store.state.bodegas.models.find(model => {
                        return this.routeString(model.name).toLowerCase() == this.$route.params.sub_category.toLowerCase()
                    })

                    console.log(bodega)
                    if (bodega) {

                        this.$store.commit('categories/setSelectedBodega', bodega)
                        this.$store.dispatch('categories/getArticles')

                    }

                } else if (category_param == 'cepa') {

                    console.log('parametro de cepa:')

                    let cepa = this.$store.state.cepas.models.find(model => {
                        return this.routeString(model.name).toLowerCase() == this.$route.params.sub_category.toLowerCase()
                    })

                    console.log(cepa)
                    if (cepa) {

                        this.$store.commit('categories/setSelectedCepa', cepa)
                        this.$store.dispatch('categories/getArticles')

                    }

                } else if (category_param == 'marca') {

                    if (typeof this.$route.params.sub_category != 'undefined') {
                        let brand = this.$store.state.categories.brands.find(model => {
                            return this.routeString(model.name).toLowerCase() == this.$route.params.sub_category.toLowerCase()
                        })
                        if (typeof brand != 'undefined') {
                            this.$store.commit('categories/setSelectedBrand', brand)
                            this.$store.dispatch('categories/getArticles')
                            console.log('pidiendo la marca ' + brand.name)
                        }
                    }

                } else {

                    let category = this.$store.state.categories.categories.find(model => {
                        return this.routeString(model.name).toLowerCase() == this.$route.params.category.toLowerCase()
                    })

                    if (typeof this.$route.params.sub_category != 'undefined') {
                        // Hay una sub_categoria como parametro
                        let sub_category = category.sub_categories.find(model => {
                            return this.routeString(model.name).toLowerCase() == this.$route.params.sub_category.toLowerCase()
                        })
                        if (typeof sub_category != 'undefined') {
                            this.$store.commit('categories/setSelectedSubCategory', sub_category)
                            this.$store.dispatch('categories/getArticles')
                            console.log('pidiendo la sub_category '+sub_category.name)
                        }
                    } else {
                        if (typeof category != 'undefined') {
                            this.$store.commit('categories/setSelectedCategory', category)
                            this.$store.dispatch('categories/getArticles')
                            console.log('pidiendo la category '+category.name)
                        }
                    }
                }

            }
            return null
        },
        async callAuthMethods() {
            console.log('callAuthMethods')
            if (this.authenticated) {
                console.log('esta authenticated')
                // this.runFirebase()
                // await this.$store.dispatch('last_searchs/getLastSearchs')
                await this.$store.dispatch('orders/getCurrentOrder')
                await this.$store.dispatch('messages/getMessages')
                // await this.$store.dispatch('help/setWaitingCall')
                // await this.$store.dispatch('cupons/getActiveCupons')
                await this.listenChannels()
                await this.getLastCart()

            } else {
                this.$store.commit('cart/setCart', null)
                this.$store.commit('orders/setOrder', null)
            }
        },
    }
}
</script>
<style lang="sass">
@import '@/sass/app.sass'
#app
    font-family: var(--font-family-sans)
    -webkit-font-smoothing: antialiased
    -moz-osx-font-smoothing: grayscale
    text-align: center
    min-height: 100vh
    background: var(--background-color)


// .container-principal 

//     background: red

//     // overflow-y: hidden
//     min-height: 100vh
//     .btn-update
//         @media screen and (max-width: 998px)
//             margin-top: 70px
//             margin-bottom: -30px
//         @media screen and (min-width: 998px)
//             margin-top: 100px
//             margin-bottom: -60px
</style>
