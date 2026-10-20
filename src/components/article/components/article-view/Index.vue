<template>
	<div
	class="ficha-ml"
	:class="es_ficha ? '' : 'ficha-ml--modal'">

		<b-row
		v-if="es_ficha"
		class="m-b-0">
			<category-info></category-info>
		</b-row>

		<!--
			🔴 UNA sola tarjeta blanca con todo adentro: galeria, datos y caja de compra. Antes
			eran tres tarjetas sueltas (la galeria tenia su marco, la columna de datos el suyo y
			la descripcion el suyo) y se veian como tres recuadros apilados. Es el cambio que
			mas mueve la pantalla de toda la mision.
		-->
		<div class="ficha-ml__tarjeta">
			<div class="ficha-ml__cuerpo">
				<div class="ficha-ml__galeria">
					<article-image></article-image>
				</div>
				<div class="ficha-ml__datos">
					<article-data></article-data>
				</div>
				<div class="ficha-ml__compra">
					<caja-de-compra
					v-if="article_to_show"
					:article="article_to_show"></caja-de-compra>
				</div>
			</div>

			<!--
				Los relacionados van ADENTRO de la tarjeta, al final y separados por una linea.
				En el modal de agregar al carrito no van: ahi el comprador esta a un click de
				cerrar la compra y mostrarle otros seis productos es sacarlo de eso.
			-->
			<relacionados v-if="es_ficha"></relacionados>
		</div>

		<!--
			En el modal de agregar al carrito la descripcion completa vive ACA: no hay una
			`views/Article.vue` alrededor que la dibuje en su propia seccion (esa es la
			pagina entera, y no envuelve al modal). En la ficha real no se repite: ya la
			dibuja `views/Article.vue`, en su seccion con el ancla `#descripcion-completa`.
		-->
		<description v-if="!es_ficha"></description>
	</div>
</template>
<script>
export default {
	name: 'Article',
	components: {
		CategoryInfo: () => import('@/components/article/components/CategoryInfo'),
		ArticleImage: () => import('@/components/article/components/ArticleImage'),
		ArticleData: () => import('@/components/article/components/data/Index'),
		CajaDeCompra: () => import('@/components/article/components/data/buy-box/Index'),
		Relacionados: () => import('@/components/article/components/Relacionados'),
		Description: () => import('@/components/article/components/Description'),
	},
	computed: {
		/**
		 * El articulo de la ficha.
		 *
		 * @returns {Object|null}
		 */
		article_to_show() {
			return this.$store.state.articles.article_to_show
		},

		/**
		 * Si esto es la FICHA del articulo o el modal de agregar al carrito.
		 *
		 * El mismo componente dibuja las dos cosas desde siempre. En el modal no van ni las
		 * migas de pan ni los relacionados, y la caja de compra baja a lo ancho: no hay lugar
		 * para tres columnas.
		 *
		 * 🔴 La ruta sola NO alcanza. El modal tambien se abre DESDE la ficha: el boton
		 * "Mas info" de cada tarjeta (`article-card/body/BtnMasInfo.vue`) lo abre, y los
		 * relacionados que ahora viven adentro de la tarjeta son justamente tarjetas. Sin el
		 * chequeo del modal, abrir uno desde ahi dibujaba las migas de pan y OTRA grilla de
		 * relacionados —los mismos, porque salen del store del articulo actual— adentro de un
		 * modal. Antes del 16/9 no pasaba porque los relacionados no vivian aca.
		 *
		 * @returns {boolean}
		 */
		es_ficha() {
			return this.$route.name == 'Article' && !this.esta_en_modal
		},
		/**
		 * Si esta instancia esta montada adentro del modal de agregar al carrito.
		 *
		 * Se resuelve subiendo por la cadena de padres hasta encontrar el `BModal` de
		 * BootstrapVue. No es reactivo y no hace falta que lo sea: un componente no cambia de
		 * padre en toda su vida, asi que el cacheo del computed es exactamente lo que se
		 * quiere. Si algun dia el nombre del componente de BootstrapVue cambiara, esto
		 * devuelve false y se vuelve al comportamiento de antes —la ruta sola—, que es lo que
		 * habia hasta ahora: degrada, no rompe.
		 *
		 * @returns {boolean}
		 */
		esta_en_modal() {
			let padre = this.$parent
			while (padre) {
				if (padre.$options && padre.$options.name == 'BModal') {
					return true
				}
				padre = padre.$parent
			}
			return false
		},
	},
}
</script>
<style lang="sass">
.ficha-ml
	// El ancho maximo sale de la captura. El fondo gris de la pagina es el que hace que la
	// tarjeta blanca se lea como una tarjeta.
	max-width: 1180px
	margin-left: auto
	margin-right: auto

	.ficha-ml__tarjeta
		background: #FFF
		border-radius: 6px
		box-shadow: 0 1px 2px rgba(0, 0, 0, .12)
		// La linea de 1px no esta en la captura: alla el fondo de la pagina es gris (#EDEDED) y
		// la sombra alcanza para que la tarjeta se lea. Aca el fondo lo elige cada comercio
		// (`online_configuration.background_color`) y puede ser blanco: sin la linea, la tarjeta
		// desaparece. No se clava el gris de Mercado Libre porque eso seria pisarle el tema al
		// comercio, que es justo lo que el diseno dice que NO se copia.
		border: 1px solid rgba(0, 0, 0, .08)
		padding: 24px
		margin-top: 1rem
		@media screen and (max-width: 767px)
			padding: 14px

	.ficha-ml__cuerpo
		display: flex
		flex-direction: row
		flex-wrap: wrap
		align-items: flex-start
		gap: 24px

	// Telefono: las tres columnas, una abajo de la otra.
	.ficha-ml__galeria,
	.ficha-ml__datos,
	.ficha-ml__compra
		width: 100%
		min-width: 0

	// Tablet (768-1024): galeria y datos arriba en dos columnas, la caja de compra a lo ancho
	// abajo. Es el ancho donde se esconden los defectos, y donde tres columnas no entran.
	@media screen and (min-width: 768px)
		.ficha-ml__galeria
			width: calc(50% - 12px)
		.ficha-ml__datos
			width: calc(50% - 12px)
		.ficha-ml__compra
			width: 100%

	// Escritorio: las tres columnas de la captura, 46% / 32% / 22%.
	@media screen and (min-width: 1025px)
		.ficha-ml__galeria
			width: calc(46% - 16px)
		.ficha-ml__datos
			width: calc(32% - 16px)
		.ficha-ml__compra
			width: calc(22% - 16px)

// El modal de agregar al carrito: nunca tres columnas, por angosto que quede. Galeria y datos
// al lado, la caja de compra a lo ancho abajo.
.ficha-ml--modal
	.ficha-ml__tarjeta
		box-shadow: none
		border: none
		padding: 0
		margin-top: 0

	@media screen and (min-width: 1025px)
		.ficha-ml__galeria
			width: calc(50% - 12px)
		.ficha-ml__datos
			width: calc(50% - 12px)
		.ficha-ml__compra
			width: 100%
</style>
