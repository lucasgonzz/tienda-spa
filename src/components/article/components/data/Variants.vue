<template>
	<div
	class="article-variants"
	v-if="article_to_show.article_properties && article_to_show.article_properties.length">
		<div
		v-for="article_property in article_to_show.article_properties"
		:key="article_property.article_property_type.name"
		class="article-variants__grupo">

			<!-- "Color: Black" — el nombre de la propiedad en gris y el valor elegido en negrita. -->
			<p class="article-variants__label">
				{{ article_property.article_property_type.name }}:
				<span
				v-if="valor_elegido(article_property)"
				class="article-variants__label-valor">
					{{ valor_elegido(article_property) }}
				</span>
			</p>

			<!--
				Con hasta 12 valores, la fila de chips de la captura. Con mas, el desplegable de
				siempre: una lista de cincuenta talles en chips es peor que un select, ocupa media
				pantalla y obliga a buscar con los ojos.
			-->
			<div
			v-if="usa_chips(article_property)"
			class="article-variants__chips">
				<button
				v-for="article_property_value in article_property.article_property_values"
				:key="article_property_value.id ? 'valor-'+article_property_value.id : 'valor-'+article_property_value.name"
				type="button"
				class="article-variants__chip"
				:class="es_elegido(article_property, article_property_value) ? 'article-variants__chip--elegido' : ''"
				:aria-pressed="es_elegido(article_property, article_property_value) ? 'true' : 'false'"
				@click="elegir(article_property, article_property_value)">
					<!--
						Si el valor trae imagen propia, el chip es la miniatura de 40x40. Hoy ese
						campo no llega de la API y siempre cae al texto; queda leido asi para que
						agregarlo del lado del servidor no obligue a tocar esto.
					-->
					<img
					v-if="article_property_value.image_url"
					class="article-variants__chip-img"
					:src="article_property_value.image_url"
					:alt="article_property_value.name">
					<span v-else>
						{{ article_property_value.name }}
					</span>
				</button>
			</div>

			<b-form-select
			v-else
			:options="getOptions(article_property)"
			v-model="article_to_show.selected_article_properties[article_property.article_property_type.name]"
			@change="setSelectedVariant()"></b-form-select>
		</div>
	</div>
