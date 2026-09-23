<template>
	<!--
		La lista EXPLICITA de los descuentos y recargos del cliente del comprador (mision
		descuentos-recargos-por-cliente): un titulo y, por cada ajuste, su badge (verde el
		descuento, ambar el recargo, el mismo diseño que los del precio) con el nombre al lado.

		La usan el desplegable del nombre (escritorio y celular) y los resumenes del carrito y del
		checkout. Con la lista vacia no se dibuja nada: un comprador sin cliente del ERP, sin
		ajustes o contra una API vieja no ve ningun bloque.
	-->
	<div
	v-if="ajustes && ajustes.length"
	class="ajustes-de-cliente">
		<p class="ajustes-de-cliente__titulo">
			{{ titulo }}
		</p>
		<ul class="ajustes-de-cliente__lista">
			<li
			v-for="ajuste in ajustes"
			:key="ajuste.tipo + '-' + ajuste.id"
			class="ajustes-de-cliente__item">
				<b-badge
				:class="ajuste.tipo == 'recargo' ? 'ajustes-de-cliente__badge--recargo' : 'ajustes-de-cliente__badge--descuento'"
				class="ajustes-de-cliente__badge">
					{{ texto_de_ajuste(ajuste) }}
				</b-badge>
				<span
				v-if="ajuste.name"
				class="ajustes-de-cliente__nombre">
					{{ ajuste.name }}
				</span>
			</li>
		</ul>
	</div>
</template>
<script>
/**
 * Lista de descuentos y recargos del cliente.
 *
 * @prop {Array} ajustes cada uno {id, tipo: 'descuento'|'recargo', name, percentage}. Sale de
 *                       ajustes_del_comprador() o de ajustes_del_carrito() del mixin global.
 * @prop {String} titulo la frase de arriba de la lista.
 */
export default {
	name: 'AjustesDeCliente',
	props: {
		ajustes: {
			type: Array,
			default: () => [],
		},
		titulo: {
			type: String,
			default: '',
		},
	},
}
</script>
<style scoped lang="sass">
// Sin ancho propio: lo pone quien lo usa (el desplegable del nombre le da uno minimo, los
// resumenes del carrito lo dejan ocupar la columna).
.ajustes-de-cliente
	text-align: left
	white-space: normal

	.ajustes-de-cliente__titulo
		font-size: .85rem
		line-height: 1.3
		color: rgba(0, 0, 0, .65)
		margin: 0 0 .35rem 0

	.ajustes-de-cliente__lista
		list-style: none
		padding: 0
		margin: 0

	.ajustes-de-cliente__item
		display: flex
		flex-direction: row
		align-items: center
		flex-wrap: wrap
		gap: .4rem
		margin-bottom: .25rem
		font-size: .85rem
		line-height: 1.3

	// El mismo badge que los del precio (article-card/body/Price.vue): 12px, 600, 3px de radio.
	.ajustes-de-cliente__badge
		font-size: 12px
		font-weight: 600
		line-height: 1.3
		padding: 2px 5px
		border-radius: 3px
		white-space: nowrap
		color: #FFF

	.ajustes-de-cliente__badge--descuento
		background-color: #00A650

	.ajustes-de-cliente__badge--recargo
		background-color: #C25E00

	.ajustes-de-cliente__nombre
		color: rgba(0, 0, 0, .8)
		// Un nombre largo se parte en palabras y no desborda el desplegable.
		overflow-wrap: anywhere
</style>
