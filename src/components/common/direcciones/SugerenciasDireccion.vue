<template>
	<ul
	v-if="sugerencias.length"
	:id="id_lista"
	role="listbox"
	aria-label="Direcciones sugeridas"
	class="sugerencias-direccion">
		<li
		v-for="(sugerencia, index) in sugerencias"
		:id="id_lista + '-' + index"
		:key="(sugerencia.place_id || 'sugerencia') + '-' + index"
		role="option"
		:aria-selected="index === activa ? 'true' : 'false'"
		:class="{'sugerencias-direccion__item--activa': index === activa}"
		class="sugerencias-direccion__item"
		@mousedown.prevent
		@mouseenter="$emit('activar', index)"
		@click="$emit('elegir', sugerencia)">
			<i
			class="bi bi-geo-alt sugerencias-direccion__pin"
			aria-hidden="true"></i>
			<span class="sugerencias-direccion__textos">
				<span class="sugerencias-direccion__principal">{{ sugerencia.principal }}</span>
				<span
				v-if="sugerencia.secundario"
				class="sugerencias-direccion__secundario">{{ sugerencia.secundario }}</span>
			</span>
		</li>
	</ul>
</template>
<script>
/**
 * La lista amigable de sugerencias del buscador de direcciones (misión
 * formas-envio-direcciones-maps, 19/10/2026): cada una en dos renglones, arriba la calle y la
 * altura (`mainText` de Google) y abajo la localidad y la provincia (`secondaryText`) en gris, con
 * un pin. Filas de 44px como mínimo para el dedo.
 *
 * Va en el flujo de la página (no flotando sobre el resto): así no la recorta un modal ni el
 * borde de la pantalla del teléfono, y empuja hacia abajo lo que sigue.
 *
 * El teclado lo maneja el input del buscador (flechas, Enter, Escape) con `aria-activedescendant`:
 * esta lista solo dibuja cuál está activa (`activa`) y avisa clicks y hovers.
 *
 * `@mousedown.prevent` evita que el input pierda el foco al tocar una sugerencia.
 */
export default {
	name: 'SugerenciasDireccion',
	props: {
		/** [{place_id, principal, secundario, texto, prediccion}] (helpers/google_places.js). */
		sugerencias: {
			type: Array,
			default: () => [],
		},
		/** Índice de la sugerencia activa con el teclado (-1: ninguna). */
		activa: {
			type: Number,
			default: -1,
		},
		/** Id de la lista (lo referencia el input con aria-controls / aria-activedescendant). */
		id_lista: {
			type: String,
			required: true,
		},
	},
}
</script>
<style lang="sass">
.sugerencias-direccion
	list-style: none
	margin: .4rem 0 0
	padding: .25rem 0
	background: #FFF
	border: 1px solid rgba(0, 0, 0, .14)
	border-radius: 12px
	box-shadow: 0 6px 18px rgba(0, 0, 0, .08)
	text-align: left

.sugerencias-direccion__item
	display: flex
	align-items: center
	gap: .7rem
	min-height: 44px
	padding: .55rem .85rem
	cursor: pointer

	& + &
		border-top: 1px solid rgba(0, 0, 0, .06)

.sugerencias-direccion__item--activa
	background: color-mix(in srgb, var(--secondary-color, #0d6efd) 8%, #fff)

.sugerencias-direccion__pin
	flex: 0 0 auto
	font-size: 1.1rem
	line-height: 1
	color: var(--secondary-color, #0d6efd)

.sugerencias-direccion__textos
	display: flex
	flex-direction: column
	min-width: 0

.sugerencias-direccion__principal
	font-size: .95rem
	font-weight: 600
	color: #1a1a1a
	overflow-wrap: anywhere

.sugerencias-direccion__secundario
	font-size: .82rem
	color: rgba(0, 0, 0, .55)
	overflow-wrap: anywhere
</style>
