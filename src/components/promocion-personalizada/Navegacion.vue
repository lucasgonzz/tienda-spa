<template>
	<div
	class="promo-nav">

		<button
		type="button"
		class="promo-nav__flecha promo-nav__flecha--anterior"
		aria-label="Oferta anterior"
		@click="$emit('anterior')">
			<i class="bi bi-chevron-left"></i>
		</button>

		<div
		class="promo-nav__puntos">
			<button
			v-for="i in total"
			:key="i"
			type="button"
			class="promo-nav__punto"
			:class="(i - 1) == indice ? 'promo-nav__punto--activo' : ''"
			:aria-label="'Ver la oferta ' + i"
			@click="$emit('ir', i - 1)">
				<span class="promo-nav__punto-marca"></span>
			</button>
		</div>

		<button
		type="button"
		class="promo-nav__flecha promo-nav__flecha--siguiente"
		aria-label="Oferta siguiente"
		@click="$emit('siguiente')">
			<i class="bi bi-chevron-right"></i>
		</button>

	</div>
</template>
<script>
/**
 * Puntos y flechas para moverse entre las ofertas. Sin nada de logica de datos: recibe
 * cuantas hay y cual se esta viendo, y avisa hacia arriba.
 */
export default {
	props: {
		total: {
			type: Number,
			required: true,
		},
		indice: {
			type: Number,
			required: true,
		},
	},
}
</script>
<style lang="sass">
.promo-nav
	display: flex
	flex-direction: row
	align-items: center
	justify-content: center
	gap: .5rem
	margin-top: 1.5rem

	.promo-nav__puntos
		display: flex
		flex-direction: row
		align-items: center
		justify-content: center

	// El punto visible mide 8px, pero el area tactil real es de 44x44: es el minimo con el
	// que un dedo acierta sin pelearse con el de al lado.
	.promo-nav__punto
		width: 44px
		height: 44px
		display: flex
		align-items: center
		justify-content: center
		padding: 0
		border: none
		background: none
		cursor: pointer
		-webkit-appearance: none
		appearance: none

		&:focus
			outline: none

		&:focus-visible
			outline: 2px solid var(--secondary-color)
			outline-offset: -8px
			border-radius: 999px

	.promo-nav__punto-marca
		width: 8px
		height: 8px
		border-radius: 999px
		background: #1d1d1f
		opacity: .22
		transition: opacity 280ms var(--curva-promo), transform 280ms var(--curva-promo)

	.promo-nav__punto--activo
		.promo-nav__punto-marca
			opacity: 1
			background: var(--secondary-color)
			transform: scale(1.15)

	.promo-nav__flecha
		width: 44px
		height: 44px
		display: flex
		align-items: center
		justify-content: center
		padding: 0
		border: none
		border-radius: 999px
		background: none
		color: #1d1d1f
		font-size: 1.1rem
		opacity: .4
		cursor: pointer
		-webkit-appearance: none
		appearance: none
		transition: opacity 220ms var(--curva-promo)

		&:hover
			opacity: .9

		&:focus
			outline: none

		&:focus-visible
			outline: 2px solid var(--secondary-color)
			outline-offset: 2px
			opacity: .9

// Escritorio: las flechas salen del panel y quedan a los costados, centradas verticalmente.
// El ancestro posicionado es .promo__panel (position: relative), que es justo el borde del
// que tienen que salirse.
@media screen and (min-width: 1366px)
	.promo-nav
		margin-top: 2rem

		.promo-nav__flecha
			position: absolute
			top: 50%
			transform: translateY(-50%)
			width: 52px
			height: 52px
			font-size: 1.35rem

		.promo-nav__flecha--anterior
			left: -68px

		.promo-nav__flecha--siguiente
			right: -68px
</style>
