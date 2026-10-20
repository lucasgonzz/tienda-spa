<template>
	<b-row
	v-if="items.length"
	class="contact-info justify-content-center">
		<b-col
		cols="12"
		md="10"
		lg="8"
		xl="6"
		class="contact-info__inner mx-auto text-center">
			<div 
			class="title">
				Encontranos en
			</div>
			<vue-horizontal-list 
			:items="items" :options="options">
				<template v-slot:default="{ item }">
					<div 
					class="contact-item"
					@click="setItem(item)">
						<img :src="img(item.image_url)" alt="">
					</div>
				</template>
			</vue-horizontal-list>
		</b-col>
	</b-row>
</template>
<script>
export default {
	components: {
		VueHorizontalList: () => import('vue-horizontal-list'),
	},
	computed: {
		options() {
			return {
				responsive: [
					{ end: 576, size: 3 },
					{ start: 576, size: 4 },
				],
				items: {
					padding: 0,
				},
				list: {
					// 1200 because @media (min-width: 1200px) and therefore I want to switch to windowed mode
					windowed: 0,

					// Because: #app {padding: 80px 24px;}
					padding: 10,
				},
				position: {
					start: 1,
				},
				autoplay: { play: true, repeat: true, speed: 2000 },
			}
		},
		items() {
			let items = []
			if (this.commerce.phone) {
				items.push({
					image_url: 'whatsapp.png',
					link: 'https://api.whatsapp.com/send?phone='+this.commerce.phone,
				})
			}
			if (this.commerce.online_configuration.instagram) {
				items.push({
					image_url: 'instagram.png',
					link: this.commerce.online_configuration.instagram,
				})
			}
			if (this.commerce.online_configuration.facebook) {
				items.push({
					image_url: 'facebook.png',
					link: this.commerce.online_configuration.facebook,
				})
			}
			if (this.commerce.email) {
				items.push({
					image_url: 'mail.png',
					link: 'mailto:'+this.commerce.email,
				})
			}
			return items
		},
	},
	methods: {
		img(url) {
			return require('@/assets/'+url)
		},
		setItem(item) {
			window.open(item.link)
		}
	}
}
</script>
<style lang="sass">
.contact-info
	background: #CFCFCF
	justify-content: center
	.contact-info__inner
		display: flex
		flex-direction: column
		align-items: center
		// Con `align-items: center` el carrusel mide lo que mide su contenido y no lo que mide la
		// columna: cuatro contactos son 608px, y en un teléfono (375px) quedaba de x=-116 a x=492, con
		// 125px de scroll horizontal en la página (medido el 15/10/2026 en Masquito y en el slot). Con
		// el tope, el carrusel nunca es más ancho que la columna: la librería lo mide al montar y
		// reparte los casilleros dentro, y lo que no entra se desliza (autoplay o dedo).
		// El tope va SOLO por debajo de 768px, donde la columna ocupa todo el ancho menos 30px. Desde
		// 768px la columna es una fracción del ancho (en xl, la mitad): topear contra ella achica el
		// carrusel a 576px o menos entre los 1200 y los 1212px, la librería pasa de 4 a 3 casilleros y en
		// escritorio le aparecen una flecha y un autoplay que hoy no tiene. Por la misma razón no se
		// achica `.contact-item`: la librería elige 3 o 4 casilleros según el ancho del CARRUSEL
		// (probado el 15/10/2026: 608px -> 470px y aparece la flecha).
		.vue-horizontal-list
			@media screen and (max-width: 767.98px)
				max-width: 100%
	.title 
		font-size: 25px
		margin: 25px 0 -15px
		text-align: center
		width: 100%
	.cont-contact-items
		background: #F7F7F7
		display: flex
		flex-direction: row 
		// flex-wrap: no-wrap 
		max-width: 100%
		overflow-x: scroll 
	.contact-item 
		width: 110px
		display: flex
		justify-content: center 
		align-items: center 
		margin: 15px 15px 30px
		img 
			width: 75px
			height: 75px
			cursor: pointer
			&:hover 
				transform: scale(1.07)
				transition: all .2s
</style>