<template>
    <div id="app">
        <logo-loading></logo-loading>
        <div>
            <!-- <notifications-permissions></notifications-permissions> -->
            <nav-component></nav-component>
            <b-container fluid class="container-principal">
                <b-button
                v-if="new_version"
                @click="refreshApp"
                class="btn-update"
                variant="success">
                    Hay una nueva version disponible, click para actualizar
                </b-button>
                <transition name="slide-left">
                    <router-view/>
                </transition>
                <btn-whats-app></btn-whats-app>
            </b-container>
        </div>
    </div>
</template>
<script>
import NavComponent from '@/components/nav/Index'
import UpdateButton from '@/components/common/UpdateButton'
import BtnWhatsApp from '@/components/common/BtnWhatsApp'
import LogoLoading from '@/components/common/LogoLoading'
import WebSockets from '@/mixins/WebSockets'
import transitions from '@/mixins/transitions'
import firebase from '@/mixins/firebase'
import articles from '@/mixins/articles'
// import NotificationsPermissions from '@/components/nav/modals/NotificationsPermissions'
import app from '@/mixins/app'
import VueScreenSize from 'vue-screen-size'
export default {
    components: {
        NavComponent,
        UpdateButton,
        BtnWhatsApp,
        // NotificationsPermissions,
        LogoLoading,
    },
    mixins: [WebSockets, transitions, app, firebase, articles, VueScreenSize.VueScreenSizeMixin],
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
    },
    watch: {
        authenticated() {
            if (this.authenticated) {
                this.callAuthMethods()
            } else {
                this.setCartFromCookies()
            }
        },
        route() {
            this.$scrollToTop()
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
        document.addEventListener(
            'swUpdated', this.showRefreshUI, { once: true }
        );
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
        this.$store.dispatch('auth/me')
        .then(() => {
            this.$store.commit('auth/setLoading', false)
            this.callMethods()
        })
    },
    methods: {
        showRefreshUI (e) {
            console.log('Se recibio el evento desde App.vue')
            this.new_version = true
        },
        refreshApp () {
            console.log('Se llamo refreshApp.')
            location.reload(true)
        },
        async callMethods() {
            console.log('callMethods')
            if (!this.data_loaded) {
                await this.$store.dispatch('commerce/getCommerce')
                await this.$store.dispatch('titles/getTitles')
                await this.$store.dispatch('categories/getCategories')
                await this.$store.dispatch('categories/getIndex')
                await this.$store.dispatch('platelets/getModels')
                // await this.$store.dispatch('coins/getCoins')
                await this.$store.dispatch('last_searchs/getLastSearchsForSearchPage')
                // await this.$store.dispatch('articles/getArticlesNames')
                // await this.$store.dispatch('commerce/getWorkdays')
                await this.$store.dispatch('payment_methods/getModels')
                await this.$store.dispatch('delivery_zones/getModels')
                this.data_loaded = true
            }
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
    background: #DEDEDE

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
