<template>
	<div class="thanks-page view-p-t">
		<b-row class="justify-content-center">
			<b-col
			cols="12"
			lg="10"
			xl="9">
				<div class="thanks-page__success">
					<div class="thanks-page__success-icon-wrap">
						<i
						class="bi bi-check-circle-fill thanks-page__success-icon"
						aria-hidden="true"></i>
					</div>
					<p class="thanks-page__eyebrow">
						Listo
					</p>
					<h1 class="thanks-page__title">
						¡Gracias por tu compra!
					</h1>
					<p class="thanks-page__lead">
						Recibimos tu pedido correctamente. Nos pondremos en contacto con vos por correo o WhatsApp si hace falta.
					</p>
				</div>

				<div
				v-if="order && has_order_lines"
				class="thanks-page__card thanks-page__card--summary">
					<h2 class="thanks-page__card-title">
						Resumen del pedido
					</h2>
					<p class="thanks-page__order-meta">
						<span class="thanks-page__order-label">Pedido</span>
						<strong class="thanks-page__order-num">N° {{ order.num }}</strong>
					</p>

					<div class="thanks-page__table-wrap">
						<table class="thanks-page__table">
							<thead>
								<tr>
									<th scope="col">
										Producto
									</th>
									<th
									scope="col"
									class="thanks-page__th-num">
										Cant.
									</th>
									<th
									scope="col"
									class="thanks-page__th-num">
										Subtotal
									</th>
								</tr>
							</thead>
							<tbody>
								<tr
								v-for="(article, idx) in display_articles"
								:key="'art-' + article.id + '-' + idx">
									<td class="thanks-page__td-name">
										{{ article.name }}
									</td>
									<td class="thanks-page__td-num">
										{{ article.pivot.amount }}
									</td>
									<td class="thanks-page__td-num">
										{{ price(line_total(article)) }}
									</td>
								</tr>
								<tr
								v-for="(promo, idx) in display_promos"
								:key="'promo-' + promo.id + '-' + idx">
									<td class="thanks-page__td-name">
										<span class="thanks-page__badge-promo">Promo</span>
										{{ promo.name }}
									</td>
									<td class="thanks-page__td-num">
										{{ promo.pivot.amount }}
									</td>
									<td class="thanks-page__td-num">
										{{ price(line_total(promo)) }}
									</td>
								</tr>
							</tbody>
							<tfoot>
								<tr>
									<td
									colspan="2"
									class="thanks-page__td-total-label">
										Total
									</td>
									<td class="thanks-page__td-total-value">
										{{ price(order.total) }}
									</td>
								</tr>
							</tfoot>
						</table>
					</div>

					<ul
					v-if="order_extra_lines.length"
					class="thanks-page__extras">
						<li
						v-for="(line, idx) in order_extra_lines"
						:key="'extra-' + idx">
							{{ line }}
						</li>
					</ul>
				</div>

				<div
				v-else-if="order && !has_order_lines"
				class="thanks-page__card thanks-page__card--notice">
					<p class="thanks-page__notice-text">
						Tu pedido <strong>N° {{ order.num }}</strong> fue registrado. Si no ves el detalle de ítems, podés revisarlo en “Mis pedidos” o con el comprobante PDF.
					</p>
				</div>

				<div class="thanks-page__actions">
					<b-button
					v-if="order_pdf_href"
					:href="order_pdf_href"
					target="_blank"
					rel="noopener noreferrer"
					block
					size="lg"
					variant="outline-primary"
					class="thanks-page__btn-pdf">
						<i
						class="bi bi-file-earmark-pdf thanks-page__btn-icon"
						aria-hidden="true"></i>
						Descargar PDF del pedido
					</b-button>

					<b-button
					v-if="whatsapp_ready"
					block
					size="lg"
					class="thanks-page__btn-whatsapp"
					@click="open_whatsapp">
						<i class="bi bi-whatsapp thanks-page__btn-icon"></i>
						<span v-if="!countdown_done">
							Enviando WhatsApp en <strong>{{ seconds_left }}</strong> segundos…
						</span>
						<span v-else>
							Enviar el pedido por WhatsApp
						</span>
					</b-button>

					<p
					v-if="whatsapp_ready && countdown_done"
					class="thanks-page__whatsapp-hint">
						Si no se abrió WhatsApp, tocá el botón.
					</p>

					<div
					v-if="countdown_done"
					class="thanks-page__actions-home">
						<b-button
						:to="{ name: 'Home' }"
						size="lg"
						variant="primary"
						class="thanks-page__btn-home">
							<i
							class="bi bi-house-door thanks-page__btn-icon"
							aria-hidden="true"></i>
							Volver al inicio
						</b-button>
					</div>
				</div>
			</b-col>
		</b-row>
	</div>
</template>

