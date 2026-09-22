/**
 * Contraste de color WCAG 2.x, en JS.
 *
 * 🔴 PUERTO EXACTO de `ColorContrastHelper.php` de empresa-api
 * (app/Http/Controllers/Helpers/ColorContrastHelper.php): mismos nombres de funcion, mismas
 * formulas, mismas constantes de la especificacion WCAG (0.03928, 1.055, 2.4, los pesos
 * 0.2126/0.7152/0.0722, el "+0.05" del ratio). Si el dia de mañana se ajusta algo de un
 * lado, hay que revisar el otro para que los dos calculos no diverjan: uno corre en el
 * validador de paletas de empresa-api (antes de guardar una paleta generada por IA) y este
 * corre en tiempo real en la tienda, para arreglar colores YA guardados que quedaron
 * ilegibles cuando el fondo/panel que los rodea paso de fijo a configurable.
 */

/**
 * Normaliza un valor de color a '#RRGGBB' en mayusculas.
 *
 * Tolera espacios alrededor, ausencia del '#' inicial, y el formato corto '#RGB' (se
 * expande duplicando cada digito: '#F0A' -> '#FF00AA').
 *
 * @param {string|null|undefined} value
 * @returns {string|null} '#RRGGBB' en mayusculas, o null si no es un hex valido.
 */
export function normalize_hex(value) {
	if (typeof value != 'string') {
		return null
	}

	let cleaned = value.trim().replace(/^#/, '').toUpperCase()

	// Formato corto '#RGB': cada digito se duplica para llegar a 6 caracteres.
	if (/^[0-9A-F]{3}$/.test(cleaned)) {
		let expanded = ''
		for (let i = 0; i < 3; i++) {
			expanded += cleaned[i] + cleaned[i]
		}
		cleaned = expanded
	}

	// Unico formato aceptado a esta altura: exactamente 6 digitos hexadecimales.
	if (!/^[0-9A-F]{6}$/.test(cleaned)) {
		return null
	}

	return '#' + cleaned
}

/**
 * Convierte un hex '#RRGGBB' a sus componentes RGB (0-255 cada uno).
 *
 * @param {string|null|undefined} hex
 * @returns {number[]|null} [r, g, b] con enteros 0-255, o null si el hex no es valido.
 */
export function hex_to_rgb(hex) {
	let normalized = normalize_hex(hex)

	if (normalized === null) {
		return null
	}

	let value = normalized.replace('#', '')

	return [
		parseInt(value.substring(0, 2), 16),
		parseInt(value.substring(2, 4), 16),
		parseInt(value.substring(4, 6), 16),
	]
}

/**
 * Luminancia relativa de un color, segun la formula de WCAG 2.x.
 *
 * Cada canal (0-255) se linealiza dividiendo por 255 y aplicando la correccion gamma sRGB:
 * si el valor linealizado es <= 0.03928 se divide por 12.92 (tramo lineal cerca de 0), si no
 * se aplica pow((c+0.055)/1.055, 2.4) (tramo con correccion gamma). Estos numeros y los pesos
 * 0.2126/0.7152/0.0722 son parte de la especificacion de WCAG: los pesos reflejan que el ojo
 * humano percibe el verde como el canal mas brillante y el azul como el menos brillante.
 *
 * @param {string|null|undefined} hex
 * @returns {number|null} 0..1, o null si el hex no es valido.
 */
export function relative_luminance(hex) {
	let rgb = hex_to_rgb(hex)

	if (rgb === null) {
		return null
	}

	let linear = rgb.map(function (channel) {
		let c_srgb = channel / 255
		if (c_srgb <= 0.03928) {
			return c_srgb / 12.92
		}
		return Math.pow((c_srgb + 0.055) / 1.055, 2.4)
	})

	return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2])
}

/**
 * Ratio de contraste entre dos colores, segun la formula de WCAG 2.x.
 *
 * Formula: (L_claro + 0.05) / (L_oscuro + 0.05), donde L_claro y L_oscuro son las
 * luminancias relativas de los dos colores ordenadas de mayor a menor. El resultado va
 * siempre entre 1 (mismo color) y 21 (blanco puro contra negro puro).
 *
 * @param {string|null|undefined} hex_a
 * @param {string|null|undefined} hex_b
 * @returns {number|null} Entre 1 y 21, o null si alguno de los dos colores no es valido.
 */
export function contrast_ratio(hex_a, hex_b) {
	let luminance_a = relative_luminance(hex_a)
	let luminance_b = relative_luminance(hex_b)

	if (luminance_a === null || luminance_b === null) {
		return null
	}

	let lighter = Math.max(luminance_a, luminance_b)
	let darker = Math.min(luminance_a, luminance_b)

	return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Determina si un color es "oscuro" (luminancia relativa menor al punto medio 0.5).
 *
 * @param {string|null|undefined} hex
 * @returns {boolean} true si es oscuro (o si el hex es invalido -- por seguridad se asume
 *                     oscuro, mismo criterio que el PHP).
 */
export function is_dark(hex) {
	let luminance = relative_luminance(hex)

	if (luminance === null) {
		return true
	}

	return luminance < 0.5
}

/**
 * Devuelve el color de texto (blanco o negro casi puro) con mayor contraste contra un fondo.
 *
 * Se usan '#FFFFFF' y '#111111' (en vez de negro puro '#000000') porque un negro casi puro
 * se ve mas prolijo en pantalla y sigue dando un ratio de contraste practicamente identico.
 *
 * @param {string} background_hex
 * @returns {string} '#FFFFFF' o '#111111'.
 */
export function best_text_on(background_hex) {
	let white_ratio = contrast_ratio(background_hex, '#FFFFFF')
	let black_ratio = contrast_ratio(background_hex, '#111111')

	// Si el fondo no es un hex valido, contrast_ratio da null para los dos: ahi se
	// prioriza blanco como default seguro (mismo criterio historico del proyecto y del PHP).
	if (white_ratio === null || black_ratio === null) {
		return '#FFFFFF'
	}

	return white_ratio >= black_ratio ? '#FFFFFF' : '#111111'
}
