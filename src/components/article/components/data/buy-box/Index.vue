<template>
	<div
	class="caja-compra"
	:class="tiene_recuadro ? 'caja-compra--recuadro' : ''">
		<!-- El renglon de envio. Se oculta entero si no hay nada que decir. -->
		<envio
		:article="article"></envio>

		<p
		v-if="puede_comprar && mostrar_stock_disponible"
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

			<!--
				Cuando "Comprar ahora" esta apagado —que es como viene de fabrica— este es el UNICO
				boton de la caja, asi que toma el tratamiento primario. Con el tratamiento secundario
				quedaba la unica accion de compra de la ficha pintada como accion al costado.
			-->
			<b-button
			v-if="!is_item_in_cart(article)"
			class="caja-compra__btn"
			:class="mostrar_comprar_ahora ? 'caja-compra__btn--carrito' : 'caja-compra__btn--comprar'"
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
		 * Si se muestra el texto fijo "Stock disponible" de esta caja.
		 *
		 * Lo apaga cada comercio desde su configuracion
		 * (`online_configuration.mostrar_stock_disponible`), y viene PRENDIDO de fabrica.
		 *
		 * 🔴 La condicion es `!== false`, no `flag_activo()` ni un chequeo de `=== true`. La
		 * columna la agrega empresa-api en paralelo a este cambio: mientras un comercio no
		 * tenga esa migracion corrida, el campo llega `undefined` en el JSON, y el
		 * comportamiento tiene que seguir siendo el de siempre (mostrar). Solo se oculta
		 * cuando el valor es explicitamente `false`.
		 *
		 * @returns {boolean}
		 */
		mostrar_stock_disponible() {
			return this.commerce.online_configuration.mostrar_stock_disponible !== false
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

	// 🔴 YA NO DIBUJA UN RECUADRO PROPIO: era una caja adentro de otra caja. La ficha entera
	// vive dentro de UNA tarjeta blanca (`.ficha-ml__tarjeta`), y esta caja dibujaba encima su
	// borde de 1px. Medido: el borde de la tarjeta es `rgba(0, 0, 0, .08)` y el de esta caja era
	// `rgba(0, 0, 0, .12)` -- o sea que el recuadro chico de adentro se marcaba MAS fuerte que el
	// contenedor que lo envuelve, que es al reves de como se lee una jerarquia. Mercado Libre no
	// encuadra la caja de compra: la separa con espacio.
	//
	// La clase no queda muerta: sigue decidiendo el separador de abajo, y `tiene_recuadro` sigue
	// siendo el que sabe si hay algo que separar (ver su comentario).
	&.caja-compra--recuadro
		border: none
		border-radius: 0
		padding: 0
		background: transparent

		// Apilada -- tablet y telefono, donde esta columna baja a lo ancho debajo de los datos --
		// el espacio solo no la separa de nada: queda pegada a lo de arriba. Ahi va la misma linea
		// de pelo con la que esta ficha ya separa sus bloques (ver `.envio-cotizador` en
		// `data/Index.vue`). En escritorio es una columna al costado y no hace falta.
		@media screen and (max-width: 1024px)
			border-top: 1px solid rgba(0, 0, 0, .08)
			padding-top: 16px

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

	// 🔴 El color de accion sale del tema del comercio, no del azul de Mercado Libre. Lo unico
	// que se copia literal de las capturas es el verde del descuento.
	//
	// 🔴 Sale de `--buy-box-button-color`, NO de `--primary-color` a secas: es el "Color del boton
	// 'Agregar al carrito'" que el comercio elige en Configuracion online -> Diseno. Si el
	// comercio no cargo ese campo, el tema publica el primario (y texto blanco), o sea lo de
	// siempre (ver `resolve_buy_box_button_colors` en `online_configuration_theme.js`). Los
	// fallbacks de cada `var()` cubren el instante previo a que el tema se aplique.
	.caja-compra__btn--comprar
		background: var(--buy-box-button-color, var(--primary-color))
		border-color: var(--buy-box-button-color, var(--primary-color))
		color: var(--buy-box-button-text-color, #FFF)

		// Estas tres reglas no existian: `b-button` sin variante nace `btn-secondary` y el hover /
		// focus / active gris de Bootstrap le ganaba al color del comercio apenas se pasaba el
		// mouse por encima. Se oscurece un poco el MISMO color en vez de cambiarlo.
		// `:not(:disabled):not(.disabled):active` replica el selector de Bootstrap (0,4,0) para
		// no perder el empate del click sostenido contra su `.btn-secondary:...:active` gris.
		&:hover, &:not(:disabled):not(.disabled):active
			background: color-mix(in srgb, var(--buy-box-button-color, var(--primary-color)) 85%, #000)
			border-color: color-mix(in srgb, var(--buy-box-button-color, var(--primary-color)) 85%, #000)
			color: var(--buy-box-button-text-color, #FFF)

		&:focus
			background: var(--buy-box-button-color, var(--primary-color))
			border-color: var(--buy-box-button-color, var(--primary-color))
			color: var(--buy-box-button-text-color, #FFF)
			box-shadow: 0 0 0 .2rem color-mix(in srgb, var(--buy-box-button-color, var(--primary-color)) 35%, transparent)

	// El boton secundario de la caja, con el tratamiento del "Agregar al carrito" de Mercado
	// Libre: fondo claro del MISMO color de accion, texto en ese color, sin borde.
	//
	// 🔴 El fondo era `rgba(0, 0, 0, .04)` —un gris del 4%— y sobre la tarjeta blanca no se
	// distinguia de la tarjeta: parecia texto suelto, no un boton. Se tiñe con `color-mix` sobre
	// blanco en vez de clavar un celeste: el color de accion lo elige cada comercio
	// (`--primary-color`, rojo #c5111d de fabrica), asi que un azul fijo seria de una sola tienda.
	// Misma tecnica que ya usa `_article_action_link.sass`.
	//
	// Lo comparten "Agregar al carrito" y "Actualizar carrito": los dos son la accion secundaria
	// de la caja y en Mercado Libre se ven igual. No hay motivo para separarlos.
	//
	// El color de accion es el mismo `--buy-box-button-color` que usa "Comprar ahora" (ver arriba).
	.caja-compra__btn--carrito
		background: color-mix(in srgb, var(--buy-box-button-color, var(--primary-color)) 15%, #FFF)
		border-color: transparent
		color: var(--buy-box-button-color, var(--primary-color))

		// El hover sube el mismo tinte; no cambia de color ni levanta el boton. La regla existe
		// porque `b-button` sin variante nace `btn-secondary`, y el hover gris de Bootstrap
		// —(0,1,1)— le ganaba a la regla base de arriba.
		&:hover
			background: color-mix(in srgb, var(--buy-box-button-color, var(--primary-color)) 22%, #FFF)
			border-color: transparent
			color: var(--buy-box-button-color, var(--primary-color))

		// El halo gris de `.btn-secondary:focus` tampoco es del comercio: se reemplaza por un
		// anillo del color de accion, que ademas es la unica senal de foco que queda sin borde.
		&:focus
			background: color-mix(in srgb, var(--buy-box-button-color, var(--primary-color)) 22%, #FFF)
			border-color: transparent
			color: var(--buy-box-button-color, var(--primary-color))
			box-shadow: 0 0 0 .2rem color-mix(in srgb, var(--buy-box-button-color, var(--primary-color)) 28%, transparent)

	.caja-compra__btn--quitar
		height: auto
		font-size: 14px
		font-weight: 400
		color: rgba(0, 0, 0, .55)

	// Sin "disabled" nativo (el tooltip tiene que poder recibir hover igual): la corta de verdad
	// el guard de adentro de update_article_cart(); esto es solo la senal visual.
	//
	// 🔴 Era `opacity: .65` y con el fondo nuevo dejaba de servir: la opacidad aclara el tinte
	// Y el texto a la vez, asi que el boton quedaba casi blanco sobre blanco en vez de
	// deshabilitado. Ahora se sale del color de accion y se va al gris, que es la senal de
	// "esto no se puede tocar" y no depende de cual sea el color del comercio.
	//
	// Las tres lineas del selector no son adorno: el `&:hover` / `&:focus` de `--carrito` vale
	// (0,2,1) y le ganaba a esta regla apenas se pasaba el mouse por encima, devolviendole al
	// boton deshabilitado el aspecto de habilitado.
	// Y el `.caja-compra__btn` de mas es lo que le gana el `cursor` a Bootstrap: su
	// `.btn:not(:disabled):not(.disabled) { cursor: pointer }` vale (0,3,0) — lo mismo que
	// valdria esta regla sin ese nivel de mas—, y en un empate decide el orden de
	// compilacion. Medido en la app: con un solo nivel el cursor seguia siendo `pointer`.
	.caja-compra__btn.caja-compra__btn--actualizar-disabled,
	.caja-compra__btn.caja-compra__btn--actualizar-disabled:hover,
	.caja-compra__btn.caja-compra__btn--actualizar-disabled:focus
		background: rgba(0, 0, 0, .05)
		border-color: transparent
		color: rgba(0, 0, 0, .38)
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
