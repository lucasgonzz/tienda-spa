<template>
    <b-sidebar id="nav-sidebar">
        <b-nav vertical>
            <div>
                <user-data></user-data>
                <app-data></app-data>
                <b-nav-item 
                @click="home()"
                :class="active('Home')">
                    <i :class="getIconActive('Home', 'home')"></i>
                    Inicio
                </b-nav-item>
                <b-nav-item 
                @click="install()">
                    <i class="icon-download"></i>
                    Instalar App
                </b-nav-item>
                <div
                v-if="authenticated">
                    <!-- <b-nav-item 
                    @click="favorites()"
                    :class="active('Favorites')">
                        <i :class="getIconActive('Favorites', 'heart')"></i>
                        Favoritos
                    </b-nav-item> -->
                    <b-nav-item 
                    @click="orders()"
                    :class="active('Orders')">
                        <i :class="getIconActive('Orders', 'bag')"></i>
                        Compras
                    </b-nav-item>
                    <!-- <b-nav-item 
                    @click="questions()"
                    :class="active('Questions')">
                        <i :class="getIconActive('Questions', 'comment')"></i>
                        Preguntas
                    </b-nav-item> -->
                    <!-- <b-nav-item 
                    @click="home()"
                    :class="active('Cupons')">
                        <i class="icon-cupon"></i>
                        Cupones
                    </b-nav-item> -->
                    <b-nav-item 
                    :to="{name: 'Configuration'}"
                    :class="active('Configuration')">
                        <i :class="getIconActive('Configuration', 'user')"></i>
                        Mi cuenta
                    </b-nav-item>
                </div>
                <b-nav-item 
                v-if="workdays.length"
                v-b-modal="'workdays'">
                    <i class="icon-clock"></i>
                    Horarios
                </b-nav-item>
                <b-nav-item 
                v-if="commerce.addresses && commerce.addresses.length"
                :to="{name: 'Location'}"
                :class="active('Location')">
                    <i class="icon-location"></i>
                    Nuestro local
                </b-nav-item>
                <b-nav-item 
                :to="{name: 'Help'}"
                :class="active('Help')">
                    <i class="icon-headphone"></i>
                    Ayuda
                </b-nav-item>
                <b-nav-item 
                v-b-modal="'informacion-legal'"
                :class="active('TerminosCondiciones')">
                    <i class="icon-info-o"></i>
                    Informacion legal
                </b-nav-item>
            </div>
        </b-nav>
    </b-sidebar>
</template>
<script>
import nav from '@/mixins/nav'
import auth from '@/mixins/auth'
import UserData from '@/components/user/components/UserData'
import AppData from '@/components/nav/mobile-sidebar/AppData'
import Cookies from "js-cookie"
export default {
    mixins: [nav, auth],
    components: {
        UserData,
        AppData,
    },
    data() {
        return {
            deferredPrompt: null
        }
    },
    computed: {
        is_app_installed() {
            console.log('cookie de instalar app:')
            console.log(Cookies.get("app-installed"))
            return Cookies.get("app-installed") != 'undefined' 
        },
        deferred_prompt() {
            return this.$store.state.install_btn.deferred_prompt
        },
        workdays() {
            return this.$store.state.commerce.workdays
        }
    },
    methods: {
        active(route_name) {
            return this.$route.name == route_name ? 'link-mobile-active' : ''
        },
        async install() {
            this.deferred_prompt.prompt()
        }
    },
}
</script>
<style lang="sass">
.b-sidebar
    .nav-link 
        position: relative
        .badge 
            left: 0px
            top: -2px
            font-size: .8em
</style>