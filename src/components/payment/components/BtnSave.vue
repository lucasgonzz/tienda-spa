<template>
	<div class="checkout-confirm">
		<b-button
		block
		size="lg"
		:disabled="procesando"
		:class="{'checkout-confirm__btn--mp': is_mp}"
		class="checkout-confirm__btn"
		@click="confirmar">

			<span v-if="procesando">
				<b-spinner
				small
				class="m-r-10"></b-spinner>
				{{ texto_mientras_procesa }}
			</span>

			<span v-else-if="is_mp">
				<i class="bi bi-wallet2"></i>
				Pagar con Mercado Pago
			</span>

			<span v-else-if="is_payway">
				<i class="bi bi-credit-card-2-front"></i>
				Pagar con tarjeta
			</span>

			<span v-else>
				<i class="bi bi-lock-fill"></i>
				Finalizar compra
			</span>
		</b-button>

		<p
		v-if="is_mp"
		class="checkout-confirm__hint">
			Te llevamos a Mercado Pago para completar el pago.
		</p>
	</div>
</template>
<script>
import cart from '@/mixins/cart'

/**
 * El único botón que confirma el pedido.
 *
 * 🔴 UN SOLO BOTON PARA TODAS LAS FORMAS DE PAGO, y ese es el cambio del 7/9/2026. Antes había
 * dos: éste, y uno que dibujaba el SDK de Mercado Pago dentro de un `<div class="mp-btn">` y que
 * aparecía recién después de elegir esa forma de pago (con un cartel de carga a pantalla completa
 * en el medio, porque el pedido se creaba ahí). Ahora el botón cambia de texto según la forma de
 * pago elegida y hace todo en un click, mostrando el estado adentro suyo — sin tapar la pantalla.
 *
 * El orden del camino de Mercado Pago importa y no es el que había: primero se pide la
 * preferencia y DESPUES se crea el pedido. Si Mercado Pago rechaza la preferencia (el comercio sin
 * cuenta conectada es el caso real), el comprador se queda en el checkout sin ningún pedido
 * colgado, y puede reintentar o elegir otra forma de pago.
 */
