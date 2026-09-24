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
		/**
		 * Flag de "mostrar algo" que viene PRENDIDO de fabrica: solo da false si el comercio lo
		 * apago de forma explicita.
		 *
		 * 🔴 Es el reverso de flag_activo(): ahi `undefined`/`null` dan false (no activo); aca
		 * dan true (se muestra). Hace falta porque tienda-spa nueva puede convivir con una
		 * API/base vieja donde la columna todavia no existe (llega `undefined`) o no esta
		 * casteada (llega 0/1/"0"/"1"): en esos casos la tienda tiene que verse como siempre.
		 * Solo se oculta con `false`, `0` o `"0"`.
		 *
		 * @param {number|string|boolean|null|undefined} valor flag tal como llega del API
		 * @returns {boolean}
		 */
		flag_no_apagado(valor) {
			return !(valor === false || valor === 0 || valor === '0')
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
			if (item.is_combo) {
				/* Los ids de `combos` y `articles` son secuencias distintas: buscar un combo
				   entre los artículos devolvería la línea equivocada. Por eso la rama va
				   PRIMERO y por eso `combos` se busca solo contra `combos`. */
				finded = (this.cart.combos || []).find(combo => {
					return combo.id == item.id
				})
			} else if (item.is_promocion_vinoteca) {
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
		 * El rango de precio por cantidad (`article_price_ranges`) que le corresponde a un
		 * artículo para la cantidad que el comprador eligió. null cuando ninguno aplica.
		 *
		 * 🔴 ESTA FUNCIÓN ES EL ESPEJO DE `ArticlePriceRangeHelper` DE `tienda-api`, y el
		 * servidor es el que manda. Acá se decide qué PRECIO SE MUESTRA mientras el comprador
		 * elige la cantidad; el precio que efectivamente se cobra lo resuelve
		 * `CartHelper::get_price()` con su propia copia del mismo criterio. Si los dos criterios
		 * difieren en un borde, el comprador ve un precio y paga otro — es la clase de error
		 * "el mismo invariante decidido con dos criterios distintos en front y back" de
		 * APRENDER_NO_PARCHEAR.md. Ante divergencia se corrige ESTE lado, nunca el del servidor.
		 *
		 * Los cuatro criterios, literales y en este orden:
		 *   1. `'Mayor o igual'` → matchea con `cantidad >= amount`.
		 *      `'Igual'` → matchea solo con igualdad estricta.
		 *   2. Cualquier otro `modo` NO matchea. Nunca un default permisivo.
		 *   3. Entre los que matchean gana el de MAYOR `amount`; con `amount` igual, el PRIMERO
		 *      del array (por eso la comparación es `>` estricto y no `>=`).
		 *   4. Recién sobre el GANADOR se le pregunta el MODO, y desde la misión
		 *      oferta-por-cantidad-porcentaje (24/9/2026) el modo tiene TRES valores, no dos:
		 *        4.a. `price > 0` → PRECIO FIJO. Gana siempre, aunque también haya porcentaje.
		 *             Es lo único que existía hasta esa misión, así que cualquier fila vieja de
		 *             cualquier cliente se sigue comportando exactamente igual que antes.
		 *        4.b. Si no, `porcentaje > 0 && porcentaje < 100` → PORCENTAJE sobre el precio
		 *             que la línea iba a tener. El 100 queda AFUERA a propósito: dejaría el
		 *             precio en cero, y un artículo regalado no es un descuento por cantidad,
		 *             es un dato mal cargado.
		 *        4.c. Cualquier otra cosa → el rango NO aplica y el artículo sale al precio
		 *             normal. `price` y `porcentaje` son los dos nullable en la base.
		 *
		 * 🔴 `porcentaje` la migra `empresa-api` y la tienda la despliega Lucas a mano, sitio por
		 * sitio: va a haber clientes con la tienda nueva contra una base SIN la columna durante
		 * días. Ahí el artículo llega sin la clave, `Number(undefined)` es `NaN` y el tramo cae
		 * solo en el criterio 4.c — o sea, el comportamiento de antes de la misión, byte por byte.
		 *
		 * Devuelve el rango CRUDO, con su `price` y su `porcentaje` tal como vinieron de la base —
		 * la misma escala en la que el servidor cobra. Para mostrarlo en la tienda va
		 * `precio_por_cantidad()`, que es el que resuelve el modo y le suma el recargo online.
		 *
		 * @param {object} article artículo con su `article_price_ranges`
		 * @param {number|string} cantidad la que el comprador tiene elegida
		 * @returns {object|null}
		 */
		rango_de_precio_por_cantidad(article, cantidad) {
			if (!article || !Array.isArray(article.article_price_ranges) || !article.article_price_ranges.length) {
				return null
			}
			let cantidad_numero = Number(cantidad)
			if (!isFinite(cantidad_numero) || cantidad_numero <= 0) {
				return null
			}
			let elegido = null
			article.article_price_ranges.forEach(rango => {
				if (!rango) {
					return
				}
				let amount = Number(rango.amount)
				if (!isFinite(amount)) {
					return
				}
				/* Criterios 1 y 2: solo estos dos modos matchean, cualquier otro queda afuera. */
				let matchea = false
				if (rango.modo === 'Mayor o igual') {
					matchea = cantidad_numero >= amount
				} else if (rango.modo === 'Igual') {
					matchea = cantidad_numero === amount
				}
				if (!matchea) {
					return
				}
				/* Criterio 3: mayor `amount`, y ante empate el primero del array. */
				if (elegido === null || amount > Number(elegido.amount)) {
					elegido = rango
				}
			})
			/*
				🔴 Criterio 4, y va SOBRE EL GANADOR — no adentro del forEach. El orden acá no es
				cosmetico: decide un numero distinto.

				Medido el 16/9/2026 con dos tramos, `>=10 -> $3000` y `>=20 -> price NULL`, y 25
				unidades en el carrito:

				  · filtrando el precio ANTES de elegir, el tramo sin precio no compite y gana el
				    de 10  ->  se MUESTRA $3000
				  · filtrando DESPUES, gana el de 20 por tener mayor `amount`, se queda sin precio
				    usable y cae al precio normal  ->  se COBRA $3948

				O sea: el comprador veia $3000 y pagaba $3948. Manda la segunda forma, y no por
				gusto: es lo que hacen las otras DOS implementaciones de esta misma regla.
				`ArticlePriceRangeHelper::rango()` + `::precio()` de tienda-api (que es quien
				cobra) elige el ganador sin mirar el precio, y el ERP —
				empresa-spa/src/mixins/vender/article_price_range.js, donde estos tramos se
				cargan y ya funcionan— hace el `reduce` por `amount` y recien despues escribe
				`price_vender_personalizado = Number(range.price)`, que con NULL da 0, es falsy y
				lo manda al precio normal. Las tres coinciden ahora.

				La clase esta documentada en APRENDER_NO_PARCHEAR.md, "el mismo invariante
				decidido con dos criterios distintos en front y back": ninguna de las dos formas
				esta mal leida sola, el defecto vive ENTRE las dos y no lo ve ningun test que
				ejerza un solo lado.

				🔴 Y con la forma nueva —el PORCENTAJE— el orden importa exactamente igual, con
				el mismo dato dado vuelta: un tramo perdedor con porcentaje cargado NO rescata a
				un ganador sin ningun valor usable. El ganador se elige solo por `amount` y recien
				ahi se le pregunta el modo, que es lo que hacen `ArticlePriceRangeHelper::rango()`
				y `::precio()` del lado que cobra.
			*/
			if (elegido === null) {
				return null
			}
			/* Criterio 4: el ganador tiene que tener ALGUNA de las dos formas usables. Si no
			   tiene ninguna, el rango no aplica y no se le deja el lugar al segundo. */
			if (
				this.precio_fijo_del_tramo(elegido) === null
				&& this.porcentaje_del_tramo(elegido) === null
			) {
				return null
			}
			return elegido
		},
		/**
		 * Criterio 4.a: el PRECIO FIJO usable de un tramo, o null.
		 *
		 * 🔴 El `<= 0` y no `== 0` es deliberado, y el gemelo de `tienda-api` lo descarta igual:
		 * un tramo con precio negativo es un dato imposible de cargar con sentido, pero si
		 * llegara a existir, aceptarlo sería cobrar plata al revés. Los dos lados descartan, y
		 * descartan hacia el mismo lado.
		 *
		 * `Number(null)` es 0 y `Number(undefined)` es NaN: las dos formas de "no hay precio
		 * fijo" caen acá sin necesidad de un caso especial.
		 *
		 * @param {object} rango
		 * @returns {number|null}
		 */
		precio_fijo_del_tramo(rango) {
			if (!rango) {
				return null
			}
			/*
				🔴 El booleano se descarta ANTES del Number(), y no es paranoia de tipos: los otros
				tres criterios lo descartan. `Number(true)` es 1, o sea que sin esta linea un
				`price` en true se leia acá como UN PESO —un artículo regalado— mientras
				`ArticlePriceRangeHelper` del lado que cobra lo rechazaba y cobraba el precio
				normal. Lo encontró el chequeo cruzado de las cuatro implementaciones (24/9/2026,
				33 bordes): era la única divergencia de las cuatro, junto con su gemela de
				`porcentaje_del_tramo()`.

				Hoy no llega un booleano —la columna es decimal y los tramos viajan crudos de la
				base—, pero el criterio de `criterio_de_precio.js` ya lo contempla explícitamente
				(`typeof valor == 'boolean'` -> null) y este espejo tiene que decir lo mismo que
				sus tres gemelos, no lo mismo "en los casos que hoy pasan".
			*/
			if (typeof rango.price == 'boolean') {
				return null
			}
			let price = Number(rango.price)
			if (!isFinite(price) || price <= 0) {
				return null
			}
			return price
		},
		/**
		 * Criterio 4.b: el PORCENTAJE de descuento usable de un tramo, o null. Mayor a 0 y menor
		 * a 100, los dos excluidos.
		 *
		 * 🔴 El 100 queda afuera en las CUATRO implementaciones del criterio
		 * (`CriterioDeOfertaPorCantidadHelper` de empresa-api, el `.js` del ABM,
		 * `ArticlePriceRangeHelper` de tienda-api y esta): dejaría el precio en cero. Si un lado
		 * lo aceptara y otro no, el comprador vería un número y le cobrarían otro — con la
		 * agravante de que uno de los dos números sería cero.
		 *
		 * @param {object} rango
		 * @returns {number|null}
		 */
		porcentaje_del_tramo(rango) {
			if (!rango) {
				return null
			}
			/* Misma razón que en `precio_fijo_del_tramo()`: `Number(true)` es 1, y sin esto un
			   `porcentaje` en true descontaba un 1% que ninguna de las otras tres puntas descuenta. */
			if (typeof rango.porcentaje == 'boolean') {
				return null
			}
			let porcentaje = Number(rango.porcentaje)
			if (!isFinite(porcentaje) || porcentaje <= 0 || porcentaje >= 100) {
				return null
			}
			return porcentaje
		},
		/**
		 * El precio del artículo en escala CRUDA: la base sobre la que muerde un tramo por
		 * porcentaje, antes del factor del cliente y antes del recargo online.
		 *
		 * 🔴 Es el espejo exacto de `AjustesDeClienteHelper::precio_sin_ajustes()` de la API, que
		 * es el número que el servidor usa para cobrar el porcentaje. `final_price` llega YA
		 * ajustado (la API se lo manda así al SPA) y `precio_sin_ajustes_de_cliente` es la base
		 * que la propia API cuelga al lado para poder deshacerlo; sin la clave —comprador sin
		 * ajustes, API vieja— los dos números son el mismo.
		 *
		 * Calcular el porcentaje sobre `final_price` y despues multiplicar por el factor le
		 * aplicaría el factor DOS VECES, que es el defecto que documenta `CartHelper::get_price()`
		 * con su medición (1000 × 0,945 × 0,945 = 893,03 en un camino y 945 en el otro).
		 *
		 * @param {object} article
		 * @returns {number|null}
		 */
		base_cruda_del_articulo(article) {
			if (!article) {
				return null
			}
			let base = Number(article.precio_sin_ajustes_de_cliente)
			if (!isFinite(base) || base <= 0) {
				base = Number(article.final_price)
			}
			if (!isFinite(base) || base <= 0) {
				return null
			}
			return base
		},
		/**
		 * El precio unitario a MOSTRAR cuando la cantidad elegida cae en un rango por cantidad.
		 * null cuando no hay rango que aplique (ahí manda `articlePriceEfectivo`).
		 *
		 * 🔴 La ESCALA importa y es la misma trampa que ya explican `precio_sin_oferta()` y sus
		 * hermanas de más abajo: `articlePriceEfectivo()` no muestra `final_price` pelado, le
		 * suma el `online_price_surchage` y lo redondea. El `price` del rango viene en la escala
		 * de `final_price` (es un precio unitario absoluto CON IVA cargado en el ERP), así que
		 * para que el número del rango y el precio normal sean comparables hay que pasarlo por
		 * el mismo recargo y el mismo redondeo. Sin eso el comprador vería dos cifras de escalas
		 * distintas y un "ahorro" que no es el real.
		 *
		 * ⚠️ El precio que el servidor guarda en el pivote del carrito NO lleva ese recargo (lo
		 * resuelve `CartHelper::get_price()`, que es del lado API y no conoce la configuración
		 * online del SPA). Quien necesite la escala del servidor usa
		 * `rango_de_precio_por_cantidad()` y resuelve el modo con `precio_fijo_del_tramo()` /
		 * `porcentaje_del_tramo()`; leer `rango.price` derecho alcanzaba antes de la misión
		 * oferta-por-cantidad-porcentaje, pero un tramo por porcentaje lo tiene en null.
		 *
		 * @param {object} article
		 * @param {number|string} cantidad
		 * @param {boolean} formated
		 * @returns {string|number|null}
		 */
		precio_por_cantidad(article, cantidad, formated = true) {
			if (!this.puede_ver_precios()) {
				return null
			}
			/* Con precio pausado no hay importe unitario: manda el texto de configuración. */
			if (!article || this.flag_activo(article.precio_pausado)) {
				return null
			}
			let rango = this.rango_de_precio_por_cantidad(article, cantidad)
			if (!rango) {
				return null
			}
			/*
				Criterio 4: el modo del tramo ganador. El precio fijo gana; si no hay, muerde el
				porcentaje.

				🔴 Y el porcentaje se resuelve en escala CRUDA —sobre `base_cruda_del_articulo()`,
				que es el `final_price` SIN los ajustes del cliente y SIN el recargo online—,
				exactamente como lo resuelve `ArticlePriceRangeHelper::precio()` del lado que
				cobra. Recién después pasa por el factor del cliente y por el recargo, igual que
				hace el precio fijo unas líneas más abajo.

				Si el porcentaje se aplicara DESPUÉS del recargo, el redondeo daría un número
				distinto al que cobra el servidor: es la misma trampa de escala que explican el
				bloque de arriba y `precio_sin_oferta()`.

				El `Math.round(x * 100) / 100` es el mismo redondeo a centavos que ya usa
				`precio_con_oferta_por_cantidad()` para el OTRO mecanismo, y el mismo `round(..., 2)`
				que hace el servidor. Sin él, pantalla y servidor dirían números distintos por
				fracciones de centavo.
			*/
			let price = this.precio_fijo_del_tramo(rango)
			if (price === null) {
				let porcentaje = this.porcentaje_del_tramo(rango)
				let base = this.base_cruda_del_articulo(article)
				/* Sin base no hay a qué aplicarle el porcentaje: manda el precio normal, que es
				   el lado seguro y lo que devuelve el servidor en ese mismo caso. */
				if (porcentaje === null || base === null) {
					return null
				}
				price = Math.round(base * (1 - porcentaje / 100) * 100) / 100
			}
			/* El tramo viene de la base SIN los ajustes del cliente (el servidor no se los aplica
			   al mandarlo, porque el carrito lo relee de la base y le aplica el factor ahi). Para
			   mostrar lo mismo que se va a cobrar, el factor se aplica aca, con el mismo redondeo
			   a centavos que el servidor. */
			let factor_del_cliente = this.factor_de_ajustes(this.ajustes_de_cliente(article))
			if (factor_del_cliente != 1) {
				price = Math.round(price * factor_del_cliente * 100) / 100
			}
			/* Mismo recargo y mismo redondeo que articlePriceEfectivo. Ver el bloque de arriba. */
			if (this.commerce.online_configuration.online_price_surchage) {
				price += price * Number(this.commerce.online_configuration.online_price_surchage) / 100
				price = Math.round(price)
			}
			return formated ? this.price(price) : price
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
			/* Nunca un tachado igual o menor al precio de al lado. Sin ajustes del cliente no
			   pasa nunca (la oferta siempre baja el precio), pero con un recargo del cliente
			   encima de la oferta el precio final puede quedar por ENCIMA de la base. */
			if (this.ajustes_de_cliente(article).length) {
				let mostrado = Number(this.articlePriceEfectivo(article, false))
				if (!isNaN(mostrado) && price <= mostrado) {
					return null
				}
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
		 * "A partir de 10 unidades, 15% de descuento": la OFERTA POR CANTIDAD del artículo
		 * (`article_price_ranges`), dicha en una línea (misión oferta-por-cantidad-porcentaje,
		 * 24/9/2026).
		 *
		 * 🔴 Es el HERMANO de `texto_del_mejor_tramo()`, no el mismo: aquél es la oferta
		 * personalizada de tipo 'cantidad' (un acuerdo con UN comprador, `client_offer_ranges`) y
		 * éste es la oferta por cantidad que el comercio carga en el ABM del artículo, para todo
		 * el mundo. Son dos mecanismos distintos con dos tablas distintas, y por eso son dos
		 * frases. La redacción de ésta la eligió Lucas.
		 *
		 * 🔴 Vive en el mixin y no en el componente porque la frase se muestra en DOS lados —la
		 * ficha del producto y la tarjeta del listado— y es el mismo dato: escrita dos veces, el
		 * día que cambie la redacción va a cambiar en uno solo.
		 *
		 * ── SE MUESTRA UN SOLO TRAMO, EL MEJOR, Y ES UNA DECISIÓN ────────────────────────────
		 *
		 * Un artículo puede tener una escala entera de tramos. Listarla toda convertiría en una
		 * tabla lo que el diseño de los dos lugares pide que sea un renglón: en la ficha la línea
		 * es gris y chica, "a media voz, no un cartel de oferta", y en la tarjeta del listado el
		 * espacio ya está repartido entre el badge de descuento, el tachado y el precio. Además
		 * el número grande de la ficha YA se mueve solo al cambiar la cantidad, así que la escala
		 * completa el comprador la descubre usándola. Se muestra el de mayor `amount` con valor
		 * usable, que es el mejor precio que puede conseguir.
		 *
		 * El precio del tramo de monto fijo sale de `precio_por_cantidad()` con la cantidad de
		 * ese tramo: así el número anunciado es EL MISMO que va a ver cuando ponga esa cantidad,
		 * con su factor de cliente y con el recargo online adentro.
		 *
		 * @param {object} article artículo con sus `article_price_ranges`
		 * @returns {string|null}
		 */
		texto_de_la_oferta_por_cantidad(article) {
			if (!this.puede_ver_precios()) {
				return null
			}
			if (!article || !Array.isArray(article.article_price_ranges) || !article.article_price_ranges.length) {
				return null
			}
			/* Con el precio pausado no hay importe que anunciar: manda el texto de configuración. */
			if (this.flag_activo(article.precio_pausado)) {
				return null
			}
			/* El mejor tramo: mayor `amount` con valor usable. Acá SÍ se filtra por valor antes de
			   comparar, y no contradice el criterio 4 — esto no decide ningún precio, decide qué
			   anunciar. Un tramo sin valor usable no se puede anunciar porque no existe para
			   nadie: ni el servidor lo cobra ni `precio_por_cantidad()` lo muestra. */
			let mejor = null
			article.article_price_ranges.forEach(rango => {
				if (!rango) {
					return
				}
				let amount = Number(rango.amount)
				if (!isFinite(amount) || amount <= 0) {
					return
				}
				if (rango.modo !== 'Mayor o igual' && rango.modo !== 'Igual') {
					return
				}
				if (
					this.precio_fijo_del_tramo(rango) === null
					&& this.porcentaje_del_tramo(rango) === null
				) {
					return
				}
				if (mejor === null || amount > Number(mejor.amount)) {
					mejor = rango
				}
			})
			if (mejor === null) {
				return null
			}
			let cantidad = Number(mejor.amount)
			let unidades = cantidad + (cantidad === 1 ? ' unidad' : ' unidades')
			let apertura = mejor.modo === 'Igual'
				? 'Comprando exactamente ' + unidades
				: 'A partir de ' + unidades
			/* El porcentaje se dice como porcentaje; el monto fijo, con el precio que se va a
			   mostrar para esa cantidad. */
			let porcentaje = this.porcentaje_del_tramo(mejor)
			if (this.precio_fijo_del_tramo(mejor) === null && porcentaje !== null) {
				let legible = this.porcentaje_legible(porcentaje)
				if (!legible) {
					return null
				}
				return apertura + ', ' + legible + '% de descuento'
			}
			let precio = this.precio_por_cantidad(article, cantidad)
			if (!precio) {
				return null
			}
			return apertura + ', ' + precio + ' cada una'
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
			/* Con oferta personalizada manda SU tachado (precio_sin_oferta, al lado del precio) y
			   los ajustes del cliente se suman como badges: decision del plan de la mision
			   descuentos-recargos-por-cliente. Un solo tachado por precio, siempre. */
			if (this.oferta_personalizada(article)) {
				return null
			}
			let descuentos = this.descuentos_visibles(article)
			let ajustes = this.ajustes_de_cliente(article)
			if (!descuentos.length && !ajustes.length) {
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
			/*
				🔴 Los ajustes del cliente se aplicaron DESPUES de los descuentos del articulo (el
				ERP deja final_price con esos, y la tienda multiplica por el factor del cliente
				encima). La cuenta inversa va en el orden inverso: primero se saca el factor del
				cliente, despues se suman los montos fijos y al final se divide por los
				porcentajes del articulo. Con un recargo que domina el factor pasa de 1 y el
				original sale MENOR que el precio: ahi no hay tachado (lo corta el chequeo de
				abajo) y solo quedan los badges.
			*/
			let factor_del_cliente = this.factor_de_ajustes(ajustes)
			if (!(factor > 0) || factor > 1 || !(factor_del_cliente > 0)) {
				return null
			}
			let original = Math.round((base / factor_del_cliente + suma_montos) / factor)
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
		/**
		 * ¿Ese porcentaje sirve para un recargo? Mismo criterio que
		 * AjustesDeClienteHelper::porcentajeUsable() del servidor: numerico y mayor a 0.
		 *
		 * @param {number|string|null} porcentaje
		 * @returns {boolean}
		 */
		porcentaje_de_recargo_usable(porcentaje) {
			if (porcentaje === null || typeof porcentaje == 'undefined' || porcentaje === '') {
				return false
			}
			let numero = Number(porcentaje)
			if (isNaN(numero)) {
				return false
			}
			return numero > 0
		},
		/**
		 * ¿Ese ajuste del cliente (descuento o recargo) se puede usar?
		 *
		 * @param {object} ajuste {tipo, percentage}
		 * @returns {boolean}
		 */
		ajuste_de_cliente_usable(ajuste) {
			if (!ajuste) {
				return false
			}
			if (ajuste.tipo == 'recargo') {
				return this.porcentaje_de_recargo_usable(ajuste.percentage)
			}
			return this.porcentaje_de_descuento_usable(ajuste.percentage)
		},
		/**
		 * Los descuentos y recargos del cliente del comprador que la API YA le aplico a este
		 * articulo (o combo, o promo), o [] (mision descuentos-recargos-por-cliente).
		 *
		 * 🔴 Es la UNICA puerta de lectura de `article.ajustes_de_cliente` en todo el SPA. El
		 * precio NO se recalcula aca: `final_price` llega de la API con el factor ya aplicado
		 * (encima de la oferta personalizada, si la hay). Esta lista sirve para los badges y
		 * para reconstruir el tachado.
		 *
		 * El contrato es ADITIVO: una API vieja, un comprador sin cliente del ERP o un
		 * articulo que llego por un camino sin checkPriceTypes no traen el campo y aca sale [].
		 *
		 * @param {object} article
		 * @returns {Array} cada uno {id, tipo: 'descuento'|'recargo', name, percentage}
		 */
		ajustes_de_cliente(article) {
			if (!this.puede_ver_precios()) {
				return []
			}
			if (!article || !Array.isArray(article.ajustes_de_cliente) || !article.ajustes_de_cliente.length) {
				return []
			}
			/* Con el precio pausado no hay importe: el servidor tampoco ajusta nada. */
			if (this.flag_activo(article.precio_pausado)) {
				return []
			}
			return article.ajustes_de_cliente.filter(ajuste => {
				return this.ajuste_de_cliente_usable(ajuste)
			})
		},
		/**
		 * El factor combinado de una lista de ajustes: Π(1 − d/100) × Π(1 + r/100). La MISMA
		 * formula que Vender en el ERP y que AjustesDeClienteHelper::factor() en la tienda.
		 *
		 * @param {Array} ajustes
		 * @returns {number} 1 sin ajustes
		 */
		factor_de_ajustes(ajustes) {
			let factor = 1
			if (!Array.isArray(ajustes)) {
				return factor
			}
			ajustes.forEach(ajuste => {
				if (!this.ajuste_de_cliente_usable(ajuste)) {
					return
				}
				if (ajuste.tipo == 'recargo') {
					factor *= (1 + Number(ajuste.percentage) / 100)
				} else {
					factor *= (1 - Number(ajuste.percentage) / 100)
				}
			})
			return factor
		},
		/**
		 * El texto del badge de un ajuste del cliente. El descuento sigue el estilo de
		 * texto_de_descuento() ("10% off") y el recargo es su espejo ("5% recargo"). El
		 * porcentaje va por porcentaje_legible() y no por formatDecimals(), que con un 100
		 * se come los ceros.
		 *
		 * @param {object} ajuste
		 * @returns {string}
		 */
		texto_de_ajuste(ajuste) {
			let porcentaje = this.porcentaje_legible(ajuste ? ajuste.percentage : null)
			if (!porcentaje) {
				return ''
			}
			if (ajuste.tipo == 'recargo') {
				return porcentaje + '% recargo'
			}
			return porcentaje + '% off'
		},
		/**
		 * TODOS los badges del precio de un articulo en un listado o en la ficha, en el orden en
		 * que se aplicaron: los descuentos generales visibles del articulo y despues los ajustes
		 * del cliente. Cada uno {clave, tipo: 'descuento'|'recargo', texto}.
		 *
		 * Los descuentos del articulo siguen atados a su tachado (regla del 3/9/2026: sin
		 * tachado no hay badges)... salvo que haya ajustes del cliente: con un recargo que
		 * domina no hay tachado (el precio final es mayor que el de lista), y mostrar solo el
		 * recargo sin el descuento del articulo dejaria una cuenta que no cierra.
		 *
		 * @param {object} article
		 * @returns {Array}
		 */
		badges_de_precio(article) {
			let badges = []
			let ajustes = this.ajustes_de_cliente(article)
			let descuentos = this.descuentos_visibles(article)
			if (descuentos.length && (ajustes.length || this.precio_sin_descuentos(article))) {
				descuentos.forEach((descuento, index) => {
					badges.push({
						clave: 'articulo-' + index,
						tipo: 'descuento',
						texto: this.texto_de_descuento(descuento),
					})
				})
			}
			ajustes.forEach((ajuste, index) => {
				badges.push({
					clave: 'cliente-' + ajuste.tipo + '-' + index,
					tipo: ajuste.tipo == 'recargo' ? 'recargo' : 'descuento',
					texto: this.texto_de_ajuste(ajuste),
				})
			})
			return badges
		},
		/**
		 * Los badges de los ajustes del cliente solos (sin los descuentos del articulo). Es lo
		 * que va en el carrito, en los combos y en las promociones, donde no se muestran los
		 * descuentos generales del articulo.
		 *
		 * @param {object} item
		 * @returns {Array}
		 */
		badges_de_ajustes(item) {
			let badges = []
			this.ajustes_de_cliente(item).forEach((ajuste, index) => {
				badges.push({
					clave: 'cliente-' + ajuste.tipo + '-' + index,
					tipo: ajuste.tipo == 'recargo' ? 'recargo' : 'descuento',
					texto: this.texto_de_ajuste(ajuste),
				})
			})
			return badges
		},
		/**
		 * El precio de antes de los ajustes del cliente para algo con precio FIJO (combo o
		 * promo de vinoteca), para tacharlo al lado del ajustado. null si no hay nada honesto
		 * que tachar: sin ajustes, o si los recargos dominan (el de antes no es mayor).
		 *
		 * `precio` es el que se esta mostrando al lado (final_price en un listado, pivot.price
		 * en el carrito): el tachado se reconstruye dividiendo por el factor, asi los badges
		 * que se muestran alcanzan para rehacer la cuenta.
		 *
		 * @param {object} item
		 * @param {number|string} precio
		 * @returns {string|null}
		 */
		precio_sin_ajustes_de_cliente(item, precio) {
			let ajustes = this.ajustes_de_cliente(item)
			if (!ajustes.length) {
				return null
			}
			let mostrado = Number(precio)
			let factor = this.factor_de_ajustes(ajustes)
			if (!isFinite(mostrado) || mostrado <= 0 || !(factor > 0)) {
				return null
			}
			let original = Math.round(mostrado / factor * 100) / 100
			/* En centavos, para no comparar flotantes: nunca un tachado igual o menor al precio de
			   al lado. */
			if (Math.round(original * 100) <= Math.round(mostrado * 100)) {
				return null
			}
			return this.price(original)
		},
		/**
		 * La lista de ajustes del comprador logueado, para el desplegable del nombre. Sale de
		 * `user.ajustes_de_cliente` ({descuentos, recargos}), que la API cuelga en /api/user y en
		 * el login. [] con una API vieja o un comprador sin cliente del ERP.
		 *
		 * @returns {Array} cada uno {id, tipo, name, percentage}
		 */
		ajustes_del_comprador() {
			if (!this.authenticated || !this.user || !this.user.ajustes_de_cliente) {
				return []
			}
			let lista = []
			let ajustes = this.user.ajustes_de_cliente
			if (Array.isArray(ajustes.descuentos)) {
				ajustes.descuentos.forEach(descuento => {
					lista.push(Object.assign({}, descuento, { tipo: 'descuento' }))
				})
			}
			if (Array.isArray(ajustes.recargos)) {
				ajustes.recargos.forEach(recargo => {
					lista.push(Object.assign({}, recargo, { tipo: 'recargo' }))
				})
			}
			return lista.filter(ajuste => {
				return this.ajuste_de_cliente_usable(ajuste)
			})
		},
		/**
		 * Los ajustes que YA tiene aplicados el carrito: los que el servidor le colgo a sus
		 * lineas (articulos, promos y combos), sin repetir. Es lo que se lista en el resumen del
		 * carrito y del checkout, y sale del carrito y no del comprador a proposito: dice con
		 * que se pricearon ESTAS lineas.
		 *
		 * @param {object} cart
		 * @returns {Array}
		 */
		ajustes_del_carrito(cart) {
			let lista = []
			let vistos = {}
			if (!cart) {
				return lista
			}
			let colecciones = [cart.articles, cart.promociones_vinoteca, cart.combos]
			colecciones.forEach(coleccion => {
				if (!Array.isArray(coleccion)) {
					return
				}
				coleccion.forEach(item => {
					this.ajustes_de_cliente(item).forEach(ajuste => {
						let clave = ajuste.tipo + '-' + ajuste.id
						if (vistos[clave]) {
							return
						}
						vistos[clave] = true
						lista.push(ajuste)
					})
				})
			})
			return lista
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