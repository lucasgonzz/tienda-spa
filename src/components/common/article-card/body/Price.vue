<template>
<div>
	<div
	v-if="puede_ver_precios() || is_promocion_vinoteca">
		<p
		v-if="$route.name == 'Cart' || $route.name == 'Orders'"
		class="product-price">
			{{ price(article.pivot.price) }}
			<!--
				El precio original tachado al lado de lo que se cobra, solo en el CARRITO. Ver
				precio_original_de_linea: en pedidos ya cerrados no va, y la base se compara
				contra el pivot y no contra articlePriceEfectivo.
			-->
			<span
			v-if="precio_original_de_linea"
			class="price__tachado">
				{{ precio_original_de_linea }}
			</span>
		</p>
		<div 
		v-else
		translate="no">
			<p
			class="product-price"
			v-if="is_promocion_vinoteca">
				{{ price(article.final_price) }}				
			</p>
			<div
			v-else>
				
				<div
				class="vinoteca"
				v-if="article.presentacion">
					
					<p
					v-if="!flag_activo(article.precio_pausado)"
					class="precio-unitario">
						Precio Unitario: {{ precio_por_unidad(article) }}
					</p>
					<p
					class="precio-por-caja text-danger">
						Precio X Caja: {{ articlePriceEfectivo(article) }}
					</p>

				</div>

				<p
				class="product-price"
				v-else>
					<!--
						El renglon del descuento, ARRIBA del precio: el badge verde primero y a
						su derecha el precio original tachado. Es el orden de la captura de la
						tarjeta de Mercado Libre, y es al reves que en la ficha, donde el badge
						va a la derecha del precio grande.

						Excluyente con el tachado de oferta personalizada de abajo:
						descuentos_visibles() devuelve [] apenas hay una oferta personalizada
						activa, asi que los dos nunca se dibujan juntos.
					-->
					<span
					v-if="precio_original_con_descuentos"
					class="price__linea-descuento">
						<b-badge
						v-for="(descuento, index) in badges_de_descuento"
						:key="'descuento-'+index"
						variant="success"
						class="price__badge-descuento">
							{{ texto_de_descuento(descuento) }}
						</b-badge>
						<span class="price__original-arriba">
							{{ precio_original_con_descuentos }}
						</span>
					</span>
					{{ articlePriceEfectivo(article) }}
					<!--
						El precio original, tachado al lado del descontado. Solo aparece cuando la
						oferta personalizada del comprador hizo que la API dejara final_price ya
						descontado; en cualquier otro caso precio_sin_oferta() devuelve null y
						esto no se renderiza.
					-->
					<span
					v-if="precio_sin_oferta(article)"
					class="price__tachado">
						{{ precio_sin_oferta(article) }}
					</span>
				</p>

			</div>
		</div>
	</div>
	<p
	class="info-para-ver-precios"
	v-else>
		<a @click.stop="toLogin">Inicie sesion</a> o 
		<a 
		target="_blank"
		:href="'https://api.whatsapp.com/send?phone='+commerce.phone">Solicite alta de cliente</a> para ver precios
	</p>
</div> 
</template>
<script>
export default {
	props: {
		article: Object,
	},
	computed: {
		is_promocion_vinoteca() {
			return typeof this.article.bar_code == 'undefined'
		},
		/**
		 * El precio original de esta linea, para tacharlo al lado de lo que se cobra.
		 *
		 * 🔴 Solo en el CARRITO, y la exclusion de 'Orders' es deliberada: en un pedido ya
		 * cerrado el precio del pivot es HISTORICO — es lo que se cobro el dia que se
		 * confirmo—, y tacharle al lado la base de hoy seria anunciar un ahorro que nadie sabe
		 * si existio. Si el precio de lista bajo desde entonces, incluso seria al reves.
		 *
		 * 🔴 La base sale de precio_base_de_linea() y no de precio_sin_oferta(): en esta vista
		 * el precio que se muestra es `article.pivot.price`, resuelto por el servidor y SIN el
		 * online_price_surchage que el SPA le suma a final_price. La comparacion tiene que ir
		 * contra el pivot y en su misma escala, o los dos numeros de al lado serian de escalas
		 * distintas.
		 *
		 * @returns {string|null}
		 */
		precio_original_de_linea() {
			if (this.$route.name != 'Cart') {
				return null
			}
			return this.precio_base_de_linea(this.article)
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
		toLogin() {
			this.$router.push({name: 'Login'})
		},
		toWhatsapp() {
			let link = 'https://api.whatsapp.com/send?phone='+this.commerce.phone
		}
	}
}
</script>
 
<style scoped lang="sass">
// El precio original tachado al lado del descontado. Nunca en rojo: es informacion, no una
// alarma. Un escalon mas chico que el precio de la tarjeta y bajado de opacidad.
.price__tachado
	font-size: 12px
	font-weight: 400
	margin-left: .35em
	color: rgba(0, 0, 0, .45)
	text-decoration: line-through
	// El importe no se parte a la mitad; si no entra al lado, cae entero al renglon de abajo.
	white-space: nowrap

// El renglon del descuento: badge verde + precio tachado, ARRIBA del precio grande. Es un
// bloque para que el precio grande caiga al renglon de abajo, y `flex` con `wrap` para que si
// entran dos badges y el tachado no se recorte ninguno.
.price__linea-descuento
	display: flex
	flex-direction: row
	align-items: center
	flex-wrap: wrap
	gap: .35rem
	margin-bottom: .1rem

// El precio ORIGINAL tachado, al lado del badge. Los 12px salen de la captura. Nunca en rojo:
// es informacion, no una alarma.
.price__original-arriba
	font-size: 12px
	font-weight: 400
	line-height: 1.2
	color: rgba(0, 0, 0, .45)
	text-decoration: line-through
	white-space: nowrap

// El badge verde de la captura, a la IZQUIERDA del tachado. El fondo se clava en #00A650 (el
// unico color que Lucas pidio copiar literal de Mercado Libre) y pisa al `variant="success"`
// de BootstrapVue, que compila el verde de Bootstrap.
.price__badge-descuento
	font-size: 12px
	font-weight: 600
	line-height: 1.3
	padding: 2px 5px
	border-radius: 3px
	white-space: nowrap
	background-color: #00A650
	color: #FFF
</style>
