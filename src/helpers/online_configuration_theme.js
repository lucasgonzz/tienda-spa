import { contrast_ratio, best_text_on } from '@/helpers/color_contrast'

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
 * Fondo de fábrica por plantilla, cuando el de `default_theme_colors` no es el que corresponde.
 *
 * 🔴 La plantilla ComercioCity pide gris y no blanco. Su ficha de artículo copia el layout de
 * Mercado Libre, que apoya tarjetas BLANCAS sobre un fondo gris: con el fondo blanco de fábrica la
 * tarjeta desaparece contra la página y hay que sostenerla con una línea de 1px (ver el comentario
 * de `article-view/Index.vue`, donde esa línea está puesta justamente por esto). Moderno y Clásico
 * no arman tarjetas sobre la página y siguen en blanco.
 *
 * 🔴 Esto cambia SOLO el valor de fábrica. Al comercio que ya eligió un color válido no se le
 * toca nada: `normalize_hex_color` devuelve el suyo y este fallback ni se consulta.
 */
const background_color_por_plantilla = {
	comerciocity: '#EDEDED',
}

/**
 * Stack tipográfico genérico cuando online_configuration no define fuente.
 */
const default_font_family_sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

/**
 * Aproximación opaca de `rgba(0, 0, 0, .6)`, el gris fijo que hoy usa el breadcrumb de la
 * ficha de producto (CategoryInfo.vue). Se usa SOLO para el chequeo de contraste de más
 * abajo: el valor que se publica cuando el chequeo pasa es el rgba original (ver
 * `BREADCRUMB_GRAY_CSS`), para que un comercio que ya está bien no cambie nada visualmente.
 */
const BREADCRUMB_GRAY_APROX = '#666666'
const BREADCRUMB_GRAY_CSS = 'rgba(0, 0, 0, .6)'
const BREADCRUMB_MIN_CONTRAST = 4.5

/**
 * El panel de autenticación (`.auth-layout__right` en AuthLayout.vue, donde vive el
 * formulario de login/registro) es SIEMPRE blanco puro: a diferencia del panel de branding
 * (`.auth-layout__left`), no mezcla `primary_color`. Confirmado leyendo el SASS -- y el
 * tema oscuro (`@if $theme == dark`) nunca compila en ningún cliente porque `$theme` es una
 * constante fija en `_custom.scss` (`ligth`, sin excepción por comercio), así que ese fondo
 * tampoco varía entre builds.
 */
const AUTH_PANEL_BACKGROUND_APROX = '#FFFFFF'
const AUTH_LINK_MIN_CONTRAST = 3.0

/**
 * Color del texto del breadcrumb de la ficha de producto (`--breadcrumb-text-color`).
 * El gris de siempre si sigue pasando WCAG AA (4.5, el mismo piso que ya justifica el
 * comentario original de CategoryInfo.vue) contra el fondo configurado por el comercio; si
 * no, el de mayor contraste posible contra ese fondo.
 *
 * @param {string} background_color ya normalizado (ver apply_online_configuration_theme)
 * @returns {string}
 */
function resolve_breadcrumb_text_color(background_color) {
	let ratio = contrast_ratio(BREADCRUMB_GRAY_APROX, background_color)
	if (ratio !== null && ratio >= BREADCRUMB_MIN_CONTRAST) {
		return BREADCRUMB_GRAY_CSS
	}
	return best_text_on(background_color)
}

/**
 * Color del link "Crear cuenta" del login (`--auth-link-color`). `primary_color` tal cual
 * si contrasta lo suficiente (3.0, mismo piso que ya usa LogoPaletteAiService en
 * empresa-api para `hover_text_color`, un texto de peso similar) contra el panel de auth;
 * si no, el texto fuerte que ese panel ya define para sí mismo (`--auth-text-strong`, ver
 * AuthLayout.vue) en vez de recalcular blanco/negro de cero.
 *
 * @param {string} primary_color ya normalizado (ver apply_online_configuration_theme)
 * @returns {string}
 */
function resolve_auth_link_color(primary_color) {
	let ratio = contrast_ratio(primary_color, AUTH_PANEL_BACKGROUND_APROX)
	if (ratio !== null && ratio >= AUTH_LINK_MIN_CONTRAST) {
		return primary_color
	}
	return 'var(--auth-text-strong)'
}

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
 * Devuelve el fondo de fábrica que le corresponde a la plantilla activa.
 *
 * `online_template` puede no venir (comercio recién creado, o una respuesta vieja del API): en ese
 * caso vale el blanco de siempre, que es el comportamiento que había hasta ahora.
 *
 * Se busca con `hasOwnProperty` y no con `mapa[slug]` a secas para que un slug como `constructor`
 * o `toString` no devuelva algo del prototipo en vez de un color.
 *
 * @param {object|null|undefined} online_configuration
 * @returns {string}
 */
