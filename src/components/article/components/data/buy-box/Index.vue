<template>
	<div
	class="caja-compra"
	:class="tiene_recuadro ? 'caja-compra--recuadro' : ''">
		<!-- El renglon de envio. Se oculta entero si no hay nada que decir. -->
		<envio
		:article="article"></envio>

		<p
		v-if="puede_comprar"
		class="caja-compra__stock">
			Stock disponible
		</p>

		<cantidad
		v-if="puede_comprar"
		:article="article"></cantidad>

		<div
		v-if="puede_comprar"
		class="caja-compra__botones">
			<b-button
			v-if="mostrar_comprar_ahora"
			class="caja-compra__btn caja-compra__btn--comprar"
			@click="comprar_ahora">
				Comprar ahora
			</b-button>

			<b-button
			v-if="!is_item_in_cart(article)"
			class="caja-compra__btn caja-compra__btn--carrito"
			@click="agregar_al_carrito">
				Agregar al carrito
			</b-button>

			<template v-else>
				<b-button
				v-b-tooltip.hover="actualizar_carrito_tooltip_config"
				class="caja-compra__btn caja-compra__btn--carrito"
				:class="{ 'caja-compra__btn--actualizar-disabled': actualizar_carrito_disabled }"
				:aria-disabled="actualizar_carrito_disabled ? 'true' : 'false'"
				@click="actualizar_carrito">
					Actualizar carrito
				</b-button>
				<b-button
				class="caja-compra__btn caja-compra__btn--quitar"
				variant="link"
				@click="remove_cart(article)">
					Quitar del carrito
				</b-button>
			</template>
		</div>

		<!--
			🔴 `add-to-cart` se monta igual aunque sus botones no se vean: es el dueno de TODA la
			logica de carrito (validacion de variante, evento de tracking, guardado para usuario
			logueado y para invitado) y los botones de arriba lo unico que hacen es llamar a sus
			metodos por `ref`. Aca no se duplica ni una linea de esa logica.

			Lo que se esconde por CSS es solo su fila de controles (`.cont-input-btn-add`): el
			input de cantidad lo reemplaza el desplegable de la captura, y sus botones los de
			arriba. Lo demas —las notas del pedido y el aviso de "producto agotado" con el boton
			de avisarme— se sigue viendo.
		-->
		<add-to-cart
		ref="add_to_cart"
		class="caja-compra__add-to-cart"
		:article="article"></add-to-cart>
	</div>
</template>
<script>
/*
 * 🔴 `AddToCart` se importa DERECHO y no con `() => import(...)` como los otros dos. Con la
 * carga diferida, `$refs.add_to_cart` queda en undefined hasta que llega el chunk, y los
 * botones de arriba se dibujan antes que eso: en una conexion lenta el comprador podia apretar
 * "Comprar ahora" y no pasaba nada, sin ningun aviso. La ficha siempre lo necesita, asi que
 * diferirlo no ahorraba nada.
 */
