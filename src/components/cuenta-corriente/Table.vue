<template>
	<div>
		<div 
		v-if="loading"
		class="text-center p-4">
			<b-spinner
			variant="primary"></b-spinner>
		</div>

		<div v-else-if="models.length == 0"
		class="text-center p-4 text-muted">
			No hay movimientos en la cuenta corriente
		</div>

		<b-table
		v-else
		:items="models"
		:fields="fields"
		responsive
		striped
		hover
		small
		class="cuenta-corriente-table">
			<template #cell(created_at)="data">
				{{ date(data.value) }}
			</template>

			<template #cell(detalle)="data">
				<b-button
				v-if="hasPdf(data.item)"
				size="sm"
				variant="primary"
				:title="pdfTitle(data.item)"
				@click="openPdf(data.item)">
					{{ data.value }}
				</b-button>
				<span v-else>{{ data.value }}</span>
			</template>

			<template #cell(status)="data">
				<b-badge 
				v-if="data.value != 'pago_from_client'"
				:variant="statusVariant(data.value)">
					{{ statusLabel(data.value) }}
				</b-badge>
			</template>

			<template #cell(debe)="data">
				<span 
				v-if="data.value"
				class="text-danger">
					{{ price(data.value) }}
				</span>
			</template>

			<template #cell(haber)="data">
				<span 
				v-if="data.value">
					{{ price(data.value) }}
				</span>
			</template>

			<template #cell(saldo)="data">
				<strong>{{ price(data.value) }}</strong>
			</template>

		</b-table>
	</div>
</template>
<script>
export default {
	computed: {
		loading() {
			return this.$store.state.current_acount.loading
		},
		models() {
			return this.$store.state.current_acount.models
		},
		fields() {
			return [
				{ key: 'created_at', label: 'Fecha', sortable: true },
				{ key: 'detalle', label: 'Detalle' },
				{ key: 'status', label: 'Estado' },
				{ key: 'debe', label: 'Debe', class: 'text-right' },
				{ key: 'haber', label: 'Haber', class: 'text-right' },
				{ key: 'saldo', label: 'Saldo', class: 'text-right' },
				// { key: 'description', label: 'Descripción' },
			]
		},
	},
	methods: {
		statusLabel(status) {
			const labels = {
				'sin_pagar': 'Sin pagar',
				'pagandose': 'Pagándose',
				'pagado': 'Pagado',
				'nota_credito': 'Nota de crédito',
				'pago_from_client': 'Pago',
			}
			return labels[status] || status
		},
		statusVariant(status) {
			const variants = {
				'sin_pagar': 'danger',
				'pagandose': 'info',
				'pagado': 'primary',
				'nota_credito': 'secondary',
				'pago_from_client': 'primary',
			}
			return variants[status] || 'light'
		},
		empresaUrl() {
			return this.commerce.api_url ? this.commerce.api_url : ''
		},
		hasPdf(item) {
			return item.sale_id || item.status == 'pago_from_client' || item.status == 'nota_credito'
		},
		pdfTitle(item) {
			if (item.sale_id) return 'Imprimir venta'
			if (item.status == 'pago_from_client') return 'Imprimir comprobante de pago'
			if (item.status == 'nota_credito') return 'Imprimir nota de crédito'
			return 'Imprimir'
		},
		openPdf(item) {
			const base = this.empresaUrl()
			if (!base) return
			if (item.status == 'pago_from_client' || item.status == 'nota_credito') {
				window.open(`${base}/current-acount/pdf/${item.id}`)
			} else if (item.sale_id) {
				window.open(`${base}/sale/pdf/${item.sale_id}/1/0/0`)
			}
		},
	}
}
</script>
<style scoped lang="sass">
.cuenta-corriente-table
	font-size: 0.9em
</style>
