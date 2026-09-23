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
					El renglon del descuento, ARRIBA del precio: el badge verde primero y a su
					derecha el precio original tachado. Es el orden de la captura de la tarjeta
					de Mercado Libre, y es al reves que en la ficha, donde el badge va a la
					derecha del precio grande.

					Excluyente con el tachado de oferta personalizada de abajo:
					descuentos_visibles() devuelve [] apenas hay una oferta personalizada activa.
				-->
				<span
				v-if="precio_original_con_descuentos || badges_de_descuento.length"
				class="price__linea-descuento">
					<!--
						Verde para los descuentos (del articulo y del cliente), ambar para los
						recargos del cliente (decision 3 de Lucas). Con un recargo que domina no hay
						tachado: el renglon queda con los badges solos.
					-->
					<b-badge
					v-for="badge in badges_de_descuento"
					:key="badge.clave"
					:class="badge.tipo == 'recargo' ? 'price__badge-recargo' : 'price__badge-descuento'">
						{{ badge.texto }}
					</b-badge>
					<span
					v-if="precio_original_con_descuentos"
					class="price__original-arriba">
						{{ precio_original_con_descuentos }}
					</span>
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
		 * Los badges del precio: los descuentos del articulo (atados a su tachado) y los ajustes
		 * del cliente. Ver badges_de_precio() en el mixin.
		 *
		 * @returns {Array}
		 */
		badges_de_descuento() {
			return this.badges_de_precio(this.article)
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
		font-size: 12px
		font-weight: 400
		margin-left: .35em
		color: rgba(0, 0, 0, .45)
		text-decoration: line-through
		// El importe no se parte a la mitad; si no entra al lado, cae entero al renglon de abajo.
		white-space: nowrap
	// El renglon del descuento: badge verde + precio tachado, ARRIBA del precio grande. Es un
	// bloque para que el precio grande caiga al renglon de abajo, y `flex` con `wrap` para que
	// si entran dos badges y el tachado no se recorte ninguno.
	.price__linea-descuento
		display: flex
		flex-direction: row
		align-items: center
		flex-wrap: wrap
		gap: .35rem
		margin-bottom: .1rem
	// El precio ORIGINAL tachado, al lado del badge. Los 12px salen de la captura. Nunca en
	// rojo: es informacion, no una alarma.
	.price__original-arriba
		font-size: 12px
		font-weight: 400
		line-height: 1.2
		color: rgba(0, 0, 0, .45)
		text-decoration: line-through
		white-space: nowrap
	// El badge verde de la captura, a la IZQUIERDA del tachado. El fondo se clava en #00A650
	// (el unico color que Lucas pidio copiar literal de Mercado Libre) y pisa al
	// `variant="success"` de BootstrapVue, que compila el verde de Bootstrap.
	.price__badge-descuento
		font-size: 12px
		font-weight: 600
		line-height: 1.3
		padding: 2px 5px
		border-radius: 3px
		white-space: nowrap
		background-color: #00A650
		color: #FFF
	// El badge de un RECARGO del cliente: mismo diseño que el de descuento, en ambar (decision
	// 3 de Lucas). Tono oscuro para que el texto blanco se lea igual que sobre el verde.
	.price__badge-recargo
		font-size: 12px
		font-weight: 600
		line-height: 1.3
		padding: 2px 5px
		border-radius: 3px
		white-space: nowrap
		background-color: #C25E00
		color: #FFF
</style>
 