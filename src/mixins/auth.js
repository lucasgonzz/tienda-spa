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
			this.$router.replace({name: this.$cookies.get('redirect_to')})
		}

	}
}