export default {
	mixins: [cart],
	data() {
		return {
			/** Hay un checkout en curso: el botón queda deshabilitado y muestra el estado. */
			procesando: false,
		}
	},
	watch: {
		/**
		 * Congela el selector de cuotas mientras el botón confirma y lo libera cuando termina —también
		 * cuando el flujo falla y el comprador vuelve a la pantalla: todos los caminos de error
		 * devuelven `procesando` a false—. Hace falta porque la elección de cuotas se lee DOS veces
		 * en un mismo checkout (el guardado de antes de la preferencia y el de `makeOrder`), y si
		 * cambiara en el medio Mercado Pago cobraría una cantidad y el pedido nacería con otra.
		 */
		procesando(valor) {
			this.$store.commit('cart/set_cuotas_bloqueadas', valor)
		},
	},
	beforeDestroy() {
		// Si el comprador se va de la pantalla con el flujo en curso, el selector no puede quedar
		// congelado para la próxima vez que entre.
		this.$store.commit('cart/set_cuotas_bloqueadas', false)
	},
	computed: {
		is_payway() {
			return this.cart_payment_method && this.cart_payment_method.type && this.cart_payment_method.type.name == 'Payway'
		},
		is_mp() {
			return this.cart_payment_method && this.cart_payment_method.type && this.cart_payment_method.type.name == 'MercadoPago'
		},
		payment_methods() {
			return this.$store.state.payment_methods.models
		},
		buyer_id() {
			return this.$store.state.cart.buyer_id
		},
		/**
		 * Qué dice el botón mientras trabaja. Con Mercado Pago la espera termina en otro sitio,
		 * así que conviene anticiparlo.
		 * @returns {string}
		 */
		texto_mientras_procesa() {
			if (this.is_mp) {
				return 'Te llevamos a Mercado Pago...'
			}
			return 'Enviando tu pedido...'
		},
	},
	methods: {
		/**
		 * Punto de entrada del botón. Reparte según la forma de pago elegida.
		 */
		confirmar() {
			if (this.procesando) {
				return
			}
			if (this.is_payway) {
				this.payway()
				return
			}
			this.ready()
		},
		payway() {
			if (this.check()) {
				this.$router.push({name: 'PaymentCard'})
			}
		},
		/**
		 * Manda al login al comprador que no tiene sesion en una tienda que exige registro,
		 * que es el tercer caso que el if/else de ready() no cubria.
		 *
		 * SON TRES CASOS, NO DOS: la negacion de (!autenticado && invitado_permitido) NO es
		 * "autenticado" -- tambien entra "sin sesion y con registro obligatorio". Hasta el
		 * 31/8/2026 ese caso caia en el else de ready(), rotulado "Flujo autenticado", que
		 * desreferencia this.user. Con this.user en null eso tira un TypeError DENTRO del
		 * handler del click, y una excepcion ahi no produce ninguna senial: sin pedido, sin
		 * request, sin toast y sin cambio de URL. Medido en la demo el 31/8/2026.
		 *
		 * Vive en un metodo propio, y no adentro de ready(), porque hay DOS caminos que
		 * arrancan el checkout -- el pedido comun y el de Payway (check) -- y los dos tienen
		 * que aplicar la misma politica.
		 *
		 * @returns {boolean} true si redirigio; el que llama tiene que cortar ahi
		 */
		redirect_to_login_if_no_session() {
			if (this.authenticated || this.puede_comprar_sin_login) {
				return false
			}
			// Misma politica que ya aplica CartFooter.next() al entrar al checkout: misma
			// cookie, mismo valor y misma ruta destino.
			this.$cookies.set('redirect_to', 'Payment')
			this.$toast.error('Iniciá sesión para completar tu compra')
			this.$router.push({name: 'Login'})
			return true
		},
		ready() {
			if (this.redirect_to_login_if_no_session()) {
				return
			}

			let self = this

			// Flujo guest: identificar comprador antes de crear el pedido
			if (!this.authenticated && this.puede_comprar_sin_login) {
				// Errores de validación acumulados del checkout invitado
				const checkout_errors = this.collect_guest_checkout_errors()
				if (checkout_errors.length) {
					this.show_checkout_validation_errors(checkout_errors)
					return
				}

				// Datos del comprador invitado a enviar al endpoint de identificación
				const buyer = this.$store.state.cart.buyer

				// Con envio por correo (Zipnova) el input "Direccion" de una linea esta oculto: la
				// direccion que se guarda en la ficha del comprador es el destino completo, en texto.
				let datos_buyer = { ...buyer, commerce_id: this.commerce.id }
				if (this.envio_zipnova_elegido) {
					datos_buyer.address = this.envio_destino_texto()
					if (!datos_buyer.ciudad) {
						datos_buyer.ciudad = this.envio_destino_valor('localidad')
					}
				}

				this.procesando = true

				this.$api.post('buyer', datos_buyer)
				.then(function(res) {
					// El modelo que devuelve POST buyer viene con la direccion ya actualizada
					// (el backend la persiste al reconocer el email, prompt 400). Aun asi, la
					// direccion del pedido se manda explicita desde order_address (prompt 402):
					// es lo que el comprador VIO en pantalla, y esa es la unica fuente de verdad.
					// Este bug ya se pago una vez -- un pedido guardado con la direccion vieja de
					// un cliente del ERP mientras el comprador miraba en pantalla la nueva.
					self.$store.commit('auth/setUser', res.data.model)
					return self.confirmar_pedido()
				})
				.catch(function(err) {
					console.log(err)
					self.procesando = false
					self.$toast.error('Hubo un error al identificar el comprador')
				})

			} else {
				// Flujo autenticado: comportamiento original sin cambios
				const checkout_errors = this.collect_authenticated_checkout_errors()
				if (checkout_errors.length) {
					this.show_checkout_validation_errors(checkout_errors)
					return
				}

				this.procesando = true

				// Sin `cart/save` acá: los dos caminos de `confirmar_pedido()` lo hacen igual
				// (`pagar_con_mercado_pago()` antes de la preferencia, `makeOrder()` antes del
				// pedido). El que había guardaba el carrito una tercera vez, para nada.
				this.confirmar_pedido()
				.catch(function(err) {
					console.log(err)
					self.procesando = false
					if (self.manejar_error_de_envio(err)) {
						return
					}
					self.$toast.error('No pudimos guardar tu pedido. Probá de nuevo.')
				})
			}
		},
		/**
		 * Con los datos ya validados y el comprador identificado: crea el pedido, o arranca el
		 * pago por Mercado Pago (que crea el pedido él mismo, después de la preferencia).
		 *
		 * @returns {Promise}
		 */
		confirmar_pedido() {
			if (this.is_mp) {
				return this.pagar_con_mercado_pago()
			}

			let self = this

			// mostrar_overlay = false: el estado ya lo muestra este botón, y el cartel a pantalla
			// completa es justamente lo que se sacó del checkout.
			// frenar_si_hay_descartes = true: si al guardar el carrito el servidor saca artículos
			// no disponibles para este comprador, no se crea un pedido distinto del que vio.
			return this.makeOrder(false, false, true)
			.then(function(ok) {
				self.procesando = false
				// `false`: el PUT /carts rechazo el envio por correo y makeOrder ya le dijo al
				// comprador que hacer (volver a cotizar o corregir el destino). Sin aviso generico.
				// Idem si se freno por articulos no disponibles (catalogo-por-lista-tienda).
				if (ok === false) {
					return
				}
				if (!ok) {
					self.$toast.error('No pudimos guardar tu pedido. Probá de nuevo.')
				}
			})
		},
		/**
		 * El camino de Mercado Pago, en un solo click.
		 *
		 * 🔴 EL ORDEN ES PRIMERO LA PREFERENCIA Y DESPUES EL PEDIDO, al revés de como estaba. Con
		 * el orden viejo (pedido primero, preferencia después, y encima en paralelo), un comercio
		 * sin cuenta de Mercado Pago conectada — que responde 422 y es el caso real de hoy — dejaba
		 * un pedido creado que nadie iba a pagar, y cada reintento del comprador dejaba otro.
		 *
		 * El `cart_id` se manda para que la API lo escriba como `external_reference` de la
		 * preferencia: con eso el webhook sabe a qué pedido atarle el pago aunque el comprador
		 * nunca vuelva a la tienda.
		 *
		 * Cuotas (15/10/2026): si la forma de pago ofrece cuotas, el cuerpo suma `contado: true` o
		 * `cuotas: N` (nunca los dos). Con una forma de pago sin cuotas, o contra una API que no manda
		 * `cuotas_disponibles`, no se agrega ninguna de las dos claves y el cuerpo es el de siempre.
		 * Solo viaja QUÉ eligió el comprador: el porcentaje lo resuelve la API en su base.
		 *
		 * @returns {Promise}
		 */
		pagar_con_mercado_pago() {
			let self = this

			// null (la forma de pago no ofrece cuotas), 'contado' o la cantidad. Se lee ANTES del
			// guardado y no adentro del .then: `cart/save` toma lo elegido en este mismo instante para
			// `carts.cuotas`, y lo que viaja en la preferencia tiene que ser lo mismo que quedó guardado
			// aunque el comprador toque el selector mientras espera.
			let cuotas_elegida = this.cuotas_mp_elegida
			// Se prende si la API rechazó la PREFERENCIA (no el guardado del carrito) con un 422 habiendo
			// mandado `contado` o `cuotas`. Ver revisar_cuotas_tras_rechazo().
			let preferencia_rechazada_con_cuotas = false

			// 🔴 El carrito se guarda ANTES de pedir la preferencia, y no alcanza con que
			// makeOrder() lo guarde después: la API escribe `carts.id` como `external_reference` de
			// la preferencia, y ese es el ÚNICO dato con el que el webhook sabe a qué pedido
			// atarle el pago. En el checkout de invitado el carrito todavía no existe a esta
			// altura (recién se identificó al comprador), así que sin este save la preferencia
			// viajaba con `cart_id: null` y el pago quedaba sin registrar en el pedido — en
			// silencio, porque la compra igual se completa. Medido el 7/9/2026 mirando el orden de
			// los requests: buyer, preference, carts, orders.
			//
			// Catálogo por lista (5/10/2026): si este guardado saca artículos que el comprador no
			// puede comprar con su lista, se frena ANTES de pedir la preferencia —si no, Mercado
			// Pago le cobraría un total distinto del que confirmó—. El aviso lo da
			// cortar_si_el_guardado_descarto, por eso el store no avisa (`avisar_no_disponibles`).
			return this.$store.dispatch('cart/save', { avisar_no_disponibles: false })
			.then(function(descartados) {
				self.cortar_si_el_guardado_descarto(descartados)
				let cuerpo = {
					payment_method: self.cart_payment_method,
					// Hasta el 14/10/2026 viajaba tambien `cupon`: la tienda ya no tiene cupones. La
					// API lo lee con `$request->cupon` solo sin carrito resuelto, y sin la clave le
					// llega null, la vieja y la nueva (con carrito usa `$cart->cupon`, que tampoco
					// hay: ver `save()` en store/cart.js).
					// 🔴 La zona SOLO viaja si el pedido se envia. OnlinePaymentHelper::setPrices()
					// agrega el item "Envio" con que la zona no sea null, sin mirar `deliver`, asi
					// que un comprador que elegia envio, elegia zona y despues se pasaba a retiro
					// por el local pagaba un envio que la pantalla no le mostraba en ningun lado.
					delivery_zone: self.cart.deliver ? self.cart_delivery_zone : null,
					articles: self.articles,
					cart_id: self.cart ? self.cart.id : null,
				}
				if (cuotas_elegida === 'contado') {
					cuerpo.contado = true
				} else if (cuotas_elegida !== null) {
					cuerpo.cuotas = cuotas_elegida
				}
				return self.$api.post('mercado-pago/preference', cuerpo)
				.catch(function(err) {
					if (cuotas_elegida !== null && err && err.response && err.response.status == 422) {
						preferencia_rechazada_con_cuotas = true
					}
					throw err
				})
			})
			.then(function(res) {
				const init_point = res.data && res.data.init_point ? res.data.init_point : null
				const preference_id = res.data && res.data.preference_id ? res.data.preference_id : null

				if (!init_point && !preference_id) {
					self.procesando = false
					self.$toast.error('No pudimos abrir Mercado Pago. Probá de nuevo o elegí otra forma de pago.')
					return
				}

				// frenar_si_hay_descartes = true: el comprador todavía no pagó, frenar acá es seguro.
				return self.makeOrder(true, false, true)
				.then(function(ok) {
					if (ok === false) {
						// 422 del envio por correo, o freno por articulos no disponibles: ya
						// avisado por makeOrder. No se va a Mercado Pago.
						self.procesando = false
						return
					}
					if (!ok) {
						self.procesando = false
						self.$toast.error('No pudimos guardar tu pedido. Probá de nuevo.')
						return
					}

					if (init_point) {
						// Un solo salto: el comprador se va del SPA derecho al checkout de
						// Mercado Pago. `procesando` queda en true a propósito — la página se está
						// yendo y no hay que devolverle el botón habilitado en el medio.
						window.location.href = init_point
						return
					}

					// API todavía sin `init_point` (los dos lados de la tienda no se despliegan el
					// mismo día): se abre el checkout con el SDK, como se hacía antes.
					self.abrir_checkout_con_el_sdk(preference_id)
				})
			})
			.catch(function(err) {
				// 🔴 El mensaje de la API NO se le muestra al comprador, y no es por prolijidad. Los
				// dos que puede devolver `MercadoPagoController@preference` son "El comercio no tiene
				// una cuenta de Mercado Pago conectada" —un problema del NEGOCIO, que el comprador no
				// puede resolver ni entender— y el detalle crudo que devuelve Mercado Pago, que viene
				// en inglés. Al comprador se le dice qué puede hacer él; el detalle queda en la
				// consola y en el log de la API, que es donde lo busca quien lo puede arreglar.
				console.log(err)
				// La API rechazó la preferencia con `contado` o `cuotas`: puede ser que la lista de
				// cuotas que tiene la pantalla ya no sea la vigente. `procesando` queda en true hasta que
				// se refresque la lista, para que no se reintente con la elección vieja en el medio.
				if (preferencia_rechazada_con_cuotas) {
					return self.revisar_cuotas_tras_rechazo(cuotas_elegida)
				}
				self.procesando = false
				// El `cart/save` del principio descartó artículos no disponibles: el comprador ya
				// fue avisado (y no es un problema de Mercado Pago).
				if (self.es_corte_por_articulos_no_disponibles(err)) {
					return
				}
				// El `cart/save` del principio puede rechazar el envio por correo (422): ese aviso
				// es especifico y no es un problema de Mercado Pago.
				if (self.manejar_error_de_envio(err)) {
					return
				}
				self.$toast.error('No pudimos abrir Mercado Pago. Probá de nuevo o elegí otra forma de pago.')
			})
		},
		/**
		 * La API rechazó (422) la preferencia habiendo recibido `contado` o `cuotas`: vuelve a pedir
		 * la lista de formas de pago —el mismo camino que usa App.vue al arrancar— y decide qué
		 * decirle al comprador.
		 *
		 * 🔴 Por qué hace falta: la SPA pide la lista UNA sola vez, al cargar. Si el comercio cambia o
		 * saca una cantidad de cuotas con el checkout abierto, la API (que valida contra su base) la
		 * rechaza con 422, y sin esto el comprador veía el cartel genérico y reintentaba con la misma
		 * elección vieja, otra vez 422, hasta recargar la página.
		 *
		 * Con la lista nueva, `cuotas_mp_elegida` ya dice si lo que se mandó sigue siendo una opción:
		 *   - NO sigue (la cantidad ya no se ofrece, o el método perdió sus cuotas): la elección queda
		 *     en «Contado» (o sin selector, si ya no ofrece cuotas) y se avisa que las cuotas
		 *     cambiaron. Nunca se muestra el mensaje de la API (política de este botón).
		 *   - SIGUE: la lista no era el problema (por ejemplo, el comercio sin cuenta de Mercado Pago
		 *     conectada, que también responde 422), así que va el cartel genérico de siempre. Decir que
		 *     «las cuotas cambiaron» ahí mandaría al comprador a elegir de nuevo algo que no tiene
		 *     arreglo desde su lado.
		 *
		 * El selector busca las cuotas por id en la lista del store, que `getModels` reemplaza entera,
		 * así que sigue andando con la lista nueva. Si el pedido de la lista falla, `getModels` lo
		 * resuelve igual con la lista vieja y se cae en el cartel genérico.
		 *
		 * @param {string|number} enviada Lo que se mandó: 'contado' o la cantidad de cuotas.
		 * @returns {Promise}
		 */
		revisar_cuotas_tras_rechazo(enviada) {
			let self = this
			let terminar = function(cuotas_cambiaron) {
				self.procesando = false
				if (cuotas_cambiaron) {
					self.$toast.warning('Las cuotas de este comercio cambiaron. Revisá las opciones y elegí de nuevo.', { duration: 7000 })
					return
				}
				self.$toast.error('No pudimos abrir Mercado Pago. Probá de nuevo o elegí otra forma de pago.')
			}
			return this.$store.dispatch('payment_methods/getModels')
			.then(function() {
				let sigue_vigente = self.cuotas_mp_elegida === enviada
				if (!sigue_vigente) {
					self.$store.commit('cart/set_cuotas_elegidas', self.cuotas_mp_ofrecidas.length ? 'contado' : null)
				}
				terminar(!sigue_vigente)
			})
			.catch(function(err) {
				console.log(err)
				terminar(false)
			})
		},
		/**
		 * Respaldo para cuando la API todavía no devuelve `init_point`: el SDK abre el checkout de
		 * Mercado Pago sobre la tienda. El script del SDK se carga en `public/index.html`.
		 *
		 * @param {string|null} preference_id
		 */
		abrir_checkout_con_el_sdk(preference_id) {
			if (!preference_id || typeof MercadoPago === 'undefined') {
				this.procesando = false
				this.$toast.error('No pudimos abrir Mercado Pago. Probá de nuevo o elegí otra forma de pago.')
				return
			}

			const mp = new MercadoPago(this.cart_payment_method.public_key, {
				locale: 'es-AR',
			})

			mp.checkout({
				preference: {
					id: preference_id,
				},
				autoOpen: true,
			})

			// El comprador ya esta adentro del checkout de Mercado Pago, y este camino NO se va del
			// SPA. Si cierra el modal sin pagar, el boton tiene que estar vivo para que pueda
			// reintentar: sin esto quedaba deshabilitado con el spinner para siempre, y encima con
			// el pedido ya creado.
			this.procesando = false
		},
		/**
		 * Indica si un valor de formulario está vacío o solo contiene espacios.
		 *
		 * @param {string} value
		 * @returns {boolean}
		 */
		is_blank_field(value) {
			return !value || String(value).trim() === ''
		},
		/**
		 * Arma la lista de campos faltantes del checkout invitado.
		 *
		 * @returns {string[]}
		 */
		collect_guest_checkout_errors() {
			const errors = []
			const buyer = this.$store.state.cart.buyer

			if (this.is_blank_field(buyer.name)) {
				errors.push('Nombre y apellido')
			}
			if (this.is_blank_field(buyer.phone)) {
				errors.push('Teléfono')
			}
			if (this.is_blank_field(buyer.email)) {
				errors.push('Correo electrónico')
			}
			if (this.is_blank_field(buyer.ciudad)) {
				errors.push('Ciudad')
			}
			if (
				this.flag_activo(this.commerce.online_configuration.pedir_barrio_al_registrarse)
				&& this.is_blank_field(buyer.barrio)
			) {
				errors.push('Barrio')
			}
			// La direccion solo es obligatoria si el comprador eligio envio a domicilio
			// (deliver == 1). Con retiro por local (deliver == 0) no hace falta, y con envio por
			// correo (Zipnova) la valida collect_envio_errors() campo por campo.
			if (this.cart.deliver == 1 && !this.envio_zipnova_elegido && this.is_blank_field(buyer.address)) {
				errors.push('Dirección')
			}
			if (this.cart.deliver == null) {
				errors.push('Cómo lo recibís')
			}
			this.collect_envio_errors().forEach(error => {
				errors.push(error)
			})
			if (!this.cart_payment_method && this.payment_methods.length) {
				errors.push('Cómo pagás')
			}
			if (this.must_select_delivery_day() && !this.has_selected_delivery_day()) {
				errors.push('Qué día te lo llevamos')
			}

			return errors
		},
		/**
		 * Lo que falta de la forma de envio, para los dos flujos (invitado y autenticado):
		 *
		 *   - con envio a domicilio y alguna forma de envio disponible (zonas del negocio o
		 *     Zipnova), hay que elegir una: "¿Cómo te lo enviamos?";
		 *   - si la elegida es de Zipnova, el destino tiene que estar completo (mismas reglas que
		 *     el servidor, ver envio_destino_faltantes) y con sucursal si es retiro en sucursal.
		 *
		 * Los textos son los titulos de las secciones que el comprador ve, con los campos que
		 * faltan entre parentesis.
		 *
		 * @returns {string[]}
		 */
		collect_envio_errors() {
			const errors = []
			if (this.cart.deliver != 1) {
				return errors
			}
			let hay_formas = this.delivery_zones.length > 0 || !!this.commerce.envios_zipnova
			if (hay_formas && !this.cart_delivery_zone && !this.cart_envio_opcion) {
				errors.push('¿Cómo te lo enviamos?')
				return errors
			}
			if (this.envio_zipnova_elegido) {
				let faltantes = this.envio_destino_faltantes()
				if (faltantes.length) {
					let etiquetas = []
					faltantes.forEach(clave => {
						etiquetas.push(this.envio_destino_etiqueta(clave))
					})
					this.$store.commit('cart/set_envio_errores_destino', faltantes)
					let titulo = this.cart_envio_opcion.es_punto_de_retiro ? '¿Quién lo retira en la sucursal?' : '¿A dónde te lo enviamos?'
					errors.push(titulo + ' (' + etiquetas.join(', ') + ')')
				}
			}
			return errors
		},
		/**
		 * Arma la lista de datos faltantes del checkout autenticado.
		 *
		 * @returns {string[]}
		 */
		collect_authenticated_checkout_errors() {
			const errors = []

			if (this.cart.deliver == null) {
				errors.push('Cómo lo recibís')
			}
			if (
				this.cart.deliver
				&& !this.envio_zipnova_elegido
				&& this.user
				&& (
					(this.user.comercio_city_client && this.user.comercio_city_client.address == '')
					&& (this.user.address == '')
				)
			) {
				errors.push('Dónde te lo llevamos')
			}
			// Forma de envio (zona del negocio u opcion de Zipnova) y destino del correo. Hasta el
			// 14/9/2026 aca decia 'Costo del envío', que era el titulo de la seccion vieja.
			this.collect_envio_errors().forEach(error => {
				errors.push(error)
			})
			// Va despues del envio porque en la pantalla "¿Cómo pagás?" esta debajo de las
			// secciones de envio: el aviso lista lo que falta en el orden en que se ve.
			if (!this.cart_payment_method && this.payment_methods.length) {
				errors.push('Cómo pagás')
			}
			// 🔴 Este this.user.seller_id NO lleva guarda a proposito, aunque su hermana de
			// la Direccion de entrega si la tenga. Se le puso el 31/8/2026 y se revirtio:
			// sin sesion, esta linea es lo unico que frena a un invitado de una tienda
			// register_to_buy=0 que elige Payway. Guardandola, check() devuelve true,
			// payway() navega a /pagar, el comprador TOKENIZA LA TARJETA y recien ahi falla,
			// en una pantalla donde no existe ningun formulario para completar sus datos.
			// El caso "sin sesion y con registro obligatorio" -- el que dejaba el boton mudo
			// -- ya lo cortan ready() y check() antes de llegar aca, con
			// redirect_to_login_if_no_session(). Sacar esta nota solo cuando el checkout de
			// invitado valide sus propios datos en check(), como ya hace ready().
			if (this.user.seller_id && !this.buyer_id) {
				errors.push('Cliente de este pedido')
			}
			if (this.must_select_delivery_day() && !this.has_selected_delivery_day()) {
				errors.push('Qué día te lo llevamos')
			}

			return errors
		},
		/**
		 * Indica si la tienda exige elegir un día de entrega: hay días configurados Y el
		 * select tiene sentido para el método de entrega elegido (DeliveryDay.vue solo lo
		 * muestra con envío a domicilio, deliver === 1 — retiro por local no usa día de
		 * entrega). Antes solo miraba delivery_day.models.length, así que un comercio con
		 * días configurados y un comprador que elegía retiro por local quedaba exigiendo
		 * un campo que la interfaz nunca ofrecía completar.
		 *
		 * @returns {boolean}
		 */
		must_select_delivery_day() {
			return this.cart.deliver === 1 && this.$store.state.delivery_day.models.length > 0
		},
		/**
		 * Indica si el comprador ya seleccionó un día de entrega válido.
		 *
		 * @returns {boolean}
		 */
		has_selected_delivery_day() {
			const fecha_entrega = this.$store.state.cart.cart.fecha_entrega
			return fecha_entrega && Number(fecha_entrega) !== 0
		},
		/**
		 * Muestra al comprador todo lo que le falta completar, en una sola notificación.
		 *
		 * 🔴 Los nombres que se listan acá son los TÍTULOS DE LAS SECCIONES que el comprador está
		 * viendo, no los del modelo. Antes decían "Metodo de entrega" o "Precio de envio" mientras
		 * la pantalla mostraba "¿Cómo lo recibís?" y "Costo del envío": el comprador leía el aviso
		 * y no tenía a dónde ir. Si se renombra una sección, se renombra también acá.
		 *
		 * @param {string[]} errors
		 */
		show_checkout_validation_errors(errors) {
			if (!errors.length) {
				return
			}

			if (errors.length === 1) {
				this.$toast.error('Te falta completar: ' + errors[0])
				return
			}

			this.$toast.error('Te falta completar: ' + errors.join(', '))
		},
		check() {
			// Payway entra por aca, no por ready(). Sin esto, un comprador sin sesion en una
			// tienda con registro obligatorio navegaba a /pagar y terminaba llamando a
			// makeOrder() desde Payway.vue.
			if (this.redirect_to_login_if_no_session()) {
				return false
			}
			const checkout_errors = this.collect_authenticated_checkout_errors()
			if (checkout_errors.length) {
				this.show_checkout_validation_errors(checkout_errors)
				return false
			}
			return true
		}
	}
}
</script>
