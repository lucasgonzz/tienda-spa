<template>
	<b-row
	v-if="selected_option == ''">
		<b-col
		lg="6">
			<b-card
			class="shadow"
			title="Como podemos ayudarte">
				<b-form-group>
					<b-form-radio
					v-model="option"
					value="escribinos">
						<strong>Escribinos</strong>
						<p>
							Detallanos cual es tu problema y nos pondremos en contacto con vos.
						</p>
					</b-form-radio>
				</b-form-group>
				<b-form-group>
					<b-form-radio
					v-model="option"
					value="llamada">
						<strong>Te llamamos</strong>
						<p>
							Recibi una llamada de nuestros operadores para resolver tu problema.
						</p>
					</b-form-radio>
				</b-form-group>
				<b-form-group>
					<b-button
					variant="success"
					block
					:disabled="option == ''"
					@click="setSelectedOption">
						Siguiente
					</b-button>
				</b-form-group>
			</b-card>
		</b-col>
	</b-row>
</template>
<script>
export default {
	data() {
		return {
			option: ''
		}
	},
	computed: {
		selected_option() {
			return this.$store.state.help.selected_option
		},
	},
	methods: {
		setSelectedOption() {
			this.$store.commit('help/setSelectedOption', this.option)
		}
	}
}
</script>