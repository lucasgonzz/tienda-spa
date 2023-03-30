<template>
	<b-card
	no-body
	class="shadow cupon-card">
		<i 
		@click="remove"
		class="btn-remove icon-cancel c-p"></i>
		<div class="cupon-body">
			<div class="img-container">
				<i class="icon-cupon"></i>
			</div>
			<div class="cupon-data">
				<p
				v-if="cupon.amount">
					Descuento de {{ price(cupon.amount) }} (pesos)
				</p>
				<p
				v-else>
					Descuento de un {{ cupon.percentage }}%
				</p>
				<p
				v-if="cupon.min_amount">
					Compra minima de {{ price(cupon.min_amount) }}
				</p>
				<p
				v-if="cupon.expiration_date">
					Valido hasta el {{ date(cupon.expiration_date) }}
				</p>
			</div>
		</div>
	</b-card>
</template>
<script>
export default {
	props: ['cupon'],
	methods: {
		remove() {
			this.$store.commit('cart/setCupon', null)
		}
	}
}
</script>
<style lang="sass">
.cupon-card
	margin-bottom: 1em
	&:last-child
		margin-bottom: 0
	.btn-remove
		position: absolute
		top: 10px
		right: 10px
	.cupon-body
		display: flex
	.img-container
		width: 30%
		display: flex
		justify-content: center
		align-items: center
		i 
			font-size: 4em
	.cupon-data
		width: 70%
		padding: 1em 0
		display: flex
		flex-direction: column
		align-items: flex-start
		justify-content: center
		p 
			text-align: left
</style>