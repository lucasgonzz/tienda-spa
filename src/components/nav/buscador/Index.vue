<template>
	<div class="cont-search-input-btn">
		<div class="cont-search">
			<div 
			class="icon">
				<i class="bi bi-search"></i>
			</div>
			<b-form-input	
			v-model="query"
			@keyup="callSearch"
			placeholder="¿Que estas buscando?"
			class="input-search"></b-form-input>
			<div 
			v-if="results.length"
			@click="cancelar"
			class="icon icon-right">
				Cancelar
				<!-- <i class="bi bi-x-lg"></i> -->
			</div>
		</div>
		<!-- Caja de resultados: se renderiza solo si hay loading o resultados -->
		<div
		v-if="loading || results.length"
		class="nav-search-results">
			<!-- Contenedor scrolleable que incluye spinner y resultados -->
			<div class="nav-search-results__scroll" ref="caja_resultados">
				<div
				v-if="loading"
				class="cont-center-sm">
				    <b-spinner></b-spinner>
				</div>
				<result
				@clearResults="clearResults"
				v-for="result in results"
				:key="result.id"
				:model="result"></result>
			</div>
			<!-- Pie fijo: botón "Ver todos los resultados" fuera del scroll -->
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
			se_busco_con_enter: false,
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
		cancelar() {
			this.results = []
			this.query = ''
		},
		callSearch(e) {
			this.results = [] 
			if (e.key == 'Enter') {

				this.se_busco_con_enter = true

				this.clearResults()
				this.searchArticle()
				
			} else if (e.key != 'ArrowDown' && e.key != 'ArrowUp') {
				
				this.se_busco_con_enter = false
				
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

				/*
					* Si el usuario preciona ENTER, igualmente se mandan a buscar los resultados
					entonces controlo y, si se busco con enter, limpio los resultados
					para que se esconda el recuadro
				*/
				this.esconder_resultados()				
			})
			.catch(err => {
				console.log(err)
				this.loading = false 
				this.$toast.error('Hubo un error al realizar la busqueda')
			})
		},
		esconder_resultados() {
			if (this.se_busco_con_enter) {
				this.results = []
			}
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

	.icon-right
		border-radius: 0 15px 15px 0
		position: absolute
		height: 100%
		right: 0
		width: 60px
		font-weight: bold
		text-decoration: underline
		cursor: pointer
		justify-content: flex-start
		font-size: 12px
		&:before  
			display: none

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
	.nav-search-results
		position: absolute
		top: calc(100% + 8px)
		left: 0
		width: 100%
		z-index: 300
		background: #FFF
		border: 1px solid rgba(0, 0, 0, .08)
		border-radius: 14px
		box-shadow: 0 8px 28px rgba(0, 0, 0, .12)
		overflow: hidden
		padding: 6px
		display: flex
		flex-direction: column

		/* Contenedor scrolleable: incluye spinner y resultados */
		.nav-search-results__scroll
			max-height: 60vh
			overflow-y: auto

			/* Scrollbar neutro: track transparente, thumb gris sutil */
			&::-webkit-scrollbar
				width: 8px
				height: 8px

			&::-webkit-scrollbar-track
				background: transparent

			&::-webkit-scrollbar-thumb
				background-color: rgba(0, 0, 0, .18)
				border-radius: 10px
				border: 2px solid #FFF

			/* Spinner visible con color secundario, espaciado */
			.cont-center-sm
				padding: 24px 0

			.spinner-border
				color: var(--secondary-color)

	/* Estado resaltado para navegación con flechas (Prompt 03) */
	.nav-search-result.is-active
		background: #f5f5f7
</style>