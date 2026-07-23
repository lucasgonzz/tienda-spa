/**
 * Valores por defecto alineados con la migración de colores en online_configurations.
 * Se usan solo cuando el API no envía un color válido.
 */
export const default_theme_colors = {
	primary_color: '#c5111d',
	secondary_color: '#fe7802',
	text_color: '#F2F2F2',
	hover_text_color: '#FFF',
	category_color_text: '#333',
	background_color: '#FFFFFF',
}

/**
 * Stack tipográfico genérico cuando online_configuration no define fuente.
 */
const default_font_family_sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

/**
 * Devuelve un color hexadecimal válido o un fallback.
 *
 * @param {string|null|undefined} color_value
 * @param {string} fallback_color
 * @returns {string}
 */
export function normalize_hex_color(color_value, fallback_color) {
	/* Limpia espacios para validar correctamente entradas del formulario. */
	let color_string = typeof color_value == 'string' ? color_value.trim() : ''
	/* Acepta formato #RGB o #RRGGBB para mantener flexibilidad en la configuración. */
	let is_valid_hex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color_string)
	return is_valid_hex ? color_string : fallback_color
}

/**
 * Arma el valor de --font-family-sans a partir de online_configuration.
 *
 * @param {object|null|undefined} online_configuration
 * @returns {string}
 */
function resolve_font_family_sans(online_configuration) {
	/* Permite ampliar el contrato sin romper tiendas que aún no envían el campo. */
	let font_family = online_configuration && typeof online_configuration.font_family == 'string'
		? online_configuration.font_family.trim()
		: ''

	if (font_family == '') {
		return default_font_family_sans
	}

	return `'${font_family}', ${default_font_family_sans}`
}

/**
 * Aplica la paleta y variables de tema de online_configuration en :root.
 *
 * @param {object|null|undefined} online_configuration
 * @returns {void}
 */
export function apply_online_configuration_theme(online_configuration) {
	if (!online_configuration) {
		return
	}

	/* Normaliza y valida cada color para evitar valores inválidos en CSS. */
	let primary_color = normalize_hex_color(online_configuration.primary_color, default_theme_colors.primary_color)
	let secondary_color = normalize_hex_color(online_configuration.secondary_color, default_theme_colors.secondary_color)
	let text_color = normalize_hex_color(online_configuration.text_color, default_theme_colors.text_color)
	let hover_text_color = normalize_hex_color(online_configuration.hover_text_color, default_theme_colors.hover_text_color)
	let category_color_text = normalize_hex_color(online_configuration.category_color_text, default_theme_colors.category_color_text)
	let background_color = normalize_hex_color(online_configuration.background_color, default_theme_colors.background_color)
	let font_family_sans = resolve_font_family_sans(online_configuration)

	/* Publica los colores como variables CSS consumidas por SASS y componentes. */
	document.documentElement.style.setProperty('--primary-color', primary_color)
	document.documentElement.style.setProperty('--secondary-color', secondary_color)
	document.documentElement.style.setProperty('--text-color', text_color)
	document.documentElement.style.setProperty('--hover-text-color', hover_text_color)
	document.documentElement.style.setProperty('--category-color-text', category_color_text)
	document.documentElement.style.setProperty('--background-color', background_color)
	document.documentElement.style.setProperty('--font-family-sans', font_family_sans)
}
