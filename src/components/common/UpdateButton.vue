<template>
<b-modal
id="update-button"
hide-header
hide-footer
size="sm">
	<p
	class="text-center">
		Hay una nueva version, recarga la pagina para actualizar
	</p>
	<div
	class="j-center">
		<b-button
		variant="outline-success">
			Cerrar
		</b-button>
		<b-button
		class="m-l-15"
		@click="refreshApp"
		variant="success">
			Actualizar
		</b-button>
	</div>
</b-modal>
</template>
<script>
export default {
	methods: {
		refreshApp() {
			this.$emit('refreshApp')
		}
	}
}
</script>