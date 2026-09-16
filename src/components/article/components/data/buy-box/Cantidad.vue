<template>
	<div class="caja-cantidad">
		<button
		type="button"
		class="caja-cantidad__trigger"
		:aria-expanded="panel_abierto ? 'true' : 'false'"
		@click="alternar_panel">
			<span class="caja-cantidad__label">
				Cantidad:
			</span>
			<span class="caja-cantidad__valor">
				{{ texto_unidades }}
			</span>
			<i
			class="bi bi-chevron-down caja-cantidad__flecha"
			:class="panel_abierto ? 'caja-cantidad__flecha--abierta' : ''"
			aria-hidden="true"></i>
			<span
			v-if="texto_disponibles"
			class="caja-cantidad__disponibles">
				{{ texto_disponibles }}
			</span>
		</button>

		<div
		v-if="panel_abierto"
		class="caja-cantidad__panel">
			<button
			v-for="opcion in opciones"
			:key="'cantidad-opcion-'+opcion"
			type="button"
			class="caja-cantidad__opcion"
			:class="opcion === cantidad ? 'caja-cantidad__opcion--activa' : ''"
			@click="elegir(opcion)">
				{{ opcion }} {{ opcion === 1 ? 'unidad' : 'unidades' }}
			</button>

			<!--
				El campo libre del final, separado por una linea. Es la unica forma de pedir una
				cantidad mayor a las seis de la lista.
			-->
			<div class="caja-cantidad__manual">
				<label
				class="caja-cantidad__manual-label"
				:for="'caja-cantidad-manual-'+_uid">
					Cantidad:
				</label>
				<b-form-input
				:id="'caja-cantidad-manual-'+_uid"
				v-model="cantidad_manual"
				type="number"
				min="1"
				inputmode="numeric"
				class="caja-cantidad__manual-input"
				@keyup.enter="aplicar_manual"></b-form-input>
				<b-button
				class="caja-cantidad__manual-btn"
				variant="link"
				:disabled="!cantidad_manual_valida"
				@click="aplicar_manual">
					Aplicar
				</b-button>
			</div>
		</div>
	</div>
