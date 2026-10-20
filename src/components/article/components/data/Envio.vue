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
		class="envio-ficha__renglon">
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
		 * Lo que se puede afirmar con certeza sobre el envio de este articulo, en orden.
		 *
		 * 🔴 Aca NO se cotiza ni se dibuja ningun importe. `article.envio_precio` iba a ser
		 * el campo con el numero, pero ESE NOMBRE YA SIGNIFICA OTRA COSA en el sistema: es
		 * el envio del CARRITO entero, en las tablas `carts` y `orders`. Colgarlo del
		 * articulo era una rama muerta que aparentaba estar integrada con la mision hermana
		 * `envio-cp-buyer-modal` sin estarlo -esa mision resuelve el importe adentro de
		 * `common/envio/Cotizador.vue`, que ya se dibuja en la ficha (montado desde
		 * `data/Index.vue`) con el codigo postal del comprador-. Si el proximo que pase por
		 * aca necesita un importe de envio por articulo, es el Cotizador el que lo tiene, no
		 * este renglon.
		 *
		 * 🔴 Con `commerce.envios_zipnova` activo tampoco se repite "Hacemos envíos a
		 * domicilio": el Cotizador ya lo dice con un numero real, y duplicarlo aca al lado
		 * es sumar ruido sin sumar informacion.
		 *
		 * Si no hay nada de esto (o el comercio todavia no cargo) el array sale vacio y el
		 * componente no dibuja nada.
		 *
		 * @returns {Array}
		 */
		renglones() {
			if (!this.commerce || !this.commerce.online_configuration) {
				return []
			}
			let renglones = []
			if (!this.commerce.envios_zipnova && this.flag_activo(this.commerce.online_configuration.has_delivery)) {
				renglones.push({
					texto: 'Hacemos envíos a domicilio',
					icono: 'bi bi-truck',
				})
			}
			if (this.flag_activo(this.commerce.online_configuration.retiro_por_local)) {
				renglones.push({
					texto: 'Retirá gratis por el local',
					icono: 'bi bi-shop',
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
</style>
