/**
 * Conexión en vivo con Pusher (laravel-echo + pusher-js), PEREZOSA.
 *
 * Hasta el 28/9/2026 main.js instanciaba Echo al arrancar, y pusher-js 7 conecta en el mismo
 * constructor: cada visitante de cada tienda —anónimos y bots incluidos— abría un
 * websocket contra Pusher. El plan de Pusher tiene un tope de conexiones concurrentes que
 * comparte TODA la flota (tiendas y sistemas de gestión), y esas conexiones las quemaba gente
 * que no escucha nada: todos los canales de la tienda son de un comprador (`order.{id}`,
 * `message.from_commerce.{id}`, `question.{id}`, `payment.{id}`).
 *
 * Decisión de Lucas (misión mensajes-tienda-online): la tienda se conecta SOLO con un
 * comprador logueado. Por eso acá:
 * - las dos librerías se cargan con import() dinámico, en un chunk aparte ("tiempo-real"):
 *   la tienda de un visitante anónimo nunca las ejecuta;
 * - la instancia se crea UNA sola vez y se comparte (dos pedidos seguidos reciben la misma
 *   promesa, no dos conexiones);
 * - desconectar_echo() la cierra y la olvida: una pestaña sin sesión no queda conectada.
 *
 * La key y el cluster salen del build (VUE_APP_PUSHER_KEY / VUE_APP_PUSHER_CLUSTER, que inyecta
 * EcommerceInstallationService::build_spa_env_file_content() en admin-api desde el 18/9/2026).
 * Sin key NO se conecta: se avisa por consola y la tienda sigue andando sin tiempo real. Antes,
 * instanciar Echo con la key en undefined tiraba en main.js, antes de montar Vue, y la tienda
 * quedaba en blanco (Unicas, 22/9/2026).
 */

/* La instancia viva de Echo, o null si no hay conexión. */
let echo = null

/* La promesa de la conexión en curso (o ya hecha). null = no se pidió o se desconectó. */
let conexion = null

/*
 * Se incrementa en cada desconectar_echo(). Si la sesión se cierra mientras el chunk todavía
 * se está descargando, la conexión que estaba en curso llega con un número viejo y NO crea la
 * instancia: si la creara, quedaría un websocket abierto que nadie va a cerrar.
 */
let generacion = 0

/* Para avisar una sola vez por carga de página que el build no trae la key. */
let aviso_sin_key = false

/**
 * Carga laravel-echo y pusher-js (una sola vez) y devuelve la instancia de Echo.
 *
 * Nunca rechaza: sin key, con el chunk que no baja o con la sesión cerrada en el medio,
 * resuelve null y la tienda sigue sin tiempo real.
 *
 * @returns {Promise<Object|null>} la instancia de Echo, o null si no se pudo conectar
 */
export function conectar_echo() {
	if (conexion) {
		return conexion
	}

	let key = process.env.VUE_APP_PUSHER_KEY
	if (!key) {
		if (!aviso_sin_key) {
			aviso_sin_key = true
			console.warn('Tiempo real apagado: el build de la tienda no trae VUE_APP_PUSHER_KEY.')
		}
		return Promise.resolve(null)
	}

	let esta_generacion = generacion

	conexion = Promise.all([
		import(/* webpackChunkName: "tiempo-real" */ 'laravel-echo'),
		import(/* webpackChunkName: "tiempo-real" */ 'pusher-js'),
	])
	.then(modulos => {
		if (esta_generacion !== generacion) {
			/* Se cerró la sesión mientras bajaba el chunk. */
			return null
		}

		/* laravel-echo 1.8 busca Pusher como global (PusherConnector.connect hace `new Pusher`). */
		window.Pusher = modulos[1].default || modulos[1]

		/* Por import() dinámico laravel-echo llega como módulo: la clase es el default. */
		let Echo = modulos[0].default

		echo = new Echo({
			broadcaster: 'pusher',
			key: key,
			cluster: process.env.VUE_APP_PUSHER_CLUSTER || 'sa1',
			forceTLS: false,
		})
		return echo
	})
	.catch(err => {
		/*
		 * El chunk que no baja (sin red, o un deploy nuevo que ya borró el viejo) o Pusher que
		 * tira al construirse. Se olvida la promesa para que el próximo pedido lo reintente.
		 */
		if (esta_generacion === generacion) {
			conexion = null
		}
		console.warn('No se pudo conectar el tiempo real', err)
		return null
	})

	return conexion
}

/**
 * Cierra la conexión con Pusher (si la hay) y la olvida. Se puede llamar las veces que sea:
 * sin conexión no hace nada, y si había una en curso, esa ya no se crea.
 *
 * @returns {void}
 */
export function desconectar_echo() {
	generacion++
	conexion = null

	if (!echo) {
		return
	}

	let saliente = echo
	echo = null
	try {
		saliente.disconnect()
	} catch (err) {
		console.warn('No se pudo cerrar la conexión del tiempo real', err)
	}
}
