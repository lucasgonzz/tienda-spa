import { env } from '@/runtime_config'
export default {
	computed: {
		cart() {
			return this.$store.state.cart.cart
		},
	},
	methods: {
		logout() {
			this.$store.dispatch('auth/logout')
			.then(() => {
				/*
				 * Con la sesión cerrada, el catálogo del store es el del comprador que se fue: en
				 * un comercio con listas restringidas (catalogo-por-lista-tienda, 5/10/2026) el
				 * visitante seguiría viendo el árbol, las marcas y los artículos recortados del
				 * mayorista hasta recargar la página. Se vuelve a pedir como anónimo.
				 *
				 * Solo si la sesión efectivamente se cerró: `auth/logout` se traga el error del
				 * POST, y si falló el comprador sigue logueado y su catálogo sigue siendo el suyo.
				 */
				if (!this.$store.state.auth.authenticated) {
					this.recargar_catalogo()
					/*
					 * 🔴 Si estaba parado en una categoría, marca, bodega o cepa de la home
					 * (`/inicio/herramientas`), o en una BÚSQUEDA (`/inicio?q=martillo`: es la misma
					 * ruta 'Home' con `?q=` y sin categoría), la ruta sigue siendo 'Home' y el `replace`
					 * de abajo no corre: la recarga suelta la selección y `getIndex` trae la portada, pero
					 * la URL y el título seguirían diciendo "Herramientas" —o conservarían `?q=martillo`
					 * y el texto en el buscador— mientras la pantalla muestra la portada. Se lleva la URL
					 * a la portada, sin query, para que diga lo mismo que la pantalla.
					 *
					 * De la búsqueda se limpia también el texto del buscador (`search_query`, que
					 * `getIndex` no toca). No se vuelve a ejecutar la búsqueda como visitante: dispararía
					 * un evento de búsqueda que el comprador no hizo y ensuciaría la analítica.
					 *
					 * El `.catch` vacío no es descuido: vue-router 3 rechaza la promesa con
					 * NavigationDuplicated si ya estaba ahí, y eso no es un error para nadie.
					 */
					let categoria_de_la_url = this.$route.params.category
					let busqueda_de_la_url = this.$route.query.q
					if (
						this.$route.name == 'Home'
						&& (
							(categoria_de_la_url && categoria_de_la_url != 'ultimos-ingresados')
							|| busqueda_de_la_url
						)
					) {
						if (busqueda_de_la_url) {
							this.$store.commit('categories/setSearchQuery', '')
						}
						this.$router.replace({name: 'Home', params: {category: 'ultimos-ingresados'}})
						.catch(() => {})
					}
				}
				if (this.$route.name != 'Home') {
					this.$router.replace({name: 'Home'})
				}
			})
		},
		login(user) {
			if (this.checkLogin(user)) {
				this.$store.dispatch('auth/csrf')
				.then(() => {
					this.$store.dispatch('auth/login', {
						...user,
						commerce_id: env('VUE_APP_COMMERCE_ID'),
					})
					.then(() => {
						if (this.authenticated) {
							this.recargar_articulos_con_la_sesion()
							this.checkCart()
							if (this.route_name == 'Register') {
								this.$router.replace({name : this.route_name, params: {view: 'codigo-de-verificacion'}})
							} else {
								this.redirectAfterLogin()
							}
						} else {
							this.$toast.error('Credenciales incorrectas')
						}
					})
				})
			}
		},
		checkLogin(user) {
			if (user.email == '') {
				this.$toast.error('Ingrese su telefono, por favor')
				return false
			}
			if (user.password == '') {
				this.$toast.error('Ingrese su contraseña, por favor')
				return false
			}
			return true
		},
		checkCart() {
			if (this.cart.articles.length) {
				this.$store.dispatch('cart/save')
			} else {
				console.log('no se guardo el carrito porque estaba vacio')
			}
		},
		redirectAfterLogin() {
			console.log('redirigiendo a '+this.$cookies.get('redirect_to'))
			let redirect = this.$cookies.get('redirect_to')
			if (redirect == 'Home') {
				this.$router.replace({name: 'Home', params: {category: 'ultimos-ingresados'}})
			} else if (redirect == 'Cart') {
				this.$router.replace({name: 'Cart'})
			} else if (redirect == 'Payment') {
				this.$router.replace({name: 'Payment'})
			}
		},
		/**
		 * Vuelve a pedir los artículos de la home después de un login exitoso, para que los
		 * listados del store se reemplacen por los resueltos CON la sesión.
		 *
		 * Lo que había en el store se pidió como anónimo: en una tienda que solo muestra
		 * precios a los registrados (o a los vinculados a un cliente del ERP) el backend manda
		 * esos artículos con `final_price` en null, y en un comercio con listas por cliente,
		 * con el precio público. Sin esto quedaban así hasta recargar la página, y con
		 * `puede_ver_precios()` ya en true la tarjeta mostraba el artículo sin precio y sin el
		 * cartel de "Inicie sesión" (Fenix, 23/9/2026).
		 *
		 * Se llama desde cada camino que pasa al comprador de anónimo a logueado (usuario y
		 * contraseña, Google, blanqueo de contraseña, alta que deja logueado), y NO desde el
		 * `auth/me` del arranque de App.vue: ahí los artículos ya salen con la cookie correcta
		 * y sería un request repetido en cada carga. Por eso tampoco se reemplaza esto por el
		 * watcher de `authenticated` de App.vue: al arrancar, `auth/me` también lo pasa de
		 * false a true y duplicaría los pedidos del arranque.
		 *
		 * Desde el 5/10/2026 (catalogo-por-lista-tienda) no recarga solo los artículos: también
		 * las categorías y las marcas. Ver `recargar_catalogo()`.
		 *
		 * @returns {Promise}
		 */
		recargar_articulos_con_la_sesion() {
			if (!this.$store.state.auth.authenticated) {
				return Promise.resolve()
			}
			return this.recargar_catalogo()
		},
		/**
		 * Vuelve a pedir todo lo del catálogo que depende de QUIÉN pregunta, con la identidad
		 * que hay ahora: los artículos de la home (`getIndex`), el árbol de categorías y las
		 * marcas. Antes suelta la selección activa (categoría, subcategoría, bodega, cepa y
		 * marca), que es de la identidad anterior (ver `soltar_seleccion_por_cambio_de_identidad`
		 * en store/categories.js).
		 *
		 * El árbol de categorías y las marcas NO se vacían mientras vuelve la respuesta: el menú
		 * sigue dibujado con lo anterior y la respuesta nueva lo reemplaza. Vaciarlos lo hacía
		 * desaparecer para todos los compradores en cada login y cada logout (y, si la recarga
		 * fallaba, hasta recargar la página).
		 *
		 * 🔴 Por qué categorías y marcas, y no solo los artículos: desde la misión
		 * catalogo-por-lista-tienda, un comprador vinculado a un cliente del ERP cuya lista de
		 * precios es restringida ve SOLO los artículos habilitados para esa lista, y la API le
		 * recorta también las categorías (con sus conteos) y las marcas. Recargando solo los
		 * artículos, el mayorista recién logueado seguía viendo en el menú las categorías del
		 * catálogo público, que al abrirlas salían vacías.
		 *
		 * Bodegas y cepas NO se recargan: la API no las filtra por lista, son las mismas para
		 * cualquier comprador.
		 *
		 * Lo llaman `recargar_articulos_con_la_sesion()` (después de un login) y `logout()`
		 * (después de cerrar sesión). Contra una respuesta vieja que vuelva tarde protegen los
		 * contadores de pedidos de store/categories.js: el último pedido es el que vale.
		 *
		 * 🔴 Contra una tienda-api vieja NO es "inocuo" a secas. Lo que se ve no cambia: ahí las
		 * categorías y las marcas no dependen de la sesión y vuelven idénticas a las del
		 * arranque. Pero igual cuesta dos pedidos más por cada login y cada logout, suelta
		 * también la bodega y la cepa seleccionadas (`getIndex` solo suelta categoría,
		 * subcategoría y marca), y mientras vuelven categorías y marcas quedan prendidos
		 * `loading_categories` y `loading_brands`, que hacen que la lista de la home y el
		 * catálogo muestren su skeleton, como en el arranque. La SPA no puede saber si el
		 * catálogo de este comercio está restringido, así que ese costo lo pagan todos.
		 *
		 * @returns {Promise}
		 */
		recargar_catalogo() {
			this.$store.commit('categories/soltar_seleccion_por_cambio_de_identidad')
			return Promise.all([
				this.$store.dispatch('categories/getIndex'),
				this.$store.dispatch('categories/getCategories'),
				this.$store.dispatch('categories/getBrands'),
			])
		},

	}
}