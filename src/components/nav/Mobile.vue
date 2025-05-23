<template>
    <b-sidebar 
    shadow
    v-model="mobile_sidebar_visibility"
    id="nav-sidebar">
        <b-nav vertical>
            <items-list></items-list>
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

</style>