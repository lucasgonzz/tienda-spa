<template>
<b-modal
id="informacion-legal" hide-footer hide-header>
	<b-button
	variant="success"
	@click="to('TerminosCondiciones')"
	block>
		Terminos y condiciones
	</b-button>
	<b-button
	variant="success"
	@click="to('PoliticaDePrivacidad')"
	block>
		Politica de privacidad
	</b-button>
</b-modal>
</template>
<script>
export default {
	methods: {
		to(name) {
			this.$bvModal.hide('informacion-legal')
			this.$router.push({name})
		}
	}
}
</script>