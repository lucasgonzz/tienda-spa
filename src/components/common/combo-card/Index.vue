<template>
	<div
	class="model combo-card animate__animated animate__fadeIn"
	:class="combo_class">

		<!--
			Cartel de agotado: mismo look que `.agotado` de la tarjeta de artículo (rojo, esquina
			superior izquierda). Se replica acá y no se importa `AgotadoInfo.vue` porque ese
			componente decide con `hasStock(article)`, que mira `article.stock` y no el
			`stock_disponible` calculado de un combo.
		-->
		<div
		v-if="agotado"
		class="combo-card__agotado">
			Agotado
		</div>

		<!--
			Arriba de todo: la foto propia del combo si la tiene (una sola tesela) o, si no, el
			mosaico con las imágenes de los artículos que lo componen (1 a 4 teselas + "+N").
			La forma del mosaico la fija la clase `--N`: cuadrado siempre, con reglas para 1, 2, 3
			y 4 teselas para que nunca quede un hueco.
		-->
		<div
		class="combo-card__imagenes"
		:class="'combo-card__imagenes--' + imagenes.length">
			<div
			class="combo-card__imagen"
			v-for="(imagen, index) in imagenes"
			:key="'img-' + index">
				<img
				v-if="imagen"
				:src="imagen"
				:alt="combo.name"
				@error="al_fallar_imagen">
				<i
				v-else
				class="bi bi-image combo-card__imagen-vacia"
				aria-hidden="true"></i>
			</div>
			<span
			v-if="imagenes_restantes && !tiene_foto_propia"
			class="combo-card__imagenes-mas">
				+{{ imagenes_restantes }}
			</span>
		</div>

		<div
		class="card-article-body combo-card__body">

			<span class="combo-card__badge">Combo</span>

			<p class="combo-card__name">
				{{ combo.name }}
			</p>

			<!-- Qué lleva el combo, con sus cantidades: "1x Taladro, 2x Mecha". -->
			<ul
			v-if="detalle.length"
			class="combo-card__detalle">
				<li
				v-for="(linea, index) in detalle"
				:key="'det-' + index">
					<span class="combo-card__detalle-cantidad">{{ linea.amount }}x</span>
					{{ linea.name }}
				</li>
			</ul>

			<div
			v-if="puede_ver_precios()">
				<!--
					Los descuentos y recargos del cliente del comprador (decision 2 de Lucas: van
					sobre todo lo comprable). Mismo renglon que la tarjeta de articulo: badges y el
					precio de antes tachado, arriba del precio. Con un recargo que domina no hay
					tachado.
				-->
				<span
				v-if="badges.length"
				class="combo-card__linea-ajustes">
					<b-badge
					v-for="badge in badges"
					:key="badge.clave"
					:class="badge.tipo == 'recargo' ? 'combo-card__badge-recargo' : 'combo-card__badge-descuento'">
						{{ badge.texto }}
					</b-badge>
					<span
					v-if="precio_sin_ajustes"
					class="combo-card__tachado">
						{{ precio_sin_ajustes }}
					</span>
				</span>
				<p class="product-price combo-card__price">
					{{ precio_mostrado }}
				</p>

				<!-- En el carrito: cuánto suma la línea entera. -->
				<div
				v-if="en_carrito && Number(combo.amount) > 1"
				class="combo-card__linea">
					<hr class="m-t-0">
					<p class="text-left m-b-5">
						Los {{ combo.amount }} combos
					</p>
					<p class="product-price">
						{{ price(total_de_linea) }}
					</p>
				</div>
			</div>

			<template
			v-if="authenticated || puede_comprar_sin_login">

				<!--
					"Quedan N": solo con stock calculado, sin `ignorar_stock` y con
					`mostrar_stock_disponible` prendido. En el carrito no va (ahí no se elige cantidad).
				-->
				<p
				v-if="!en_carrito && !esta_en_el_carrito && texto_quedan"
				class="combo-card__quedan">
					{{ texto_quedan }}
				</p>

				<div
				v-if="!en_carrito && !esta_en_el_carrito"
				class="combo-card__cont-add">
					<!--
						`:max` es el stock calculado del combo (sin atributo si no hay tope). El
						`formatter` recorta lo tipeado al tope en el mismo momento en que se
						escribe, y es la forma que funciona con BootstrapVue: recortar desde un
						@input dejaba el número pasado de tope a la vista cuando el v-model ya
						valía el tope.
					-->
					<b-form-input
					v-model="amount"
					class="combo-card__amount"
					type="number"
					min="1"
					:max="tope_de_stock"
					:formatter="recortar_al_tope"
					:disabled="agotado"
					aria-label="Cantidad de combos"></b-form-input>

					<b-button
					@click.stop="agregar_al_carrito"
					:disabled="guardando || !amount_valido || agotado"
					variant="outline-primary"
					class="combo-card__btn-add"
					aria-label="Agregar combo al carrito">
						<span
						v-if="guardando"
						class="spinner-border spinner-border-sm"
						role="status"
						aria-hidden="true"></span>
						<template v-else>
							<i class="bi bi-cart-plus" aria-hidden="true"></i>
							<span class="combo-card__btn-label">Agregar</span>
						</template>
					</b-button>
				</div>

				<b-button
				v-else
				@click.stop="quitar_del_carrito"
				:disabled="guardando"
				variant="danger"
				class="combo-card__btn-remove"
				block>
					<i class="bi bi-cart-x" aria-hidden="true"></i>
					Quitar
				</b-button>

			</template>

		</div>
	</div>
