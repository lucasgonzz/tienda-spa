export default {
	methods: {
		savePayment(form) {
			this.$api.post('/payments', form)
			.then(res => {
				let payment = res.data.payment
				let doc = res.data.document
				console.log(payment)
				this.$store.commit('cart/setPaymentId', payment.id)
				if (doc) {
					this.$store.commit('auth/setUserDocument', doc)
				}
				this.makeOrder()
				.then(() => {
					this.loading = false
				})
				.catch(err => {
					this.loading = false
					console.log(err)
				})
			})
			.catch(err => {
				this.loading = false
				console.log(err)
			})
		},
		sendError(status) {
			console.log('status')
			console.log(status.cause[0])
			let message
			switch (status.cause[0].code) {
				case '205':
					message = 'Ingresa el número de tu tarjeta.'
					break
				case '208':
					message = 'Elige un mes.'
					break
				case '209':
					message = 'Elige un año.'
					break
				case '212':
					message = 'Ingresa tu tipo de documento.'
					break
				case '213':
					message = 'Ingresa tu documento.'
					break
				case '214':
					message = 'Ingresa tu documento.'
					break
				case '220':
					message = 'Ingresa tu banco.'
					break
				case '221':
					message = 'Ingresa el nombre y apellido.'
					break
				case '208':
					message = ''
					break
				case '224':
					message = 'Ingresa el código de seguridad.'
					break
				case 'E301':
					message = 'Ingresa un número de tarjeta válido.'
					break
				case 'E302':
					message = 'Revisa el código de seguridad.'
					break
				case '316':
					message = 'Ingresa un nombre válido.'
					break
				case '322':
					message = 'El tipo de documento es inválido.'
					break
				case '323':
					message = 'Revisa tu documento.'
					break
				case '324':
					message = 'El documento es inválido.'
					break
				case '325':
					message = 'El mes es inválido.'
					break
				case '326':
					message = 'El año es inválido.'
					break
				default:
					message = 'Revisa los datos.'
					break
			}
			this.$toast.error(message)
		}
	}
}