<script>
/**
 * Pantalla post-compra: agradecimiento, resumen de ítems y enlace opcional al PDF del pedido.
 *
 * PDF: definir en `.env` la variable `VUE_APP_ORDER_PDF_URL` con una URL plantilla.
 * Placeholders soportados: `{id}` (id del pedido), `{num}` (número visible), `{commerce_id}`.
 * Ejemplo: `https://api.ejemplo.com/api/orders/{id}/pdf?commerce_id={commerce_id}`
 */
export default {
	metaInfo: {
		title: 'Gracias por tu compra',
	},
	computed: {
		/**
		 * Pedido actual persistido en el store tras confirmar la compra.
		 * @returns {object|null}
		 */
		order() {
			return this.$store.state.orders.order
		},
		/**
		 * Artículos del pedido para la tabla.
		 * @returns {Array}
		 */
		display_articles() {
			if (!this.order || !this.order.articles) {
				return []
			}
			return this.order.articles
		},
		/**
		 * Promociones vinoteca incluidas en el pedido.
		 * @returns {Array}
		 */
		display_promos() {
			if (!this.order || !this.order.promociones_vinoteca) {
				return []
			}
			return this.order.promociones_vinoteca
		},
		/**
		 * Indica si hay al menos una línea para mostrar en el resumen.
		 * @returns {boolean}
		 */
		has_order_lines() {
			return this.display_articles.length > 0 || this.display_promos.length > 0
		},
		/**
		 * URL final para abrir/descargar el PDF. Vacía si no hay env o pedido.
		 * @returns {string}
		 */
		order_pdf_href() {
			let tpl = process.env.VUE_APP_ORDER_PDF_URL
			if (!tpl || typeof tpl !== 'string' || tpl.trim() === '' || !this.order) {
				return ''
			}
			let id_str =
				this.order.id !== undefined && this.order.id !== null ? String(this.order.id) : ''
			let num_str =
				this.order.num !== undefined && this.order.num !== null ? String(this.order.num) : ''
			let commerce_id =
				process.env.VUE_APP_COMMERCE_ID !== undefined &&
				process.env.VUE_APP_COMMERCE_ID !== null
					? String(process.env.VUE_APP_COMMERCE_ID)
					: ''
			let out = tpl
			out = out.split('{id}').join(encodeURIComponent(id_str))
			out = out.split('{num}').join(encodeURIComponent(num_str))
			out = out.split('{commerce_id}').join(encodeURIComponent(commerce_id))
			return out
		},
		/**
		 * Líneas extra de contexto (entrega, observaciones).
		 * @returns {string[]}
		 */
		order_extra_lines() {
			let lines = []
			if (!this.order) {
				return lines
			}
			if (this.order.deliver && this.order.address) {
				lines.push('Entrega: ' + this.order.address)
			} else if (!this.order.deliver) {
				lines.push('Retiro en local')
			}
			if (this.order.fecha_entrega) {
				lines.push('Fecha de entrega: ' + this.date(this.order.fecha_entrega))
			}
			if (this.order.description) {
				lines.push('Observaciones: ' + this.order.description)
			}
			return lines
		},
		/**
		 * Si la tienda dispara WhatsApp al finalizar el pedido.
		 * @returns {boolean}
		 */
		enviar_whatsapp() {
			return (
				this.commerce &&
				this.commerce.online_configuration &&
				this.commerce.online_configuration.enviar_whatsapp_al_terminar_pedido
			)
		},
		/**
		 * Si se puede ofrecer el envio por WhatsApp: flag del comercio + telefono normalizable + pedido cargado.
		 * @returns {boolean}
		 */
		whatsapp_ready() {
			return !!(this.enviar_whatsapp && this.commerce_whatsapp_phone && this.order)
		},
	},
	data() {
		return {
			/** Segundos restantes antes de intentar abrir WhatsApp automaticamente */
			seconds_left: 5,
			/** Referencia al intervalo del countdown */
			interval_id: null,
			/** URL wa.me generada con el detalle del pedido */
			whatsapp_link: '',
			/** El countdown ya termino (o nunca arranco) */
			countdown_done: false,
			/** Se esta recuperando el pedido del backend */
			loading_order: false,
		}
	},
	created() {
		this.setTitle('Gracias por tu compra')
		this.$scrollToTop()

		if (this.order) {
			this.start_whatsapp_flow()
			return
		}

		// El pedido no esta en el store (el comprador recargo la pagina, por ejemplo).
		// Se intenta recuperar una sola vez antes de decidir que mostrar.
		this.loading_order = true

		this.$store.dispatch('orders/getCurrentOrder')
		.then(() => {
			this.loading_order = false
			this.start_whatsapp_flow()
		})
		.catch(() => {
			this.loading_order = false
			this.start_whatsapp_flow()
		})
	},
	beforeDestroy() {
		if (this.interval_id) {
			clearInterval(this.interval_id)
		}
	},
	methods: {
		/**
		 * Importe de una línea (cantidad × precio unitario del pivot).
		 * @param {object} item artículo o promo con pivot
		 * @returns {number}
		 */
		line_total(item) {
			if (!item || !item.pivot) {
				return 0
			}
			let amount = Number(item.pivot.amount)
			let unit = Number(item.pivot.price)
			if (isNaN(amount) || isNaN(unit)) {
				return 0
			}
			return amount * unit
		},
		/**
		 * Arranca el countdown de apertura automatica, pero solo si hay algo real que abrir.
		 * Si falta el flag, el telefono o el pedido, deja la pantalla en su estado final
		 * (sin countdown y sin boton de WhatsApp).
		 */
		start_whatsapp_flow() {
			if (!this.whatsapp_ready) {
				this.countdown_done = true
				return
			}

			this.set_whatsapp_link()

			this.interval_id = setInterval(() => {
				this.seconds_left -= 1

				if (this.seconds_left <= 0) {
					clearInterval(this.interval_id)
					this.interval_id = null
					this.countdown_done = true
					this.try_open_link()
				}
			}, 1000)
		},
		/**
		 * Arma el mensaje y el enlace de WhatsApp según el pedido actual.
		 */
		set_whatsapp_link() {
			if (!this.order || !this.commerce_whatsapp_phone) {
				this.whatsapp_link = ''
				return
			}

			let buyer_name =
				this.order.buyer && this.order.buyer.name ? this.order.buyer.name : 'Cliente'

			let message = '*Pedido N° ' + this.order.num + '*\n\n'

			message += '*Cliente: ' + buyer_name + '*\n\n'

			if (this.order.buyer) {
				if (this.order.buyer.phone) {
					message += '*Telefono: ' + this.order.buyer.phone + '*\n\n'
				} else if (
					this.order.buyer.comercio_city_client &&
					this.order.buyer.comercio_city_client.phone
				) {
					message +=
						'*Telefono: ' + this.order.buyer.comercio_city_client.phone + '*\n\n'
				}
			}

			if (this.order.deliver) {
				message += '*Direccion de entrega:* ' + this.order.address + ' \n \n'
			} else {
				message += '*Retiro por el local* \n \n'
			}

			message += '*Productos:*\n'

			let index = 1
			let articles_list = this.order.articles || []
			articles_list.forEach((article) => {
				message +=
					'*' +
					index +
					') ' +
					article.name +
					'* \n     Cantidad: ' +
					article.pivot.amount +
					' \n     Precio: ' +
					this.price(article.pivot.price) +
					' \n     Total: ' +
					this.price(article.pivot.amount * article.pivot.price) +
					'\n\n'
				index++
			})

			let promos_list = this.order.promociones_vinoteca || []
			promos_list.forEach((promo) => {
				message +=
					'*' +
					index +
					') ' +
					promo.name +
					'* \n     Cantidad: ' +
					promo.pivot.amount +
					' \n     Precio: ' +
					this.price(promo.pivot.price) +
					' \n     Total: ' +
					this.price(promo.pivot.amount * promo.pivot.price) +
					'\n'
				index++
			})

			message += '\n\n *Total:* ' + this.price(this.order.total)

			if (this.order.fecha_entrega) {
				message += '\n \n *Fecha de entrega:* ' + this.date(this.order.fecha_entrega)
			}

			if (this.order.description) {
				message += '\n \n *Observaciones:* ' + this.order.description
			}

			// iOS trunca o rompe links de wa.me muy largos. Si el pedido es grande, se manda el
			// encabezado y el total, y se remite al numero de pedido para el detalle completo.
			const MAX_MESSAGE_LENGTH = 1500

			if (message.length > MAX_MESSAGE_LENGTH) {
				let total_items = articles_list.length + promos_list.length

				message = '*Pedido N° ' + this.order.num + '*\n\n'
				message += '*Cliente: ' + buyer_name + '*\n\n'
				message += 'Pedido de ' + total_items + ' productos.\n\n'
				message += '*Total:* ' + this.price(this.order.total) + '\n\n'
				message += 'El detalle completo esta en el pedido N° ' + this.order.num + '.'
			}

			const encoded_message = encodeURIComponent(message)

			let link = 'https://wa.me/' + this.commerce_whatsapp_phone + '?text=' + encoded_message
			this.whatsapp_link = link
		},
		/**
		 * Intenta abrir WhatsApp. Si el link no esta listo, no hace nada: jamas abrir una
		 * pestaña vacia (window.open('') abre about:blank y devuelve un objeto truthy).
		 */
		try_open_link() {
			if (!this.whatsapp_link) {
				return
			}
			window.open(this.whatsapp_link, '_blank')
		},
		/**
		 * Handler del boton: abre WhatsApp por gesto del usuario, asi que el navegador nunca lo
		 * bloquea. Corta el countdown si todavia estaba corriendo.
		 */
		open_whatsapp() {
			if (this.interval_id) {
				clearInterval(this.interval_id)
				this.interval_id = null
			}

			this.countdown_done = true

			if (!this.whatsapp_link) {
				this.set_whatsapp_link()
			}

			this.try_open_link()
		},
	},
}
</script>

