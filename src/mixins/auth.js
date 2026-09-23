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
						commerce_id: process.env.VUE_APP_COMMERCE_ID,
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
		 * y sería un request repetido en cada carga.
		 *
		 * @returns {Promise}
		 */
		recargar_articulos_con_la_sesion() {
			if (!this.$store.state.auth.authenticated) {
				return Promise.resolve()
			}
			return this.$store.dispatch('categories/getIndex')
		},

	}
}