<template>
	<div class="not-found view">
		<!--
			Pagina inexistente (ruta comodin `*` del router, mision seo-tiendas). Antes cualquier URL
			que no existia quedaba en blanco. Reusa la tarjeta de la vuelta del pago
			(`.payment-result*`, sass/_checkout.sass) para verse igual que el resto de los avisos
			de la tienda. Lleva noindex por `meta.noindex` de la ruta (App.vue) y el servidor ya
			respondio 404 (seo.php + tienda-api).
		-->
		<div class="payment-result">
			<div class="payment-result__card">
				<i class="bi bi-signpost-split payment-result__icon payment-result__icon--wait"></i>

				<h1 class="payment-result__title">
					No encontramos esta página
				</h1>
				<p class="payment-result__text">
					Puede que el link esté mal escrito o que la página ya no exista.
				</p>

				<div class="payment-result__actions">
					<a
					href="/"
					class="btn btn-success"
					@click.prevent="home">
						Volver a la tienda
					</a>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
import nav from '@/mixins/nav'

export default {
	name: 'NotFound',
	// home() del mixin nav es el mismo que usa "Inicio" del menu: limpia la categoria elegida y
	// pide los ultimos ingresados, que no se pidieron si el visitante entro directo a esta URL.
	mixins: [nav],
	metaInfo() {
		return {
			title: 'Página no encontrada',
		}
	},
}
</script>
