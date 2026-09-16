<template>
	<div
	v-if="commerce.online_configuration.online_price_type && article_to_show && (flag_activo(article_to_show.precio_pausado) || articlePriceEfectivo(article_to_show))">
		<template v-if="flag_activo(article_to_show.precio_pausado)">
			<p class="precio-ficha">
				<span class="precio-ficha__valor">
					{{ articlePriceEfectivo(article_to_show) }}
				</span>
			</p>
		</template>
		<template v-else>
			<price-ranges
			is_from_article_page
			:article="article_to_show"></price-ranges>

			<template
			v-if="!article_to_show.ranges">
				<p class="precio-ficha">
					<!--
						El precio ORIGINAL tachado, en su propio renglon ARRIBA del precio con
						los descuentos generales del articulo. Excluyente con precio_tachado (la
						oferta personalizada): descuentos_visibles() devuelve [] apenas hay una
						oferta personalizada activa, asi que los dos nunca se dibujan juntos.
					-->
					<span
					v-if="precio_original_con_descuentos"
					class="precio-ficha__tachado-arriba">
						{{ precio_original_con_descuentos }}
					</span>
					<span class="precio-ficha__valor">
						{{ precio_mostrado }}
					</span>
					<!--
						El precio original, tachado al lado del que se paga. Sale de un computed y
						no de una llamada al mixin porque el de la oferta por cantidad depende de
						la cantidad elegida; el computed es el unico lugar donde se decide, y ahi
						esta la regla de no tachar nunca un importe igual al de al lado.
					-->
					<span
					v-if="precio_tachado"
					class="precio-ficha__tachado">
						{{ precio_tachado }}
					</span>
					<!--
						Un badge por descuento general del articulo, a la DERECHA del precio
						grande. En la ficha va a la derecha; en la tarjeta del listado va a la
						izquierda del tachado. Son dos disposiciones distintas y las dos salen de
						las capturas de Mercado Libre que paso Lucas.
					-->
					<b-badge
					v-for="(descuento, index) in badges_de_descuento"
					:key="'descuento-'+index"
					variant="success"
					class="precio-ficha__badge">
						{{ texto_de_descuento(descuento) }}
					</b-badge>
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
		/**
		 * El precio original tachado ARRIBA, por los descuentos generales del articulo.
		 *
		 * 🔴 Es EXCLUYENTE con precio_tachado, que es el de la oferta personalizada: cuando el
		 * comprador tiene oferta, descuentos_visibles() devuelve [] y esto es null; cuando no
		 * la tiene, precio_tachado es null salvo que exista una oferta con precio aplicado.
		 * Nunca se dibujan los dos.
		 *
		 * 🔴 Aca no hay tramos que atender: article.discounts es un porcentaje simple por fila,
		 * sin tipo 'unidad'/'cantidad' ni rangos, asi que la ficha se comporta igual que un
		 * listado y el mixin resuelve solo.
		 *
		 * @returns {string|null}
		 */
		precio_original_con_descuentos() {
			return this.precio_sin_descuentos(this.article_to_show)
		},
		/**
		 * Los badges de descuento, atados al tachado de arriba: sin tachado no hay badges.
		 *
		 * @returns {Array}
		 */
		badges_de_descuento() {
			if (!this.precio_original_con_descuentos) {
				return []
			}
			return this.descuentos_visibles(this.article_to_show)
		},
	},
}
</script>
<style scoped lang="sass">
// 🔴 La clase de este bloque dejo de ser `.price` a proposito (16/9/2026). Habia una regla
// `.plantilla-comerciocity .article-data .price` en `_plantilla_comerciocity.sass` que clava el
// precio en 32px con especificidad (0,3,0): con el nombre viejo, los tamanos de la captura de
// Mercado Libre se aplicaban en todas las plantillas MENOS en la de ComercioCity, en silencio.
// Con un nombre nuevo esa regla ya no engancha y no hay pelea que ganar.
.precio-ficha
	margin: 0
	text-align: left
	// Los tamanos salen de las capturas: 36px para el precio grande y 16px para el tachado de
	// arriba. Van en px y no en em porque son medidas tomadas de una pantalla, no una escala.
	.precio-ficha__valor
		font-size: 36px
		font-weight: 400
		line-height: 1.15
		letter-spacing: -.02em
		color: rgba(0, 0, 0, .9)
		@media screen and (max-width: 576px)
			font-size: 30px

	// El precio ORIGINAL tachado, en el renglon de ARRIBA del precio con descuentos. Nunca en
	// rojo: es informacion, no una alarma.
	.precio-ficha__tachado-arriba
		display: block
		font-size: 16px
		font-weight: 400
		line-height: 1.2
		color: rgba(0, 0, 0, .55)
		text-decoration: line-through
		// El importe no se parte a la mitad; si no entra, cae entero al renglon de abajo.
		white-space: nowrap
		@media screen and (max-width: 576px)
			font-size: 14px

	// El tachado de la oferta personalizada, al lado del precio que se paga.
	.precio-ficha__tachado
		font-size: 16px
		font-weight: 400
		margin-left: .4rem
		color: rgba(0, 0, 0, .55)
		text-decoration: line-through
		white-space: nowrap
		@media screen and (max-width: 576px)
			font-size: 14px
			margin-left: .3rem

	// El badge verde de la captura, a la DERECHA del precio grande. El fondo se clava en
	// #00A650 (el unico color que Lucas pidio copiar literal de Mercado Libre) y pisa al
	// `variant="success"` de BootstrapVue, que compila el verde de Bootstrap.
	.precio-ficha__badge
		font-size: 12px
		font-weight: 600
		line-height: 1.3
		padding: 2px 5px
		border-radius: 3px
		margin-left: .5rem
		vertical-align: middle
		white-space: nowrap
		background-color: #00A650
		color: #FFF

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
