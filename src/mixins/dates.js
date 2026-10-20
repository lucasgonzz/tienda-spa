import moment from 'moment'
moment.locale('es')
import { precio_es } from '../helpers/formato_precio'
export default {
	methods: {
		date(d) {
			return moment(d).format('DD/MM/YY')
		},
		hour(d) {
			return moment(d).format('HH:mm')
		},
		hour_from_time(d) {
			return moment(d, 'HH:mm:ss').format('HH:mm')
		},
		/**
		 * Precio para mostrar en formato es-AR: $3.779,07 (punto de miles, coma decimal).
		 * El formato lo resuelve precio_es() sin registrar ningun locale de numeral (ver el helper:
		 * con el locale global los precios que llegan como string de la API se multiplican por 100).
		 *
		 * @param {number|string} p Importe. Vacio, null o 0 devuelve '-'.
		 * @param {boolean} with_decimals false = recorta los decimales.
		 * @param {boolean} quitar_decimales_solo_si_no_es_00 Con with_decimals en false, recorta solo
		 *        si los decimales son ",00" ($100,00 -> $100); $100,50 queda como esta.
		 * @returns {string}
		 */
		price(p, with_decimals = true, quitar_decimales_solo_si_no_es_00 = true) {
			if (p) {
				let price = precio_es(p)
				if (with_decimals) {
					return price
				} else {
					// El texto siempre termina en ",dd": se recortan esos 3 caracteres.
					if (!quitar_decimales_solo_si_no_es_00 || price.substr(price.length-3) == ',00') {
						return price.substr(0, price.length-3)
					} else {
						return price 
					}
				}
			}
			return '-'
		},
		getMonth(d) {
			return moment(d).format('MMMM')
		},
		getDay(d) {
			return moment(d).format('dd')
		},
		since(date) {
			return moment(date).fromNow()
		},
		diff(d, formated = false) {
			var date = moment().diff(d, 'days')+''
			date = date.replace('-', '')
			if (formated) {
				// console.log('a: '+date)
				if (date == '0') {
					date = 'hoy'
				} else if (date == '1') {
					date = 'mañana'
				} else if (date == '2') {
					date = 'pasado mañana'
				} else {
					date = 'en ' + date + ' días'
				}
			} 
			return date
		},
		diff_(d) {
			var date = moment().diff(d, 'days')
			return date
		},
	}
}