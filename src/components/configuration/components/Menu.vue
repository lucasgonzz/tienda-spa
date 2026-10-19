<template>
	<b-list-group>
		<b-list-group-item
		v-b-modal="'update-name'"
		class="apretable s">
			Actualizar Nombre
		</b-list-group-item>
		<b-list-group-item
		v-b-modal="'update-number'"
		class="apretable s">
			Actualizar Teléfono 
		</b-list-group-item>
		<b-list-group-item
		v-b-modal="'update-email'"
		class="apretable s">
			Actualizar Correo 
		</b-list-group-item>
		<b-list-group-item
		v-b-modal="'update-password'"
		class="apretable s">
			Actualizar Contraseña 
		</b-list-group-item>
		<!-- Direcciones de envío guardadas (19/10/2026): solo si la tienda las tiene. -->
		<b-list-group-item
		v-if="direcciones_de_envio_activas"
		v-b-modal="'mis-direcciones'"
		class="apretable s">
			Mis direcciones
		</b-list-group-item>
		<b-list-group-item
		@click="logout"
		class="apretable s">
			Cerrar sesion
		</b-list-group-item>
	</b-list-group>
</template>
<script>
import auth from '@/mixins/auth'
import { direcciones_activas } from '@/helpers/direcciones'
export default {
	mixins: [auth],
	computed: {
		/**
		 * "Mis direcciones" solo existe con las direcciones de envío nuevas
		 * (`commerce.direcciones_de_envio`, ver helpers/direcciones.js) y si el comercio ofrece
		 * envío a domicilio (`has_delivery`): sin envío, guardar direcciones no sirve para nada.
		 *
		 * @returns {boolean}
		 */
		direcciones_de_envio_activas() {
			return direcciones_activas(this.commerce)
				&& !!this.commerce.online_configuration
				&& this.flag_activo(this.commerce.online_configuration.has_delivery)
				&& !this.sesion_sin_cuenta
		},
		/**
		 * La API ya respondió `sin_cuenta` para esta sesión (la ficha que deja el checkout de
		 * invitado): no tiene libreta de direcciones, así que no se le ofrece.
		 *
		 * @returns {boolean}
		 */
		sesion_sin_cuenta() {
			return !!(this.user && this.$store.state.buyer_addresses.sin_cuenta_para === this.user.id)
		},
	},
	created() {
		/*
		 * El SPA no puede saber si la sesión es de una cuenta (la contraseña va oculta): se le
		 * pregunta a la API trayendo la lista, que hace falta igual para "Mis direcciones". Si
		 * responde `sin_cuenta`, la opción se esconde sola (ver `sesion_sin_cuenta`).
		 */
		if (this.direcciones_de_envio_activas && this.user && this.$store.state.buyer_addresses.cargada_para !== this.user.id) {
			this.$store.dispatch('buyer_addresses/fetch').catch(() => {})
		}
	},
}
</script>