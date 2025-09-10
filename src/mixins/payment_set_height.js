export default {
	methods: {
		setFirstColHeigth() {
			if (this.user) {
				setTimeout(() => {

					let cart_resume = document.getElementById('col-cart-resum')
					console.log('cart_resume:')
					console.log(cart_resume)
					if (cart_resume) {
						let first_col = document.getElementById('first-col')	
						console.log('first_col:')
						console.log(first_col)
						if (first_col) {
							console.log('first_col')
							console.log(first_col)

							let cart_resume = document.getElementById('col-cart-resum')

							const rect = first_col.getBoundingClientRect();

							const ancho = rect.left + rect.width;

							cart_resume.style.position  = 'fixed'
							cart_resume.style.top  = rect.top+'px'
							cart_resume.style.left  = ancho+'px'

							console.log('se puso fiex')

						} else {
							this.llamarDenuevo()
						}
					} else {
						this.llamarDenuevo()
					}
				}, 1000)
			}
		},
		llamarDenuevo() {
			setTimeout(() => {
				this.setFirstColHeigth()
				console.log('llamando')
			}, 500)
		}
	}
}