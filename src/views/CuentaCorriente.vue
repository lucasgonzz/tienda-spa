<template>
	<div class="cuenta-corriente-page view-p-t">
		<b-row class="cuenta-corriente-page__hero justify-content-center">
			<b-col
			cols="12"
			lg="10"
			xl="9">
				<p class="cuenta-corriente-page__eyebrow">
					Tu cuenta
				</p>
				<h1 class="cuenta-corriente-page__title">
					Cuenta corriente
				</h1>
				<p class="cuenta-corriente-page__lead">
					Consultá tus movimientos, saldos e imprimí el estado de cuenta cuando lo necesites.
				</p>
			</b-col>
		</b-row>

		<b-row class="justify-content-center">
			<b-col
			cols="12"
			lg="10"
			xl="9">
				<div
				v-if="loading && !models.length"
				class="cuenta-corriente-page__card cuenta-corriente-page__card--loading">
					<div class="text-center py-5">
						<b-spinner variant="primary"></b-spinner>
					</div>
				</div>

				<div
				v-else
				class="cuenta-corriente-page__card">
					<div
					v-if="credit_accounts.length > 1"
					class="cuenta-corriente-page__account-select">
						<label
						class="cuenta-corriente-page__field-label"
						for="cuenta-corriente-account">
							Cuenta
						</label>
						<b-form-select
						id="cuenta-corriente-account"
						v-model="selected_credit_account_id"
						:options="credit_account_options"
						class="cuenta-corriente-page__select"
						@change="onCreditAccountChange">
						</b-form-select>
					</div>

					<div
					v-if="current_credit_account"
					class="cuenta-corriente-page__toolbar">
						<div class="cuenta-corriente-page__toolbar-left">
							<label
							class="cuenta-corriente-page__field-label cuenta-corriente-page__field-label--inline"
							for="cuenta-corriente-cantidad">
								Mostrar últimos
							</label>
							<b-form-select
							id="cuenta-corriente-cantidad"
							:value="cantidad_movimientos"
							:options="cantidad_options"
							class="cuenta-corriente-page__select cuenta-corriente-page__select--sm"
							@change="onCantidadChange">
							</b-form-select>
						</div>
						<b-button
						size="sm"
						variant="outline-primary"
						class="cuenta-corriente-page__btn-print"
						@click="printEstadoCuenta">
							<i class="bi bi-printer"></i>
							Imprimir
						</b-button>
					</div>

					<cuenta-corriente-table></cuenta-corriente-table>
				</div>
			</b-col>
		</b-row>
	</div>
</template>
<script>
import CuentaCorrienteTable from '@/components/cuenta-corriente/Table'

/**
 * Vista de cuenta corriente del buyer: movimientos, filtros e impresión del estado de cuenta.
 */
export default {
	name: 'CuentaCorriente',
	components: {
		CuentaCorrienteTable,
	},
	data() {
		return {
			// ID de la cuenta corriente seleccionada en el selector (si hay varias monedas)
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
		/**
		 * Cambia la cuenta corriente activa y recarga los movimientos.
		 *
		 * @param {number} credit_account_id ID de la cuenta seleccionada
		 */
		onCreditAccountChange(credit_account_id) {
			const ca = this.credit_accounts.find(c => c.id == credit_account_id)
			if (ca) {
				this.$store.commit('current_acount/setCurrentCreditAccount', ca)
				this.$store.dispatch('current_acount/getMovements')
			}
		},
		/**
		 * Actualiza la cantidad de movimientos a listar y vuelve a consultar la API.
		 *
		 * @param {number|string} value Cantidad elegida en el selector
		 */
		onCantidadChange(value) {
			this.$store.commit('current_acount/setCantidadMovimientos', Number(value))
			this.$store.dispatch('current_acount/getMovements')
		},
		/**
		 * Abre en una pestaña nueva el PDF del estado de cuenta en empresa-api.
		 */
		printEstadoCuenta() {
			const empresa_url = this.commerce.api_url ? this.commerce.api_url : ''
			if (!empresa_url || !this.current_credit_account) return
			const url = `${empresa_url}/current-acount/pdf/${this.current_credit_account.id}/${this.cantidad_movimientos}/simple`

			window.open(url)
		},
	}
}
</script>
<style scoped lang="sass">
/*
 * Cuenta corriente: layout centrado y tarjeta alineada al resto de páginas institucionales (carrito, contacto).
 * Indentación con espacios: sass indentado no acepta tabuladores en este proyecto.
 */
.cuenta-corriente-page
  max-width: 1200px
  margin-left: auto
  margin-right: auto
  padding-bottom: 2.5rem

.cuenta-corriente-page__hero
  margin-bottom: 1.5rem
  text-align: center
  @media (min-width: 992px)
    text-align: left

.cuenta-corriente-page__eyebrow
  font-size: 0.8rem
  text-transform: uppercase
  letter-spacing: 0.12em
  color: var(--secondary-color)
  font-weight: 600
  margin-bottom: 0.35rem

.cuenta-corriente-page__title
  font-size: 1.85rem
  font-weight: 700
  margin-bottom: 0.5rem
  color: #1a1a1a
  line-height: 1.25

.cuenta-corriente-page__lead
  font-size: 1.05rem
  line-height: 1.5
  color: #666
  margin-bottom: 0
  max-width: 36rem
  margin-left: auto
  margin-right: auto
  @media (min-width: 992px)
    margin-left: 0
    margin-right: 0

.cuenta-corriente-page__card
  background: #fff
  border-radius: 14px
  padding: 1.25rem 1.15rem
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.07)
  border: 1px solid rgba(0, 0, 0, 0.06)
  border-top: 3px solid var(--secondary-color)
  @media (min-width: 992px)
    padding: 1.5rem 1.4rem

.cuenta-corriente-page__card--loading
  min-height: 220px

.cuenta-corriente-page__account-select
  margin-bottom: 1.25rem

.cuenta-corriente-page__field-label
  display: block
  font-size: 0.72rem
  font-weight: 600
  text-transform: uppercase
  letter-spacing: 0.06em
  color: #888
  margin-bottom: 0.35rem

.cuenta-corriente-page__field-label--inline
  display: inline
  margin-bottom: 0
  margin-right: 0.5rem

.cuenta-corriente-page__select
  border-radius: 10px
  border-color: rgba(0, 0, 0, 0.12)
  font-size: 0.92rem
  max-width: 100%

.cuenta-corriente-page__select--sm
  width: auto
  min-width: 10rem
  display: inline-block

.cuenta-corriente-page__toolbar
  display: flex
  flex-wrap: wrap
  align-items: center
  justify-content: space-between
  gap: 0.75rem
  margin-bottom: 1.15rem
  padding-bottom: 1rem
  border-bottom: 1px solid rgba(0, 0, 0, 0.06)

.cuenta-corriente-page__toolbar-left
  display: flex
  flex-wrap: wrap
  align-items: center
  gap: 0.35rem

.cuenta-corriente-page__btn-print
  font-weight: 600
  border-radius: 10px
  border-width: 2px
  display: inline-flex
  align-items: center
  gap: 0.35rem
</style>
