import VueScreenSize from 'vue-screen-size'
import moment from 'moment'
export default {
	mixins: [VueScreenSize.VueScreenSizeMixin],
	filters: {
		nl2br(value) {
			return nl2br(value)
		},
		first_upper(value) {
			return value[0].toUpperCase() + value.substring(1).toLowerCase()
		},
	},
	computed: {
		is_local() {
			return process.env.VUE_APP_API_URL == 'http://tienda.local:8000'
		},
		app_name() {
			return 'fiushh'
		},
		from_cloudinary() {
			return this.commerce.from_cloudinary
		},
		is_verified() {
			return this.authenticated && !this.user.verification_code
		},
		logo_src() {
			return `@/assets/${this.app_name}/logo.png`
		},
		spinner_src() {
			return `@/assets/${this.app_name}/spinner.gif`
		},
		variant_color() {
			return process.env.VUE_APP_VARIANT_COLOR
			// Pinocho
			// return '#f9b234' 
			// Fiushh
			// return '#B68EFF'
		},
		variant_color_dark() {
			return '#5E25C2'
		},
		categories_breakpoint_limit() {
			return 14
		},
		authenticated() {
			return this.$store.state.auth.authenticated
		},
		commerce() {
			return this.$store.state.commerce.commerce
		},
		workdays() {
			return this.$store.state.commerce.workdays
		},
		user() {
			return this.$store.state.auth.user
		},
		// currentPage() {
		// 	return this.$route.path
		// },
		route_name() {
			return this.$route.name
		},
		view() {
			return this.$route.params.view
		},
		articles_page() {
			return this.$store.state.articles.page
		},
		selected_sub_category() {
			return this.$store.state.categories.selected_sub_category
		},
		selected_category() {
			return this.$store.state.categories.selected_category
		},
		featured() {
			return this.$store.state.articles.featured
		},
		search_query() {
			return this.$store.state.articles.search_query
		},
		articles() {
			return this.$store.state.articles.articles
		},
		is_mobile() {
			if (this.$vssWidth < '992') {
				return true
			}
			return false
		},
		is_open() {
			let is_open = false
			let now = moment()
			let hora_inicio
			let hora_fin
			let day_name = moment().format('dddd')
			this.workdays.forEach(workday => {
				if (workday.name == day_name) {
					workday.schedules.forEach(schedule => {
						hora_inicio = moment(schedule.from, 'hh:mm:ss')
						hora_fin = moment(schedule.to, 'hh:mm:ss')
						if (now.isBetween(hora_inicio, hora_fin)) {
							is_open = true
						}
					})
				}
			})
			return is_open
		},
		percentage_card_formated() {
			return this.percentageToMultiply(this.commerce.percentage_card)
		},
		percentage_card() {
			return this.commerce.percentage_card
		},
        dolar_blue() {
        	let coins_dolar = this.$store.state.coins.dolar
        	let dolar 
        	if (this.commerce.dolar == 'compra') {
        		dolar = coins_dolar.compra
        	} else if (this.commerce.dolar == 'venta') {
        		dolar = coins_dolar.venta
        	} else if (this.commerce.dolar == 'promedio') {
        		dolar = coins_dolar.promedio
        	} else if (this.commerce.dolar) {
        		dolar = Number(this.commerce.dolar)
        	}
        	if (this.commerce.dolar_plus) {
				dolar += Number(this.commerce.dolar_plus)
			}
			return dolar
        },
		article_to_show() {
			return this.$store.state.articles.article_to_show
		},
		cart_articles() {
			return this.$store.state.cart.cart.articles
		}
	},
	methods: {
		articleImage(article) {
			if (article.images.length) {
				return article.images[0].hosting_url
			} else if (this.commerce.default_article_image_url) {
				return this.commerce.default_article_image_url
			}
			return null
		},
		routeString(value) {
			return value.toLowerCase().replaceAll(' ', '-')
		},
		formatDecimals(number) {
			if (number.substr(number.length-2, number.length) == '00') {
				return number.substr(0, number.length-3)
			}
			return number
		},	
		nl2br(str, is_xhtml) {
			if (typeof str === 'undefined' || str === null) {
				return '';
			}
			var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
			return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
		},
		scrollTo(element_id, time_out = null, margin_top = 160) {
			if (time_out) {
				console.log('se va a llamar a scrollTo en '+time_out)
				setTimeout(() => {
					this._scrollTo(element_id, margin_top)
				}, time_out)
			} else {
				console.log('se va a llamar a scrollTo')
				this._scrollTo(element_id, margin_top)
			}
		},
		_scrollTo(element_id, margin_top) {
			let element = document.getElementById(element_id)
			if (!element) {
				setTimeout(() => {
					console.log('se llamo denuevo a scrollTo porque no estaba el elemento')
					this._scrollTo(element_id, margin_top)
				}, 500)
			} else {
				let position = element.getBoundingClientRect();
				if (margin_top) {
					window.scrollTo({
						top: position.top + window.scrollY - margin_top,
						behavior: 'smooth'
					})
				} else {
					window.scrollTo({
						top: position.top + window.scrollY,
						behavior: 'smooth'
					})
				}
				console.log('se scrollTo a '+element_id)
			}
		},
		isView(name) {
			return this.route_name == name
		},
		isArticleInCart(article = null) {
			if (!article) {
				article = this.article_to_show
			}
			let finded = this.cart_articles.find(art => {
				return art.id == article.id
			})
			console.log('isArticleInCart: '+finded != undefined)
			return finded != undefined
		},
		articlePrice(article, formated = true) {
			let price = this.articlePriceEfectivo(article, formated)
			// console.log('aca: '+price)
			// if (this.percentage_card) {
			// 	price = price + (price * this.percentage_card_formated)
			// } 
			return formated ? this.price(price) : price
		},
		articlePriceEfectivo(article, formated = true) {
			if (this.commerce.online_price_type.slug == 'only_registered' && !this.authenticated) {
				console.log('No se muestran percio porque esta en only_registered')
				return null
			} else if (this.commerce.online_price_type.slug == 'only_buyers_with_comerciocity_client' && (!this.authenticated || !this.user.comercio_city_client)) {
				console.log('entro en only_buyers_with_comerciocity_client')
				console.log('authenticated:')
				console.log(this.authenticated)
				return null
			} else {
				let price = article.final_price
				if (article.with_dolar) {
					price = price * (this.dolar_blue + 3)
				}
				return formated ? this.price(price) : price
			}
		},
		checkAuth() {
			if (this.authenticated) {
				return true
			}
			this.$router.push({name: 'Login'})
			return false
		},
		scrollBottom(el) {
			setTimeout(() => {
				let container = document.getElementById(el)
				if (container) {
					container.scrollTop = container.scrollHeight
				}
			}, 1)
		},
		isEmail(email) {
		    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		    return re.test(String(email).toLowerCase());
		},
		percentageToMultiply(p) {
			let percentage_card = Number(p)
			if (percentage_card < 10) {
				return Number('0.0'+percentage_card)
			} 
			return Number('0.'+percentage_card)
		},
		setTitle(title = null) {
			title = this.commerce.company_name
			// if (!title || !this.is_mobile) {
			// 	title = this.commerce.company_name
			// }
			// let limit = 15
			// if (this.$vssWidth > '300') {
			// 	limit = 20
			// }
			// if (title.length > limit && title != 'El Kiosco Verde') {
			// 	title = title.substring(0, limit-2)
			// 	title += '..'
			// }
			this.$store.commit('generals/setTitle', title)
		},
		hasMore() {
			if (this.search_query != '') {
				return true
			} else if (this.hasMoreFeatured()) {
				return true
			}  else if (this.hasMoreLastUploads()) {
				console.log('aca')
				return true
			} else if (this.hasMoreFromSubCategory()) {
				return true
			}
			return false
		},
		hasMoreFeatured() {
			if (this.selected_category && this.selected_category.is_featured && this.selected_category.articles_count > 6 && this.articles.length % 6 == 0) {
				return true
			}
		},
		hasMoreLastUploads() {
			if (this.selected_category && this.selected_category.is_last_uploads && this.articles.length % 6 == 0) {
				return true
			}
		},
		hasMoreFromSubCategory() {
			return this.selected_sub_category && this.selected_sub_category.articles_count > 6 && this.articles.length % 6 == 0
		},
		getViewport() { 
			var viewPortWidth;
			var viewPortHeight;

			// the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
			if (typeof window.innerWidth != 'undefined') {
			viewPortWidth = window.innerWidth,
			viewPortHeight = window.innerHeight
			}

			// IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
			else if (typeof document.documentElement != 'undefined'
			&& typeof document.documentElement.clientWidth !=
			'undefined' && document.documentElement.clientWidth != 0) {
			viewPortWidth = document.documentElement.clientWidth,
			viewPortHeight = document.documentElement.clientHeight
			}

			// older versions of IE
			else {
			viewPortWidth = document.getElementsByTagName('body')[0].clientWidth,
			viewPortHeight = document.getElementsByTagName('body')[0].clientHeight
			}
			return [viewPortWidth, viewPortHeight];
		}
	}
}