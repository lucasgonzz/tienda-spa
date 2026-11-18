/** Los destinos nuevos son internacionales explícitos: nunca inferimos país ni cambiamos el teléfono general. */
export function normalizeInternationalWhatsappPhone(value) {
	if (typeof value !== 'string') {
		return ''
	}
	let phone = value.trim()
	if (!phone || !/^\+?[0-9 ()\-.]+$/.test(phone)) {
		return ''
	}
	phone = phone.replace(/[ ()\-.]/g, '')
	if (phone.indexOf('+') === 0) {
		phone = phone.substr(1)
	} else if (phone.indexOf('00') === 0) {
		phone = phone.substr(2)
	}
	return /^[1-9][0-9]{7,14}$/.test(phone) ? phone : ''
}

export function whatsappContacts(configuration) {
	let contacts = []
	let config = configuration || {}
	let consultations = normalizeInternationalWhatsappPhone(config.whatsapp_consultations_phone)
	let seller = normalizeInternationalWhatsappPhone(config.whatsapp_seller_phone)
	if (consultations) {
		contacts.push({ key: 'consultations', name: 'Consultas', phone: consultations, link: 'https://wa.me/' + consultations })
	}
	if (seller) {
		contacts.push({ key: 'seller', name: 'Hablar con un vendedor', phone: seller, link: 'https://wa.me/' + seller })
	}
	return contacts
}