</template>
<script>
/*
 * LA TARJETA DE UN COMBO. Es propia y NO reusa `article-card`: un combo no tiene ficha a la que
 * navegar ni variantes. Lo que tiene es una receta —`articles[]` con el `pivot.amount` de cada
 * componente—, un precio que resuelve el servidor por lista (`final_price`), una foto propia
 * opcional (`images[]`) y un stock calculado (`stock_disponible`).
 *
 * Qué muestra, tal como lo pidió Lucas: la foto del combo si la tiene y, si no, el collage con
 * las imágenes de los artículos que lo componen; el nombre, el detalle de qué lleva con sus
 * cantidades, el precio y el botón de agregar.
 *
 * Stock (misión combos-calculados): `stock_disponible` lo calcula el servidor (cuántos combos se
 * pueden armar con lo que hay de cada componente; manda el limitante). `null` = ningún
 * componente lleva stock, hay siempre. La tarjeta NO lo recalcula: pone el cartel "Agotado" con
 * 0, el tope en el input de cantidad y el "Quedan N". La regla vive en `@/helpers/combo`.
 *
 * 🔴 No hay página de detalle de un combo: la tarjeta lo muestra entero y el agregado al carrito
 * se resuelve acá adentro. Por eso no pasa por el modal `add-to-cart-modal` (que monta la ficha
 * de un artículo) ni por `articles/setArticleToShow`.
 */
