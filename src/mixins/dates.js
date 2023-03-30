import moment from 'moment'
moment.locale('es')
import numeral from 'numeral'
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
		price(p) {
			if (p === null) {
				return '-'
			}
			let price = numeral(p).format('$0,0.00')
			// if (price.substr(price.length-2, price.length) == '00') {
			// 	return price.substr(0, price.length-3)
			// }
			return price
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