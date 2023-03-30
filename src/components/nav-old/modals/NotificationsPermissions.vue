<template>
<b-modal id="notifications-permissions" hide-footer hide-header size="sm">
	<p
	class="text-center">
		Queremos notificarte el estado de tus pedidos
	</p>
	<div
	class="j-center">
		<b-button 
		size="sm"
		variant="outline-success"
		@click="dismiss">Mas tarde</b-button>
		<b-button 
		class="m-l-15"
		size="sm"
		variant="success"
		@click="aceptar">Aceptar</b-button>
	</div>
</b-modal>
</template>
<script>
import Cookies from "js-cookie"
import firebase from '@/mixins/firebase'
export default {
	mixins: [firebase],
	methods: {
		async dismiss() {
			Cookies.set("notifications", null, { expires: 7 })
			this.$bvModal.hide('notifications-permissions')
		},
		async aceptar() {
			console.log('se acepto')
			Notification.requestPermission().then((permission) => {
	            console.log('permission: '+permission)
	            if (permission === "granted") {
	                console.log('Permisos aceptados')
	                this.initializeFirebase();
	            } else if (permission === 'denied') {
	                console.log('Permisos rechazados')
					// Cookies.set("notifications", null, { expires: 1 })
	            }
				this.$bvModal.hide('notifications-permissions')
	        })
		}
	}
}
</script>
<style scoped lang="sass">
</style>