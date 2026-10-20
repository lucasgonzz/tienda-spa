<template>
	<div 
	v-if="show"
	class="descriptions m-b-15">
		<div
		class="card">
			<h5
			class="header">
				Descripcion
			</h5>
			<div 
			v-for="(description, index) in descripcion_a_mostrar.estructuradas"
			:key="description.id ? 'description-'+description.id : 'description-index-'+index"
			class="body description">
				<p
				class="title">
					{{ description.title }}
				</p>
				<p
				:style="description_content_style"
				v-html="descripcionConSaltos(description.content)"></p>
			</div>
			<!--
				Respaldo: el texto suelto del articulo se muestra SOLO si no hay descripciones
				con titulo (el helper devuelve '' si las hay).
			-->
			<div
			v-if="descripcion_a_mostrar.texto"
			class="body description">
				<p
				:style="description_content_style"
				v-html="descripcionConSaltos(descripcion_a_mostrar.texto)"></p>
			</div>
		</div>
	</div>
</template>
<script>
import { descripciones_a_mostrar, tiene_descripcion } from '@/helpers/descripcion_articulo'

export default {
	computed: {
		/**
		 * Articulo activo mostrado en el detalle.
		 *
		 * @returns {Object}
		 */
		article() {
			return this.$store.state.articles.article_to_show
		},
		/**
		 * Que se muestra: las descripciones con titulo o, si no hay ninguna, el texto suelto.
		 * La regla vive en `helpers/descripcion_articulo.js`, compartida con el resumen
		 * recortado y con la ficha.
		 *
		 * @returns {{estructuradas: Array, texto: string}}
		 */
		descripcion_a_mostrar() {
			return descripciones_a_mostrar(this.article)
		},
		/**
		 * Define si existe contenido de descripcion para renderizar el bloque.
		 *
		 * @returns {boolean}
		 */
		show() {
			return tiene_descripcion(this.article)
		},
		/**
		 * Estilo inline para aplicar el tamaño de fuente configurado.
		 *
		 * @returns {Object}
		 */
		description_content_style() {
			/* Configuracion online para no repetir accesos anidados en el template. */
			let online_configuration = this.$store.state.commerce.commerce
				? this.$store.state.commerce.commerce.online_configuration
				: null
			/* Valor crudo para convertirlo a número y validar rango permitido. */
			let raw_font_size = online_configuration
				? Number(online_configuration.article_description_font_size)
				: null
			/* Fallback seguro para mantener compatibilidad con configuraciones previas. */
			let font_size = raw_font_size && raw_font_size >= 10 && raw_font_size <= 60
				? raw_font_size
				: 16
			return {
				fontSize: font_size + 'px',
			}
		}
	},
	methods: {
		descripcionConSaltos(text) {
			/* Una descripcion con titulo puede venir sin contenido: no debe romper el render. */
			return String(text || '').replace(/\n/g, '<br>');
		}
	}
}
</script>
<style lang="sass">
.descriptions
	background: #FFF
	border-radius: 10px
	border: 2px solid #DDDDDD
	.title 
		font-size: 1.2em
		font-weight: bold 
		margin: 10px 0
		text-align: left
</style>