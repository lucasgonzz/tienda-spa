export default {
	computed: {
		/**
		 * Telefono del comercio normalizado para wa.me (solo digitos, formato internacional).
		 * Devuelve '' si no se puede normalizar a un numero valido.
		 * @returns {string}
		 */
		commerce_whatsapp_phone() {
			if (!this.commerce) {
				return ''
			}
			return this.normalizeWhatsappPhone(this.commerce.phone)
		},
	},
	methods: {
		/**
		 * Normaliza un telefono al formato que exige wa.me: solo digitos, con codigo de pais,
		 * sin '+', sin '0' inicial y sin el '15' de los celulares argentinos.
		 *
		 * Casos contemplados (Argentina):
		 *   '+54 9 3444 62-2139'  -> '5493444622139'
		 *   '03444 15 622139'     -> '5493444622139'
		 *   '3444622139'          -> '5493444622139'
		 *   '(011) 15 4123-4567'  -> '5491141234567'
		 *
		 * Numeros con codigo de pais distinto de 54 se devuelven solo con los caracteres no
		 * numericos removidos, para no romper comercios fuera de Argentina.
		 *
		 * @param {string|number} phone telefono tal como lo cargo el comercio
		 * @returns {string} digitos listos para wa.me, o '' si no es normalizable
		 */
		normalizeWhatsappPhone(phone) {
			if (phone === null || phone === undefined || phone === '') {
				return ''
			}

			// Solo digitos: se descartan '+', espacios, guiones y parentesis.
			let digits = String(phone).replace(/\D/g, '')

			if (!digits) {
				return ''
			}

			// Prefijo de salida internacional ('00 54 ...' -> '54 ...')
			if (digits.indexOf('00') === 0) {
				digits = digits.substr(2)
			}

			// Numero con codigo de pais que NO es Argentina: se devuelve tal cual.
			// Se considera "con codigo de pais" un numero de 11+ digitos que no arranca con 54.
			if (digits.length >= 11 && digits.indexOf('54') !== 0) {
				return digits
			}

			// Quitar el codigo de pais argentino si vino incluido
			if (digits.indexOf('54') === 0 && digits.length > 10) {
				digits = digits.substr(2)
			}

			// Quitar el 9 de movil (se vuelve a agregar al final, ya normalizado)
			if (digits.indexOf('9') === 0 && digits.length > 10) {
				digits = digits.substr(1)
			}

			// Quitar el 0 inicial del codigo de area
			if (digits.indexOf('0') === 0) {
				digits = digits.substr(1)
			}

			// Quitar el '15' del celular: aparece despues del codigo de area (2 a 4 digitos).
			// El numero nacional significativo argentino tiene 10 digitos; si quedaron 12,
			// sobran exactamente esos dos.
			if (digits.length === 12) {
				let cut = -1
				let i = 2
				while (i <= 4) {
					if (digits.substr(i, 2) === '15') {
						cut = i
						i = 5
					} else {
						i++
					}
				}
				if (cut !== -1) {
					digits = digits.substr(0, cut) + digits.substr(cut + 2)
				}
			}

			// A esta altura tiene que ser un numero nacional significativo de 10 digitos.
			// Si no lo es, el telefono esta mal cargado: mejor no ofrecer link que ofrecer uno roto.
			if (digits.length !== 10) {
				return ''
			}

			return '549' + digits
		},
	},
}
