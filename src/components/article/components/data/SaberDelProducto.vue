<template>
	<div
	v-if="texto_completo"
	class="saber-del-producto">
		<p class="saber-del-producto__titulo">
			Lo que tenés que saber de este producto
		</p>

		<p
		class="saber-del-producto__texto"
		v-html="texto_recortado_con_saltos"></p>

		<!--
			Solo si la descripcion NO entro entera. Si entro, el boton no aparece: no tiene
			sentido mandar a leer mas de lo que ya se esta leyendo.
		-->
		<button
		v-if="hay_que_recortar"
		type="button"
		class="saber-del-producto__link"
		@click="ver_caracteristicas">
			Ver características
		</button>
	</div>
</template>
<script>
export default {
	name: 'SaberDelProducto',
	computed: {
		/**
		 * El articulo de la ficha.
		 *
		 * @returns {Object|null}
		 */
		article() {
			return this.$store.state.articles.article_to_show
		},
		/**
		 * Cuantos caracteres se muestran antes de recortar.
		 *
		 * @returns {number}
		 */
		tope_de_caracteres() {
			return 600
		},
		/**
		 * Toda la descripcion del articulo, en un solo texto.
		 *
		 * Son las mismas dos fuentes que dibuja `Description.vue` mas abajo en la pagina: la
		 * descripcion suelta del articulo y las descripciones con titulo. Se unen para poder
		 * medir el largo de una sola vez.
		 *
		 * @returns {string}
		 */
		texto_completo() {
			if (!this.article) {
				return ''
			}
			let partes = []
			if (this.article.description) {
				partes.push(String(this.article.description))
			}
			if (Array.isArray(this.article.descriptions)) {
				this.article.descriptions.forEach(descripcion => {
					if (descripcion && descripcion.content) {
						partes.push(String(descripcion.content))
					}
				})
			}
			return partes.join('\n\n').trim()
		},
		/**
		 * Si la descripcion no entra entera en el tope.
		 *
		 * @returns {boolean}
		 */
		hay_que_recortar() {
			return this.texto_completo.length > this.tope_de_caracteres
		},
		/**
		 * La descripcion recortada.
		 *
		 * 🔴 Corta en el ULTIMO espacio antes del tope, nunca a mitad de palabra. Si en los 600
		 * caracteres no hay ningun espacio —una sola palabra larguisima, un pegado sin espacios—
		 * corta igual en el tope: mejor una palabra partida que el texto entero.
		 *
		 * @returns {string}
		 */
		texto_recortado() {
			if (!this.hay_que_recortar) {
				return this.texto_completo
			}
			let corte = this.texto_completo.slice(0, this.tope_de_caracteres)
			let ultimo_espacio = Math.max(corte.lastIndexOf(' '), corte.lastIndexOf('\n'))
			if (ultimo_espacio > 0) {
				corte = corte.slice(0, ultimo_espacio)
			}
			/* Sin esto quedan cosas como "del producto ,..." cuando el corte cae justo despues
			   de un signo de puntuacion. */
			corte = corte.replace(/[\s,;:.\-]+$/, '')
			return corte + '...'
		},
		/**
		 * Lo mismo, con los saltos de linea convertidos a <br>, igual que `Description.vue`.
		 *
		 * @returns {string}
		 */
		texto_recortado_con_saltos() {
			return this.texto_recortado.replace(/\n/g, '<br>')
		},
	},
	methods: {
		/**
		 * Lleva a la descripcion completa, mas abajo en la misma pagina.
		 *
		 * El ancla la pone `views/Article.vue` alrededor del bloque de descripcion. Si no
		 * existe —por ejemplo si este componente se monta adentro del modal de agregar al
		 * carrito, donde no hay descripcion completa— no hace nada y no rompe.
		 *
		 * @returns {void}
		 */
		ver_caracteristicas() {
			let ancla = document.getElementById('descripcion-completa')
			if (!ancla) {
				return
			}
			ancla.scrollIntoView({ behavior: 'smooth', block: 'start' })
		},
	},
}
</script>
<style scoped lang="sass">
.saber-del-producto
	text-align: left

	.saber-del-producto__titulo
		margin: 0 0 .5rem 0
		font-size: 16px
		font-weight: 600
		line-height: 1.3
		color: rgba(0, 0, 0, .9)

	.saber-del-producto__texto
		margin: 0
		font-size: 14px
		line-height: 1.6
		color: rgba(0, 0, 0, .75)
		// El texto recortado puede traer parrafos largos; sin esto una URL pegada desborda la
		// columna en telefono.
		overflow-wrap: break-word

	.saber-del-producto__link
		margin-top: .4rem
		padding: 0
		border: none
		background: transparent
		font-size: 14px
		line-height: 1.4
		color: var(--secondary-color)
		cursor: pointer

		&:hover
			text-decoration: underline
</style>
