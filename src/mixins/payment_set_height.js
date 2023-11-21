export default {
	methods: {
		setFirstColHeigth() {
			if (this.user) {
				let cart_resume = document.getElementById('col-cart-resum')
				if (cart_resume) {
					let first_col = document.getElementById('3rt-col')	
					if (first_col) {
						first_col = first_col.children[0]
						console.log('first_col')
						console.log(first_col)

						let cart_resume = document.getElementById('col-cart-resum')

						let margin_top = cart_resume.getBoundingClientRect().height - first_col.getBoundingClientRect().height - 150
						console.log('margin_top')
						console.log(margin_top)
						console.log('-'+margin_top+'px')
						first_col.style.marginTop  = '-'+margin_top+'px'
					} else {
						this.llamarDenuevo()
					}
				} else {
					this.llamarDenuevo()
				}
			}
		},
		llamarDenuevo() {
			setTimeout(() => {
				this.setFirstColHeigth()
			}, 500)
		}
	}
}