<style lang="scss" scoped>
.thanks-page {
  font-family: var(--font-family-sans, sans-serif);
  max-width: 960px;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 2.5rem;
}

.thanks-page__success {
  text-align: center;
  margin-bottom: 1.75rem;
}

.thanks-page__success-icon-wrap {
  margin-bottom: 0.75rem;
}

.thanks-page__success-icon {
  font-size: 3rem;
  color: #198754;
}

.thanks-page__eyebrow {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--secondary-color);
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.thanks-page__title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.65rem;
  line-height: 1.25;
}

.thanks-page__lead {
  font-size: 1.05rem;
  line-height: 1.55;
  color: #555;
  margin-bottom: 0;
  max-width: 32rem;
  margin-left: auto;
  margin-right: auto;
}

.thanks-page__card {
  background: #fff;
  border-radius: 14px;
  padding: 1.35rem 1.2rem;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.07);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-top: 3px solid var(--secondary-color);
  margin-bottom: 1.25rem;

  @media (min-width: 768px) {
    padding: 1.6rem 1.5rem;
  }
}

.thanks-page__card-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #222;
  margin-bottom: 0.75rem;
  text-align: left;
}

.thanks-page__order-meta {
  margin-bottom: 1rem;
  text-align: left;
}

.thanks-page__order-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #888;
  margin-right: 0.35rem;
}

