<template>
	<div class="cuenta-corriente-table-root">
		<div
		v-if="loading"
		class="cuenta-corriente-table-root__loading">
			<b-spinner
			variant="primary"></b-spinner>
		</div>

		<div
		v-else-if="models.length == 0"
		class="cuenta-corriente-table-root__empty">
			<i class="bi bi-inbox cuenta-corriente-table-root__empty-icon"></i>
			<p class="cuenta-corriente-table-root__empty-text">
				No hay movimientos en la cuenta corriente
			</p>
		</div>

		<div
		v-else
		class="cuenta-corriente-table-wrap">
			<table class="cuenta-corriente-table">
				<thead>
					<tr>
						<th>Fecha</th>
						<th>Detalle</th>
						<th>Estado</th>
						<th class="cuenta-corriente-table__th-num">Debe</th>
						<th class="cuenta-corriente-table__th-num">Haber</th>
						<th class="cuenta-corriente-table__th-num">Saldo</th>
					</tr>
				</thead>
				<tbody>
					<tr
					v-for="(item, index) in models"
					:key="rowKey(item, index)">
						<td class="cuenta-corriente-table__td-date">
							{{ date(item.created_at) }}
						</td>
						<td class="cuenta-corriente-table__td-detail">
							<button
							v-if="hasPdf(item)"
							type="button"
							class="cuenta-corriente-table__link"
							:title="pdfTitle(item)"
							@click="openPdf(item)">
								<i class="bi bi-file-earmark-text"></i>
								<span>{{ item.detalle }}</span>
							</button>
							<span
							v-else
							class="cuenta-corriente-table__detail-text">
								{{ item.detalle }}
							</span>
						</td>
						<td class="cuenta-corriente-table__td-status">
							<span
							v-if="item.status != 'pago_from_client'"
							class="cuenta-corriente-table__badge"
							:class="statusClass(item.status)">
								{{ statusLabel(item.status) }}
							</span>
						</td>
						<td class="cuenta-corriente-table__td-num cuenta-corriente-table__td-debe">
							<span v-if="item.debe">{{ price(item.debe) }}</span>
						</td>
						<td class="cuenta-corriente-table__td-num">
							<span v-if="item.haber">{{ price(item.haber) }}</span>
						</td>
						<td class="cuenta-corriente-table__td-num cuenta-corriente-table__td-saldo">
							<strong>{{ price(item.saldo) }}</strong>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>
<script>
/**
 * Tabla de movimientos de cuenta corriente: fechas, importes y acceso a PDFs de comprobantes.
 */
export default {
	computed: {
		loading() {
			return this.$store.state.current_acount.loading
		},
		models() {
			return this.$store.state.current_acount.models
		},
	},
	methods: {
		/**
		 * Clave estable por fila para el v-for (id del movimiento o índice de respaldo).
		 *
		 * @param {Object} item Movimiento de cuenta corriente
		 * @param {number} index Índice en el listado
		 * @returns {string|number}
		 */
		rowKey(item, index) {
			if (item.id) {
				return item.id
			}
			return index
		},
		/**
		 * Etiqueta legible del estado del movimiento.
		 *
		 * @param {string} status Código de estado del backend
		 * @returns {string}
		 */
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
		/**
		 * Clase CSS del badge según el estado del movimiento.
		 *
		 * @param {string} status Código de estado del backend
		 * @returns {string}
		 */
		statusClass(status) {
			const classes = {
				'sin_pagar': 'cuenta-corriente-table__badge--danger',
				'pagandose': 'cuenta-corriente-table__badge--info',
				'pagado': 'cuenta-corriente-table__badge--success',
				'nota_credito': 'cuenta-corriente-table__badge--muted',
				'pago_from_client': 'cuenta-corriente-table__badge--success',
			}
			return classes[status] || 'cuenta-corriente-table__badge--muted'
		},
		/**
		 * URL base de empresa-api para abrir PDFs.
		 *
		 * @returns {string}
		 */
		empresaUrl() {
			return this.commerce.api_url ? this.commerce.api_url : ''
		},
		/**
		 * Indica si el movimiento tiene PDF disponible para imprimir.
		 *
		 * @param {Object} item Movimiento de cuenta corriente
		 * @returns {boolean}
		 */
		hasPdf(item) {
			return item.sale_id || item.status == 'pago_from_client' || item.status == 'nota_credito'
		},
		/**
		 * Texto del tooltip del botón de PDF según el tipo de movimiento.
		 *
		 * @param {Object} item Movimiento de cuenta corriente
		 * @returns {string}
		 */
		pdfTitle(item) {
			if (item.sale_id) return 'Imprimir venta'
			if (item.status == 'pago_from_client') return 'Imprimir comprobante de pago'
			if (item.status == 'nota_credito') return 'Imprimir nota de crédito'
			return 'Imprimir'
		},
		/**
		 * Abre el PDF del movimiento: pagos y notas de crédito directo; ventas con token seguro.
		 * Para ventas abre la pestaña de inmediato (gesto del usuario) y redirige al recibir el token.
		 *
		 * @param {Object} item Movimiento de cuenta corriente
		 */
		async openPdf(item) {
			const base = this.empresaUrl()
			if (!base) return

			if (item.status == 'pago_from_client' || item.status == 'nota_credito') {
				window.open(`${base}/current-acount/pdf/${item.id}`)
				return
			}

			if (item.sale_id) {
				// Pestaña en blanco síncrona para que el navegador no bloquee el popup tras el await.
				const win = window.open('', '_blank')
				try {
					const token = await this.$store.dispatch('current_acount/getSalePdfToken', item.sale_id)
					if (!token) {
						if (win) win.close()
						this.$toast.error('No se pudo generar el PDF')
						return
					}
					const url = `${base}/sale/pdf/${item.sale_id}?origin=tienda&token=${encodeURIComponent(token)}`
					if (win) {
						win.location = url
					} else {
						window.open(url)
					}
				} catch (e) {
					if (win) win.close()
					this.$toast.error('No se pudo generar el PDF')
				}
			}
		},
	}
}
</script>
<style scoped lang="sass">
/*
 * Tabla de movimientos: indentación con espacios (sass indentado del proyecto).
 */