</template>
<script>
export default {
	name: 'CajaCantidad',
	props: {
		article: Object,
	},
	data() {
		return {
			panel_abierto: false,
			cantidad_manual: '',
		}
	},
	computed: {
		/**
		 * La variante elegida, que es la que manda sobre el stock cuando el articulo tiene.
		 *
		 * @returns {Object|null}
		 */
		selected_article_variant() {
			return this.$store.state.articles.selected_article_variant
		},
		/**
		 * La cantidad que se MUESTRA. La fuente de verdad sigue siendo
		 * `$store.state.articles.amount`, la misma que lee y escribe `add-to-cart/Amount.vue`:
		 * los dos controles quedan siempre sincronizados porque leen el mismo lugar.
		 *
		 * El `|| 1` es solo para dibujar: el store arranca en '' (cadena vacia) para un
		 * articulo que no esta en el carrito, y "Cantidad: unidades" no se le muestra a nadie.
		 * El valor real lo normaliza `asegurar_cantidad_valida()`.
		 *
		 * @returns {number}
		 */
		cantidad() {
			let cantidad = Number(this.$store.state.articles.amount)
			if (!cantidad || isNaN(cantidad) || cantidad < 1) {
				return 1
			}
			return cantidad
		},
		/**
		 * El tope por stock, o null si el articulo no lleva control de stock.
		 *
		 * 🔴 Es EXACTAMENTE el criterio de `add-to-cart/Amount.vue`, que es el que hoy corta la
		 * cantidad y avisa "Solo hay N unidades en STOCK": primero el stock de la variante
		 * elegida (si el articulo tiene variantes), despues el del articulo, y null cuando no
		 * hay ninguno de los dos. Si alla cambia, tiene que cambiar aca.
		 *
		 * @returns {number|null}
		 */
		max() {
			if (
				this.article
				&& this.article.article_variants
				&& this.article.article_variants.length
				&& this.selected_article_variant
				&& this.selected_article_variant.stock
			) {
				return Number(this.selected_article_variant.stock)
			} else if (this.article && this.article.stock != null) {
				return Number(this.article.stock)
			}
			return null
		},
		/**
		 * Las opciones de la lista: 1 a 6, o hasta el stock si es menor. Las seis de la
		 * captura; para mas que eso esta el campo libre del final del panel.
		 *
		 * @returns {Array}
		 */
		opciones() {
			let tope = 6
			if (this.max !== null && this.max < tope) {
				tope = this.max
			}
			let opciones = []
			let numero = 1
			while (numero <= tope) {
				opciones.push(numero)
				numero++
			}
			return opciones
		},
		/**
		 * "1 unidad" / "3 unidades".
		 *
		 * @returns {string}
		 */
		texto_unidades() {
			return this.cantidad + (this.cantidad === 1 ? ' unidad' : ' unidades')
		},
		/**
		 * "(+50 disponibles)", o null si el articulo no lleva control de stock.
		 *
		 * @returns {string|null}
		 */
		texto_disponibles() {
			if (this.max === null || isNaN(this.max) || this.max <= 0) {
				return null
			}
			return '(+' + this.max + ' disponibles)'
		},
		/**
		 * Si lo tipeado en el campo libre es un entero usable. El boton "Aplicar" arranca
		 * deshabilitado y se habilita recien con esto en true.
		 *
		 * @returns {boolean}
		 */
		cantidad_manual_valida() {
			let valor = Number(this.cantidad_manual)
			if (this.cantidad_manual === '' || isNaN(valor) || valor < 1 || valor !== Math.floor(valor)) {
				return false
			}
			if (this.max !== null && valor > this.max) {
				return false
			}
			return true
		},
		/**
		 * La cantidad CRUDA del store, sin el `|| 1` de mostrar de `cantidad`.
		 *
		 * 🔴 Existe solo para el watch de mas abajo: `cantidad` nunca deja ver el '' real
		 * (lo tapa el `|| 1`), y sin verlo no hay forma de saber cuando re-normalizar.
		 *
		 * @returns {string|number}
		 */
		cantidad_store() {
			return this.$store.state.articles.amount
		},
	},
	methods: {
		/**
		 * Abre y cierra el panel. Al abrirlo precarga el campo libre con la cantidad actual.
		 *
		 * @returns {void}
		 */
		alternar_panel() {
			this.panel_abierto = !this.panel_abierto
			if (this.panel_abierto) {
				this.cantidad_manual = String(this.cantidad)
			}
		},
		/**
		 * Guarda la cantidad elegida de la lista y cierra el panel.
		 *
		 * @param {number} opcion
		 * @returns {void}
		 */
		elegir(opcion) {
			this.$store.commit('articles/setAmount', opcion)
			this.panel_abierto = false
		},
		/**
		 * Guarda la cantidad tipeada a mano y cierra el panel.
		 *
		 * @returns {void}
		 */
		aplicar_manual() {
			if (!this.cantidad_manual_valida) {
				return
			}
			this.$store.commit('articles/setAmount', Number(this.cantidad_manual))
			this.panel_abierto = false
		},
		/**
		 * Normaliza la cantidad del store a un entero usable.
		 *
		 * 🔴 Hace falta porque el desplegable SIEMPRE muestra una cantidad ("1 unidad"), y el
		 * boton "Agregar al carrito" de `add-to-cart/Index.vue` se deshabilita cuando el store
		 * tiene '' o 0. Sin esto el comprador veria "1 unidad" elegida y el boton apagado, sin
		 * ninguna explicacion.
		 *
		 * @returns {void}
		 */
		asegurar_cantidad_valida() {
			let cantidad = Number(this.$store.state.articles.amount)
			if (!cantidad || isNaN(cantidad) || cantidad < 1) {
				this.$store.commit('articles/setAmount', 1)
			}
		},
		/**
		 * Cierra el panel al hacer click afuera.
		 *
		 * @param {MouseEvent} event
		 * @returns {void}
		 */
		cerrar_si_es_afuera(event) {
			if (!this.panel_abierto) {
				return
			}
			if (this.$el && !this.$el.contains(event.target)) {
				this.panel_abierto = false
			}
		},
		/**
		 * Cierra el panel con Escape.
		 *
		 * @param {KeyboardEvent} event
		 * @returns {void}
		 */
		cerrar_con_escape(event) {
			if (event.key === 'Escape' || event.key === 'Esc') {
				this.panel_abierto = false
			}
		},
	},
	watch: {
		/**
		 * El artículo se cambia sin destruir esta vista (se va de un producto a otro y el
		 * componente se reusa), y `checkCartArticleAmount()` deja la cantidad en '' cuando el
		 * nuevo no esta en el carrito. Hay que volver a normalizar.
		 */
		'article.id'() {
			this.asegurar_cantidad_valida()
		},
		/**
		 * El desplegable SIEMPRE muestra una cantidad valida (el `|| 1` de `cantidad`), pero
		 * el store puede quedar en '' por fuera de este componente -por ejemplo
		 * `add-to-cart/Index.vue` lo vacia despues de guardar el carrito-. Sin este watch el
		 * desplegable mentia "1 unidad" mientras el store tenia '', y "Actualizar carrito" /
		 * "Comprar ahora" fallaban en silencio o con un aviso que no coincidia con lo que se
		 * veia en pantalla.
		 */
		cantidad_store() {
			this.asegurar_cantidad_valida()
		},
	},
	created() {
		this.asegurar_cantidad_valida()
	},
	mounted() {
		document.addEventListener('click', this.cerrar_si_es_afuera)
		document.addEventListener('keydown', this.cerrar_con_escape)
	},
	beforeDestroy() {
		document.removeEventListener('click', this.cerrar_si_es_afuera)
		document.removeEventListener('keydown', this.cerrar_con_escape)
	},
}
</script>
<style scoped lang="sass">
.caja-cantidad
	position: relative
	text-align: left

	.caja-cantidad__trigger
		display: flex
		flex-direction: row
		align-items: center
		flex-wrap: wrap
		gap: .3rem
		width: 100%
		padding: 0
		border: none
		background: transparent
		font-size: 14px
		line-height: 1.4
		color: rgba(0, 0, 0, .9)
		cursor: pointer
		text-align: left

	.caja-cantidad__valor
		font-weight: 600

	.caja-cantidad__flecha
		font-size: 11px
		transition: transform .15s

	.caja-cantidad__flecha--abierta
		transform: rotate(180deg)

	.caja-cantidad__disponibles
		margin-left: .25rem
		color: rgba(0, 0, 0, .55)

	// El panel de la captura: se abre debajo, con borde y sombra, y ocupa todo el ancho de la
	// caja de compra.
	.caja-cantidad__panel
		position: absolute
		z-index: 30
		top: calc(100% + 6px)
		left: 0
		right: 0
		display: flex
		flex-direction: column
		background: #FFF
		border: 1px solid rgba(0, 0, 0, .12)
		border-radius: 6px
		box-shadow: 0 4px 14px rgba(0, 0, 0, .14)
		padding: 6px 0
		max-height: 320px
		overflow-y: auto

	.caja-cantidad__opcion
		display: block
		width: 100%
		padding: 8px 14px
		border: none
		// La barra vertical de la izquierda: transparente en las que no estan elegidas, para
		// que el texto de todas arranque en la misma columna.
		border-left: 3px solid transparent
		background: transparent
		font-size: 14px
		line-height: 1.4
		text-align: left
		color: rgba(0, 0, 0, .9)
		cursor: pointer

		&:hover
			background: rgba(0, 0, 0, .04)

	.caja-cantidad__opcion--activa
		border-left-color: var(--primary-color)
		color: var(--primary-color)
		font-weight: 600

	.caja-cantidad__manual
		display: flex
		flex-direction: row
		align-items: center
		gap: .4rem
		margin-top: 6px
		padding: 10px 14px 4px
		border-top: 1px solid rgba(0, 0, 0, .12)

	.caja-cantidad__manual-label
		margin: 0
		font-size: 14px
		color: rgba(0, 0, 0, .9)
		white-space: nowrap

	.caja-cantidad__manual-input
		width: 70px
		height: 34px
		font-size: 14px

	.caja-cantidad__manual-btn
		padding: 0
		font-size: 14px
		font-weight: 600
		color: var(--primary-color)
		white-space: nowrap
</style>
