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
 