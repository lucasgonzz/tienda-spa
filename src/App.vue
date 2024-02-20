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
                <b-container fluid class="container-principal">
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
        tienda_pausada() {
            return this.commerce.online_configuration.pausar_tienda_online 
        },
    },
    watch: {
        authenticated() {
            if (this.authenticated) {
                this.callAuthMethods()
            } else {
                this.setCartFromCookies()
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
        window.addEventListener("beforeinstallprompt", e => {
            e.preventDefault();
            // Stash the event so it can be triggered later.
            this.$store.commit('install_btn/setDeferredPrompt', e)
        });
        window.addEventListener("appinstalled", () => {
            this.$store.commit('install_btn/setDeferredPrompt', null)
        });
        this.$store.commit('auth/setLoading', true)
        this.$store.dispatch('commerce/getCommerce')
        .then(() => {
            this.$store.commit('auth/setLoading', false)
            this.callMethods()
        })
        this.$scrollToTop()
    },
    methods: {
        async callMethods() {
            console.log('callMethods')
            if (!this.data_loaded) {
                if (this.commerce.online_configuration.register_to_buy) {
                    this.$store.dispatch('auth/me')
                } else {
                    this.setCartFromCookies()
                }
                await this.$store.dispatch('titles/getTitles')
                
                await this.getIndex()
                
                await this.$store.dispatch('categories/getCategories')
                
                await this.getCategory()

                await this.$store.dispatch('platelets/getModels')
                await this.$store.dispatch('payment_methods/getModels')
                await this.$store.dispatch('delivery_zones/getModels')
                this.data_loaded = true
            }
        },
        getIndex() {
            if (this.$route.params.category == 'ultimos-ingresados') {
                return this.$store.dispatch('categories/getIndex')
            }
            return null
        },
        getCategory() {
            if (this.$route.params.category != 'ultimos-ingresados') {
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
            return null
        },
        async callAuthMethods() {
            console.log('callAuthMethods')
            if (this.authenticated) {
                this.runFirebase()
                await this.$store.dispatch('last_searchs/getLastSearchs')
                await this.$store.dispatch('orders/getCurrentOrder')
                await this.$store.dispatch('messages/getMessages')
                await this.$store.dispatch('help/setWaitingCall')
                await this.$store.dispatch('cupons/getActiveCupons')
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
@import "./sass/fonts/styles.css"
@import '@/sass/app.sass'
#app 
    font-family: -apple-system, Roboto, IBM Plex Sans Arabic, Nunito, Avenir, Helvetica, Arial, sans-serif
    -webkit-font-smoothing: antialiased
    -moz-osx-font-smoothing: grayscale 
    text-align: center
    height: 100vh
.container-principal

    // background: rgba(0,0,0,.1)
    background: #EBEBEB

    // background: url('~@/assets/fondo.jpg') 
    // background-size: 100% auto
    // background-position: center top
    // background-attachment: fixed
    // background-repeat: repeat

    // overflow-y: hidden
    min-height: 100vh
    .btn-update
        @media screen and (max-width: 998px)
            margin-top: 70px
            margin-bottom: -30px
        @media screen and (min-width: 998px)
            margin-top: 100px
            margin-bottom: -60px
</style>
