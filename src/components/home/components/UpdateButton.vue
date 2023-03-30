<template>
    <b-col
    v-if="update_exists"
    cols="12"
    xl="11">
    	<b-button
        @click="refreshApp"
    	variant="success">
            Nueva version disponible, click para actualizar
        </b-button>
    </b-col>
</template>
<script>
export default {
    computed: {
        update_exists() {
            return this.$store.state.ws.update_exists
        },
    },
	methods: {
        refreshApp () {
            this.$store.commit('ws/setUpdateApp', true)
        },
	}
}
</script>