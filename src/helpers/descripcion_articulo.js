/**
 * Qué descripción de un artículo se muestra en la tienda.
 *
 * El artículo puede traer dos fuentes de descripción:
 *   - `descriptions`: descripciones estructuradas (título + contenido), una relación.
 *   - `descripcion`: un texto suelto, columna `text` de la tabla `articles` (en el ERP es el
 *     campo "Descripción", la información complementaria del artículo).
 *
 * 🔴 El nombre es `descripcion`, en español, y NO `description`: esa columna no existe en
 * ninguna base (la crea `empresa-api`, que gobierna el esquema). Hasta el 23/9/2026 la tienda
 * leía `article.description`, que siempre llegaba `undefined`, así que el texto del campo
 * Descripción nunca se mostró y la ficha salía sin descripción aunque el ERP la tuviera cargada.
 * No "corregirlo" de vuelta a `description`: no falla, simplemente no muestra nada.
 *
 * 🔴 Regla (pedido de Lucas, 23/9/2026): si el artículo tiene descripciones estructuradas se
 * muestran SOLO esas; el texto suelto queda como respaldo únicamente cuando no hay ninguna.
 * Antes se dibujaban las dos juntas y esa regla estaba repetida en tres componentes
 * (`Description.vue`, `SaberDelProducto.vue` y `views/Article.vue`): cualquier cambio tenía que
 * hacerse en los tres. Ahora los tres leen de acá, así no divergen -- por ejemplo, que el
 * resumen recortado muestre el texto suelto y la descripción completa no.
 */

/**
 * Convierte cualquier valor en un texto sin espacios sobrantes; null/undefined dan ''.
 *
 * @param {*} value
 * @returns {string}
 */
function texto_limpio(value) {
	if (value === null || value === undefined) {
		return ''
	}
	return String(value).trim()
}

/**
 * Devuelve lo que hay que mostrar como descripción del artículo.
 *
 * Una descripción estructurada cuenta si tiene título o contenido con texto: una fila vacía
 * (guardada sin completar) no es "tener descripción", y si contara taparía el texto de respaldo
 * y dejaría la ficha sin descripción.
 *
 * @param {Object|null|undefined} article Artículo tal como llega de la API.
 * @returns {{estructuradas: Array<Object>, texto: string}}
 *   `estructuradas`: descripciones con título/contenido, en el orden en que llegaron.
 *   `texto`: el campo `descripcion` del artículo, solo si no hay estructuradas; si no, ''.
 */
export function descripciones_a_mostrar(article) {
	if (!article) {
		return { estructuradas: [], texto: '' }
	}

	let estructuradas = []
	if (Array.isArray(article.descriptions)) {
		article.descriptions.forEach(descripcion => {
			if (descripcion && (texto_limpio(descripcion.title) || texto_limpio(descripcion.content))) {
				estructuradas.push(descripcion)
			}
		})
	}

	if (estructuradas.length) {
		return { estructuradas: estructuradas, texto: '' }
	}

	return { estructuradas: [], texto: texto_limpio(article.descripcion) }
}

/**
 * Si el artículo tiene algo para mostrar en su descripción (estructurada o de respaldo).
 *
 * @param {Object|null|undefined} article
 * @returns {boolean}
 */
export function tiene_descripcion(article) {
	let descripcion = descripciones_a_mostrar(article)
	return !!(descripcion.estructuradas.length || descripcion.texto)
}