.cuenta-corriente-table-root__loading
  text-align: center
  padding: 2.5rem 1rem

.cuenta-corriente-table-root__empty
  text-align: center
  padding: 2.5rem 1rem

.cuenta-corriente-table-root__empty-icon
  font-size: 2rem
  color: #ccc
  display: block
  margin-bottom: 0.65rem

.cuenta-corriente-table-root__empty-text
  font-size: 0.95rem
  color: #888
  margin-bottom: 0

.cuenta-corriente-table-wrap
  overflow-x: auto
  -webkit-overflow-scrolling: touch

.cuenta-corriente-table
  width: 100%
  border-collapse: collapse
  font-size: 0.92rem
  text-align: left

.cuenta-corriente-table thead
  border-bottom: 2px solid rgba(0, 0, 0, 0.08)

.cuenta-corriente-table th
  font-weight: 600
  color: #555
  padding: 0.55rem 0.5rem 0.75rem
  font-size: 0.78rem
  text-transform: uppercase
  letter-spacing: 0.04em
  white-space: nowrap

.cuenta-corriente-table td
  padding: 0.7rem 0.5rem
  border-bottom: 1px solid rgba(0, 0, 0, 0.06)
  vertical-align: middle

.cuenta-corriente-table tbody tr:last-child td
  border-bottom: none

.cuenta-corriente-table tbody tr:hover
  background: rgba(0, 0, 0, 0.02)

.cuenta-corriente-table__th-num,
.cuenta-corriente-table__td-num
  text-align: right
  white-space: nowrap

.cuenta-corriente-table__td-date
  color: #555
  font-size: 0.88rem
  white-space: nowrap

.cuenta-corriente-table__td-debe
  color: #c0392b
  font-weight: 500

.cuenta-corriente-table__td-saldo strong
  color: #1a1a1a
  font-weight: 700

.cuenta-corriente-table__link
  display: inline-flex
  align-items: center
  gap: 0.4rem
  padding: 0.3rem 0.65rem
  border-radius: 8px
  border: 1px solid rgba(0, 0, 0, 0.1)
  background: rgba(0, 0, 0, 0.03)
  color: var(--primary-color)
  font-size: 0.88rem
  font-weight: 600
  line-height: 1.3
  cursor: pointer
  transition: background 0.15s ease, border-color 0.15s ease
  &:hover
    background: color-mix(in srgb, var(--secondary-color) 12%, #fff)
    border-color: color-mix(in srgb, var(--secondary-color) 35%, #ccc)
    color: var(--primary-color)

.cuenta-corriente-table__detail-text
  color: #333
  font-weight: 500

.cuenta-corriente-table__badge
  display: inline-block
  font-size: 0.72rem
  font-weight: 600
  padding: 0.2rem 0.55rem
  border-radius: 999px
  line-height: 1.35
  white-space: nowrap

.cuenta-corriente-table__badge--success
  background: color-mix(in srgb, #27ae60 18%, #fff)
  color: #1e7e45

.cuenta-corriente-table__badge--danger
  background: color-mix(in srgb, #e74c3c 16%, #fff)
  color: #c0392b

.cuenta-corriente-table__badge--info
  background: color-mix(in srgb, var(--secondary-color) 20%, #fff)
  color: color-mix(in srgb, var(--secondary-color) 75%, #000)

.cuenta-corriente-table__badge--muted
  background: rgba(0, 0, 0, 0.06)
  color: #666
</style>
