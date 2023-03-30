<template>
	<b-row
	v-if="waiting_call"
	class="view waiting-call">
		<b-col
		cols="12"
		lg="8">
			<b-card
			class="shadow">
				<p
				class="text-with-icon">
					<i class="icon-phone-o text-success"></i>
					Recibiras una llamada dentro de los proximos 5 minutos
				</p>
			</b-card>
		</b-col>
	</b-row>
</template>
<script>
export default {
	computed: {
		waiting_call() {
			return this.$store.state.help.waiting_call
		},
	},
}
</script>
<style lang="sass">
.waiting-call  
	padding: 0
	margin-top: 15px !important
</style>