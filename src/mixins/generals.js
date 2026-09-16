import VueScreenSize from 'vue-screen-size'
import moment from 'moment'
// Reutilizamos el normalizador y el default de color del helper de tema,
// para tener una sola fuente de verdad del color de acento (online_configuration.primary_color)
import { normalize_hex_color, default_theme_colors } from '@/helpers/online_configuration_theme'
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
	data() {
		return {
			ancho_pantalla: window.innerWidth
		}
	},
	created() {
		window.addEventListener('resize', () => {
		    this.ancho_pantalla = window.innerWidth
		    // console.log('Nuevo ancho:', window.innerWidth);
		});
	},
	computed: {
		is_local() {
			return process.env.VUE_APP_API_URL == 'http://tienda.local:8000'
		},
		from_cloudinary() {
			return this.commerce.from_cloudinary
		},
		is_verified() {
			return this.authenticated && !this.user.verification_code
		},
		/**
		 * Color de acento usado como color activo en la paginación de los swipers.
		 * Sale del primary_color del online_configuration del comercio (misma fuente
		 * que ya usa el resto del tema), en vez de una env var de build por cliente.
		 * Si el comercio todavía no cargó, cae al mismo default que usa el tema.
		 */
		variant_color() {
			if (this.commerce && this.commerce.online_configuration && this.commerce.online_configuration.primary_color) {
				return normalize_hex_color(this.commerce.online_configuration.primary_color, default_theme_colors.primary_color)
			}
			return default_theme_colors.primary_color
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
		/**
		 * Indica si los usuarios pueden comprar sin necesidad de registrarse.
		 * Cuando register_to_buy = 0, se muestran los controles de carrito a todos.
		 *
		 * @returns {boolean}
		 */
		puede_comprar_sin_login() {
			return !Number(this.commerce.online_configuration.register_to_buy)
		},
		cart_articles() {
			return this.$store.state.cart.cart.articles
		},
		cart() {
			return this.$store.state.cart.cart
		},
		show_nav_content() {
			return this.route_name != 'Payment' && this.route_name != 'PaymentCard'
		},
	},
	methods: {
		/**
		 * Normaliza un flag booleano que viene del API como string.
		 *
		 * 🔴 MySQL manda los tinyint como string ("0" / "1"), y en JavaScript el string "0" es
		 * TRUTHY. Leer `article.precio_pausado` o `commerce.show_buyer_messages` crudo en un v-if
		 * da siempre true y da vuelta la condicion entera (por eso la tienda dejaba de mostrar
		 * precios y bloqueaba el boton de carrito). Todo flag del API se lee por aca.
		 *
		 * @param {number|string|boolean|null} valor flag tal como llega del API
		 * @returns {boolean}
		 */
		flag_activo(valor) {
			return Number(valor) === 1
		},
		precio_por_unidad(article) {
			return this.price(article.final_price / article.presentacion) 
		},
		commerce_has_extencion(slug){
			if (this.commerce) {
				let finded_extencion = this.commerce.extencions.find(extencion => {
					return extencion.slug == slug 
				})
				return typeof finded_extencion != 'undefined'
			}
			return false 
		},
		articleImage(article) {
			if (article.images.length) {
				return article.images[0].hosting_url
			} else if (this.commerce.online_configuration.default_article_image_url) {
				return this.commerce.online_configuration.default_article_image_url
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
		is_item_in_cart(item = null) {
			if (!item) {
				item = this.article_to_show
			}
			let finded = this.get_item_cart(item)
			return finded != undefined
		},
		get_item_cart(item) {
			let finded 
			if (item.is_promocion_vinoteca) {
				finded = this.cart.promociones_vinoteca.find(promo => {
					return promo.id == item.id 
				})
			} else {
				finded = this.cart.articles.find(article => {
					return article.id == item.id && (!article.pivot.variant_id || article.pivot.variant_id == item.variant_id)
				})
			}
			return finded
		},

		isArticleInCart(article = null) {
			if (!article) {
				article = this.article_to_show
			}
			let finded = this.get_article_cart(article)
			return finded != undefined
		},
		get_article_cart(article) {
			let finded = this.cart_articles.find(art => {
				return art.id == article.id && (!art.pivot.variant_id || art.pivot.variant_id == article.variant_id)
			})
			return finded
		},
		/**
		 * Precio mostrado en tienda (formateado o número según formated).
		 * Si el artículo tiene precio pausado, devuelve el texto configurado sin pasar por formato monetario.
		 */
		articlePrice(article, formated = true) {
			let price = this.articlePriceEfectivo(article, formated)
			if (this.puede_ver_precios() && this.flag_activo(article.precio_pausado)) {
				return price
			}
			return formated ? this.price(price) : price
		},
		/**
		 * Precio efectivo o texto de precio pausado.
		 * Con precio pausado y formated=false devuelve null (no hay importe unitario numérico).
		 */
		articlePriceEfectivo(article, formated = true) {
			if (!this.puede_ver_precios()) {
				return null
			}

			// Texto fijo de configuración online en lugar del importe
			if (this.flag_activo(article.precio_pausado)) {
				const texto = this.commerce && this.commerce.online_configuration
					? this.commerce.online_configuration.text_precio_pausado
					: ''
				return texto
			}

			let price = Number(article.final_price)
				
			if (this.commerce_has_extencion('lista_de_precios_por_rango_de_cantidad_vendida')) {

				let price_type_mas_caro = null

				article.ranges.forEach(range => {
					if (range.price) {
						price_type_mas_caro = range
					}
				})

				article.ranges.forEach(range => {
					if (range.price && range.min < price_type_mas_caro.min) {
						price_type_mas_caro = range 
					}
				})

				if (price_type_mas_caro) {

					price = price_type_mas_caro.price
				} else {
					console.log('no hay price_type para '+article.name)
				}
				
			} 
			if (this.commerce.online_configuration.online_price_surchage) {
				price += price * Number(this.commerce.online_configuration.online_price_surchage) / 100
				price = Math.round(price)
			}
			return formated ? this.price(price) : price


				
			// if (this.commerce.online_configuration.online_price_type.slug == 'only_registered' && !this.authenticated) {
			// 	// console.log('No se muestran percio porque esta en only_registered')
			// 	return null
			// } else if (
			// 	this.commerce.online_configuration.online_price_type.slug == 'only_buyers_with_comerciocity_client' 
			// 	&& (
			// 			!this.authenticated 
			// 			|| (
			// 				!this.user.comercio_city_client
			// 				&& !this.user.seller_id
			// 			)
			// 		)
			// 	) {
			// 	return null
			// } else {
			// 	let price = Number(article.final_price)
				
			// 	if (this.commerce_has_extencion('lista_de_precios_por_rango_de_cantidad_vendida')) {

			// 		let price_type_mas_caro = null

			// 		article.ranges.forEach(range => {
			// 			if (range.price) {
			// 				price_type_mas_caro = range
			// 			}
			// 		})

			// 		article.ranges.forEach(range => {
			// 			if (range.price && range.min < price_type_mas_caro.min) {
			// 				price_type_mas_caro = range 
			// 			}
			// 		})

			// 		if (price_type_mas_caro) {

			// 			price = price_type_mas_caro.price
			// 		} else {
			// 			console.log('no hay price_type para '+article.name)
			// 		}
					
			// 	} 
			// 	if (this.commerce.online_configuration.online_price_surchage) {
			// 		price += price * Number(this.commerce.online_configuration.online_price_surchage) / 100
			// 		price = Math.round(price)
			// 	}
			// 	return formated ? this.price(price) : price
			// }
		},
		/**
		 * Determina si el usuario puede ver precios.
		 *
		 * Si la tienda no requiere registro para comprar (register_to_buy = 0),
		 * los precios son visibles para todos sin importar online_price_type.
		 *
		 * @returns {boolean}
		 */
		puede_ver_precios() {
			/* Sin registro requerido: precios siempre visibles independientemente de online_price_type. */
			if (!Number(this.commerce.online_configuration.register_to_buy)) {
				return true
			}
			if (this.commerce.online_configuration.online_price_type.slug == 'only_registered' && !this.authenticated) {
				// console.log('No se muestran percio porque esta en only_registered')
				return false
			} else if (
				this.commerce.online_configuration.online_price_type.slug == 'only_buyers_with_comerciocity_client' 
				&& (
						!this.authenticated 
						|| (
							!this.user.comercio_city_client
							&& !this.user.seller_id
						)
					)
				) {
				return false
			} 
			return true
		},
		/**
		 * La oferta personalizada del articulo, o null.
		 *
		 * Es la unica puerta de lectura de article.oferta_personalizada en todo el SPA. El
		 * contrato con la API es ADITIVO: un articulo que llego por un camino que no pasa
		 * por checkPriceTypes, o de una API vieja, simplemente no trae el campo y aca sale
		 * null. Todos los v-if del tachado cortan con eso.
		 *
		 * @param {object} article
		 * @returns {object|null}
		 */
		oferta_personalizada(article) {
			if (!article || !article.oferta_personalizada) {
				return null
			}
			return article.oferta_personalizada
		},
		/**
		 * El precio ORIGINAL, para tacharlo al lado del descontado. null cuando no hay oferta
		 * con precio aplicado.
		 *
		 * 🔴 Replica el mismo tratamiento que articlePriceEfectivo le da a final_price
		 * (online_price_surchage y su Math.round). Si no lo replicara, el tachado y el precio
		 * grande serian dos numeros de escalas distintas y el descuento se veria mal —
		 * mostrando un ahorro que no es el real.
		 *
		 * 🔴 ESTE ES EL TACHADO DE LOS LISTADOS, y por eso solo devuelve algo con
		 * tipo_descuento 'unidad'. En un listado (tarjeta, buscador) el precio grande sale
		 * SIEMPRE de articlePriceEfectivo, y con 'cantidad' el servidor no toca final_price:
		 * el precio grande y la base son la MISMA cifra, asi que tacharla seria mostrar dos
		 * veces el mismo importe, uno cruzado.
		 *
		 * Si lo que necesitas es la base para compararla contra OTRO precio —el del tramo, que
		 * es lo que muestran la tarjeta del mensaje de promocion y la ficha del producto
		 * cuando hay una cantidad elegida—, ese es precio_base_de_oferta(). Y si el precio de
		 * al lado es el del carrito, que sale del pivot y no lleva recargo, ese es
		 * precio_base_de_linea(). No le saques el corte por tipo a este metodo para resolver
		 * ninguno de esos dos casos: le rompe el tachado a los trece llamadores de los
		 * listados.
		 *
		 * @param {object} article
		 * @param {boolean} formated
		 * @returns {string|number|null}
		 */
		precio_sin_oferta(article, formated = true) {
			if (!this.puede_ver_precios()) {
				return null
			}
			let oferta = this.oferta_personalizada(article)
			if (!oferta || !oferta.precio_aplicado) {
				return null
			}
			if (oferta.tipo_descuento != 'unidad') {
				return null
			}
			/* Con precio pausado no hay importe: articlePriceEfectivo devuelve el texto de
			   configuracion, asi que no hay nada contra que tachar. */
			if (this.flag_activo(article.precio_pausado)) {
				return null
			}
			/* La extension de rangos por cantidad vendida hace que articlePriceEfectivo ignore
			   final_price y use article.ranges[].price. Ahi el precio grande y precio_sin_oferta
			   serian de escalas distintas, asi que no se tacha nada. Es la misma limitacion que
			   la API ya fija mandando precio_aplicado en false; la guarda queda por las dudas. */
			if (this.commerce_has_extencion('lista_de_precios_por_rango_de_cantidad_vendida')) {
				return null
			}
			if (typeof article.precio_sin_oferta == 'undefined' || article.precio_sin_oferta === null) {
				return null
			}
			let price = Number(article.precio_sin_oferta)
			if (isNaN(price)) {
				return null
			}
			/* Mismo recargo y mismo redondeo que articlePriceEfectivo, para que los dos numeros
			   queden en la misma escala. */
			if (this.commerce.online_configuration.online_price_surchage) {
				price += price * Number(this.commerce.online_configuration.online_price_surchage) / 100
				price = Math.round(price)
			}
			return formated ? this.price(price) : price
		},
		/**
		 * El precio ORIGINAL de un articulo con oferta, sea del tipo que sea.
		 *
		 * 🔴 Es hermano de precio_sin_oferta() y NO es lo mismo. La diferencia es CONTRA QUE se
		 * compara el tachado:
		 *
		 *   - En un LISTADO el precio grande sale de articlePriceEfectivo, y con 'cantidad' esa
		 *     cifra ES la base, asi que no hay nada que tachar. Ese caso lo corta
		 *     precio_sin_oferta() y esta bien que lo corte.
		 *   - En la TARJETA del mensaje de promocion, el precio grande de una oferta
		 *     'cantidad' es el del MEJOR TRAMO, que es mas barato que la base. Ahi el tachado
		 *     si tiene sentido, y es justo lo que el comprador tiene que ver: cuanto pagaba
		 *     antes y cuanto paga llevando N.
		 *   - En la FICHA del producto pasa lo mismo pero con el tramo de la cantidad que el
		 *     comprador tiene elegida en ese momento, que es la que le precargo el mensaje y
		 *     la que puede cambiar a mano. Ver el computed precio_tachado de
		 *     components/article/components/data/Price.vue.
		 *
		 * Por eso este metodo devuelve la base sin mirar el tipo, y quien lo llama decide si la
		 * muestra comparandola contra el precio que EL esta renderizando. La regla que no se
		 * negocia es la del llamador: nunca mostrar un tachado igual al precio de al lado.
		 *
		 * Mismo recargo y mismo redondeo que articlePriceEfectivo, por lo mismo de siempre: dos
		 * numeros en escalas distintas le muestran al comprador un ahorro que no es el real.
		 *
		 * @param {object} article
		 * @param {boolean} formated
		 * @returns {string|number|null}
		 */
		precio_base_de_oferta(article, formated = true) {
			if (!this.puede_ver_precios()) {
				return null
			}
			let oferta = this.oferta_personalizada(article)
			if (!oferta || !oferta.precio_aplicado) {
				return null
			}
			/* Con precio pausado no hay importe contra que comparar: articlePriceEfectivo
			   devuelve el texto de configuracion, no un numero. */
			if (this.flag_activo(article.precio_pausado)) {
				return null
			}
			/* Con la extension de rangos por cantidad vendida el precio grande sale de
			   article.ranges[].price y no de final_price: la base quedaria en otra escala. */
			if (this.commerce_has_extencion('lista_de_precios_por_rango_de_cantidad_vendida')) {
				return null
			}
			if (typeof article.precio_sin_oferta == 'undefined' || article.precio_sin_oferta === null) {
				return null
			}
			let price = Number(article.precio_sin_oferta)
			if (isNaN(price)) {
				return null
			}
			if (this.commerce.online_configuration.online_price_surchage) {
				price += price * Number(this.commerce.online_configuration.online_price_surchage) / 100
				price = Math.round(price)
			}
			return formated ? this.price(price) : price
		},
		/**
		 * Precio unitario con el tramo por cantidad aplicado, para tipo_descuento 'cantidad'.
		 * Recorre los tramos ordenados por min y se queda con el ultimo que encaja; `max` null
		 * es SIN TECHO (convencion del contrato, igual que category_price_type_ranges).
		 *
		 * La base es articlePriceEfectivo(article, false): para 'cantidad' el servidor NO toca
		 * final_price (ahi no conoce la cantidad), asi que el precio efectivo es el de lista y
		 * el descuento del tramo se aplica encima. El precio que se cobra de verdad lo vuelve a
		 * resolver el servidor en el carrito; esto es solo lo que se le muestra al comprador.
		 *
		 * @param {object} article
		 * @param {number} cantidad
		 * @param {boolean} formated
		 * @returns {string|number|null}
		 */
		precio_con_oferta_por_cantidad(article, cantidad, formated = true) {
			if (!this.puede_ver_precios()) {
				return null
			}
			let oferta = this.oferta_personalizada(article)
			if (!oferta || !oferta.precio_aplicado) {
				return null
			}
			if (oferta.tipo_descuento != 'cantidad' || !Array.isArray(oferta.rangos)) {
				return null
			}
			if (this.flag_activo(article.precio_pausado)) {
				return null
			}
			/* Misma limitacion conocida que en precio_sin_oferta(): con la extension de rangos
			   por cantidad vendida prendida la oferta personalizada NO altera ningun precio. */
			if (this.commerce_has_extencion('lista_de_precios_por_rango_de_cantidad_vendida')) {
				return null
			}
			let cantidad_pedida = Number(cantidad)
			if (!cantidad_pedida || isNaN(cantidad_pedida) || cantidad_pedida <= 0) {
				return null
			}
			let base = this.articlePriceEfectivo(article, false)
			if (base === null || typeof base == 'undefined' || isNaN(Number(base))) {
				return null
			}
			/* Se ordena por min y se recorre entero quedandose con el ULTIMO tramo que encaja:
			   es la misma forma que usa CartHelper::get_price_range() del lado del servidor.
			   min null = sin piso, max null = SIN TECHO. El null no se convierte a ningun
			   numero grande. */
			let rangos = oferta.rangos.slice().sort(function (a, b) {
				return Number(a.min) - Number(b.min)
			})
			let porcentaje = null
			rangos.forEach(rango => {
				let cumple_min = rango.min === null || typeof rango.min == 'undefined' || cantidad_pedida >= Number(rango.min)
				let cumple_max = rango.max === null || typeof rango.max == 'undefined' || cantidad_pedida <= Number(rango.max)
				if (cumple_min && cumple_max) {
					porcentaje = Number(rango.porcentaje)
				}
			})
			if (porcentaje === null || isNaN(porcentaje)) {
				return null
			}
			/* Mismo redondeo a 2 decimales que hace el servidor al aplicar el porcentaje. */
			let price = Math.round(Number(base) * (1 - porcentaje / 100) * 100) / 100
			return formated ? this.price(price) : price
		},
		/**
		 * Pasa el decimal(6,2) del contrato a algo legible: 15.00 -> "15", 12.50 -> "12,5".
		 *
		 * @param {number|string|null} valor
		 * @returns {string|null}
		 */
		porcentaje_legible(valor) {
			if (valor === null || typeof valor == 'undefined' || valor === '') {
				return null
			}
			let numero = Number(valor)
			if (isNaN(numero) || numero <= 0) {
				return null
			}
			return String(Math.round(numero * 100) / 100).replace('.', ',')
		},
		/**
		 * "Llevá 12 o más y pagás 18% menos": a partir de cuantas unidades mejora el precio.
		 *
		 * 🔴 Vive en el mixin y no en el componente porque esa frase se muestra en DOS lados —
		 * la tarjeta del mensaje de promocion y la ficha del producto— y son el mismo dato:
		 * si se escribe dos veces, el dia que cambie la redaccion va a cambiar en uno solo.
		 *
		 * El mejor tramo es el ULTIMO del array: el contrato con empresa-api garantiza tramos
		 * contiguos, ordenados por `min` y con porcentaje creciente, y el ultimo lleva `max`
		 * en null (sin techo).
		 *
		 * @param {object} article
		 * @returns {string|null}
		 */
		texto_del_mejor_tramo(article) {
			let oferta = this.oferta_personalizada(article)
			if (!oferta || !oferta.precio_aplicado || oferta.tipo_descuento != 'cantidad') {
				return null
			}
			if (!Array.isArray(oferta.rangos) || !oferta.rangos.length) {
				return null
			}
			let mejor_tramo = oferta.rangos[oferta.rangos.length - 1]
			if (!mejor_tramo || !mejor_tramo.min) {
				return null
			}
			let cantidad = Number(mejor_tramo.min)
			let porcentaje = this.porcentaje_legible(mejor_tramo.porcentaje)
			if (!cantidad || isNaN(cantidad) || !porcentaje) {
				return null
			}
			return 'Llevá ' + cantidad + ' o más y pagás ' + porcentaje + '% menos'
		},
		/**
		 * El precio ORIGINAL de una linea del CARRITO, para tacharlo al lado de lo que se
		 * cobra. null cuando no hay nada honesto que tachar.
		 *
		 * 🔴 Existe aparte de precio_base_de_oferta() por una sola razon, y es la ESCALA. En
		 * el carrito el precio que se muestra es `article.pivot.price`, que lo resolvio el
		 * SERVIDOR y por lo tanto NO lleva el online_price_surchage que el SPA le suma a
		 * final_price adentro de articlePriceEfectivo. Si el tachado saliera de
		 * precio_base_de_oferta() —que si aplica ese recargo— los dos numeros de al lado
		 * serian de escalas distintas y el ahorro anunciado no seria el real. Por eso este
		 * devuelve `precio_sin_oferta` CRUDO: la misma escala que el pivot.
		 *
		 * 🔴 Y la comparacion final es contra el pivot y estricta. Cubre de una sola vez los
		 * tres casos en los que tachar seria mentir: la oferta por cantidad cuya cantidad no
		 * llega al primer tramo (el servidor cobra la base y no hay descuento), el pivot
		 * optimista que el SPA calculo con recargo antes de que contestara el servidor, y
		 * cualquier linea vieja cuyo precio guardado ya no tenga nada que ver con la base.
		 *
		 * @param {object} article articulo del carrito, con su pivot
		 * @returns {string|null}
		 */
		precio_base_de_linea(article) {
			if (!this.puede_ver_precios()) {
				return null
			}
			let oferta = this.oferta_personalizada(article)
			if (!oferta || !oferta.precio_aplicado) {
				return null
			}
			if (!article || this.flag_activo(article.precio_pausado)) {
				return null
			}
			/* Misma limitacion conocida que en precio_sin_oferta(): con la extension de rangos
			   por cantidad vendida prendida la oferta personalizada NO altera ningun precio. */
			if (this.commerce_has_extencion('lista_de_precios_por_rango_de_cantidad_vendida')) {
				return null
			}
			if (typeof article.precio_sin_oferta == 'undefined' || article.precio_sin_oferta === null) {
				return null
			}
			if (!article.pivot || typeof article.pivot.price == 'undefined' || article.pivot.price === null) {
				return null
			}
			let base = Number(article.precio_sin_oferta)
			let cobrado = Number(article.pivot.price)
			if (isNaN(base) || isNaN(cobrado)) {
				return null
			}
			/* En centavos, para no comparar flotantes. Si no se cobra menos que la base, no hay
			   ahorro: la regla es no mostrar nunca un tachado igual al precio de al lado. */
			if (Math.round(base * 100) <= Math.round(cobrado * 100)) {
				return null
			}
			return this.price(base)
		},
		/**
		 * ¿Ese porcentaje sirve para descontar algo?
		 *
		 * Mismo criterio que ClientOfferHelper::porcentajeUsable() del lado del servidor:
		 * numerico, mayor a 0 y hasta 100. Un descuento cargado con un porcentaje invalido
		 * (null, 0, texto, negativo, 250) no suma al calculo NI muestra badge.
		 *
		 * @param {number|string|null} porcentaje
		 * @returns {boolean}
		 */
		porcentaje_de_descuento_usable(porcentaje) {
			if (porcentaje === null || typeof porcentaje == 'undefined' || porcentaje === '') {
				return false
			}
			let numero = Number(porcentaje)
			if (isNaN(numero)) {
				return false
			}
			return numero > 0 && numero <= 100
		},
		/**
		 * ¿Ese monto fijo sirve para descontar algo?
		 *
		 * `article_discounts` admite dos tipos excluyentes por fila (igual que
		 * ArticlePricesHelper::aplicar_descuentos() del lado del servidor: `if
		 * percentage ... else if amount`): porcentual o monto fijo en pesos. Un monto en 0,
		 * negativo o invalido no descuenta nada.
		 *
		 * @param {number|string|null} monto
		 * @returns {boolean}
		 */
		monto_de_descuento_usable(monto) {
			if (monto === null || typeof monto == 'undefined' || monto === '') {
				return false
			}
			let numero = Number(monto)
			if (isNaN(numero)) {
				return false
			}
			return numero > 0
		},
		/**
		 * Los descuentos del articulo que hay que mostrarle a ESTE comprador, o [].
		 *
		 * 🔴 Es la UNICA puerta de lectura de article.discounts en todo el SPA, y el gate
		 * unico del tachado nuevo Y de los badges: si esto devuelve [], no se dibuja ninguna
		 * de las dos cosas.
		 *
		 * 🔴 NO IMPORTA SI EL ARTICULO TIENE OTROS DESCUENTOS U OTROS AJUSTES QUE NO ESTAN
		 * ACA (decision de Lucas, 3/9/2026). `final_price` es SIEMPRE el precio real, lo
		 * calcule como lo calcule el sistema de gestion por dentro (otros descuentos ocultos,
		 * recargos de articulo, en el orden que sea). La tienda no reconstruye ESE calculo
		 * completo: arma un precio tachado "como si" solo hubieran existido los descuentos
		 * VISIBLES, tal que aplicandoselos a mano da el precio final. Es una cuenta propia y
		 * autosuficiente de la tienda, no un espejo del calculo interno del ERP — por eso no
		 * hace falta (ni se puede, no llega el dato) saber si hay otros descuentos u otros
		 * recargos por fuera de estos.
		 *
		 * 🔴 La OFERTA PERSONALIZADA GANA (regla de Lucas, 1/9/2026): si el comprador tiene
		 * una oferta sobre este articulo, los descuentos generales se apagan enteros. Se corta
		 * contra oferta_personalizada() a secas y NO contra oferta.precio_aplicado, a
		 * proposito: con tipo_descuento 'cantidad' el servidor no toca final_price y la ficha
		 * ya dibuja su propio tachado por tramo (precio_base_de_oferta) mas la linea de
		 * price-tramo. Un solo relato de descuento por articulo, siempre.
		 *
		 * El contrato con la API es ADITIVO, igual que el de oferta_personalizada: un articulo
		 * que llego por un camino sin withAll() no trae el campo y aca sale [].
		 *
		 * @param {object} article
		 * @returns {Array}
		 */
		descuentos_visibles(article) {
			if (!this.puede_ver_precios()) {
				return []
			}
			if (!article || !Array.isArray(article.discounts) || !article.discounts.length) {
				return []
			}
			if (this.oferta_personalizada(article)) {
				return []
			}
			if (this.flag_activo(article.precio_pausado)) {
				return []
			}
			/* La extension de rangos por cantidad vendida hace que articlePriceEfectivo ignore
			   final_price y use article.ranges[].price, que no tiene por que venir neto de
			   estos descuentos. Misma limitacion que ya cortan precio_sin_oferta() y hermanas. */
			if (this.commerce_has_extencion('lista_de_precios_por_rango_de_cantidad_vendida')) {
				return []
			}
			return article.discounts.filter(descuento => {
				if (!this.flag_activo(descuento.show_in_online)) {
					return false
				}
				return this.porcentaje_de_descuento_usable(descuento.percentage)
					|| this.monto_de_descuento_usable(descuento.amount)
			})
		},
		/**
		 * El precio ORIGINAL del articulo, para tacharlo ARRIBA del precio con descuentos.
		 * null cuando no hay descuentos que mostrar.
		 *
		 * 🔴 Se RECONSTRUYE, no llega del backend: es la cuenta INVERSA de la que pediria
		 * Lucas para armar la promocion — "aplicandole los descuentos visibles a este precio
		 * tachado, da el precio final". Se arranca del precio YA RECARGADO
		 * (articlePriceEfectivo con formated=false, que ya trae el online_price_surchage y su
		 * Math.round) y se le suman de vuelta los montos fijos visibles, y ese resultado se
		 * divide por el factor combinado de los porcentajes visibles — el orden inverso al
		 * que se aplicarian de adelante para atras (primero los porcentajes, despues los
		 * montos fijos: precio_final = precio_tachado * factor - suma_montos).
		 *
		 * 🔴 COMPOSICION EN CASCADA para los porcentajes (decision de Lucas, 1/9/2026): con
		 * mas de un descuento porcentual, cada uno se aplica sobre lo que dejo el anterior
		 * (20% y 10% = 28% total, no 30%).
		 *
		 * 🔴 El unico error posible es de REDONDEO, nunca estructural: articlePriceEfectivo
		 * ya redondeo el precio grande al peso antes de que esta funcion lo use de base, y
		 * Math.round redondea para el lado mas cercano (no siempre para abajo) — el tachado
		 * puede quedar un peso de mas o de menos, nunca varios ni en una direccion fija.
		 *
		 * @param {object} article
		 * @param {boolean} formated
		 * @returns {string|number|null}
		 */
		precio_sin_descuentos(article, formated = true) {
			let descuentos = this.descuentos_visibles(article)
			if (!descuentos.length) {
				return null
			}
			let base = this.articlePriceEfectivo(article, false)
			if (base === null || typeof base == 'undefined' || isNaN(Number(base)) || Number(base) <= 0) {
				return null
			}
			base = Number(base)
			let factor = 1
			let suma_montos = 0
			descuentos.forEach(descuento => {
				if (this.porcentaje_de_descuento_usable(descuento.percentage)) {
					factor *= (1 - Number(descuento.percentage) / 100)
				} else if (this.monto_de_descuento_usable(descuento.amount)) {
					suma_montos += Number(descuento.amount)
				}
			})
			if (!(factor > 0) || factor > 1) {
				return null
			}
			let original = Math.round((base + suma_montos) / factor)
			/* La regla que no se negocia, la misma que precio_base_de_oferta() y llamadores:
			   nunca mostrar un tachado igual o menor al precio de al lado. */
			if (original <= base) {
				return null
			}
			return formated ? this.price(original) : original
		},
		/**
		 * El texto del badge de UN descuento: "20% off" o "$100 off" segun el tipo.
		 *
		 * 🔴 Es el UNICO lugar donde vive ese texto, y lo leen las dos superficies: la ficha
		 * (article/components/data/Price.vue) y las dos tarjetas de listado
		 * (common/article-card/body/Price.vue y common/ArticleCard.vue). Cambiarlo aca los
		 * cambia a los tres de una.
		 *
		 * El texto era "20% de descuento" hasta el 16/9/2026. Se acorto a "off" por pedido de
		 * Lucas para copiar la ficha de Mercado Libre: el badge es chico y el texto largo lo
		 * obligaba a partirse en dos renglones o a bajar solo debajo del precio.
		 *
		 * @param {object} descuento
		 * @returns {string}
		 */
		texto_de_descuento(descuento) {
			if (this.porcentaje_de_descuento_usable(descuento.percentage)) {
				return this.formatDecimals(String(descuento.percentage)) + '% off'
			}
			if (this.monto_de_descuento_usable(descuento.amount)) {
				/* price(monto, false) recorta los decimales SOLO cuando son ".00", igual
				   criterio que formatDecimals() ya aplica al porcentaje de arriba: "$100 off",
				   no "$100.00 off", para un monto redondo. */
				return this.price(Number(descuento.amount), false) + ' off'
			}
			return ''
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