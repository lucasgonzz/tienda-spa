<template>
	<div
	class="promo-tarjeta"
	:class="{ 'promo-tarjeta--con-imagen': imagen }">

		<!-- Capa 1: la imagen del articulo. Entra junto con el eyebrow. -->
		<!-- Sin imagen el bloque no se renderiza: si quedara vacio, en escritorio dejaria -->
		<!-- una columna de 380px en blanco (medido en la tienda corriendo). -->
		<div
		v-if="imagen"
		class="promo-tarjeta__media promo__capa-1">
			<img
			class="promo-tarjeta__imagen"
			:src="imagen"
			:alt="article.name">
		</div>

		<div
		class="promo-tarjeta__cuerpo">

			<div
			class="promo-tarjeta__eyebrow promo__capa-1">
				Para vos
			</div>

			<!-- Capa 2: el nombre del articulo y la linea del descuento. -->
			<div
			class="promo__capa-2">
				<h2
				class="promo-tarjeta__titulo">
					{{ article.name }}
				</h2>
				<p
				v-if="texto_descuento"
				class="promo-tarjeta__descuento">
					{{ texto_descuento }}
				</p>
			</div>

			<!-- Capa 3: el precio, la vigencia y el unico boton. -->
			<div
			class="promo__capa-3">
				<div
				v-if="precio_destacado"
				class="promo-tarjeta__precios">
					<span
					class="promo-tarjeta__precio">
						{{ precio_destacado }}
					</span>
					<span
					v-if="precio_tachado"
					class="promo-tarjeta__precio-tachado">
						{{ precio_tachado }}
					</span>
				</div>

				<p
				v-if="vigencia"
				class="promo-tarjeta__vigencia">
					Válida hasta el {{ vigencia }}
				</p>

				<button
				type="button"
				class="promo-tarjeta__boton"
				@click="usar">
					Usar la promoción
				</button>
			</div>

		</div>
	</div>
</template>
<script>
/**
 * Una oferta personalizada por pantalla.
 *
 * No pide datos ni toca el store: recibe el articulo ya resuelto por la API (con su
 * `oferta_personalizada` colgada) y se apoya en los mixins globales que inyecta main.js
 * con Vue.mixin — `generals` (articleImage, articlePriceEfectivo, oferta_personalizada,
 * precio_base_de_oferta, precio_con_oferta_por_cantidad, texto_del_mejor_tramo,
 * porcentaje_legible) y `dates` (date). No importa nada.
 */
