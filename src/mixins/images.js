export default {
	methods: {
		articleImageUrl(article) {
			let url = `https://res.cloudinary.com/lucas-cn/image/upload/c_crop,g_custom,q_auto,f_auto/${this.getFirstImage(article)}`
			return url
		},
		image(model, from_model = false, is_image = false) {
			let url 
			let image_url = null
			let model_prop_url
			let image_prop_url
			if (!this.from_cloudinary) {
				model_prop_url = 'hosting_image_url'
				image_prop_url = 'hosting_url'
			} else {
				model_prop_url = 'image_url'
				image_prop_url = 'url'
			}
			if (is_image) {
				image_url = model[image_prop_url]
			} else if (!from_model) {
				if (model[model_prop_url]) {
					image_url = model[model_prop_url]
				} else if (model.images && model.images.length) {
					image_url = model.images[0][image_prop_url] 
				}
			} else {
				image_url = model[from_model][model_prop_url]
			}
			if (!image_url && this.commerce.online_configuration.default_article_image_url) {
				image_url = this.commerce.online_configuration.default_article_image_url
			}
			if (!this.is_local) {
				image_url = this.getProductionUrl(image_url)
			} 
			if (!this.from_cloudinary) {
				if (typeof image_url == 'undefined') {
					console.log('url_undefined')
					console.log(model)
				}
				return image_url 
			} else {
				if (image_url) {
					if (from_cloudinary) {
						if (cropped) {
							url = `https://res.cloudinary.com/lucas-cn/image/upload/c_crop,g_custom,q_auto,f_auto/${image_url}`
						} else {
							url = `https://res.cloudinary.com/lucas-cn/image/upload/q_auto,f_auto/${image_url}`
						}
					} else {
						url = image_url
					}
				} else {
					url = '@/assets/image-not-found.jpg'
				}
				return url
			}
		},
		getProductionUrl(image_url) {
			if (image_url) {
				let position = image_url.indexOf('storage')
				let first = image_url.substring(0, position)
				let end = image_url.substring(position)
				return first+'public/'+end 
			}
		},
		imageUrl(path, cropped = false) {
			let url
			if (cropped) {
				url = `https://res.cloudinary.com/lucas-cn/image/upload/c_crop,g_custom,q_auto,f_auto/${path}`
			} else {
				url = `https://res.cloudinary.com/lucas-cn/image/upload/${path}`
			}
			return url
		},
		imageUrlFromVariant(article) {
			let url = `https://res.cloudinary.com/lucas-cn/image/upload/${article.
				variant.url}`
			return url
		},
		imageCropedUrlFromVariant(article) {
			let url = `https://res.cloudinary.com/lucas-cn/image/upload/c_crop,g_custom,q_auto,f_auto/${article.
				variant.url}`
			return url
		},
		imageCropedUrlfromImage(image) {
			let url = `https://res.cloudinary.com/lucas-cn/image/upload/c_crop,g_custom,q_auto,f_auto/${image.url}`
			return url
		},
		getFirstImage(article) {
			let first_image = article.images[0].url
			if (article.images) {
				article.images.forEach(image => {
					if (image.first) {
						first_image = image.url
					}
				})
			}
			return first_image
		},
		imageUrlFromImage(image) {
			let url = `https://res.cloudinary.com/lucas-cn/image/upload/${image.url}`
			return url
		},
	}
}