</template>
<script>
import articles from '@/mixins/articles'
export default {
	name: 'ArticleProperties',
	mixins: [articles],
	computed: {
		article_to_show() {
			return this.$store.state.articles.article_to_show
		},
		selected_article_variant() {
			return this.$store.state.articles.selected_article_variant
		},
	},
	methods: {
		/**
		 * Hasta cuantos valores se dibujan como chips antes de caer al desplegable.
		 *
		 * @returns {number}
		 */
		tope_de_chips() {
			return 12
		},
		/**
		 * Si esta propiedad se dibuja con chips o con el desplegable de siempre.
		 *
		 * @param {Object} article_property
		 * @returns {boolean}
		 */
		usa_chips(article_property) {
			if (!article_property.article_property_values) {
				return false
			}
			return article_property.article_property_values.length <= this.tope_de_chips()
		},
		/**
		 * El valor elegido de esta propiedad, o null si todavia no eligio ninguno.
		 *
		 * El 0 es el "Seleccione X" del desplegable de siempre, que es como arranca el articulo
		 * (lo deja asi la mutacion `setArticleToShow`).
		 *
		 * @param {Object} article_property
		 * @returns {string|null}
		 */
		valor_elegido(article_property) {
			let elegido = this.article_to_show.selected_article_properties[article_property.article_property_type.name]
			if (!elegido || elegido === 0) {
				return null
			}
			return elegido
		},
		/**
		 * Si este valor es el elegido de su propiedad.
		 *
		 * @param {Object} article_property
		 * @param {Object} article_property_value
		 * @returns {boolean}
		 */
		es_elegido(article_property, article_property_value) {
			return this.valor_elegido(article_property) == article_property_value.name
		},
		/**
		 * Elige un valor desde un chip.
		 *
		 * 🔴 Escribe en el MISMO lugar que escribia el `v-model` del desplegable
		 * (`selected_article_properties[nombre_de_la_propiedad]`) y llama al MISMO
		 * `setSelectedVariant()`. Lo que cambia es el control, no el comportamiento: la logica
		 * de resolver que variante quedo elegida no se toca.
		 *
		 * @param {Object} article_property
		 * @param {Object} article_property_value
		 * @returns {void}
		 */
		elegir(article_property, article_property_value) {
			this.$set(
				this.article_to_show.selected_article_properties,
				article_property.article_property_type.name,
				article_property_value.name
			)
			this.setSelectedVariant()
		},
		getOptions(article_property) {
			let options = []
			options.push({
				value: 0,
				text: 'Seleccione '+article_property.article_property_type.name,
			})
			article_property.article_property_values.forEach(article_property_value => {
				options.push({
					value: article_property_value.name,
					text: article_property_value.name,
				})
			})
			return options
		},
		setSelectedVariant() {
			let is_variant = true
			let selected_variant = null
			// console.log('selected_article_properties')
			// console.log(this.article_to_show.selected_article_properties)

			this.article_to_show.article_variants.find(article_variant => {
				// console.log('variante: '+article_variant.variant_description)
				article_variant.article_property_values.forEach(article_property_value => {
					// console.log('article_property_value: '+article_property_value.name)
					if (!this.isSelectedPropertyValue(article_property_value)) {
						is_variant = false
					}
				})

				if (is_variant) {
					// console.log('IS VARIANT: '+article_variant.variant_description)
					selected_variant = article_variant
				} else {
					is_variant = true
				}
				// console.log('------------------------------')
			})

			if (selected_variant) {
				this.$store.commit('articles/setSelectedArticleVariant', selected_variant)
				this.article_to_show.variant_id = selected_variant.id
				this.setVariantImage()
				console.log('selected_variant')
				console.log(selected_variant)
			} else {
				this.$store.commit('articles/setSelectedArticleVariant', null)
			}
		},
		isSelectedPropertyValue(article_property_value) {
			// console.log('comparando article_property_type '+article_property_value.article_property_type.name+' con '+article_property_value.name)
			// console.log(this.article_to_show.selected_article_properties[article_property_value.article_property_type.name] == article_property_value.name)
			return this.article_to_show.selected_article_properties[article_property_value.article_property_type.name] == article_property_value.name
		},
	}
}
</script>
<style lang="sass">
.article-variants
	text-align: left

	select
		margin-bottom: 15px

	.article-variants__grupo
		margin-bottom: 1rem

		&:last-child
			margin-bottom: 0

	.article-variants__label
		margin: 0 0 .4rem 0
		font-size: 14px
		line-height: 1.3
		color: rgba(0, 0, 0, .55)

	.article-variants__label-valor
		font-weight: 600
		color: rgba(0, 0, 0, .9)

	// La fila de chips de la captura: 40px de alto, radio 6, borde de 1px y 8px de separacion.
	.article-variants__chips
		display: flex
		flex-direction: row
		flex-wrap: wrap
		gap: 8px

	.article-variants__chip
		display: inline-flex
		align-items: center
		justify-content: center
		min-width: 40px
		height: 40px
		padding: 0 12px
		border: 1px solid rgba(0, 0, 0, .25)
		border-radius: 6px
		background: #FFF
		font-size: 14px
		line-height: 1
		color: rgba(0, 0, 0, .9)
		cursor: pointer
		transition: border-color .15s

		&:hover
			border-color: rgba(0, 0, 0, .45)

	// El elegido, en el color del comercio. El borde pasa a 2px y el padding baja 1px de cada
	// lado para que el chip no cambie de tamano al elegirlo y la fila no se mueva.
	.article-variants__chip--elegido
		border: 2px solid var(--primary-color)
		padding: 0 11px

	.article-variants__chip-img
		width: 40px
		height: 40px
		object-fit: cover
		border-radius: 4px
</style>
