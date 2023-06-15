<template>
	<b-row
	v-if="show"
	:class="margin_bottom"
	class="footer">
		<b-col
		cols="12"
		md="4">
			<h3>
				Categorias
			</h3>
			<p
			v-for="category in categories"
			:key="category.id"
			@click="setSelectedCategory(category)">
				{{ category.name }}
			</p>
		</b-col>
		<b-col
		md="4">
			<h3>
				Contactanos
			</h3>
			<p>
				<a 
				:href="'mailto:'+commerce.email">
					<i class="icon-message"></i>
					{{ commerce.email }}
				</a>
			</p>
			<p>
				<a 
    			:href="'https://api.whatsapp.com/send?phone='+commerce.phone"
    			target="_blank">
					<i class="icon-whatsapp"></i>
					{{ commerce.phone }} 
    			</a>
			</p>
		</b-col>
		<b-col
		md="4">
			<h3>
				Buscanos en
			</h3>
			<p
			v-if="commerce.online_configuration.instagram">
				<a target="_blank" :href="commerce.online_configuration.instagram">
					<i class="icon-instagram"></i>
					Instagram
				</a>
			</p>
			<p
			v-if="commerce.online_configuration.facebook">
				<a target="_blank" :href="commerce.online_configuration.facebook">
					<i class="icon-facebook"></i>
					Facebook
				</a>
			</p>
		</b-col>
		<copyright-component></copyright-component>	
	</b-row>
</template>
<script>
import categories from '@/mixins/_categories'
export default {
	mixins: [categories],
	computed: {
		show() {
			return this.route_name != 'Messages' && this.route_name != 'Maps'
		},
		categories() {
			return this.$store.state.categories.categories
		}, 
		items() {
			return [
				{
					icon: 'diamond',
					title: 'Mejor calidad',
					content: 'Garantizamos tu satisfacción'
				},
				{
					icon: 'clock',
					title: 'Soporte 24/7',
					content: 'Nuestro soporte telefonico esta siempre disponible para usted'
				},
				{
					icon: 'trophy',
					title: 'Precio competitivo',
					content: 'La mejor relacion calidad precio'
				},
				{
					icon: 'shield',
					title: 'Certificado SSL',
					content: 'Protegemos tus compras con una conexión segura a internet'
				},
			]
		},
		margin_bottom() {
			if (this.is_mobile) {
				if (this.route_name == 'Article') {
					return ''
				}
				if (this.route_name == 'Home' && this.cart_articles.length) {
					return ''
				}
			}
			return 'margin-bottom'
		},
	},
	components: { 
		CopyrightComponent: () => import('@/components/common/footer/Copyright')
	},
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.margin-bottom 
	margin-bottom: -65px !important
.footer 

	@if ($theme == dark) 
		background: #111111
		[class^='icon-'], h6, h3
			color: #FFF
	@else if ($theme == ligth) 
		background: rgba(0,0,0,.1)
		[class^='icon-'], h6, h3
			color: rgba(0,0,0,.7)

	[class^='col-']
		padding: 0 15px

	h3 
		font-size: 18px
		text-align: left
		color: rgba(0,0,0,.9)
		font-weight: bold
		margin: 35px 0
		padding-left: 35px
	.cont 
		padding: 0 2em 2em
		@media screen and (min-width: 768px)
			padding-bottom: 5em
		[class^='icon-']
			font-size: 3em
		h6 
			font-weight: bold
		// p 
		// 	color: rgba(0,0,0,.7)
	p, a
		text-align: left
		color: rgba(0,0,0,.9)
		font-size: 15px
		margin-bottom: 20px
		cursor: pointer 
	p 
		padding-left: 35px
		&:last-child
			margin-bottom: 20px
		i 
			padding-right: 7px
</style>