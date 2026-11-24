<template>
	<!--
		Contenedor del Card Payment Brick de Mercado Pago. Los campos de la tarjeta son iframes de Mercado Pago:
		ni el número ni el código de seguridad existen en nuestro DOM (regla PCI). Las cuotas las define nuestro
		selector, así que el Brick no muestra las suyas ni su botón de pagar.
	-->
	<div class="checkout-tarjeta">
		<p
		v-if="error"
		class="checkout-cuotas__hint"
		role="alert">
			No pudimos cargar el formulario de la tarjeta. Recargá la página o elegí otro medio de pago.
		</p>
		<p
		v-else-if="!listo"
		class="checkout-cuotas__hint"
		role="status">
			Cargando formulario seguro...
		</p>
		<div :id="id_del_contenedor"></div>
	</div>
</template>
<script>
import { registrar, desmontar } from '@/utils/brick_de_tarjeta'

/**
 * Monta el Card Payment Brick con la public key del comercio y registra su controlador en `brick_de_tarjeta`
 * (de ahí lo lee el botón de pagar). Lo desmonta al destruirse.
 */
export default {
	name: 'FormularioDeTarjeta',
	props: {
		// Public key de Mercado Pago del comercio (viene en la lista pública de métodos de pago).
		public_key: { type: String, required: true },
		// Monto con el que se inicializa el Brick (sólo informativo: el cobro lo decide el servidor).
		amount: { type: Number, required: true },
		// Email del comprador, que el Brick usa como pagador.
		email: { type: String, default: '' },
	},
	data() {
		return {
			// Id del contenedor donde Mercado Pago dibuja el formulario.
			id_del_contenedor: 'tarjeta-mercado-pago-brick',
			// El formulario terminó de cargar.
			listo: false,
			// No se pudo cargar (SDK bloqueado o error de Mercado Pago).
			error: false,
			// El componente ya se destruyó (el Brick puede llegar tarde y hay que desmontarlo).
			destruido: false,
		}
	},
	mounted() {
		this.montar_brick()
	},
	beforeDestroy() {
		this.destruido = true
		desmontar()
	},
	methods: {
		/**
		 * Crea el Brick. El SDK (`sdk.mercadopago.com/js/v2`) lo carga public/index.html.
		 *
		 * @returns {void}
		 */
		montar_brick() {
			let self = this
			if (typeof window === 'undefined' || !window.MercadoPago) {
				this.error = true
				return
			}
			let mp = new window.MercadoPago(this.public_key, { locale: 'es-AR' })
			mp.bricks().create('cardPayment', this.id_del_contenedor, {
				initialization: {
					amount: this.amount,
					payer: { email: this.email },
				},
				customization: {
					// Las cuotas las elige el comprador en nuestro selector: el Brick no ofrece las suyas.
					paymentMethods: { maxInstallments: 1, minInstallments: 1 },
					// El botón de pagar es el del checkout.
					visual: { hidePaymentButton: true },
				},
				callbacks: {
					onReady() {
						self.listo = true
					},
					onError() {
						self.error = true
					},
				},
			})
			.then(function(controlador) {
				if (self.destruido) {
					controlador.unmount()
					return
				}
				registrar(controlador)
			})
			.catch(function() {
				self.error = true
			})
		},
	},
}
</script>