import AddToCart from '@/components/article/components/data/add-to-cart/Index'
import articles from '@/mixins/articles'
export default {
	name: 'CajaDeCompra',
	mixins: [articles],
	props: {
		article: Object,
	},
	components: {
		AddToCart,
		Envio: () => import('@/components/article/components/data/Envio'),
		Cantidad: () => import('@/components/article/components/data/buy-box/Cantidad'),
	},
	computed: {
		/**
		 * Si se dibuja el boton "Comprar ahora".
		 *
		 * Lo habilita cada comercio desde su configuracion
		 * (`online_configuration.mostrar_comprar_ahora`), y viene APAGADO de fabrica: la mayoria
		 * de las tiendas quiere una sola accion —"Agregar al carrito"— y el atajo al pago se
		 * prende a pedido.
		 *
		 * 🔴 Se lee con `Number(x) == 1` y NO con el flag pelado. El API devuelve estos booleanos
		 * como string, y `"0"` es TRUTHY en JavaScript: con un `v-if` derecho el boton se
		 * encenderia en toda tienda que lo tenga apagado, que es justo lo contrario del default.
		 * Mismo criterio que `App.vue` (tienda_pausada) y `nav/footer/ItemsList.vue`. No lo
		 * "simplifiques" a truthy.
		 *
		 * @returns {boolean}
		 */
		mostrar_comprar_ahora() {
			/* El comercio llega asincronico y esta caja puede montarse antes: hasta que llegue, se
			   trata como apagado. */
			if (!this.commerce || !this.commerce.online_configuration) {
				return false
			}
			return Number(this.commerce.online_configuration.mostrar_comprar_ahora) == 1
		},
		/**
		 * Si este articulo se puede comprar AHORA.
		 *
		 * Son las mismas cuatro condiciones que ya decidian si `add-to-cart/Index.vue` dibujaba
		 * su fila de controles: comprador habilitado, precio no pausado, precio visible y
		 * stock. Se repiten aca porque los botones viven ahora en este componente, y si las dos
		 * listas se separan aparecerian botones sobre un articulo que la logica de abajo no
		 * deja agregar.
		 *
		 * @returns {boolean}
		 */
		puede_comprar() {
			if (!this.authenticated && !this.puede_comprar_sin_login) {
				return false
			}
			if (!this.article || this.flag_activo(this.article.precio_pausado)) {
				return false
			}
			if (!this.articlePriceEfectivo(this.article)) {
				return false
			}
			return this.hasStock(this.article)
		},
		/**
		 * Si la caja dibuja su recuadro.
		 *
		 * 🔴 No siempre hay algo que encuadrar. Con un comercio que exige registro para comprar
		 * (`register_to_buy`) y un visitante sin sesion, `add-to-cart` no dibuja nada y los
		 * botones tampoco: quedaba un recuadro vacio de 16px de padding colgando a la derecha
		 * de la ficha. El renglon de envio, cuando es lo unico que hay, se lee mejor suelto.
		 *
		 * @returns {boolean}
		 */
		tiene_recuadro() {
			if (this.puede_comprar) {
				return true
			}
			/* Agotado: ahi `add-to-cart` dibuja el aviso y el boton de "avisarme cuando este
			   disponible", que si tienen que ir encuadrados. */
			if (!this.authenticated && !this.puede_comprar_sin_login) {
				return false
			}
			return !!this.article && !this.hasStock(this.article)
		},
		/**
		 * Si "Actualizar carrito" tiene que verse deshabilitado: sin cantidad valida no hay
		 * nada que actualizar. El dueno de la logica es `add-to-cart/Index.vue` (mismo
		 * criterio que ya usa su propio boton "Actualizar"); esto solo lo LEE por ref para
		 * no duplicarlo. Antes del mount del hijo no hay nada que leer: false por default,
		 * como ya hacen comprar_ahora/agregar_al_carrito/actualizar_carrito de mas abajo.
		 *
		 * @returns {boolean}
		 */
		actualizar_carrito_disabled() {
			if (!this.$refs.add_to_cart) {
				return false
			}
			return this.$refs.add_to_cart.actualizar_carrito_disabled
		},
		/**
		 * El tooltip del boton de arriba. Mismo texto que ya usa `add-to-cart/Index.vue`
		 * para su propio boton "Actualizar": antes esta caja no lo replicaba, y
		 * "Actualizar carrito" cortaba en silencio sin avisar nada.
		 *
		 * @returns {Object}
		 */
		actualizar_carrito_tooltip_config() {
			return {
				title: 'Indicá una nueva cantidad para poder actualizar el carrito.',
				disabled: !this.actualizar_carrito_disabled,
			}
		},
	},
	methods: {
		/**
		 * "Comprar ahora": agrega al carrito y sigue al pago. La logica es la de
		 * `add-to-cart/Index.vue`, llamada por `ref`.
		 *
		 * @returns {void}
		 */
		comprar_ahora() {
			if (!this.$refs.add_to_cart) {
				return
			}
			this.$refs.add_to_cart.buyNow()
		},
		/**
		 * "Agregar al carrito", con la logica de `add-to-cart/Index.vue`.
		 *
		 * @returns {void}
		 */
		agregar_al_carrito() {
			if (!this.$refs.add_to_cart) {
				return
			}
			this.$refs.add_to_cart.agregar_al_carrito()
		},
		/**
		 * "Actualizar carrito", con la logica de `add-to-cart/Index.vue`.
		 *
		 * @returns {void}
		 */
		actualizar_carrito() {
			if (!this.$refs.add_to_cart) {
				return
			}
			this.$refs.add_to_cart.update_article_cart()
		},
	},
}
</script>
<style scoped lang="sass">
.caja-compra
	box-sizing: border-box
	text-align: left

	// El recuadro propio de la columna derecha, con los numeros de la captura. Solo cuando hay
	// algo adentro: ver `tiene_recuadro`.
	&.caja-compra--recuadro
		border: 1px solid rgba(0, 0, 0, .12)
		border-radius: 6px
		padding: 16px
		background: #FFF

	.caja-compra__stock
		margin: .85rem 0 .35rem 0
		font-size: 16px
		font-weight: 600
		line-height: 1.3
		color: rgba(0, 0, 0, .9)

	// Los 15px son el pedido de Lucas: los botones estaban amontonados uno contra otro. El
	// `+ .caja-compra__add-to-cart` de mas abajo estira esa misma separacion hasta el textarea
	// de notas, que se monta afuera de este contenedor.
	.caja-compra__botones
		display: flex
		flex-direction: column
		gap: 15px
		margin-top: 1rem

	.caja-compra__btn
		width: 100%
		height: 48px
		border-radius: 6px
		font-size: 15px
		font-weight: 600
		display: inline-flex
		align-items: center
		justify-content: center

	// 🔴 El azul de accion sale del tema del comercio (`--primary-color`), no del azul de
	// Mercado Libre. Lo unico que se copia literal de las capturas es el verde del descuento.
	.caja-compra__btn--comprar
		background: var(--primary-color)
		border-color: var(--primary-color)
		color: #FFF

	// El boton suave de la captura: el mismo color de accion, pero apoyado sobre un fondo
	// tenue en vez de lleno.
	.caja-compra__btn--carrito
		background: rgba(0, 0, 0, .04)
		border-color: transparent
		color: var(--primary-color)

	.caja-compra__btn--quitar
		height: auto
		font-size: 14px
		font-weight: 400
		color: rgba(0, 0, 0, .55)

	// Mismo tratamiento que ".add-to-cart__btn-actualizar--disabled" del componente viejo:
	// sin "disabled" nativo (el tooltip tiene que poder recibir hover igual), la corta de
	// verdad el guard de adentro de update_article_cart(); esto es solo la senal visual.
	.caja-compra__btn--actualizar-disabled
		opacity: 0.65
		cursor: not-allowed
		box-shadow: none

	// El textarea de notas vive adentro de `add-to-cart`, o sea AFUERA de
	// `.caja-compra__botones`: sin esto quedaba pegado al ultimo boton mientras los botones
	// entre si ya respiraban. El selector de hermano lo acota al caso en que hay botones arriba;
	// con el articulo agotado `add-to-cart` dibuja el aviso y ahi no corresponde.
	.caja-compra__botones + .caja-compra__add-to-cart
		margin-top: 15px

	// Ver el comentario del template: el componente se monta igual, lo que se esconde es su
	// fila de controles, que estos botones reemplazan.
	.caja-compra__add-to-cart ::v-deep .cont-input-btn-add
		display: none

	.caja-compra__add-to-cart ::v-deep .add-to-cart
		border-top: none
		padding-top: 0
		margin-bottom: 0
</style>
