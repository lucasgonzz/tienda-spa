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
			Actualizar Numero 
		</b-list-group-item>
		<b-list-group-item
		v-b-modal="'update-password'"
		class="apretable s">
			Actualizar Contraseña 
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
import nav from '@/mixins/nav'
export default {
	mixins: [auth, nav],
}
</script>