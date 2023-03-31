<template>
	<b-col
	class="copyright"
	cols="12">
		<p>
			Copyright {{ commerce.company_name }} - {{year }}. Todos los derechos reservados. Defensa de las y los consumidores. Para reclamos 
			<a href="https://autogestion.produccion.gob.ar/consumidores" target="_blank">
				<strong>
					ingrese aquí
				</strong>
			</a>
		</p>
		<p
		class="comerciocity-info">
			Creado con 
			<img 
			src="@/assets/comerciocity-logo.png" alt="">
		</p>
	</b-col>
</template>
<script> 
import moment from 'moment'
export default {
	computed: {
		year() {
			return moment().format('Y')
		}
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.copyright
	background: darken($green, 20)
	padding: 15px 
	display: flex 
	flex-direction: row 
	flex-wrap: wrap
	justify-content: space-between
	p, a
		color: rgba(255,255,255,.8)
		font-size: 15px
		margin: 10px 0
		margin-bottom: 0 !important
	.comerciocity-info
		font-size: 12px
		text-align: left
	img
		width: 70px
</style>