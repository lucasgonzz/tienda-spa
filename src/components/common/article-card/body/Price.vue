<template>
<div>
	<div
	v-if="puede_ver_precios() || is_promocion_vinoteca">
		<p 
		v-if="$route.name == 'Cart' || $route.name == 'Orders'"
		class="product-price">
			{{ price(article.pivot.price) }}
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
		}
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
