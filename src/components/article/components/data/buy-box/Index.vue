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
				class="caja-compra__btn caja-compra__btn--carrito"
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
import articles from '@/mixins/articles'
export default {
	name: 'CajaDeCompra',
	mixins: [articles],
	props: {
		article: Object,
	},
	components: {
		Envio: () => import('@/components/article/components/data/Envio'),
		Cantidad: () => import('@/components/article/components/data/buy-box/Cantidad'),
		AddToCart: () => import('@/components/article/components/data/add-to-cart/Index'),
	},
	computed: {
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

	.caja-compra__botones
		display: flex
		flex-direction: column
		gap: .5rem
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

	// Ver el comentario del template: el componente se monta igual, lo que se esconde es su
	// fila de controles, que estos botones reemplazan.
	.caja-compra__add-to-cart ::v-deep .cont-input-btn-add
		display: none

	.caja-compra__add-to-cart ::v-deep .add-to-cart
		border-top: none
		padding-top: 0
		margin-bottom: 0
</style>
