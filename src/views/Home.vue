<template>
	<div class="home view">
		<!--
			h1 de la pagina (mision seo-tiendas). Con una categoria, marca, bodega o cepa elegida el
			h1 es el titulo visible de la lista (articles-list/Index.vue); en la portada no hay un
			titulo visible que lo sea, asi que va el nombre del comercio, solo para lectores de
			pantalla y buscadores (sr-only de Bootstrap: no cambia nada a la vista).
		-->
		<h1
		v-if="!hay_filtro_elegido"
		class="sr-only">
			{{ commerce.company_name }}
		</h1>

		<add-to-cart-modal></add-to-cart-modal>


		<title-jumbotron></title-jumbotron>

		<!-- Con el diseño de lista, las tarjetas de categorías serían la misma información dos veces. -->
		<categorias-home
		v-if="!es_diseno_lista"></categorias-home>

		<sub-categories-sidebar></sub-categories-sidebar>

		<!--
			Diseño del inicio «Lista de categorías» (online_configuration.diseno_home): en la portada,
			la lista reemplaza a Destacados, Novedades y Últimos ingresos. Con una categoría, marca o
			búsqueda elegida, el listado de siempre.
		-->
		<lista-categorias
		v-if="mostrar_lista_categorias"
		:categories="categorias_con_productos"></lista-categorias>

		<template
		v-else>
			<order-by></order-by>

			<b-row
			class="row-articles">
				<b-col
				:class="class_products"
				cols="12">
					<articles-list></articles-list>
				</b-col>
			</b-row>
		</template>
		
		<contact-info></contact-info> 
	</div>
