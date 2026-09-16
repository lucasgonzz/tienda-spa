<template>
<b-skeleton-wrapper :loading="loading">
	<template v-slot:loading>
		<b-card
		class="card-skeleton m-b-15">
			<b-skeleton type="button" width="70%" class="m-b-15"></b-skeleton>
			<b-skeleton type="button" width="40%" class="m-b-15"></b-skeleton>
			<b-skeleton type="button" width="100%"></b-skeleton>
		</b-card>
	</template>
	<!--
		🔴 La clase dejo de ser `.article-data` a proposito (16/9/2026). Esta columna ya no es
		una tarjeta: la ficha entera vive adentro de UNA sola tarjeta blanca, que la pone
		`article-view/Index.vue`. Y habia reglas `.plantilla-comerciocity .article-data ...` en
		`_plantilla_comerciocity.sass` (padding de 28px, nombre de 26px) con especificidad
		(0,3,0) que con el nombre viejo seguian mandando y dejaban un marco adentro de otro.

		El orden es el de las capturas de Mercado Libre: condicion → nombre → precio → cuotas →
		envio → variantes → lo que tenes que saber. La caja de compra se fue a su propia columna
		(`buy-box/Index.vue`).
	-->
	<!--
		Sin margen propio arriba: adentro de la tarjeta la columna de datos tiene que arrancar a
		la misma altura que la foto, y los 20px de `m-t-20` la bajaban medio renglon.
	-->
	<div
	class="ficha-datos"
	v-if="article_to_show">
		<condition></condition>

		<name-heart></name-heart>

		<price></price>
		<vinoteca></vinoteca>

		<payment-methods-info></payment-methods-info>

		<!--
			Envío por correo (Zipnova): el comprador ve cuánto sale y cuánto tarda con su código
			postal antes de agregar al carrito. Solo si el comercio lo tiene conectado. Se ve
			también en el modal de agregar al carrito (mismo componente).
		-->
		<cotizador-envio
		v-if="commerce.envios_zipnova"
		:articulos="[{ id: article_to_show.id, amount: 1 }]"></cotizador-envio>

		<variants></variants>

		<saber-del-producto></saber-del-producto>

		<!-- <notes></notes> -->

		<div class="ficha-datos__actions">
			<compartir
			:article="article_to_show"></compartir>

			<whatsapp-link></whatsapp-link>
		</div>
	</div>
</b-skeleton-wrapper>
</template>
<script>
import NameHeart from '@/components/article/components/data/NameHeart'
import PaymentMethodsInfo from '@/components/article/components/data/PaymentMethodsInfo'
import Price from '@/components/article/components/data/Price'
import Condition from '@/components/article/components/data/Condition'
// import Notes from '@/components/article/components/data/Notes'
import Compartir from '@/components/article/components/data/Compartir'
import WhatsappLink from '@/components/article/components/data/WhatsappLink'
import CotizadorEnvio from '@/components/common/envio/Cotizador'

import BtnLoader from '@/components/common/BtnLoader'
export default {
	name: 'ArticleData',
	components: {
		NameHeart,
		Vinoteca: () => import('@/components/article/components/data/Vinoteca'),
		PaymentMethodsInfo,
		Price,
		Condition,
		// Notes,
		Compartir,
		WhatsappLink,
		CotizadorEnvio,
		Variants: () => import('@/components/article/components/data/Variants'),
		SaberDelProducto: () => import('@/components/article/components/data/SaberDelProducto'),

		BtnLoader,
	},
	computed: {
		loading() {
			return this.$store.state.articles.loading_article_to_show
		},
	},
}
</script>
<style lang="sass">
.ficha-datos
	/* Anula text-align: center de #app en la columna de datos del producto. */
	text-align: left

	.payment-methods-info
		margin-top: .75rem

	.article-variants
		margin-top: 1rem

	.saber-del-producto
		margin-top: 1.25rem

	// El separador del cotizador de envio. Lo declaraba `common/envio/Cotizador.vue` como
	// `.article-data .envio-cotizador`, y esa cadena quedo muerta al renombrar la columna. Se
	// repone aca, con la clase nueva, para que el bloque siga leyendose separado del resto.
	.envio-cotizador
		padding-top: .85rem
		border-top: 1px solid rgba(0, 0, 0, .08)
		margin-bottom: .25rem

/* Acciones secundarias del artículo (compartir y WhatsApp). */
.ficha-datos__actions
	margin-top: 1rem
	display: flex
	flex-direction: column
	align-items: stretch
	gap: 0.5rem
	width: 100%

// El nombre del producto con los tamaños de la captura: 22px y peso 600.
//
// 🔴 La cadena arranca en `.ficha-ml__datos` (la columna que arma `article-view/Index.vue`) y
// no en `.ficha-datos` a proposito: el estilo de `NameHeart.vue` es `scoped`, o sea
// `.cont-name .product-name[data-v-hash]`, que vale (0,3,0) — lo mismo que valdria esta regla
// con un nivel menos. En un empate gana el que va despues en la hoja, y eso depende del orden
// de compilacion: con el nivel de mas queda (0,4,0) y gana siempre.
.ficha-ml__datos .ficha-datos .cont-name .product-name
	font-size: 22px
	font-weight: 600
	line-height: 1.3
	letter-spacing: -.01em
	color: rgba(0, 0, 0, .9)
	@media screen and (max-width: 576px)
		font-size: 20px
</style>
