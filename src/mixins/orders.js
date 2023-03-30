export default {
	methods: {
		total(order) {
			if (order.articles) {
				let total = 0
				order.articles.forEach(article => {
					total += article.pivot.price * article.pivot.amount
				})
				return total
			}
		},
        amount(amount) {
            let punto_index = amount.indexOf('.')
            if (amount.substr(punto_index) == '.00') {
                return amount.substr(0, punto_index)
            }
            return amount
        }
	}
}