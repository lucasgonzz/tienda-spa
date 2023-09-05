<template>
	<div class="cont-search-input-btn">
		<div class="cont-search">
			<div 
			class="icon">
				<i class="icon-search"></i>
			</div>
			<b-form-input	
			v-model="query"
			@keyup="callSearch"
			placeholder="¿Que estas buscando?"
			class="input-search"></b-form-input>
		</div>
		<div 
		class="results">
			<div 
			v-if="loading"
			class="cont-center-sm">
			    <b-spinner></b-spinner>
			</div>
			<result
			@clearResults="clearResults"
			v-for="result in results"
			:model="result"></result>	
			<more-results-btn
			@clearResults="clearResults"
			:results="results"></more-results-btn>
		</div>
	</div>				
</template>
<script>
import search from '@/mixins/search'
export default {
	mixins: [search],
	components: {
		Result: () => import('@/components/nav/buscador/Result'),
		MoreResultsBtn: () => import('@/components/nav/buscador/MoreResultsBtn'),
	},
	data() {
		return {
			loading: false,
			interval: null,
			results: [],
		}
	},
	computed: {
		query: {
			get() {
				return this.$store.state.categories.search_query
			},
			set(value) {
				this.$store.commit('categories/setSearchQuery', value)
			},
		},
	},
	methods: {
		callSearch(e) {
			this.results = [] 
			if (e.key == 'Enter') {
				this.clearResults()
				this.searchArticle()
			} else if (e.key != 'ArrowDown' && e.key != 'ArrowUp') {
				this.loading = true 
				if (this.interval) {
		            window.clearInterval(this.interval)
					this.interval = null
				}
				if (this.query.length >= 2) {
					this.waiting_time = 1
					this.interval = window.setInterval(() => {
						if (this.waiting_time == 0) {
		                    window.clearInterval(this.interval)
							this.search()
						} else {
							this.waiting_time--
						}		
					}, 500)
				} else {
					this.loading = false 
				}
			}
		},
		search() {
			console.log('buscando')
			this.$api.get('articles/search/'+this.query+'/'+process.env.VUE_APP_COMMERCE_ID)
			.then(res => {
				this.loading = false 
				this.results = res.data.articles.data 
				console.log(this.results)
			})
			.catch(err => {
				console.log(err)
				this.loading = false 
				this.$toast.error('Hubo un error al realizar la busqueda')
			})
		},
		clearResults() {
			this.results = []
		},
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.cont-search-input-btn
	display: inline-flex	
	position: relative 
	@media screen and (max-width: 992px)
		width: 90%
	@media screen and (min-width: 992px) and (max-width: 1200px)
		width: 400px
	@media screen and (min-width: 1200px) and (max-width: 1400px)
		width: 600px
	@media screen and (min-width: 1400px)
		width: 700px
	.cont-search
		width: 100%
		position: relative
		display: flex
		flex-direction: row
		// box-shadow: 0 2px 4px rgb(0 0 0 / 15%) !important
		// border: 1px solid #ced4da
		// border-radius: 1px 
	.icon 
		background: #FFF
		width: 40px
		display: flex
		flex-direction: row
		align-items: center
		font-size: 1.2em
		justify-content: flex-end
		border-radius: 15px 0 0 15px
		i
			color: rgba(0, 0, 0, .6)
	.bg-gray 
		background: #e9ecef !important
	.input-search
		border-radius: 0 15px 15px 0 
		box-shadow: none !important
		border: none !important
		@media screen and (max-width: 992px)
			padding: 18px
		@media screen and (min-width: 992px)
			padding: 22px
	.results
		box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px
		border-radius: 0 0 7px 7px
		display: flex
		flex-direction: column
		position: absolute
		top: 100%
		left: 0
		width: 100%
		background: $green
		z-index: 300
		max-height: 60vh
		overflow-y: scroll

		&::-webkit-scrollbar 
			width: 9px
			height: 9px

		&::-webkit-scrollbar-track 
			background: rgba(0,0,0,0)

		&::-webkit-scrollbar-thumb 
			background-color: lighten($blue, 20)
			border-radius: 10px
			border: 2px solid #ffffff
</style>