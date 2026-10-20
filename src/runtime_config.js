/**
 * Configuración de la tienda en tiempo de ejecución (misión versiones-tienda, 1/10/2026).
 *
 * Por qué existe: hasta acá cada variable `VUE_APP_*` leída de `process.env` la resolvía vue-cli
 * AL COMPILAR, reemplazándola por el valor literal del `.env`. Como la URL de la API, el id del comercio, el
 * nombre de la tienda, Pusher, etc. son distintos en cada cliente, eso obligaba a UNA COMPILACIÓN
 * POR TIENDA, y esa compilación corría en el VPS de builds de producción en cada instalación y en
 * cada actualización (admin-api, EcommerceInstallationService: `npm ci` + webpack por cliente).
 *
 * Ahora el bundle es uno solo por versión: lo compila GitHub Actions al hacer el release
 * (`.github/workflows/release.yml`, sin `.env`) y los valores de cada tienda se leen de
 * `window.__CC_CONFIG__`, que define `config.js`. Ese archivo lo escribe admin-api al lado del
 * `index.html` cada vez que despliega una versión de ecommerce en un cliente (instalación o
 * actualización). `public/index.html` lo carga síncrono y antes que el bundle, así que ya está
 * cargado cuando los stores hacen `axios.defaults.baseURL = env('VUE_APP_API_URL')` al importarse.
 *
 * Orden de resolución:
 *   1. `window.__CC_CONFIG__[key]`  → producción: lo escribe el admin en cada despliegue.
 *   2. `process.env[key]`           → desarrollo (`.env` / `.env.local`) y respaldo: una tienda
 *                                     compilada por la vía vieja (con `.env`, en el VPS de builds)
 *                                     trae el `config.js` por defecto, vacío, y sigue andando
 *                                     exactamente igual que antes.
 *   3. `fallback`.
 *
 * vue-cli inyecta `process.env` como un objeto literal con todas las `VUE_APP_*` que existían al
 * compilar (DefinePlugin), así que el acceso dinámico `process.env[key]` queda resuelto en el
 * bundle y en el navegador no sobrevive ninguna referencia a `process`. Una clave que no estaba en
 * el `.env` da `undefined`, igual que la lectura directa de `process.env` de antes.
 *
 * Los valores son strings en las dos fuentes (URLs, ids, 'true'/'false'), igual que con el `.env`:
 * el código que concatena o compara no cambia. Las claves que escribe el admin están documentadas
 * en `.env.example` y en `public/config.js`.
 *
 * Es la misma función que `empresa-spa/src/runtime_config.js`: si se cambia una, se cambian las dos.
 *
 * @param {string} key       Nombre de la variable, p. ej. 'VUE_APP_API_URL'.
 * @param {*}      fallback  Valor a devolver si la clave no está ni en config.js ni en el build.
 * @returns {*} El valor de config.js, si no el del build, si no el fallback.
 */
export function env(key, fallback = undefined) {
	if (typeof window !== 'undefined' && window.__CC_CONFIG__ && window.__CC_CONFIG__[key] !== undefined) {
		return window.__CC_CONFIG__[key]
	}
	if (process.env[key] !== undefined) {
		return process.env[key]
	}
	return fallback
}
