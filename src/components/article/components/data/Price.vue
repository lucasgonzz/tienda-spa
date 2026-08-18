<template>
	<div
	v-if="commerce.online_configuration.online_price_type && article_to_show && (flag_activo(article_to_show.precio_pausado) || articlePriceEfectivo(article_to_show))">
		<template v-if="flag_activo(article_to_show.precio_pausado)">
			<p class="price">
				{{ articlePriceEfectivo(article_to_show) }}
			</p>
		</template>
		<template v-else>
			<price-ranges
			is_from_article_page
			:article="article_to_show"></price-ranges>

			<template
			v-if="!article_to_show.ranges">
				<p class="price">
					{{ precio_mostrado }}
					<!--
						El precio original, tachado al lado del que se paga. Sale de un computed y
						no de una llamada al mixin porque el de la oferta por cantidad depende de
						la cantidad elegida; el computed es el unico lugar donde se decide, y ahi
						esta la regla de no tachar nunca un importe igual al de al lado.
					-->
					<span
					v-if="precio_tachado"
					class="price__tachado">
						{{ precio_tachado }}
					</span>
				</p>
				<!--
					Por que el precio cambia al mover la cantidad. Sin esta linea el comprador ve
					el numero grande moverse solo y no tiene con que explicarselo.
				-->
				<p
				v-if="texto_del_tramo"
				class="price-tramo">
					{{ texto_del_tramo }}
				</p>
			</template>
		</template>
	</div>
</template>
<script>
export default {
	name: 'Price',
	components: {
		PriceRanges: () => import('@/components/article/components/data/PriceRanges'),
	},
	computed: {
		article_to_show() {
			return this.$store.state.articles.article_to_show
		},
		/**
		 * La cantidad que el comprador tiene elegida AHORA en la ficha.
		 *
		 * Es la misma que precarga el mensaje de promocion al apretar "Usar la promocion" y la
		 * misma que el comprador cambia a mano en el input: por eso el precio se mueve solo
		 * cuando sube o baja unidades. Vacia (que es lo normal en un articulo que no esta en
		 * el carrito) devuelve null y no hay tramo que resolver.
		 *
		 * @returns {number|null}
		 */
		cantidad_elegida() {
			let cantidad = Number(this.$store.state.articles.amount)
			if (!cantidad || isNaN(cantidad) || cantidad < 1) {
				return null
			}
			return cantidad
		},
		/**
		 * El precio unitario del tramo que corresponde a la cantidad elegida, o null.
		 *
		 * 🔴 Devuelve null cuando la cantidad NO llega al primer tramo, y de eso depende toda
		 * la logica de abajo: sin tramo no hay descuento, y sin descuento no hay nada que
		 * tachar. El mixin ya resuelve tambien los casos en los que la oferta no altera ningun
		 * precio (extension de rangos por cantidad vendida, precio pausado, precios ocultos).
		 *
		 * @returns {string|null}
		 */
		precio_del_tramo() {
			if (!this.article_to_show || this.cantidad_elegida === null) {
				return null
			}
			return this.precio_con_oferta_por_cantidad(this.article_to_show, this.cantidad_elegida)
		},
		/**
		 * El precio grande de la ficha.
		 *
		 * 🔴 Con una oferta por CANTIDAD el servidor no toca `final_price` (ahi no conoce la
		 * cantidad), asi que articlePriceEfectivo devuelve el precio de lista: el comprador
		 * llegaba desde el mensaje con 12 unidades precargadas y veia el precio sin descuento,
		 * que es justo lo contrario de lo que le acababan de prometer. El precio del tramo lo
		 * resuelve el SPA y gana cuando existe. Con 'unidad' no hace falta nada: el servidor
		 * ya dejo `final_price` descontado.
		 *
		 * @returns {string|null}
		 */
		precio_mostrado() {
			if (this.precio_del_tramo) {
				return this.precio_del_tramo
			}
			return this.articlePriceEfectivo(this.article_to_show)
		},
		/**
		 * El precio original, tachado al lado del que se paga.
		 *
		 * Son dos casos distintos y por eso hay dos metodos en el mixin:
		 *   - Sin tramo aplicado, el precio grande sale de articlePriceEfectivo y el tachado es
		 *     el de los listados, precio_sin_oferta(), que ya corta las ofertas por cantidad
		 *     porque alla el precio grande y la base son la misma cifra.
		 *   - Con tramo aplicado, el precio grande es el del tramo y la base es
		 *     precio_base_de_oferta().
		 *
		 * 🔴 La regla que no se negocia: nunca mostrar un tachado igual al precio de al lado.
		 * Si la cantidad elegida no llega al primer tramo no hay descuento, y entonces tampoco
		 * hay nada que tachar — eso lo resuelve el null de precio_del_tramo, y la comparacion
		 * de aca abajo cubre el resto.
		 *
		 * @returns {string|null}
		 */
		precio_tachado() {
			if (!this.precio_del_tramo) {
				return this.precio_sin_oferta(this.article_to_show)
			}
			let base = this.precio_base_de_oferta(this.article_to_show)
			if (!base || base === this.precio_del_tramo) {
				return null
			}
			return base
		},
		/**
		 * "Llevá 12 o más y pagás 18% menos": a partir de cuantas unidades mejora el precio.
		 *
		 * La frase la arma el mixin, que es la misma que muestra la tarjeta del mensaje de
		 * promocion. Se muestra siempre que la oferta por cantidad exista, tenga o no la
		 * cantidad puesta todavia: es lo que explica por que el precio se mueve al cambiarla.
		 *
		 * @returns {string|null}
		 */
		texto_del_tramo() {
			return this.texto_del_mejor_tramo(this.article_to_show)
		},
	},
}
</script>
<style scoped lang="sass">
.price
	font-size: 2em
	font-weight: 500
	text-align: left
	// El precio original tachado va al lado del descontado, nunca en rojo: es informacion,
	// no una alarma. Un escalon mas chico y bajado de opacidad, para que el precio con
	// descuento siga siendo lo unico que grita.
	.price__tachado
		font-size: .6em
		font-weight: 400
		margin-left: .4em
		opacity: .45
		text-decoration: line-through
		// El importe no se parte a la mitad; si no entra, cae entero al renglon de abajo.
		white-space: nowrap
		@media screen and (max-width: 576px)
			font-size: .55em
			margin-left: .3em

// La linea que explica a partir de cuantas unidades mejora el precio. Va a media voz: una
// sola linea, gris, chica, pegada al precio. No es un cartel de oferta.
.price-tramo
	margin: .15rem 0 0 0
	font-size: .9rem
	font-weight: 400
	line-height: 1.3
	letter-spacing: -0.01em
	text-align: left
	color: #6e6e73
	@media screen and (max-width: 576px)
		font-size: .85rem
</style>