.thanks-page__order-num {
  font-size: 1.1rem;
  color: var(--primary-color);
}

.thanks-page__table-wrap {
  overflow-x: auto;
  margin-bottom: 0.5rem;
}

.thanks-page__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
  text-align: left;
}

.thanks-page__table thead {
  border-bottom: 2px solid rgba(0, 0, 0, 0.08);
}

.thanks-page__table th {
  font-weight: 600;
  color: #444;
  padding: 0.5rem 0.35rem 0.65rem 0;
}

.thanks-page__table td {
  padding: 0.55rem 0.35rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  vertical-align: top;
}

.thanks-page__th-num,
.thanks-page__td-num {
  text-align: right;
  white-space: nowrap;
}

.thanks-page__td-name {
  color: #333;
  font-weight: 500;
}

.thanks-page__badge-promo {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.12rem 0.35rem;
  border-radius: 4px;
  background: color-mix(in srgb, var(--secondary-color) 22%, #fff);
  color: color-mix(in srgb, var(--secondary-color) 70%, #000);
  margin-right: 0.35rem;
}

.thanks-page__td-total-label {
  text-align: right;
  font-weight: 700;
  font-size: 1rem;
  padding-top: 0.85rem !important;
  border-bottom: none !important;
}

.thanks-page__td-total-value {
  text-align: right;
  font-weight: 700;
  font-size: 1.15rem;
  color: #1a1a1a;
  padding-top: 0.85rem !important;
  border-bottom: none !important;
}

.thanks-page__extras {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0.75rem 0 0;
  border-top: 1px dashed rgba(0, 0, 0, 0.12);
  text-align: left;
}

.thanks-page__extras li {
  font-size: 0.88rem;
  color: #555;
  margin-bottom: 0.35rem;
  line-height: 1.45;
}

.thanks-page__card--notice {
  border-top-color: color-mix(in srgb, var(--primary-color) 60%, #ccc);
}

.thanks-page__notice-text {
  text-align: left;
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #444;
}

.thanks-page__actions {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

/* Contenedor del CTA principal: centrado respecto al resumen del pedido */
.thanks-page__actions-home {
  display: flex;
  justify-content: center;
  margin-top: 0.35rem;
}

.thanks-page__btn-icon {
  margin-right: 0.35rem;
}

.thanks-page__btn-pdf {
  font-weight: 600;
  border-radius: 10px;
  border-width: 2px;
}

.thanks-page__btn-whatsapp {
  background: #25d366 !important;
  border: none !important;
  color: #fff !important;
  font-weight: 600;
  border-radius: 10px;

  &:hover {
    background: #1ebe5d !important;
    color: #fff !important;
  }
}

.thanks-page__whatsapp-hint {
  text-align: center;
  font-size: 0.85rem;
  color: #777;
  margin: -0.15rem 0 0.35rem;
}

.thanks-page__btn-home {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: auto;
  min-width: 11.5rem;
  padding: 0.65rem 1.85rem;
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 0.01em;
  white-space: nowrap;
  border-radius: 999px;
  border: none;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover,
  &:focus {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  }
}
</style>
