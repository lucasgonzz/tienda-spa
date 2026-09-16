<template>
	<!--
		El renglon de envio de la ficha. 🔴 Se oculta ENTERO si no hay nada que decir: no se
		escribe "Llega gratis hoy" ni ninguna promesa parecida si el comercio no la tiene
		configurada.
	-->
	<div
	v-if="renglones.length"
	class="envio-ficha">
		<p
		v-for="(renglon, index) in renglones"
		:key="'envio-renglon-'+index"
		class="envio-ficha__renglon"
		:class="renglon.destacado ? 'envio-ficha__renglon--destacado' : ''">
			<i
			:class="renglon.icono"
			aria-hidden="true"></i>
			{{ renglon.texto }}
		</p>
	</div>
</template>
<script>
export default {
	name: 'EnvioFicha',
	props: {
		article: Object,
	},
	computed: {
		/**
		 * El importe de envio de ESTE articulo, o null.
		 *
		 * 🔴 Contrato ADITIVO con la mision hermana `envio-cp-buyer-modal`, que es la que
		 * guarda el codigo postal del comprador y cotiza. Aca no se cotiza nada: solo se lee
		 * un campo OPCIONAL que esa mision deja en el articulo. Mientras el campo no exista
		 * —que es el estado de hoy— esto devuelve null, el renglon del importe no se dibuja y
		 * no se rompe nada.
		 *
		 * 🔴 Nunca se inventa un precio de envio. Sin cotizacion, silencio.
		 *
		 * @returns {number|null}
		 */
		precio_de_envio() {
			if (!this.article || typeof this.article.envio_precio == 'undefined' || this.article.envio_precio === null) {
				return null
			}
			let precio = Number(this.article.envio_precio)
			if (isNaN(precio) || precio < 0) {
				return null
			}
			return precio
		},
		/**
		 * Lo que se puede afirmar con certeza sobre el envio de este articulo, en orden.
		 *
		 * Son tres fuentes y ninguna se adivina:
		 *   - el importe cotizado, si la mision hermana lo dejo en el articulo;
		 *   - `has_delivery` del comercio: hace envios a domicilio;
		 *   - `retiro_por_local` del comercio: se puede pasar a buscar.
		 *
		 * Si las tres estan en blanco el array sale vacio y el componente no dibuja nada.
		 *
		 * @returns {Array}
		 */
		renglones() {
			let renglones = []
			if (this.precio_de_envio !== null) {
				if (this.precio_de_envio === 0) {
					renglones.push({
						texto: 'Envío gratis a tu domicilio',
						icono: 'bi bi-truck',
						destacado: true,
					})
				} else {
					renglones.push({
						texto: 'Envío a domicilio: ' + this.price(this.precio_de_envio),
						icono: 'bi bi-truck',
						destacado: false,
					})
				}
			} else if (this.flag_activo(this.commerce.online_configuration.has_delivery)) {
				/* Sin cotizacion no se dice cuanto sale ni cuando llega: solo que el comercio
				   hace envios, que es lo unico que se sabe con certeza. */
				renglones.push({
					texto: 'Hacemos envíos a domicilio',
					icono: 'bi bi-truck',
					destacado: false,
				})
			}
			if (this.flag_activo(this.commerce.online_configuration.retiro_por_local)) {
				renglones.push({
					texto: 'Retirá gratis por el local',
					icono: 'bi bi-shop',
					destacado: false,
				})
			}
			return renglones
		},
	},
}
</script>
<style scoped lang="sass">
.envio-ficha
	text-align: left

	.envio-ficha__renglon
		display: flex
		flex-direction: row
		align-items: baseline
		gap: .4rem
		margin: 0 0 .25rem 0
		font-size: 14px
		line-height: 1.35
		color: rgba(0, 0, 0, .9)

		&:last-child
			margin-bottom: 0

	// El verde es el mismo #00A650 del badge de descuento: el unico color que Lucas pidio
	// copiar literal de las capturas.
	.envio-ficha__renglon--destacado
		font-size: 16px
		font-weight: 600
		color: #00A650
</style>
