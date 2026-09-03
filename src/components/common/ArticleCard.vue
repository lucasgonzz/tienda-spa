<template> 
	<div 
	@click="callToArticle"
	class="model article-card animate__animated animate__fadeIn"
	:class="article_class"
	no-body>
		<div
		v-if="is_cart_view"
		@click.stop="removeArticle"
		class="btn-remove-article">
			<i class="bi bi-x-lg"></i>
		</div>

		<div 
		v-if="!hasStock(article)"
		class="agotado">
			Agotado
		</div>

		<div class="cont-images">
			
			<vue-load-image
			class="img-fluid">
				<img 
				slot="image"
				:src="articleImage(article)">
		        <b-spinner
				slot="preloader"
		        variant="success"></b-spinner>
				<div slot="error">Imagen no encontrada</div>
			</vue-load-image>
			
		</div>
		<div
		class="card-article-body">
			<p 
			v-if="article.brand"
			class="product-brand">
				{{ article.brand.name }}
			</p>
			<p 
			translate="no"
			class="product-name">
				{{ article_name }}
			</p>
			<p 
			v-if="is_cart_view"
			class="amount">
				Cantidad: {{ article.amount }}
			</p>
			<div 
			v-if="is_cart_view && article.selected_variant"
			class="amount">
				<p
				class="m-b-0"
				v-for="article_property_value in article.selected_variant.article_property_values">
					{{ article_property_value.article_property_type.name }}: {{ article_property_value.name }}
				</p>
			</div>
			<p 
			v-if="is_order_details"
			class="amount">
				Cantidad: {{ article.pivot.amount }}
			</p>
			<p
			v-if="articlePriceEfectivo(article)"
			translate="no"
			class="product-price">
				<!--
					El precio ORIGINAL tachado, en su propio renglon ARRIBA del precio con los
					descuentos generales del articulo. Excluyente con el tachado de oferta
					personalizada de abajo: descuentos_visibles() devuelve [] apenas hay una
					oferta personalizada activa.
				-->
				<span
				v-if="precio_original_con_descuentos"
				class="price__original-arriba">
					{{ precio_original_con_descuentos }}
				</span>
				{{ articlePriceEfectivo(article) }}
				<!--
					El precio original, tachado al lado del descontado. Solo aparece cuando la
					oferta personalizada del comprador hizo que la API dejara final_price ya
					descontado; en cualquier otro caso precio_sin_oferta() devuelve null y esto
					no se renderiza.
				-->
				<span
				v-if="precio_sin_oferta(article)"
				class="price__tachado">
					{{ precio_sin_oferta(article) }}
				</span>
				<!-- Un badge por descuento general, con SU propio porcentaje, a la derecha del precio. -->
				<b-badge
				v-for="(descuento, index) in badges_de_descuento"
				:key="'descuento-'+index"
				variant="danger"
				class="price__badge-descuento">
					{{ texto_de_descuento(descuento) }}
				</b-badge>
			</p>
			<b-button
			class="btn-more-info"
			v-if="!is_mobile"
			@click="toArticle(article)"
			variant="primary">
				Más info 
			</b-button>
			<div
			class="m-t-15"
			v-if="is_cart_view && article.amount > 1 && !flag_activo(article.precio_pausado)">
				<hr
				class="m-t-0">
				<p
				class="text-left m-b-5">
					Las {{ article.amount }} unidades
				</p>
				<p 
				class="product-price">
					{{ price(articlePriceEfectivo(article, false) * article.amount) }}
				</p>
			</div>
		</div>
	</div>
</template>
<script>
import VueLoadImage from 'vue-load-image'
import articlesMixin from '@/mixins/articles'
export default {
	name: 'ArticleCard',
	mixins: [articlesMixin],
	props: {
		article: Object,
		full_width: {
			type: Boolean,
			default: false
		},
		shadow: {
			type: String,
			default: 's'
		},
	},
	components: {
		VueLoadImage,
	},
	computed: {
		is_cart_view() {
			return this.$route.name == 'Cart'
		},
		is_order_details() {
			return this.$route.name == 'Orders'
		},
		article_class() {
			let class_ = ''
			if (this.full_width) {
				class_ += ' full-width'
			}
			if (this.shadow != 'shadow-2') {
				class_ += ' '+this.shadow
			} else {
				if (this.is_mobile) {
					class_ += ' shadow-2'
				} else {
					class_ += ' shadow-1'
				}
			}
			return class_
		},
		article_name() {
			if (this.article.variant) {
				return this.article.name + ' ' + this.article.variant.description
			} else {
				return this.article.name
			}
		},
		cart() {
			return this.$store.state.cart.cart
		},
		/**
		 * El precio original a tachar arriba, por los descuentos generales visibles del
		 * articulo. null en cualquier otro caso, incluido el del comprador con oferta
		 * personalizada, donde manda el tachado chico de al lado.
		 *
		 * @returns {string|null}
		 */
		precio_original_con_descuentos() {
			return this.precio_sin_descuentos(this.article)
		},
		/**
		 * Los badges de descuento, atados al tachado de arriba: sin tachado no hay badges.
		 *
		 * @returns {Array}
		 */
		badges_de_descuento() {
			if (!this.precio_original_con_descuentos) {
				return []
			}
			return this.descuentos_visibles(this.article)
		},
 	},
	methods: {
		callToArticle() {
			if (this.is_mobile) {
				this.toArticle(this.article)
			}
		},
		removeArticle() {
			this.$store.commit('cart/removeArticle', {
				item: this.article,
				remove_only_one_amount: true
			})
			if (this.authenticated) {
				this.$store.dispatch('cart/removeArticle', this.article)
			} else {
				localStorage.cart = JSON.stringify(this.cart) 
			}
		},
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.agotado
	position: absolute
	top: 0
	left: 0
	font-weight: bold 
	font-size: 16px
	border-radius: 4px 0 5px 0
	background: $red 
	color: #FFF
	z-index: 10
	padding: 5px 10px

// El precio original tachado al lado del descontado. Nunca en rojo: es informacion, no una
// alarma. Va anidado bajo .article-card porque este bloque NO es scoped y si no se escaparia
// al resto de la tienda.
.article-card
	.price__tachado
		font-size: .72em
		font-weight: 400
		margin-left: .35em
		opacity: .45
		text-decoration: line-through
		// El importe no se parte a la mitad; si no entra al lado, cae entero al renglon de abajo.
		white-space: nowrap
		@media screen and (max-width: 576px)
			font-size: .78em
			margin-left: .25em
	// El precio ORIGINAL tachado, en el renglon de ARRIBA del precio con descuentos. Un
	// escalon mas chico que el precio de la tarjeta y bajado de opacidad: informacion, no
	// alarma.
	.price__original-arriba
		display: block
		font-size: .62em
		font-weight: 400
		line-height: 1.15
		opacity: .5
		text-decoration: line-through
		white-space: nowrap
		@media screen and (max-width: 576px)
			font-size: .68em
	// Un badge por descuento, a la derecha del precio nuevo. Inline a proposito: si no entran
	// en el ancho de la tarjeta bajan de renglon ENTEROS, nunca se recortan ni se parten.
	.price__badge-descuento
		font-size: .48em
		font-weight: 600
		margin-left: .4em
		vertical-align: middle
		white-space: nowrap
		@media screen and (max-width: 576px)
			font-size: .55em
			margin-left: .3em
</style>
 