function resolve_default_background_color(online_configuration) {
	/* Slug de la plantilla activa, con la misma guarda que usa App.vue para armar su clase. */
	let template_slug = online_configuration
		&& online_configuration.online_template
		&& typeof online_configuration.online_template.slug == 'string'
			? online_configuration.online_template.slug
			: ''

	if (Object.prototype.hasOwnProperty.call(background_color_por_plantilla, template_slug)) {
		return background_color_por_plantilla[template_slug]
	}

	return default_theme_colors.background_color
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
 * Resuelve el color del boton "Agregar al carrito": usa el propio si esta cargado,
 * y si no, el mismo color que ya usan el resto de los botones outline-primary
 * (el color secundario), que es el comportamiento de siempre.
 *
 * @param {object|null|undefined} online_configuration
 * @returns {string}
 */
function resolve_add_to_cart_button_color(online_configuration) {
	let secondary_color = normalize_hex_color(online_configuration && online_configuration.secondary_color, default_theme_colors.secondary_color)
	if (!online_configuration || !online_configuration.add_to_cart_button_color) {
		return secondary_color
	}
	return normalize_hex_color(online_configuration.add_to_cart_button_color, secondary_color)
}

/**
 * Resuelve el color de los botones de compra de la ficha de producto ("Comprar ahora" y
 * "Agregar al carrito" de `buy-box/Index.vue`) y el color de su texto.
 *
 * 🔴 No es `resolve_add_to_cart_button_color`: ese cae al color SECUNDARIO cuando el comercio
 * no cargó nada (el tratamiento de siempre del botón de las tarjetas), mientras que los botones
 * de la ficha siempre se pintaron con el color PRIMARIO. Si acá cayera al secundario, todo
 * comercio que nunca tocó el campo vería cambiar los botones de su ficha. Sin color propio se
 * devuelve exactamente lo de antes en reposo: el primario con texto blanco. (Los estados hover /
 * focus / click de "Comprar ahora" son nuevos para todos: antes los mandaba el gris de Bootstrap.)
 *
 * Con color propio el texto se elige por contraste (blanco o casi negro), porque un color
 * claro con texto blanco fijo dejaría el botón ilegible.
 *
 * @param {object|null|undefined} online_configuration
 * @param {string} primary_color ya normalizado (ver apply_online_configuration_theme)
 * @returns {{color: string, text_color: string}}
 */
function resolve_buy_box_button_colors(online_configuration, primary_color) {
	let own_color = online_configuration && online_configuration.add_to_cart_button_color
	let valid_own_color = own_color ? normalize_hex_color(own_color, '') : ''
	if (valid_own_color == '') {
		return { color: primary_color, text_color: '#FFF' }
	}
	return { color: valid_own_color, text_color: best_text_on(valid_own_color) }
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
	/* El único fallback que depende de la plantilla: ver `background_color_por_plantilla`. */
	let background_color = normalize_hex_color(online_configuration.background_color, resolve_default_background_color(online_configuration))
	let font_family_sans = resolve_font_family_sans(online_configuration)
	let add_to_cart_button_color = resolve_add_to_cart_button_color(online_configuration)
	let buy_box_button_colors = resolve_buy_box_button_colors(online_configuration, primary_color)
	/* Colores derivados por contraste: ver los dos resolve_* de arriba. */
	let breadcrumb_text_color = resolve_breadcrumb_text_color(background_color)
	let auth_link_color = resolve_auth_link_color(primary_color)

	/* Publica los colores como variables CSS consumidas por SASS y componentes. */
	document.documentElement.style.setProperty('--primary-color', primary_color)
	document.documentElement.style.setProperty('--secondary-color', secondary_color)
	document.documentElement.style.setProperty('--text-color', text_color)
	document.documentElement.style.setProperty('--hover-text-color', hover_text_color)
	document.documentElement.style.setProperty('--category-color-text', category_color_text)
	document.documentElement.style.setProperty('--background-color', background_color)
	document.documentElement.style.setProperty('--font-family-sans', font_family_sans)
	document.documentElement.style.setProperty('--add-to-cart-button-color', add_to_cart_button_color)
	document.documentElement.style.setProperty('--buy-box-button-color', buy_box_button_colors.color)
	document.documentElement.style.setProperty('--buy-box-button-text-color', buy_box_button_colors.text_color)
	document.documentElement.style.setProperty('--breadcrumb-text-color', breadcrumb_text_color)
	document.documentElement.style.setProperty('--auth-link-color', auth_link_color)
}
