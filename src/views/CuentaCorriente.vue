<template>
	<div class="view">
		
		<b-row>
			<b-col
			lg="8">
				
				<h3 class="m-40">Cuenta corriente</h3>
				
				<div 
				v-if="loading && !models.length"
				class="text-center p-4">
					<b-spinner variant="primary"></b-spinner>
				</div>

				<template v-else>
					<div 
					v-if="credit_accounts.length > 1"
					class="mb-3">
						<b-form-select
						v-model="selected_credit_account_id"
						:options="credit_account_options"
						@change="onCreditAccountChange">
						</b-form-select>
					</div>


				<div 
				v-if="current_credit_account"
				class="d-flex justify-content-between align-items-center mb-3">
					<b-form-group
					label="Mostrar últimos"
					label-cols="auto"
					class="mb-0 align-items-center">
						<b-form-select
						:value="cantidad_movimientos"
						:options="cantidad_options"
						size="sm"
						style="width: auto"
						@change="onCantidadChange">
						</b-form-select>
					</b-form-group>
					<b-button
					size="sm"
					variant="outline-primary"
					@click="printEstadoCuenta">
						<i class="icon-printer"></i>
						Imprimir
					</b-button>
				</div>

					<cuenta-corriente-table></cuenta-corriente-table>
				</template>
			</b-col>
		</b-row>
	</div>
</template>
<script>
import CuentaCorrienteTable from '@/components/cuenta-corriente/Table'
export default {
	name: 'CuentaCorriente',
	components: {
		CuentaCorrienteTable,
	},
	data() {
		return {
			selected_credit_account_id: null,
		}
	},
	computed: {
		loading() {
			return this.$store.state.current_acount.loading
		},
		credit_accounts() {
			return this.$store.state.current_acount.credit_accounts
		},
		current_credit_account() {
			return this.$store.state.current_acount.current_credit_account
		},
		models() {
			return this.$store.state.current_acount.models
		},
		cantidad_movimientos() {
			return this.$store.state.current_acount.cantidad_movimientos
		},
		credit_account_options() {
			return this.credit_accounts.map(ca => ({
				value: ca.id,
				text: ca.moneda ? ca.moneda.name : `Cuenta #${ca.id}`,
			}))
		},
		cantidad_options() {
			return [
				{ value: 50, text: '50 movimientos' },
				{ value: 100, text: '100 movimientos' },
				{ value: 200, text: '200 movimientos' },
				{ value: 500, text: '500 movimientos' },
			]
		},
	},
	created() {
		this.setTitle('Cuenta corriente')
		this.$store.dispatch('current_acount/getCreditAccounts')
		.then(() => {
			if (this.current_credit_account) {
				this.selected_credit_account_id = this.current_credit_account.id
				this.$store.dispatch('current_acount/getMovements')
			}
		})
	},
	methods: {
		onCreditAccountChange(credit_account_id) {
			const ca = this.credit_accounts.find(c => c.id == credit_account_id)
			if (ca) {
				this.$store.commit('current_acount/setCurrentCreditAccount', ca)
				this.$store.dispatch('current_acount/getMovements')
			}
		},
		onCantidadChange(value) {
			this.$store.commit('current_acount/setCantidadMovimientos', Number(value))
			this.$store.dispatch('current_acount/getMovements')
		},
		printEstadoCuenta() {
			const empresa_url = this.commerce.api_url ? `https://${this.commerce.api_url}` : ''
			if (!empresa_url || !this.current_credit_account) return
			const url = `${empresa_url}/current-acount/pdf/${this.current_credit_account.id}/${this.cantidad_movimientos}/simple`
			window.open(url)
		},
	}
}
</script>
<style scoped lang="sass">
.cuenta-corriente-view
	padding: 20px
	max-width: 1000px
	margin: 0 auto
</style>