export default {
	props: {
		article: {
			type: Object,
			required: true,
		},
	},
	computed: {
		/**
		 * La oferta vigente del articulo, o null.
		 *
		 * @returns {object|null}
		 */
		oferta() {
			return this.oferta_personalizada(this.article)
		},
		/**
		 * @returns {boolean}
		 */
		es_por_cantidad() {
			return !!this.oferta && this.oferta.tipo_descuento == 'cantidad'
		},
		/**
		 * El tramo mas conveniente de una oferta por cantidad.
		 *
		 * Es el ULTIMO del array: el contrato con empresa-api garantiza tramos contiguos,
		 * ordenados por `min` y con porcentaje creciente, y el ultimo lleva `max` en null
		 * (sin techo).
		 *
		 * @returns {object|null}
		 */
		mejor_tramo() {
			if (!this.oferta || !this.oferta.rangos || !this.oferta.rangos.length) {
				return null
			}
			return this.oferta.rangos[this.oferta.rangos.length - 1]
		},
		/**
		 * Cantidad a partir de la cual se consigue el mejor tramo.
		 *
		 * @returns {number|null}
		 */
		cantidad_del_mejor_tramo() {
			if (!this.mejor_tramo || !this.mejor_tramo.min) {
				return null
			}
			return Number(this.mejor_tramo.min)
		},
		/**
		 * La linea del descuento, en una sola frase.
		 *
		 * @returns {string|null}
		 */
		texto_descuento() {
			if (!this.oferta) {
				return null
			}
			/*
			 * La frase de la oferta por cantidad la arma el mixin y no este componente: es
			 * exactamente la misma que muestra la ficha del producto (Price.vue), y con dos
			 * copias el dia que cambie la redaccion iba a cambiar en una sola.
			 *
			 * Devuelve null cuando la oferta no altera ningun precio (precio_aplicado en
			 * false: extension de rangos por cantidad vendida prendida, o precio pausado). Es
			 * lo correcto: ahi la tienda no va a cobrar el tramo ni en la ficha ni en el
			 * carrito, y anunciarlo seria prometer un precio que no existe.
			 */
			if (this.es_por_cantidad) {
				return this.texto_del_mejor_tramo(this.article)
			}
			let porcentaje_unidad = this.porcentaje_legible(this.oferta.porcentaje)
			if (!porcentaje_unidad) {
				return null
			}
			return porcentaje_unidad + '% de descuento'
		},
		/**
		 * El precio grande.
		 *
		 * En 'unidad' el servidor ya dejo `final_price` descontado, asi que articlePriceEfectivo
		 * alcanza. En 'cantidad' el servidor NO toca el precio (no conoce la cantidad ahi), asi
		 * que el tramo lo resuelve el SPA con el mixin.
		 *
		 * Con `precio_pausado` no se muestra importe: el servidor no toco ningun precio
		 * (precio_aplicado = false) y articlePriceEfectivo devolveria el TEXTO de configuracion,
		 * que en el cuerpo de precio de esta tarjeta quedaria como una frase gigante. La oferta
		 * igual se muestra — el comerciante la creo a proposito — y el boton lleva a la ficha,
		 * donde el flujo de precio pausado ya esta resuelto.
		 *
		 * @returns {string|null}
		 */
		precio_destacado() {
			if (this.flag_activo(this.article.precio_pausado)) {
				return null
			}
			if (this.es_por_cantidad && this.cantidad_del_mejor_tramo) {
				let con_tramo = this.precio_con_oferta_por_cantidad(this.article, this.cantidad_del_mejor_tramo)
				if (con_tramo) {
					return con_tramo
				}
			}
			return this.articlePriceEfectivo(this.article)
		},
		/**
		 * El precio original, para tacharlo al lado del grande.
		 *
		 * 🔴 Va con precio_base_de_oferta() y NO con precio_sin_oferta(): este ultimo es el
		 * tachado de los LISTADOS y corta las ofertas 'cantidad' a proposito, porque alla el
		 * precio grande y la base son la misma cifra. Aca no: con 'cantidad' el precio grande
		 * es el del mejor tramo, mas barato que la base, y mostrar de cuanto viene es
		 * justamente lo que le da sentido a la promocion.
		 *
		 * La comparacion contra precio_destacado se queda igual y es la regla que vale para
		 * cualquiera que use precio_base_de_oferta(): nunca mostrar un tachado igual al precio
		 * de al lado, que seria anunciar un ahorro que no existe.
		 *
		 * @returns {string|null}
		 */
		precio_tachado() {
			let base = this.precio_base_de_oferta(this.article)
			if (!base) {
				return null
			}
			if (base === this.precio_destacado) {
				return null
			}
			return base
		},
		/**
		 * @returns {string|null}
		 */
		imagen() {
			if (!this.article || !this.article.images) {
				return null
			}
			return this.articleImage(this.article)
		},
		/**
		 * Fecha de fin de la oferta, ya formateada. La vigencia la manda la API; el SPA no
		 * compara fechas: si la oferta no vino, no existe.
		 *
		 * @returns {string|null}
		 */
		vigencia() {
			if (!this.oferta || !this.oferta.hasta) {
				return null
			}
			return this.date(this.oferta.hasta)
		},
	},
	methods: {
		/**
		 * @returns {void}
		 */
		usar() {
			this.$emit('usar', this.article)
		},
	},
}
</script>
<style lang="sass">
.promo-tarjeta
	display: flex
	flex-direction: column
	gap: 1.25rem
	text-align: left

	.promo-tarjeta__media
		display: flex
		align-items: center
		justify-content: center

	.promo-tarjeta__imagen
		max-width: 100%
		max-height: 30vh
		object-fit: contain
		border-radius: 14px

	.promo-tarjeta__cuerpo
		display: flex
		flex-direction: column
		gap: 1rem

	.promo-tarjeta__eyebrow
		font-size: 0.72rem
		letter-spacing: .12em
		text-transform: uppercase
		font-weight: 600
		color: var(--secondary-color)

	.promo-tarjeta__titulo
		margin: 0
		font-size: 1.75rem
		font-weight: 600
		letter-spacing: -0.022em
		line-height: 1.08
		color: #1d1d1f

	.promo-tarjeta__descuento
		margin: .5rem 0 0 0
		font-size: 1.05rem
		font-weight: 500
		line-height: 1.35
		color: #1d1d1f

	.promo-tarjeta__precios
		display: flex
		flex-direction: row
		align-items: baseline
		flex-wrap: wrap
		gap: .6rem

	.promo-tarjeta__precio
		font-size: 2rem
		font-weight: 600
		letter-spacing: -0.022em
		line-height: 1.05
		color: #1d1d1f

	// Nunca en rojo: el tachado es una referencia, no una alarma.
	.promo-tarjeta__precio-tachado
		font-size: 1.25rem
		font-weight: 500
		text-decoration: line-through
		opacity: .45
		color: #1d1d1f

	.promo-tarjeta__vigencia
		margin: .35rem 0 0 0
		font-size: .85rem
		color: #6e6e73

	// En telefono el bloque del precio y el boton quedan al pie de la hoja, y el respiro de
	// abajo respeta la barra de gestos del sistema (env(safe-area-inset-bottom)).
	.promo__capa-3
		padding-bottom: max(1rem, env(safe-area-inset-bottom))

	// Un solo boton primario en toda la pantalla.
	.promo-tarjeta__boton
		width: 100%
		margin-top: 1.25rem
		padding: .85rem 2rem
		border: none
		border-radius: 999px
		background: var(--secondary-color)
		color: #fff
		font-family: inherit
		font-size: 1rem
		font-weight: 500
		line-height: 1.2
		white-space: nowrap
		cursor: pointer
		-webkit-appearance: none
		appearance: none
		transition: opacity 220ms var(--curva-promo), transform 220ms var(--curva-promo)

		&:hover
			opacity: .88

		&:active
			transform: scale(.98)

		&:focus
			outline: none

		&:focus-visible
			outline: 2px solid var(--secondary-color)
			outline-offset: 3px

