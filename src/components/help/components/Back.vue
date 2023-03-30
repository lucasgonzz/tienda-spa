<template>
	<b-button
	variant="outline-success"
	block
	v-if="selected_option != ''"
	@click="back">
		Volver
		<!-- <i class="icon-back"></i> Volver -->
	</b-button>
</template>
<script>
export default {
	computed: {
		selected_option() {
			return this.$store.state.help.selected_option
		}
	},
	methods: {
		back() {
			this.$store.commit('help/setSelectedOption', '')
		}
	}
}
</script>