</template>
<script>
import SubCategoriesSidebar from '@/components/categories/components/SubCategoriesSidebar'
import CanSeePrices from '@/components/home/components/CanSeePrices'
import ArticlesList from '@/components/home/components/articles-list/Index'
import TitleJumbotron from '@/components/home/components/TitleJumbotron'
import CategoriasHome from '@/components/home/components/categorias-home/Index'
import ListaCategorias from '@/components/home/components/lista-categorias/Index'
import OrderPhone from '@/components/home/components/OrderPhone'
import UpdateButton from '@/components/home/components/UpdateButton'
import Platelets from '@/components/home/components/platelets/Index'
import CategoriesButton from '@/components/home/components/CategoriesButton'
import Categories from '@/components/categories/components/Categories'
import OrderBy from '@/components/home/components/OrderBy'
import SubCategories from '@/components/categories/components/SubCategories'
export default {
	name: 'Home',
	/**
	 * Head de la home y de los listados por categoria / subcategoria / marca / bodega / cepa, con
	 * las mismas reglas que tienda-api usa para el HTML del servidor (plan de seo-tiendas): el
	 * titulo lo completa el titleTemplate de App.vue ("<nombre> | <comercio>", o solo el comercio
	 * en la portada) y la canonica tiene que dar igual en los dos lados.
	 */
	metaInfo() {
		let seo = this.seo_pagina
		let titulo_completo = seo.nombre ? seo.nombre + ' | ' + this.commerce.company_name : this.commerce.company_name
		return {
			title: seo.nombre || this.commerce.company_name,
			meta: [
				{ vmid: 'description', name: 'description', content: seo.descripcion },
				{ vmid: 'og:type', property: 'og:type', content: 'website' },
				{ vmid: 'og:title', property: 'og:title', content: titulo_completo },
				{ vmid: 'og:description', property: 'og:description', content: seo.descripcion },
				{ vmid: 'og:url', property: 'og:url', content: seo.canonica },
			],
			link: [
				{ vmid: 'canonical', rel: 'canonical', href: seo.canonica },
			],
		}
	},
	components: {
		AddToCartModal: () => import('@/components/common/add-to-cart-modal/Index'),
		ContactInfo: () => import('@/components/common/ContactInfo'),
		SubCategoriesSidebar,
		TitleJumbotron,
		CategoriasHome,
		ListaCategorias,
		OrderPhone,
		CategoriesButton,
		UpdateButton,
		Platelets,
		CanSeePrices,
		ArticlesList,
        // Categories,
        OrderBy,
        SubCategories,
	},
	watch: {
		/**
		 * Con el diseño de lista, el botón «atrás» del navegador desde una categoría (o desde una
		 * búsqueda) tiene que volver a la lista: la ruta vuelve a la portada pero el store queda con
		 * el filtro elegido, porque App.vue solo lee la ruta al arrancar. Con el diseño de siempre no
		 * se toca nada (ese comportamiento es anterior y no es de esta misión).
		 * @param {object} to
		 */
		$route(to) {
			if (!this.es_diseno_lista || to.name != 'Home') {
				return
			}
			let es_portada = !to.params.category || to.params.category == 'ultimos-ingresados'
			if (es_portada && !to.query.q && this.hay_filtro_o_busqueda) {
				this.$store.commit('categories/setIsFromSearch', false)
				this.$store.commit('categories/setSelectedCategory', null)
				this.$store.commit('categories/setSelectedSubCategory', null)
				this.$store.commit('categories/setSelectedBrand', null)
				this.$store.commit('categories/setSelectedBodega', null)
				this.$store.commit('categories/setSelectedCepa', null)
			}
		},
	},
	computed: {
		/**
		 * online_configuration.diseno_home == 'lista_categorias'. Cualquier otro valor -- incluido
		 * undefined, cuando el empresa-api del comercio todavia no tiene la columna -- es el inicio
		 * de siempre.
		 * @returns {boolean}
		 */
		es_diseno_lista() {
			return !!(this.commerce && this.commerce.online_configuration && this.commerce.online_configuration.diseno_home == 'lista_categorias')
		},
		/**
		 * @returns {boolean}
		 */
		hay_filtro_o_busqueda() {
			return this.hay_filtro_elegido || !!this.$store.state.categories.is_from_search
		},
		/**
		 * Categorias con al menos un producto: las vacias serian renglones que no despliegan nada.
		 * articles_count puede no venir (tienda-api vieja): ahi se muestran todas.
		 * @returns {Array}
		 */
		categorias_con_productos() {
			return this.categories.filter(category => category.articles_count === undefined || category.articles_count === null || Number(category.articles_count) > 0)
		},
		/**
		 * La lista va en la portada (sin filtro ni busqueda). Si el comercio no tiene ninguna
		 * categoria con productos, la portada queda como siempre en lugar de una lista vacia.
		 * @returns {boolean}
		 */
		mostrar_lista_categorias() {
			if (!this.es_diseno_lista || this.hay_filtro_o_busqueda) {
				return false
			}
			return !!this.$store.state.categories.loading_categories || this.categorias_con_productos.length > 0
		},
		/**
		 * Mismo criterio que articles-list/Index.vue para dibujar su titulo (que es el h1 cuando
		 * hay un filtro elegido).
		 * @returns {boolean}
		 */
		hay_filtro_elegido() {
			let estado = this.$store.state.categories
			return !!(estado.selected_category || estado.selected_sub_category || estado.selected_bodega || estado.selected_cepa || estado.selected_brand)
		},
		/**
		 * Nombre, descripcion y canonica de la pagina, resueltos desde la RUTA (no desde lo
		 * elegido en el store, que puede quedar de una navegacion anterior). El modelo se busca
		 * igual que getCategory() de App.vue: seo_slug(nombre) contra el parametro.
		 * @returns {{nombre: (string|null), descripcion: string, canonica: string}}
		 */
		seo_pagina() {
			let comercio = this.commerce.company_name
			let origen = this.seo_origen()
			let categoria = this.$route.params.category ? String(this.$route.params.category).toLowerCase() : ''
			let sub = this.$route.params.sub_category ? String(this.$route.params.sub_category).toLowerCase() : ''

			if (!categoria || categoria == 'ultimos-ingresados') {
				let top = this.$store.state.categories.categories
					.filter(model => Number(model.articles_count) > 0)
					.slice()
					.sort((a, b) => Number(b.articles_count) - Number(a.articles_count))
					.slice(0, 5)
					.map(model => model.name)
				let descripcion = comercio + ': tienda online. '
				if (top.length) {
					descripcion += top.join(', ') + '. '
				}
				return {
					nombre: null,
					descripcion: this.seo_recortar(descripcion + this.seo_sufijo_compra()),
					canonica: origen + '/',
				}
			}

			let listas = {
				marca: this.$store.state.categories.brands,
				bodega: this.$store.state.bodegas.models,
				cepa: this.$store.state.cepas.models,
			}
			let modelo = null
			let camino = null
			if (listas[categoria] && sub) {
				modelo = (listas[categoria] || []).find(model => this.seo_slug(model.name) == sub) || null
				camino = '/inicio/' + this.seo_segmento(categoria) + '/' + this.seo_segmento(modelo ? this.seo_slug(modelo.name) : sub)
			} else {
				let modelo_categoria = this.$store.state.categories.categories.find(model => this.seo_slug(model.name) == categoria) || null
				let slug_categoria = modelo_categoria ? this.seo_slug(modelo_categoria.name) : categoria
				if (sub) {
					let subs = modelo_categoria && modelo_categoria.sub_categories ? modelo_categoria.sub_categories : []
					modelo = subs.find(model => this.seo_slug(model.name) == sub) || null
					camino = '/inicio/' + this.seo_segmento(slug_categoria) + '/' + this.seo_segmento(modelo ? this.seo_slug(modelo.name) : sub)
				} else {
					modelo = modelo_categoria
					camino = '/inicio/' + this.seo_segmento(slug_categoria)
				}
			}

			// Mientras no cargaron las categorias/marcas (o si el nombre no existe) no hay nombre:
			// titulo y descripcion de la portada, la canonica igual sale de la ruta.
			let nombre = modelo ? modelo.name : null
			let descripcion = comercio + ': tienda online. ' + this.seo_sufijo_compra()
			if (nombre) {
				descripcion = nombre + ' en ' + comercio
				if (modelo.articles_count !== undefined && modelo.articles_count !== null) {
					descripcion += ': ' + Number(modelo.articles_count) + ' productos.'
				} else {
					descripcion += '.'
				}
				let primeros = (this.$store.state.categories.articles || []).slice(0, 5).map(article => article.name)
				if (primeros.length) {
					descripcion += ' ' + primeros.join(', ') + '…'
				} else {
					descripcion += ' ' + this.seo_sufijo_compra()
				}
			}
			return {
				nombre,
				descripcion: this.seo_recortar(descripcion),
				canonica: origen + camino,
			}
		},
		selected_category() {
			return this.$store.state.categories.selected_category
		},
		articles() {
			return this.$store.state.articles.articles
		},
		featured() {
			return this.$store.state.articles.featured
		},
		categories() {
			return this.$store.state.categories.categories
		},
		class_categories() {
			return 'm-t-15'
			if (this.is_mobile || this.categories.length < this.categories_breakpoint_limit) {
				return 'col-categories-mobile'
			}
			return 'col-categories-desktop'
		},
		class_products() {
			return ''
			if (this.is_mobile) {
				return 'm-t-50'
			}
			if (!this.is_mobile || this.categories.length < this.categories_breakpoint_limit) {
				return 'm-t-70'
			}
			return 'col-products-desktop m-t-50'
		},
		cols_lg() {
			return 11
			if (this.is_mobile || this.categories.length < this.categories_breakpoint_limit) {
				return 10
			}
			return 12
		},
	},
}
</script>
<style scoped lang="sass">
// .home 		
	// margin-top: -15px
.row-articles
	position: relative
.col-categories-mobile
	position: fixed
	z-index: 90
	left: 0 
	padding: 0
	width: 100%
.col-categories-desktop
	position: fixed
	z-index: 90
	left: 0 
	width: 250px
.col-products-desktop
	padding-left: 250px
	padding-right: 50px
</style>
