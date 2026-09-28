<template>
    <b-sidebar
    shadow
    v-model="mobile_sidebar_visibility"
    title="Menú"
    id="nav-sidebar">
        <b-nav vertical>
            <items-list mobile></items-list>
        </b-nav>
    </b-sidebar>
</template>
<script>
export default {
    components: {
        ItemsList: () => import('@/components/nav/footer/ItemsList'),
    },
    computed: {
        mobile_sidebar_visibility: {
            get() {
                return this.$store.state.auth.mobile_sidebar_visibility
            },
            set(value) {
                this.$store.commit('auth/setMobileSidebarVisibility', value)
            }
        },
    },
}
</script>
<style lang="sass">
@import '@/sass/_custom'
#nav-sidebar
    // background: $green !important
    width: 380px
    .nav
        height: 100%

    .item, a
        color: #333

    // Mismo lenguaje visual que nav-categories-sidebar (categories/Index.vue): filas
    // redondeadas, hover con color-mix sobre los tokens del comercio, separador sutil.
    // Con mayor especificidad (id + clase) que .items-list .item de ItemsList.vue, asi que
    // pisa sin tocar ese archivo ni la barra de escritorio que lo comparte.
    .item
        border-radius: 10px
        margin: 2px 10px
        padding: 12px 14px
        transition: background .15s ease
        &:hover
            background: color-mix(in srgb, var(--secondary-color) 12%, transparent)

    i.bi
        color: var(--secondary-color)

    // Separa el bloque de auth (login/registro o pedidos/salir) del resto de los items.
    .item-divider
        margin: 14px 20px
        background: rgba(0, 0, 0, .08)

</style>