// Tablet (768-1024) y el hueco hasta escritorio: una sola columna, imagen arriba.
@media screen and (min-width: 768px)
	.promo-tarjeta
		gap: 1.5rem

		.promo-tarjeta__imagen
			max-height: 34vh

		// Fuera del telefono el boton vuelve a medir lo que dice y no hay hoja que anclar.
		.promo__capa-3
			padding-bottom: 0

		.promo-tarjeta__boton
			width: auto

		.promo-tarjeta__titulo
			font-size: clamp(1.75rem, 4.2vw, 3rem)

		.promo-tarjeta__precio
			font-size: clamp(2rem, 5vw, 3.25rem)

		.promo-tarjeta__precio-tachado
			font-size: clamp(1.25rem, 3vw, 1.75rem)

// Escritorio: dos columnas, imagen a la izquierda.
//
// 🔴 Las dos columnas SOLO cuando hay imagen (.promo-tarjeta--con-imagen). Medido en la tienda
// corriendo: un articulo sin imagen dejaba una columna de 380px vacia y medio panel en blanco,
// justo lo contrario del restraint que se busca. Y en este sistema pasa seguido: el comercio
// puede no haberle cargado foto al articulo, y el default_article_image_url es opcional.
@media screen and (min-width: 1366px)
	.promo-tarjeta--con-imagen
		display: grid
		grid-template-columns: 380px 1fr
		align-items: center
		gap: 2.5rem

		.promo-tarjeta__imagen
			max-height: 42vh

	// Sin imagen la tarjeta queda en una sola columna, angosta y centrada: una linea de texto
	// de 880px de ancho no se lee, y ese ancho lo pedia la imagen que no esta.
	.promo-tarjeta:not(.promo-tarjeta--con-imagen)
		max-width: 34rem
		margin: 0 auto
</style>
