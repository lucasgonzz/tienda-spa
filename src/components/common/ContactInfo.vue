<template>
	<b-row
	class="contact-info">
		<b-col
		cols="12"
		md="10"
		lg="8"
		xl="6">
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
	.title 
		font-size: 25px
		margin: 25px 0 -15px
		text-align: center
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