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
		 * (`commerce.direcciones_de_envio`). Ver helpers/direcciones.js.
		 *
		 * @returns {boolean}
		 */
		direcciones_de_envio_activas() {
			return direcciones_activas(this.commerce)
		},
	},
}
</script>