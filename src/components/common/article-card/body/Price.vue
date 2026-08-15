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
					v-if="!article.precio_pausado"
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
</style>
