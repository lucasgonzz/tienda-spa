<template>
	<b-row
	v-if="selected_option == 'llamada'">
		<b-col
		lg="6">
			<b-card
			class="shadow">
				<div
				v-if="!waiting_call">
					<p
					class="text-with-icon">
						<i class="icon-phone-o"></i>
						Te vamos a llamar dentro de los proximos 5 minutos
					</p>
					<b-form-group>
						<b-button
						@click="call"
						block
						variant="success">
							<btn-loader
							text="Recibir llamada"
							:loader="loading"></btn-loader>
						</b-button>
					</b-form-group>
					<back></back>
				</div>
				<div
				class="m-b-15"
				v-else>
					<p
					class="text-with-icon">
						<i class="icon-phone-o text-success"></i>
						Recibimos tu petición
					</p>
					<p>
						<strong>
							Un operador se pondrá en contacto contigo dentro de los próximos 5 minutos.
						</strong>
					</p>
				</div>
				<back></back>
			</b-card>
		</b-col>
	</b-row>
</template>
<script>
import BtnLoader from '@/components/common/BtnLoader'
import Back from '@/components/help/components/Back'
export default {
	components: {
		BtnLoader,
		Back,
	},
	data() {
		return {
			loading: false,
		}
	},
	computed: {
		selected_option() {
			return this.$store.state.help.selected_option
		},
		waiting_call() {
			return this.$store.state.help.waiting_call
		},
	},
	methods: {
		call() {
			if (this.checkAuth()) {
				this.loading = true
				this.$api.post('calls', {
					commerce_id: process.env.VUE_APP_COMMERCE_ID
				})
				.then(() => {
					this.loading = false
					this.$store.commit('help/setWaitingCall', true)
				})
				.catch(err => {
					this.$toast.error('No podemos procesar tu llamada en estos momentos')
					this.loading = false
					console.log(err)
				})
			}
		}
	}
}
</script>