import { trackear, TIPOS_EVENTO, enviar_cola } from '@/utils/tracking'
import { firma_de_lineas, lineas_del_carrito } from '@/store/cart'
export default {
	computed: {
		/**
		 * Unidades totales del carrito: la suma de las cantidades, no la cantidad de lineas.
		 *
		 * 🔴 Los `Number()` NO son decorativos. `amount` llega como STRING desde la API, asi que
		 * `0 + "1"` da `"01"` y de ahi en adelante cada vuelta CONCATENA en vez de sumar. Con 20
		 * productos en el carrito eso mostraba `013445254443565164166 unidades` en la barra de
		 * navegacion (medido el 29/8/2026 en tienda.comerciocity.store con el comprador
		 * renata.cabrera@gmail.com). El contador de productos distintos de abajo nunca se rompio
		 * porque usa `.length`.
		 *
		 * El patron correcto ya estaba en este mismo archivo, en `total()`:
		 * `Number(article.pivot.price) * Number(article.pivot.amount)`. Habia quedado sin aplicar
		 * justo aca.
		 *
		 * ⚠️ El `|| 0` tampoco sobra: `Number(undefined)` da NaN, y un solo renglon sin `amount`
		 * contagiaria el total entero a `NaN unidades`. Con la concatenacion vieja ese caso salia
		 * como `...undefined...`, o sea que ya estaba roto — pero NaN es una forma de fallar NUEVA
		 * que introduce este arreglo, y esta pantalla se filma para la demo comercial.
		 *
		 * @returns {number}
		 */
		cant_cart_items() {
			let cant_items = 0
			let cart = this.$store.state.cart.cart
			if (cart) {
				cart.articles.forEach(article => {
					cant_items += Number(article.amount) || 0
				})

				cart.promociones_vinoteca.forEach(promo => {
					cant_items += Number(promo.amount) || 0
				})
			}
			return cant_items
		},
		/**
		 * Cantidad de líneas distintas en el carrito (artículos + promos vinoteca).
		 * @returns {number}
		 */
		cart_unique_products_count() {
			let cart = this.$store.state.cart.cart
			if (!cart) {
				return 0
			}
			let count = 0
			if (cart.articles) {
				count += cart.articles.length
			}
			if (cart.promociones_vinoteca) {
				count += cart.promociones_vinoteca.length
			}
			return count
		},
		/**
		 * Etiqueta singular/plural para productos distintos del resumen.
		 * @returns {string}
		 */
		cart_products_label() {
			return this.cart_unique_products_count === 1 ? 'producto' : 'productos'
		},
		/**
		 * Etiqueta singular/plural para unidades totales del resumen.
		 * @returns {string}
		 */
		cart_units_label() {
			return this.cant_cart_items === 1 ? 'unidad' : 'unidades'
		},
		loading_last_cart() {
			return this.$store.state.cart.loading_last_cart
		},
		articles() {
			let cart = this.$store.state.cart.cart
			if (cart) {
				return cart.articles
			}
			return []
		},
		promociones_vinoteca() {
			let cart = this.$store.state.cart.cart
			if (cart) {
				return cart.promociones_vinoteca
			}
			return []
		},
		cart() {
			return this.$store.state.cart.cart
		},
		// cart_buyer() {
		// 	return this.$store.state.cart.buyer
		// },
		delivery_zones() {
			return this.$store.state.delivery_zones.models
		},
		deliver() {
			return this.$store.state.cart.cart.deliver
		},
		cupon: {
			get() {
				return this.$store.state.cart.cupon
			},
			set(value) {
				this.$store.commit('cart/setCupon', value)
			}
		},
		cart_payment_method: {
			get() {
				return this.$store.state.cart.payment_method
			},
			set(value) {
				this.$store.commit('cart/setPaymentMethod', value)
			}
		},
		cart_delivery_zone: {
			get() {
				return this.$store.state.cart.delivery_zone
			},
			set(value) {
				this.$store.commit('cart/setDeliveryZone', value)
			}
		},
		order() {
			return this.$store.state.orders.order
		},
		/**
		 * Total del carrito: valor del servidor si existe; si no, suma local por pivot (guest checkout).
		 */
		total() {
			let cart_total = this.$store.state.cart.cart.total
			if (cart_total != null && cart_total !== undefined) {
				/*
				 * 🔴 El Number() NO es decorativo, es el mismo bug que ya se pago en cant_cart_items.
				 * `carts.total` es decimal(20,2) y PDO lo devuelve como STRING ("10000.00"), asi que
				 * todo lo que sume sobre este valor CONCATENA en vez de sumar:
				 *
				 *   "10000.00" + 2000  ->  "10000.002000"   (el envio desaparece del total)
				 *   "10000.00" + 1000  ->  "10000.001000"   (el recargo desaparece, y su linea da $0)
				 *
				 * price() formatea eso como $10.000,00, o sea que la pantalla muestra un total menor
				 * que el que efectivamente cobra la API (OnlinePaymentHelper si suma bien). Se nota
				 * recien con el carrito YA GUARDADO: con el carrito local el total se calcula abajo
				 * con Number() y da bien, que es por lo que esto sobrevivio tanto.
				 *
				 * Las restas y multiplicaciones (descuentos, cupon) nunca se rompieron: `-` y `*`
				 * fuerzan el numero. Solo el `+` concatena.
				 */
				let numero = Number(cart_total)
				return isFinite(numero) ? numero : 0
			}
			// Calcular localmente para guest (cart no persistido aun)
			let total = 0
			let articles = this.$store.state.cart.cart.articles || []
			articles.forEach(function(article) {
				if (article.pivot && article.pivot.price != null && article.pivot.price !== undefined) {
					total += Number(article.pivot.price) * Number(article.pivot.amount)
				}
			})
			return total
		},
		total_with_payment_method_discount() {
			if (this.cart_payment_method && this.cart_payment_method.discount) {
				return this.total - (this.total * this.cart_payment_method.discount / 100)
			}
			return this.total
		},
		total_with_payment_method_surchage() {
			if (this.cart_payment_method && this.cart_payment_method.surchage) {
				return this.total + (this.total * this.cart_payment_method.surchage / 100)
			}
			return this.total
		},
		total_with_payment_method() {
			if (this.cart_payment_method && this.cart_payment_method.discount) {
				return this.total_with_payment_method_discount
			}
			if (this.cart_payment_method && this.cart_payment_method.surchage) {
				return this.total_with_payment_method_surchage
			}
			return this.total
		},
		total_with_cupon() {
			let total = this.total_with_payment_method 
			if (this.cupon) {
				if (this.cupon.amount) {
					total -= this.cupon.amount
				} else {
					total = total - (total * this.percentageToMultiply(this.cupon.percentage))
				}
			}
			return total
		},
		/**
		 * Estado del envío por correo (Zipnova) en el store: código postal, opciones cotizadas,
		 * opción elegida, sucursal y destino.
		 *
		 * @returns {object}
		 */
		envio() {
			return this.$store.state.cart.envio
		},
		/**
		 * La opción de Zipnova que el comprador eligió, buscada por su `key` entre las opciones
		 * cotizadas. Es null si no eligió o si la opción ya no está en la lista (se re-cotizó y
		 * desapareció): con eso la pantalla nunca muestra un precio que no esté en la cotización.
		 *
		 * @returns {object|null}
		 */
		cart_envio_opcion() {
			let envio = this.$store.state.cart.envio
			if (!envio || !envio.opcion_key) {
				return null
			}
			let opcion = envio.opciones.find(opcion => {
				return opcion.key == envio.opcion_key
			})
			return opcion ? opcion : null
		},
		/**
		 * Si el pedido va por correo (Zipnova): envío a domicilio y una opción de Zipnova elegida.
		 * Es lo que esconde el input de "Dirección" de una sola línea (la reemplaza el formulario
		 * completo de DireccionEnvio) y lo que decide qué se valida al confirmar.
		 *
		 * @returns {boolean}
		 */
		envio_zipnova_elegido() {
			return Number(this.cart.deliver) === 1 && !!this.cart_envio_opcion
		},
		/**
		 * Lo que suma el envío al total en PANTALLA: la zona propia del negocio o la opción de
		 * Zipnova (`precio`, que ya viene con la regla de envío gratis aplicada). Sin envío a
		 * domicilio, cero. Es un cálculo de pantalla: lo que se cobra lo resuelve la API con
		 * `carts.envio_precio` / la zona guardada, y sale del mismo dato.
		 *
		 * @returns {number}
		 */
		envio_precio_elegido() {
			if (Number(this.cart.deliver) !== 1) {
				return 0
			}
			if (this.cart_delivery_zone) {
				let precio = Number(this.cart_delivery_zone.price)
				return isFinite(precio) ? precio : 0
			}
			if (this.cart_envio_opcion) {
				let precio = Number(this.cart_envio_opcion.precio)
				return isFinite(precio) ? precio : 0
			}
			return 0
		},
		/**
		 * Total con el envío. Hasta el 14/9/2026 hacía `Number(this.cart_delivery_zone.price)` sin
		 * guarda y reventaba con la zona en null (retiro por el local, o zona todavía sin elegir);
		 * Total.vue lo esquivaba con un cálculo propio. Ahora suma `envio_precio_elegido`, que ya
		 * contempla la zona, la opción de Zipnova y el caso sin envío.
		 *
		 * @returns {number}
		 */
		total_with_deliver() {
			return this.total_with_cupon + this.envio_precio_elegido
		},
		total_final() {
			return this.total_with_deliver
		},
		buyer_id() {
			return this.$store.state.cart.buyer_id
		},
		selected_buyer() {
			return this.$store.state.cart.selected_buyer
		},
		fecha_entrega() {
			return this.$store.state.cart.fecha_entrega
		},
		/**
		 * Direccion que el comprador tiene a la vista en el checkout y que acepta al
		 * confirmar. Es la unica fuente de verdad de la direccion del pedido: se manda
		 * explicita al backend (OrderController@get_address le da prioridad sobre
		 * cualquier direccion guardada del Buyer o del Client del ERP).
		 *
		 * Orden de resolucion, siguiendo lo que cada flujo muestra en pantalla:
		 *   0. Envio por correo (Zipnova) -> el destino del formulario de DireccionEnvio, en una
		 *      linea (mismo texto que arma EnvioDestinoHelper::como_texto en la API).
		 *   1. Vendedor con cliente seleccionado -> el input de Addresses.vue, que edita
		 *      selected_buyer.comercio_city_client.address.
		 *   2. Comprador invitado -> el input "Direccion" de Buyer.vue (store cart.buyer.address).
		 *   3. Comprador logueado -> el input de Addresses.vue (user.address o
		 *      user.comercio_city_client.address).
		 *
		 * @returns {string|null}
		 */
		order_address() {
			// 0) Envio por correo: la direccion es el destino completo que el comprador cargo. Los
			// inputs de una sola linea de abajo estan ocultos en este caso, asi que no hay otra.
			if (this.envio_zipnova_elegido) {
				let texto = this.envio_destino_texto()
				if (texto) {
					return texto
				}
			}

			// 1) Vendedor con un cliente seleccionado: gana siempre, porque cart.buyer
			// puede tener datos de una sesion anterior del mismo browser.
			if (this.selected_buyer && this.selected_buyer.comercio_city_client && this.selected_buyer.comercio_city_client.address) {
				let direccion = String(this.selected_buyer.comercio_city_client.address).trim()
				if (direccion) {
					return direccion
				}
			}

			// 2) Comprador invitado: lo que escribio en el input de Buyer.vue
			if (this.$store.state.cart.buyer && this.$store.state.cart.buyer.address) {
				let direccion = String(this.$store.state.cart.buyer.address).trim()
				if (direccion) {
					return direccion
				}
			}

			// 3) Comprador logueado: direccion propia o la del cliente del ERP asociado
			if (this.user) {
				if (this.user.address) {
					let direccion = String(this.user.address).trim()
					if (direccion) {
						return direccion
					}
				}
				if (this.user.comercio_city_client && this.user.comercio_city_client.address) {
					let direccion = String(this.user.comercio_city_client.address).trim()
					if (direccion) {
						return direccion
					}
				}
			}

			// Sin direccion (ej. retiro por local): valor valido, el pedido no lleva
			// direccion de envio.
			return null
		},
	},
	methods: {
		discountCupon(total) {
			if (this.cupon) {
				if (this.cupon.amount) {
					total -= this.cupon.amount
				} else {
					total = total - (total * this.percentageToMultiply(this.cupon.percentage))
				}
			}
			return total
		},
		/**
		 * Un valor del destino de envío como texto recortado, o cadena vacía.
		 *
		 * @param {string} clave
		 * @returns {string}
		 */
		envio_destino_valor(clave) {
			let destino = this.$store.state.cart.envio.destino
			if (!destino || destino[clave] === undefined || destino[clave] === null) {
				return ''
			}
			return String(destino[clave]).trim()
		},
		/**
		 * El destino de Zipnova en una sola línea, para `orders.address` (el ERP viejo la muestra
		 * tal cual, y también va en los mails y el WhatsApp del pedido).
		 *
		 * 🔴 Es la réplica en JS de `EnvioDestinoHelper::como_texto()` de la API, y tiene que dar
		 * EXACTAMENTE el mismo texto: el servidor lo vuelve a armar desde `envio_destino` al crear
		 * el pedido, y si difieren el comprador vería una dirección en pantalla y otra en el mail.
		 * Formato: "{calle} {numero} {piso_depto}, {localidad}, {provincia} (CP {cp}) — {nombre}
		 * {apellido}, DNI {documento}, tel {telefono} ({referencia})".
		 *
		 * @returns {string}
		 */
		envio_destino_texto() {
			let direccion = (this.envio_destino_valor('calle') + ' ' + this.envio_destino_valor('numero') + ' ' + this.envio_destino_valor('piso_depto'))
				.trim()
				.replace(/\s+/g, ' ')

			let partes = []
			if (direccion !== '') {
				partes.push(direccion)
			}
			if (this.envio_destino_valor('localidad') !== '') {
				partes.push(this.envio_destino_valor('localidad'))
			}
			let provincia = this.envio_destino_valor('provincia')
			let cp = this.envio_destino_valor('codigo_postal')
			if (provincia !== '' || cp !== '') {
				partes.push((provincia + (cp !== '' ? ' (CP ' + cp + ')' : '')).trim())
			}

			let persona = (this.envio_destino_valor('nombre') + ' ' + this.envio_destino_valor('apellido')).trim()
			let datos = []
			if (persona !== '') {
				datos.push(persona)
			}
			if (this.envio_destino_valor('documento') !== '') {
				datos.push('DNI ' + this.envio_destino_valor('documento'))
			}
			if (this.envio_destino_valor('telefono') !== '') {
				datos.push('tel ' + this.envio_destino_valor('telefono'))
			}

			let texto = partes.join(', ')
			if (datos.length) {
				texto += (texto !== '' ? ' — ' : '') + datos.join(', ')
			}
			if (this.envio_destino_valor('referencia') !== '') {
				texto += ' (' + this.envio_destino_valor('referencia') + ')'
			}
			return texto
		},
		/**
		 * Etiquetas visibles de los campos del destino, por clave. Son las mismas que muestra
		 * DireccionEnvio.vue: el aviso de "te falta completar" tiene que decir lo que el
		 * comprador ve en la pantalla, no el nombre del campo en la base.
		 *
		 * @param {string} clave
		 * @returns {string}
		 */
		envio_destino_etiqueta(clave) {
			let etiquetas = {
				nombre: 'Nombre',
				apellido: 'Apellido',
				documento: 'DNI',
				email: 'Email',
				telefono: 'Teléfono',
				calle: 'Calle',
				numero: 'Número',
				piso_depto: 'Piso / Depto',
				localidad: 'Localidad',
				provincia: 'Provincia',
				codigo_postal: 'Código postal',
				referencia: 'Referencias',
				point_id: 'Sucursal de retiro',
			}
			return etiquetas[clave] ? etiquetas[clave] : clave
		},
		/**
		 * Claves del destino que faltan o son inválidas, con las mismas reglas que
		 * `EnvioDestinoHelper::faltantes()` de la API: nombre, DNI (7 a 11 dígitos), email válido,
		 * teléfono (8 dígitos o más), localidad, provincia y código postal siempre; calle y número
		 * solo a domicilio; sucursal elegida solo en retiro en sucursal.
		 *
		 * Se valida acá para no mandar un carrito que el servidor va a rechazar con 422, pero el
		 * servidor valida igual: esto es la primera línea, no la única.
		 *
		 * @returns {string[]} claves (ver envio_destino_etiqueta para el nombre visible)
		 */
		envio_destino_faltantes() {
			let faltan = []
			let opcion = this.cart_envio_opcion
			let es_punto_de_retiro = !!(opcion && opcion.es_punto_de_retiro)

			let obligatorios = ['nombre', 'documento', 'email', 'telefono', 'localidad', 'provincia', 'codigo_postal']
			if (!es_punto_de_retiro) {
				obligatorios.push('calle', 'numero')
			}
			obligatorios.forEach(clave => {
				if (this.envio_destino_valor(clave) === '') {
					faltan.push(clave)
				}
			})

			// Mismo recorte que hace el servidor al normalizar: espacios, puntos y guiones afuera,
			// así "30.111.222" vale acá igual que allá.
			let documento = this.envio_destino_valor('documento').replace(/[\s.\-]/g, '')
			if (documento !== '' && !/^\d{7,11}$/.test(documento)) {
				faltan.push('documento')
			}
			let email = this.envio_destino_valor('email')
			if (email !== '' && !this.isEmail(email)) {
				faltan.push('email')
			}
			let telefono = this.envio_destino_valor('telefono')
			if (telefono !== '' && telefono.replace(/\D/g, '').length < 8) {
				faltan.push('telefono')
			}
			if (es_punto_de_retiro && !this.$store.state.cart.envio.point_id) {
				faltan.push('point_id')
			}

			return faltan.filter((clave, index) => {
				return faltan.indexOf(clave) === index
			})
		},
		/**
		 * Lleva la pantalla a una sección del checkout, solo si existe. `makeOrder` corre también
		 * desde Payway y el modal del carrito, donde no hay ninguna sección de envío, y el
		 * `_scrollTo` del mixin general reintenta cada 500 ms para siempre si el id no está.
		 *
		 * @param {string} id
		 */
		scroll_a_seccion(id) {
			if (document.getElementById(id)) {
				this.scrollTo(id)
			}
		},
		/**
		 * Atiende los errores del envío por correo que devuelven el `PUT /api/carts` y el
		 * `POST /api/orders`, y le dice al comprador qué hacer:
		 *
		 *   - 422 `opcion_envio`: la opción elegida ya no está (cambió el carrito, venció la
		 *     cotización). Se suelta la elección; si el servidor mandó `opciones` frescas se
		 *     muestran esas (ya re-cotizó él), si no se vuelve a cotizar.
		 *   - 422 `destino`: faltan datos del destinatario. Se marcan los campos que el servidor
		 *     rechazó (`errors`) y se lleva al comprador al formulario.
		 *   - 422 `sin_zipnova` / `sin_articulos`: el negocio ya no cotiza por correo o no hay
		 *     nada que enviar. Se suelta la opción para que elija otra forma de envío.
		 *   - 422 `ubicacion`: Zipnova no reconoció el destino. Se suelta la opción y el cotizador
		 *     pide localidad y provincia.
		 *   - 502 `zipnova`: Zipnova no respondió. Se avisa y la opción queda: es reintentable.
		 *
		 * @param {object} err Error de axios.
		 * @returns {boolean} true si el error era del envío y ya se le avisó al comprador.
		 */
		manejar_error_de_envio(err) {
			if (!err || !err.response || !err.response.data) {
				return false
			}
			let status = err.response.status
			let data = err.response.data
			if ((status != 422 && status != 502) || !data.codigo) {
				return false
			}
			let self = this

			if (data.codigo == 'opcion_envio') {
				this.$toast.error(data.message || 'Esa forma de envío ya no está disponible, volvé a cotizar')
				this.$store.commit('cart/set_envio_opcion_key', null)
				if (Array.isArray(data.opciones)) {
					// El servidor ya re-cotizó: son las opciones vigentes para este carrito y este
					// CP, no hace falta pedirlas de nuevo (y sería otra consulta a Zipnova).
					this.$store.commit('cart/set_envio_opciones', {
						opciones: data.opciones,
						zipcode: this.$store.state.cart.envio.zipcode,
						city: data.city,
						state: data.state,
						envio_gratis: data.opciones.length ? !!data.opciones[0].envio_gratis : false,
						items_firma: firma_de_lineas(lineas_del_carrito(this.$store.state.cart.cart)),
					})
				} else if (this.$store.state.cart.envio.zipcode) {
					this.$store.dispatch('cart/cotizar_envio', {
						articles: lineas_del_carrito(this.$store.state.cart.cart),
						cart_id: this.cart && this.cart.id ? this.cart.id : null,
					})
					.catch(() => {
						// El mensaje ya quedó en envio.error y el cotizador lo muestra.
					})
				}
				this.scroll_a_seccion('formas-de-envio')
				return true
			}

			if (data.codigo == 'destino') {
				let claves = []
				if (data.errors && typeof data.errors === 'object') {
					Object.keys(data.errors).forEach(clave => {
						claves.push(clave)
					})
				}
				this.$store.commit('cart/set_envio_errores_destino', claves)
				let etiquetas = []
				claves.forEach(clave => {
					etiquetas.push(self.envio_destino_etiqueta(clave))
				})
				if (etiquetas.length) {
					this.$toast.error('Revisá los datos del envío: ' + etiquetas.join(', '))
				} else {
					this.$toast.error(data.message || 'Revisá los datos del envío')
				}
				this.scroll_a_seccion('direccion-envio')
				return true
			}

			if (data.codigo == 'sin_zipnova' || data.codigo == 'sin_articulos' || data.codigo == 'ubicacion') {
				this.$toast.error(data.message || 'No pudimos cotizar el envío. Elegí otra forma de envío.')
				this.$store.commit('cart/set_envio_opcion_key', null)
				if (data.codigo == 'ubicacion') {
					this.$store.commit('cart/set_envio_needs_location', true)
				}
				this.scroll_a_seccion('formas-de-envio')
				return true
			}

			if (data.codigo == 'zipnova') {
				this.$toast.error(data.message || 'No pudimos cotizar el envío en este momento. Probá de nuevo en un rato.')
				return true
			}

			return false
		},
		/**
		 * Crea el pedido a partir del carrito.
		 *
		 * Devuelve SIEMPRE una promesa, y resuelve con `true` si el pedido quedo creado o con `null`
		 * si algo fallo. Antes no devolvia nada, y por eso el checkout no tenia forma de encadenar
		 * nada despues del pedido: el camino de Mercado Pago pedia la preferencia EN PARALELO, sin
		 * mirar si el pedido se habia creado.
		 *
		 * Desde el 14/9/2026 tambien puede resolver con `false`: el `PUT /carts` o el `POST /orders`
		 * rechazaron el envio por correo (422 `opcion_envio` / `destino` / `sin_zipnova` /
		 * `sin_articulos` / `ubicacion`, o 502 `zipnova`) y `manejar_error_de_envio` YA le dijo al
		 * comprador que hacer. El llamador no tiene que mostrar el aviso generico en ese caso.
		 *
		 * No rechaza nunca: los llamadores viejos (Payway, el modal del carrito, el gateway) la
		 * invocan sin `.catch`, y una promesa rechazada ahi solo ensuciaria la consola.
		 *
		 * @param {boolean} from_mercadopago El pago sigue en Mercado Pago: no se limpia el carrito ni
		 *                                   se navega a la pagina de gracias, eso pasa al volver.
		 * @param {boolean} mostrar_overlay Prender el cartel de carga a pantalla completa. El checkout
		 *                                  pasa `false` porque muestra el estado adentro del boton;
		 *                                  los demas llamadores no tienen boton propio y lo dejan en
		 *                                  `true`.
		 * @returns {Promise<boolean|null>}
		 */
		makeOrder(from_mercadopago = false, mostrar_overlay = true) {
			if (!this.canMakeOrder()) {
				return Promise.resolve(null)
			}

			let self = this

			if (mostrar_overlay) {
				this.$store.commit('auth/setLoading', true)
				this.$store.commit('auth/setMessage', 'Enviando pedido')
			}

			let apagar_overlay = function() {
				if (mostrar_overlay) {
					self.$store.commit('auth/setLoading', false)
					self.$store.commit('auth/setMessage', '')
				}
			}

			return this.$store.dispatch('cart/save')
			.then(function() {
				return self.$api.post('/orders', {
					commerce_id 	: process.env.VUE_APP_COMMERCE_ID,
					cart_id         : self.cart.id,
					dolar_blue      : self.dolar_blue,
					buyer_id		: self.buyer_id,
					seller_id		: self.user.seller_id,
					buyer 			: self.user,
					selected_buyer 	: self.selected_buyer,
					fecha_entrega 	: self.fecha_entrega,
					// Direccion explicita: la que el comprador VIO en el formulario y acepto al
					// confirmar. OrderController@get_address le da prioridad sobre cualquier
					// direccion guardada en buyer/selected_buyer (ver prompt 402).
					address         : self.order_address,
				})
			})
			.then(function(res) {
				if (from_mercadopago) {
					// El pedido YA quedo creado (el POST devolvio 201): lo que falta es el
					// pago en MercadoPago. Se trackea igual porque checkout_complete
					// significa "pedido creado", no "pedido pagado", y este camino nunca
					// vuelve a pasar por aca.
					//
					// El order_id sale del cuerpo del 201, que OrderController@store ahora
					// devuelve como {"order_id": N}. En esta rama el SPA nunca llama a
					// getCurrentOrder, asi que es la unica forma de conocerlo — y MercadoPago
					// es el medio dominante, o sea que sin esto el grueso de los
					// checkout_complete quedaria sin poder atarse a la venta.
					//
					// 🔴 El fallback a null NO es defensivo por las dudas: los dos lados nunca
					// se despliegan juntos, asi que este SPA va a correr un tiempo contra la
					// API vieja, que responde 201 con cuerpo VACIO. Ahi order_id queda null y
					// el evento igual se manda (armar_evento saltea los null).
					let order_id = res.data && res.data.order_id ? res.data.order_id : null
					trackear(TIPOS_EVENTO.CHECKOUT_COMPLETO, {
						order_id: order_id,
						amount: self.total,
					})
					// Vaciado inmediato: esta rama se va del SPA enseguida (redirect a
					// MercadoPago) y los 5 segundos del temporizador de la cola no llegan.
					// Ver el comentario largo de la rama de abajo para el otro motivo.
					enviar_cola()
					apagar_overlay()
					return true
				}

				// Se guarda el id ANTES de limpiar el carrito del store: despues self.cart es null.
				let cart_id = self.cart.id
				// Mismo motivo que cart_id: el total del carrito hay que leerlo antes de vaciarlo.
				let total_del_pedido = self.total

				self.$store.commit('cart/setCart', null)
				self.$store.commit('cart/set_buyer_id', null)
				self.$store.commit('cart/set_selected_buyer', null)
				localStorage.cart = null

				// Secuencia obligatoria. El orden ES el fix: OrderController@current resuelve el
				// comprador leyendo del guard 'buyer', asi que si la sesion se invalida antes,
				// el pedido no se puede recuperar nunca mas y la pagina de gracias queda vacia.
				// 1) cargar el pedido -> 2) borrar el carrito -> 3) cerrar sesion -> 4) navegar.
				return self.$store.dispatch('orders/getCurrentOrder')
				.then(function() {
					// El tracking se SUMA a la secuencia, no la altera: sigue siendo
					// 1) cargar el pedido -> 2) borrar el carrito -> 3) cerrar sesion ->
					// 4) navegar. Va aca y no antes porque el order_id recien se conoce
					// despues de getCurrentOrder (POST /orders responde 201 sin cuerpo).
					let pedido = self.$store.state.orders.order
					trackear(TIPOS_EVENTO.CHECKOUT_COMPLETO, {
						order_id: pedido ? pedido.id : null,
						amount: pedido && pedido.total != null ? pedido.total : total_del_pedido,
					})
					/*
					 * 🔴 Vaciado INMEDIATO, y esto no es una optimizacion: es lo unico que
					 * le da una chance al buyer_id.
					 *
					 * trackear() solo encola — el envio real sale 5 segundos despues, por
					 * temporizador. Mientras tanto esta misma cadena sigue y llega a
					 * logoutGuestAfterOrder(), que hace POST buyer/logout y es el camino
					 * NORMAL del checkout de invitado. Cuando el lote finalmente saliera, la
					 * sesion ya no existe, y BuyerTrackingController resuelve el comprador
					 * desde el guard en el momento de la ingesta: buyer_id llegaria null.
					 * Peor que perderlo siempre: si el temporizador casualmente disparaba
					 * antes del logout, si lo llevaba. Sin esto la atribucion de las compras
					 * queda librada a una carrera, sin patron.
					 *
					 * ⚠️ Esto REDUCE la carrera, no la elimina: el envio del tracking y el
					 * del logout son dos requests independientes y el orden en que llegan al
					 * servidor no esta garantizado. La atribucion igual es recuperable por
					 * order_id -> orders.buyer_id, que es la via confiable cuando el
					 * buyer_id del evento viene null.
					 */
					enviar_cola()
					return self.deleteCartAfterOrder(cart_id)
				})
				.then(function() {
					return self.logoutGuestAfterOrder()
				})
				.then(function() {
					apagar_overlay()
					self.$router.push({name: 'Thanks'})
					return true
				})
			})
			.catch(function(err) {
				apagar_overlay()
				console.log(err)
				// Un 422 del envio por correo tiene su propio aviso (y su propia salida: volver a
				// cotizar o corregir el destino). Se distingue con `false` para que el boton no
				// pise ese aviso con el generico de "no pudimos guardar tu pedido".
				if (self.manejar_error_de_envio(err)) {
					return false
				}
				return null
			})
		},
		// 🔴 NO convertir esto en un porton que devuelva false sin frenar tambien a los
		// llamadores. Se intento el 31/8/2026 y se revirtio: makeOrder() se alcanza desde
		// CardPaymentMethod.setSelected(), que llama makeOrder(true) e INMEDIATAMENTE
		// despues initMp(), sin mirar el resultado. Hoy, con un invitado sin identificar, la
		// cadena revienta en this.user.seller_id y el overlay de carga queda prendido
		// tapando el boton de MercadoPago que initMp() acaba de dibujar. Es un bug feo, pero
		// tapa el pago. Si canMakeOrder() devuelve false y limpia el overlay sin frenar a
		// initMp(), el boton de MercadoPago queda vivo y el comprador PUEDE PAGAR sin que
		// exista ningun pedido de este lado. Arreglar esto de verdad es cerrar la identidad
		// del comprador en los cuatro caminos de pago, no poner un guard aca.
		canMakeOrder() {
			return true
		},
		/**
		 * Borra el carrito del pedido ya confirmado. Necesita la sesion viva, asi que corre
		 * ANTES del logout del invitado. Nunca rechaza: un fallo aca no debe impedir que el
		 * comprador llegue a la pagina de gracias.
		 *
		 * @param {number|null} cart_id id del carrito que origino el pedido
		 * @returns {Promise}
		 */
		deleteCartAfterOrder(cart_id) {
			if (!cart_id) {
				return Promise.resolve()
			}
			return this.$api.delete('carts/' + cart_id)
			.catch(() => {})
		},
		/**
		 * Destruye la sesion del comprador invitado, para que la proxima visita al sitio sea
		 * anonima. Solo aplica si el comercio permite comprar sin registrarse. Nunca rechaza.
		 *
		 * Los commits al store van DESPUES de que el logout resolvio: si se limpia
		 * `authenticated` antes, cualquier interceptor de $api que dependa de ese flag puede
		 * comportarse distinto durante el request.
		 *
		 * @returns {Promise}
		 */
		logoutGuestAfterOrder() {
			if (!this.puede_comprar_sin_login) {
				return Promise.resolve()
			}
			return this.$api.post('buyer/logout')
			.catch(() => {})
			.then(() => {
				this.$store.commit('auth/setAuthenticated', false)
				this.$store.commit('auth/setUser', null)
			})
		},
	}
}