import cart from '@/mixins/cart'
import {
	imagenes_de_tarjeta,
	tope_de_stock_del_combo,
	combo_agotado,
	recortar_cantidad_al_tope,
	texto_quedan,
} from '@/helpers/combo'
export default {
	name: 'ComboCard',
	mixins: [cart],
	props: {
		combo: Object,
		full_width: {
			type: Boolean,
			default: false
		},
		/** Modo carrito/checkout: muestra lo que se cobra (el pivote) y el botón de quitar. */
		en_carrito: {
			type: Boolean,
			default: false
		},
	},
	data() {
		return {
			amount: 1,
			guardando: false,
			/* Cuántas imágenes entran en el mosaico antes de pasar al contador "+N". */
			max_imagenes: 4,
			/* La foto propia del combo no cargó (URL rota): se cae al mosaico de componentes. */
			foto_propia_fallo: false,
		}
	},
	computed: {
		combo_class() {
			let class_ = ''
			if (this.full_width) {
				class_ += ' full-width'
			}
			if (this.en_carrito) {
				class_ += ' combo-card--en-carrito'
			}
			return class_
		},
		/** Los artículos del combo, siempre un array aunque la API no los mande. */
		articulos() {
			if (this.combo && Array.isArray(this.combo.articles)) {
				return this.combo.articles
			}
			return []
		},
		/**
		 * Lo que dibuja la parte de arriba: [foto propia] o el mosaico de los componentes.
		 * La regla (y el porqué de cada fallback) está en `imagenes_de_tarjeta()`.
		 */
		visual() {
			return imagenes_de_tarjeta(
				this.combo,
				this.max_imagenes,
				this.commerce.online_configuration.default_article_image_url,
				this.foto_propia_fallo
			)
		},
		/** Las URL de las teselas (null = ícono de imagen vacía). */
		imagenes() {
			return this.visual.urls
		},
		/** ¿Lo de arriba es la foto propia del combo y no el collage? */
		tiene_foto_propia() {
			return this.visual.propia
		},
		/** Cuántos componentes quedaron fuera del mosaico, para el "+N". */
		imagenes_restantes() {
			return this.visual.restantes
		},
		/**
		 * `online_configuration.ignorar_stock` (Online Configurations -> Stock): mismo criterio
		 * que `hasStock()` del mixin de artículos, con el mismo chequeo de verdad.
		 */
		ignorar_stock() {
			return !!this.commerce.online_configuration.ignorar_stock
		},
		/**
		 * El tope de unidades por stock calculado, o null si no hay tope (stock null = sin
		 * control, o `ignorar_stock`).
		 */
		tope_de_stock() {
			return tope_de_stock_del_combo(this.combo, this.ignorar_stock)
		},
		/** Stock calculado en cero: cartel "Agotado" y botón Agregar deshabilitado. */
		agotado() {
			return combo_agotado(this.tope_de_stock)
		},
		/**
		 * "Quedan N", o null. `mostrar_stock_disponible` viene PRENDIDO de fábrica: solo se
		 * oculta con `=== false` (mismo criterio que `buy-box/Index.vue` y `Cantidad.vue`).
		 */
		texto_quedan() {
			let mostrar = this.commerce.online_configuration.mostrar_stock_disponible !== false
			return texto_quedan(this.tope_de_stock, mostrar)
		},
		/**
		 * Qué lleva el combo: nombre y cantidad de cada componente. La cantidad sale del pivote
		 * `article_combo.amount`; sin pivote se asume 1 en vez de esconder la línea, porque un
		 * componente sin cantidad sigue siendo parte del combo.
		 */
		detalle() {
			let lineas = []
			this.articulos.forEach(article => {
				if (!article) {
					return
				}
				let amount = article.pivot && article.pivot.amount != null
					? Number(article.pivot.amount)
					: 1
				if (!isFinite(amount) || amount <= 0) {
					amount = 1
				}
				lineas.push({
					name: article.name,
					/* `article_combo.amount` es integer: el Number() de arriba ya lo deja limpio. */
					amount: amount,
				})
			})
			return lineas
		},
		/**
		 * El precio unitario del combo.
		 *
		 * 🔴 En el carrito manda el PIVOTE, que es lo que el servidor resolvió y va a cobrar. En
		 * la home manda `final_price`, que es el precio fijo cargado en el ABM de empresa.
		 *
		 * ⚠️ Al combo NO se le suma el `online_price_surchage` que `articlePriceEfectivo()` le
		 * suma a un artículo: `combos.price` es un precio final puesto a mano, igual que el de
		 * una promoción de vinoteca —que ya se muestra crudo en `article-card/body/Price.vue`—,
		 * no un precio derivado de una lista. Sumarle el recargo mostraría un número que el
		 * servidor no cobra.
		 */
		precio_mostrado() {
			if (this.en_carrito && this.combo.pivot) {
				return this.price(this.combo.pivot.price)
			}
			return this.price(this.combo.final_price)
		},
		/**
		 * Los badges de los ajustes del cliente. En la home y en el carrito: el combo del
		 * carrito vuelve de la API con `ajustes_de_cliente` igual que el de la home.
		 *
		 * @returns {Array}
		 */
		badges() {
			return this.badges_de_ajustes(this.combo)
		},
		/**
		 * El precio de antes de los ajustes del cliente, reconstruido desde el que se muestra al
		 * lado (el pivote en el carrito, `final_price` en la home) con el factor de los badges.
		 *
		 * @returns {string|null}
		 */
		precio_sin_ajustes() {
			let precio = this.en_carrito && this.combo.pivot ? this.combo.pivot.price : this.combo.final_price
			return this.precio_sin_ajustes_de_cliente(this.combo, precio)
		},
		/** Lo que suma la línea del carrito: precio del pivote por la cantidad. */
		total_de_linea() {
			if (!this.combo.pivot) {
				return 0
			}
			let precio = Number(this.combo.pivot.price)
			let cantidad = Number(this.combo.pivot.amount)
			if (!isFinite(precio) || !isFinite(cantidad)) {
				return 0
			}
			return precio * cantidad
		},
		amount_valido() {
			let cantidad = Number(this.amount)
			return isFinite(cantidad) && cantidad > 0
		},
		/** ¿Este combo ya está en el carrito? Se busca contra `cart.combos`, nunca contra articles. */
		esta_en_el_carrito() {
			return this.cart_combos.findIndex(combo => {
				return combo.id == this.combo.id
			}) != -1
		},
	},
	methods: {
		/** La foto propia no cargó: se descarta y la tarjeta muestra el collage de componentes. */
		al_fallar_imagen() {
			if (this.tiene_foto_propia) {
				this.foto_propia_fallo = true
			}
		},
		/**
		 * Formatter del input de cantidad: recorta lo tipeado al stock disponible y avisa, igual
		 * que `add-to-cart/Amount.vue::check_amount`. Devuelve siempre string (contrato del
		 * `formatter` de BootstrapVue).
		 *
		 * @param {string} valor
		 * @returns {string}
		 */
		recortar_al_tope(valor) {
			let resultado = recortar_cantidad_al_tope(valor, this.tope_de_stock)
			if (resultado.recortado) {
				this.$toast.error('Solo hay ' + this.tope_de_stock + ' unidades en STOCK')
			}
			return String(resultado.valor)
		},
		agregar_al_carrito() {
			if (this.agotado) {
				this.$toast.error('El combo está agotado')
				return
			}
			if (!this.amount_valido) {
				this.$toast.error('Indique una cantidad')
				return
			}
			/* Red de seguridad por si el valor entró sin pasar por el formatter (v-model programático). */
			let recorte = recortar_cantidad_al_tope(this.amount, this.tope_de_stock)
			if (recorte.recortado) {
				this.$toast.error('Solo hay ' + this.tope_de_stock + ' unidades en STOCK')
				this.amount = recorte.valor
			}
			let cantidad = Number(this.amount)
			/*
			 * El pivote local, calcado del que arma add-to-cart/Index.vue para un artículo. Es
			 * OPTIMISTA: el precio que se cobra lo resuelve `CartHelper::get_price()` del lado
			 * de la API y vuelve en el `setCart` de la respuesta. Sirve para que el invitado —que
			 * no persiste el carrito hasta el checkout— vea el total bien mientras tanto.
			 */
			this.combo.amount = cantidad
			this.combo.pivot = {
				amount: cantidad,
				notes: '',
				price: Number(this.combo.final_price),
			}
			this.$store.commit('cart/addItem', this.combo)

			if (this.authenticated) {
				let self = this
				self.guardando = true
				self.$store.commit('auth/setMessage', 'Guardando carrito')
				self.$store.commit('auth/setLoading', true)
				self.$store.dispatch('cart/save')
				.then(() => {
					self.guardando = false
					self.$store.commit('auth/setLoading', false)
					self.$store.commit('cart/set_added_item', self.combo)
					self.$store.commit('cart/set_added_item_popup_visible', true)
				})
				.catch(err => {
					self.guardando = false
					self.$store.commit('auth/setLoading', false)
					console.log(err)
					self.$toast.error('Error al guardar carrito')
				})
			} else {
				/* Invitado: el carrito vive en memoria hasta el paso de pago. */
				this.$store.commit('cart/set_added_item', this.combo)
				this.$store.commit('cart/set_added_item_popup_visible', true)
			}
		},
		quitar_del_carrito() {
			if (!confirm('¿Seguro quiere quitar ' + this.combo.name + ' del carrito?')) {
				return
			}
			this.$store.commit('cart/removeArticle', {
				item: this.combo,
				remove_only_one_amount: false
			})
			if (this.authenticated) {
				let self = this
				self.guardando = true
				self.$store.commit('auth/setMessage', 'Guardando carrito')
				self.$store.commit('auth/setLoading', true)
				self.$store.dispatch('cart/save')
				.then(() => {
					self.guardando = false
					self.$store.commit('auth/setLoading', false)
				})
				.catch(err => {
					self.guardando = false
					self.$store.commit('auth/setLoading', false)
					console.log(err)
					self.$toast.error('Error al guardar carrito')
				})
			}
		},
	}
}
</script>
<style lang="sass" scoped>
.combo-card
	display: flex
	flex-direction: column
	position: relative
	overflow: hidden
	border: 1px solid rgba(0, 0, 0, .1)
	border-radius: 8px
	background: #FFF

	// Cartel de agotado: copia local de `.agotado` (article-card/AgotadoInfo.vue). El rojo es el
	// $red de bootstrap (#dc3545), el mismo que usa la tarjeta de articulo.
	.combo-card__agotado
		position: absolute
		top: 0
		left: 0
		font-weight: bold
		font-size: 16px
		border-radius: 4px 0 5px 0
		background: #dc3545
		color: #FFF
		z-index: 10
		padding: 5px 10px

	// La parte de arriba es SIEMPRE un cuadrado (aspect-ratio 1:1) sea cual sea la cantidad de
	// teselas, asi todas las tarjetas de una fila miden lo mismo. Las teselas se reparten el
	// cuadrado con una grilla de 2x2 y la clase `--N` (N = cantidad de teselas) decide como:
	//   1 tesela  -> ocupa todo (foto propia, o un combo de un solo componente)
	//   2 teselas -> dos columnas, cada una a alto completo
	//   3 teselas -> la primera ocupa todo el ancho de arriba, las otras dos abajo
	//   4 teselas -> 2x2
	// Antes solo existia la regla `--1`: con 2 y 3 imagenes la grilla dejaba una celda vacia.
	.combo-card__imagenes
		display: grid
		grid-template-columns: 1fr 1fr
		grid-template-rows: 1fr 1fr
		gap: 2px
		position: relative
		aspect-ratio: 1 / 1
		background: rgba(0, 0, 0, .04)

		&.combo-card__imagenes--0, &.combo-card__imagenes--1
			grid-template-columns: 1fr
			grid-template-rows: 1fr

		&.combo-card__imagenes--2
			grid-template-rows: 1fr

		&.combo-card__imagenes--3 .combo-card__imagen:first-child
			grid-column: 1 / -1

		.combo-card__imagen
			display: flex
			align-items: center
			justify-content: center
			background: #FFF
			position: relative
			// Sin esto la tesela toma el tamano intrinseco de la imagen y desborda su celda.
			min-width: 0
			min-height: 0
			overflow: hidden

			// La imagen va absoluta para llenar la celda sin aportar su alto a la grilla.
			// `contain`, igual que la tarjeta de articulo: se ve el producto entero, sin recortar.
			img
				position: absolute
				top: 0
				left: 0
				width: 100%
				height: 100%
				object-fit: contain

			.combo-card__imagen-vacia
				font-size: 1.6rem
				color: rgba(0, 0, 0, .2)

		.combo-card__imagenes-mas
			position: absolute
			right: 6px
			bottom: 6px
			background: rgba(0, 0, 0, .65)
			color: #FFF
			border-radius: 10px
			font-size: .72rem
			padding: 1px 7px

	.combo-card__body
		padding: .5rem
		display: flex
		flex-direction: column

	.combo-card__badge
		align-self: flex-start
		background: rgba(0, 0, 0, .06)
		border-radius: 10px
		font-size: .68rem
		text-transform: uppercase
		letter-spacing: .04em
		padding: 1px 8px
		margin-bottom: 4px

	.combo-card__name
		font-weight: 600
		margin-bottom: 4px

	// "Quedan N": discreto, pegado arriba del selector de cantidad.
	.combo-card__quedan
		margin: 8px 0 0
		font-size: .8rem
		color: rgba(0, 0, 0, .55)
		text-align: left

	// El renglon de los ajustes del cliente, ARRIBA del precio: badges y tachado. Mismas
	// medidas que el de la tarjeta de articulo (article-card/body/Price.vue).
	.combo-card__linea-ajustes
		display: flex
		flex-direction: row
		align-items: center
		flex-wrap: wrap
		gap: .35rem
		margin-bottom: .1rem

	.combo-card__badge-descuento, .combo-card__badge-recargo
		font-size: 12px
		font-weight: 600
		line-height: 1.3
		padding: 2px 5px
		border-radius: 3px
		white-space: nowrap
		color: #FFF
		// sass/_nav.sass le da `z-index: 100` a todo .badge y este badge es flex item: sin
		// esto se pinta encima del menu lateral del telefono.
		z-index: auto

	// El verde del badge de descuento de la tienda (#00A650) y el ambar del recargo.
	.combo-card__badge-descuento
		background-color: #00A650

	.combo-card__badge-recargo
		background-color: #C25E00

	.combo-card__tachado
		font-size: 12px
		font-weight: 400
		line-height: 1.2
		color: rgba(0, 0, 0, .45)
		text-decoration: line-through
		white-space: nowrap

	.combo-card__detalle
		list-style: none
		padding: 0
		margin: 0 0 6px
		font-size: .8rem
		color: rgba(0, 0, 0, .65)
		text-align: left

		li
			line-height: 1.25

		.combo-card__detalle-cantidad
			font-weight: 600
			color: rgba(0, 0, 0, .8)

	.combo-card__cont-add
		display: flex
		flex-direction: row
		align-items: stretch
		gap: .5rem
		margin-top: 10px

		.combo-card__amount
			flex: 1
			min-width: 0

		.combo-card__btn-add
			flex-shrink: 0
			display: inline-flex
			align-items: center
			justify-content: center
			gap: .3rem
			padding: 0 .7rem

		// La etiqueta del boton nace oculta, igual que en la tarjeta de articulo: en pantallas
		// chicas el boton es un icono y el texto no entra.
		.combo-card__btn-label
			display: none

			@media screen and (min-width: 768px)
				display: inline

	.combo-card__btn-remove
		margin-top: 10px
</style>
