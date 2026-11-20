<template>
	<div 
	class="cont-buttons m-t-10">
		
		<!-- La clase fija btn-ver-mas es el unico enganche estable para apuntarle desde una
		plantilla: el :class de al lado cambia entre btn-mas-info y w-100 segun si el visitante
		puede comprar, asi que no sirve como selector. -->
		<b-button
		class="btn-ver-mas"
		:class="(authenticated || puede_comprar_sin_login) ? 'btn-mas-info' : 'w-100'"
		@click.stop="toArticle(article)"
		variant="primary">
			<span
			class="d-sm-none">
				Ver
			</span>
			<span
			class="d-none d-sm-block">
				Ver mas
			</span>
		</b-button>
 		
 		<template
 		v-if="authenticated || puede_comprar_sin_login">
			<b-button
			v-if="!is_item_in_cart(article)"
			class="btn-add-to-cart"
			@click.stop="add_to_cart"
			:disabled="comprando || flag_activo(article.precio_pausado)"
			variant="outline-primary">
				<i class="bi bi-cart-plus"></i>
				<span class="btn-cart-label">Agregar</span>
			</b-button>
			<b-button
			v-else
			class="btn-add-to-cart"
			@click.stop="quitar"
			:disabled="comprando"
			variant="danger">
				<i class="bi bi-cart-plus"></i>
				<span class="btn-cart-label">Quitar</span>
			</b-button>
 		</template>

		<selector-compra v-if="comprando" :article="article" @terminar="comprando = false" />
	</div>
</template>
<script>
import articlesMixin from '@/mixins/articles'
import { tomar_compra } from '@/helpers/compra_desde_tarjeta'
import SelectorCompra from '@/components/common/article-card/SelectorCompra'
export default {
	mixins: [articlesMixin],
	components: { SelectorCompra },
	data() { return { comprando: false } },
	props: {
		article: Object,
	},
	methods: {
		add_to_cart() {
			if (this.comprando || (!this.authenticated && !this.puede_comprar_sin_login)) return
			if (tomar_compra(this.$store)) this.comprando = true
		},
		quitar() {
			if (!this.comprando) this.remove_cart(this.article)
		}
	}
}
</script>
<style lang="sass">
.cont-buttons
	display: flex  
	justify-content: space-between
	flex-direction: row 

	.btn-add-to-cart
		width: 45px

	.btn-mas-info
		width: calc(100% - 45px - 10px)

	// La etiqueta del boton de carrito nace oculta: en Moderno y en Clasico el boton es un icono
	// de 45px de ancho y el texto no entra. La plantilla ComercioCity, donde ese boton pasa a
	// ocupar la fila entera, la muestra desde _plantilla_comerciocity.sass.
	.btn-cart-label
		display: none


.plantilla-clasico
	.btn-mas-info
		display: none

	.btn-add-to-cart
		width: 100%
</style>