<?php
/**
 * Capa SEO de la tienda (mision seo-tiendas, 23/9/2026).
 *
 * Por que existe: la tienda es una SPA de Vue y el HTML que baja del servidor era siempre el mismo
 * index.html vacio (<div id=app></div> + un <noscript> en ingles). Lo que no ejecuta JavaScript
 * —WhatsApp, Facebook, Bing en primera pasada, los crawlers de IA, y Google antes de renderizar—
 * no veia ni titulo, ni descripcion, ni un solo producto. Google llego a mostrar como descripcion
 * de una tienda el texto del <noscript>.
 *
 * Que hace (lo llama public/.htaccess para toda ruta que no es un archivo real):
 *   - /robots.txt  → lo genera aca (Disallow de las rutas privadas + Sitemap: https://<host>/sitemap.xml).
 *   - /sitemap.xml → proxy de  GET {API}/api/seo/sitemap/{commerce_id}?sitio=...   (cache 6 h).
 *   - cualquier otra ruta:
 *       GET {API}/api/seo/pagina/{commerce_id}?ruta=<path>&sitio=<https://host>   (timeout 3 s, cache 15 min)
 *       y con esa respuesta ("Contrato A" de la mision) reemplaza en index.html la region
 *       <!--seo:head-->…<!--/seo:head--> por las etiquetas de la pagina, mete el cuerpo_html
 *       adentro de #app y responde con el `estado` (200 o 404).
 *
 * 🔴 FALLBACK INNEGOCIABLE: ante cualquier falla (API caida, timeout, HTTP != 200, JSON invalido,
 * falta una clave, no se encuentran los marcadores, excepcion) se sirve index.html tal cual y con
 * 200, exactamente como se servia antes de que existiera este archivo. Si hay una respuesta
 * cacheada vencida y la API falla, se usa la vencida. Nunca se imprime un error de PHP.
 *
 * Vue monta sobre #app y REEMPLAZA el contenido estatico: el visitante sigue viendo la SPA de
 * siempre. Para que no vea un destello de HTML sin estilos antes de que monte, el cuerpo inyectado
 * va tapado por un overlay blanco (.seo-cargando) que desaparece junto con el resto al montar;
 * sin JavaScript, el <noscript><style> del head de index.html lo esconde y se ve el contenido.
 *
 * 🔴 Tiene que correr en PHP 7.4: no se sabe que PHP tiene el docroot de cada tienda. Nada de
 * match, ?->, str_contains, argumentos nombrados, union types ni nada posterior a 7.4.
 *
 * Los dos valores de abajo los reemplaza vue.config.js al compilar (VUE_APP_API_URL y
 * VUE_APP_COMMERCE_ID del .env del build). Si quedaron sin reemplazar, se sirve index.html.
 *
 * Probarlo en local, parado en dist/:  php -S 127.0.0.1:8190 seo.php
 * (con el servidor embebido este archivo hace tambien de .htaccess, ver seo_servidor_embebido()).
 */

ini_set('display_errors', '0');
error_reporting(0);

define('SEO_API_URL', '__VUE_APP_API_URL__');
define('SEO_COMMERCE_ID', '__VUE_APP_COMMERCE_ID__');

define('SEO_TTL_PAGINA', 15 * 60);
define('SEO_TTL_SITEMAP', 6 * 60 * 60);

/**
 * Rutas privadas o funcionales: no se indexan (la API igual les responde noindex,follow).
 * Es la misma tabla del plan de la mision y la misma que public/robots.txt.
 */
function seo_rutas_privadas()
{
    return array(
        '/buscar', '/carrito', '/compras', '/favoritos', '/login', '/registro', '/recuperar-clave',
        '/confirmar-compra', '/pagar', '/pago-', '/configuracion', '/mensajes', '/notificaciones',
        '/cupones', '/cuenta-corriente', '/tarjetas', '/ubicacion', '/mapas', '/social-login',
        '/auth/', '/gracias-por-tu-compra', '/preguntas', '/seleccion-especial/',
    );
}

/**
 * Ruta de index.html, que vive en la misma carpeta que este archivo.
 */
function seo_ruta_index()
{
    return __DIR__ . DIRECTORY_SEPARATOR . 'index.html';
}

/**
 * Sirve index.html tal cual, con 200. Es el comportamiento de la tienda antes de esta capa.
 */
function seo_fallback()
{
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    if (!headers_sent()) {
        http_response_code(200);
        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: no-cache');
    }
    if (!seo_es_head()) {
        readfile(seo_ruta_index());
    }
    exit;
}

function seo_es_head()
{
    return isset($_SERVER['REQUEST_METHOD']) && strtoupper($_SERVER['REQUEST_METHOD']) === 'HEAD';
}

/**
 * La URL de la API del build, sin barra final. null si el placeholder no se reemplazo o quedo vacio.
 */
function seo_api_url()
{
    $url = trim(SEO_API_URL);
    // El placeholder se arma concatenado: si estuviera escrito entero, el reemplazo del build lo
    // pisaria tambien aca y la comparacion no serviria para nada.
    if ($url === '' || $url === '__VUE_APP_' . 'API_URL__') {
        return null;
    }
    return rtrim($url, '/');
}

function seo_commerce_id()
{
    $id = trim(SEO_COMMERCE_ID);
    if ($id === '' || $id === '__VUE_APP_' . 'COMMERCE_ID__') {
        return null;
    }
    return $id;
}

/**
 * Host de la request saneado: minusculas y solo [a-z0-9.-:]. Nunca se usa crudo.
 */
function seo_host()
{
    $host = isset($_SERVER['HTTP_HOST']) ? strtolower((string) $_SERVER['HTTP_HOST']) : '';
    $host = preg_replace('/[^a-z0-9.\-:]/', '', $host);
    return is_string($host) ? $host : '';
}

/**
 * Path de la request sin query string, empezando con '/'.
 */
function seo_ruta()
{
    $uri = isset($_SERVER['REQUEST_URI']) ? (string) $_SERVER['REQUEST_URI'] : '/';
    $ruta = parse_url($uri, PHP_URL_PATH);
    if (!is_string($ruta) || $ruta === '') {
        return '/';
    }
    if ($ruta[0] !== '/') {
        $ruta = '/' . $ruta;
    }
    return $ruta;
}

/**
 * GET con timeouts cortos. Devuelve array(status, body) o null si ni siquiera hubo respuesta.
 * curl si esta; si no, file_get_contents con stream context.
 */
function seo_http_get($url, $timeout_conexion, $timeout_total)
{
    $headers = array('Accept: application/json, application/xml;q=0.9, */*;q=0.1', 'User-Agent: tienda-seo/1.0');

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        if ($ch === false) {
            return null;
        }
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout_conexion);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout_total);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_ENCODING, '');
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($body === false || $status === 0) {
            return null;
        }
        return array($status, (string) $body);
    }

    if (!ini_get('allow_url_fopen')) {
        return null;
    }
    $contexto = stream_context_create(array(
        'http' => array(
            'method' => 'GET',
            'timeout' => $timeout_total,
            'ignore_errors' => true,
            'follow_location' => 0,
            'header' => implode("\r\n", $headers) . "\r\n",
        ),
    ));
    $body = @file_get_contents($url, false, $contexto);
    if ($body === false || !isset($http_response_header) || !is_array($http_response_header)) {
        return null;
    }
    $status = 0;
    foreach ($http_response_header as $linea) {
        if (preg_match('#^HTTP/\S+\s+(\d{3})#', $linea, $m)) {
            // Con redirecciones hay varias lineas de estado: vale la ultima.
            $status = (int) $m[1];
        }
    }
    if ($status === 0) {
        return null;
    }
    return array($status, (string) $body);
}

/**
 * Carpeta de cache de este host. null si no se puede crear (se trabaja sin cache).
 */
function seo_dir_cache($host)
{
    $dir = rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . 'tienda-seo-' . md5($host);
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        return null;
    }
    return $dir;
}

/**
 * Lee una entrada de cache. Devuelve array('fresca' => bool, 'datos' => string) o null.
 */
function seo_cache_leer($archivo, $ttl)
{
    if ($archivo === null || !is_file($archivo)) {
        return null;
    }
    $datos = @file_get_contents($archivo);
    if ($datos === false || $datos === '') {
        return null;
    }
    $mtime = @filemtime($archivo);
    return array(
        'fresca' => $mtime !== false && (time() - $mtime) < $ttl,
        'datos' => $datos,
    );
}

/**
 * Escribe una entrada de cache de forma atomica (temporal + rename), para que una request
 * concurrente nunca lea un archivo a medio escribir.
 */
function seo_cache_escribir($archivo, $datos)
{
    if ($archivo === null) {
        return;
    }
    $temporal = $archivo . '.' . getmypid() . '.' . mt_rand() . '.tmp';
    if (@file_put_contents($temporal, $datos) === false) {
        return;
    }
    if (!@rename($temporal, $archivo)) {
        @unlink($temporal);
    }
}

/**
 * Valida la respuesta de /api/seo/pagina contra el Contrato A. Devuelve el array o null.
 * Claves exactas: estado, titulo, descripcion, canonica, imagen, robots, og_type, json_ld, cuerpo_html.
 */
function seo_validar_pagina($json)
{
    $datos = json_decode($json, true);
    if (!is_array($datos)) {
        return null;
    }
    $claves = array('estado', 'titulo', 'descripcion', 'canonica', 'imagen', 'robots', 'og_type', 'json_ld', 'cuerpo_html');
    foreach ($claves as $clave) {
        if (!array_key_exists($clave, $datos)) {
            return null;
        }
    }
    if (!is_numeric($datos['estado']) || !in_array((int) $datos['estado'], array(200, 404), true)) {
        return null;
    }
    foreach (array('titulo', 'descripcion', 'robots', 'og_type', 'cuerpo_html') as $clave) {
        if (!is_string($datos[$clave])) {
            return null;
        }
    }
    foreach (array('canonica', 'imagen') as $clave) {
        if ($datos[$clave] !== null && !is_string($datos[$clave])) {
            return null;
        }
    }
    if (!is_array($datos['json_ld'])) {
        return null;
    }
    $datos['estado'] = (int) $datos['estado'];
    return $datos;
}

function seo_e($valor)
{
    return htmlspecialchars((string) $valor, ENT_QUOTES, 'UTF-8');
}

/**
 * Arma las etiquetas del head a partir de la respuesta de la API. Todas llevan data-seo para que
 * src/main.js las saque antes de montar Vue (despues el head lo maneja vue-meta).
 */
function seo_armar_head($datos)
{
    $titulo = $datos['titulo'];
    $descripcion = $datos['descripcion'];
    $canonica = ($datos['canonica'] !== null && $datos['canonica'] !== '') ? $datos['canonica'] : null;
    $imagen = ($datos['imagen'] !== null && $datos['imagen'] !== '') ? $datos['imagen'] : null;

    $h = array();
    $h[] = '<title data-seo>' . seo_e($titulo) . '</title>';
    $h[] = '<meta data-seo name="description" content="' . seo_e($descripcion) . '">';
    if ($canonica !== null) {
        $h[] = '<link data-seo rel="canonical" href="' . seo_e($canonica) . '">';
    }
    $h[] = '<meta data-seo name="robots" content="' . seo_e($datos['robots']) . '">';
    $h[] = '<meta data-seo property="og:type" content="' . seo_e($datos['og_type']) . '">';
    $h[] = '<meta data-seo property="og:title" content="' . seo_e($titulo) . '">';
    $h[] = '<meta data-seo property="og:description" content="' . seo_e($descripcion) . '">';
    if ($canonica !== null) {
        $h[] = '<meta data-seo property="og:url" content="' . seo_e($canonica) . '">';
    }
    if ($imagen !== null) {
        $h[] = '<meta data-seo property="og:image" content="' . seo_e($imagen) . '">';
    }
    $h[] = '<meta data-seo name="twitter:card" content="' . ($imagen !== null ? 'summary_large_image' : 'summary') . '">';
    $h[] = '<meta data-seo name="twitter:title" content="' . seo_e($titulo) . '">';
    $h[] = '<meta data-seo name="twitter:description" content="' . seo_e($descripcion) . '">';
    if ($imagen !== null) {
        $h[] = '<meta data-seo name="twitter:image" content="' . seo_e($imagen) . '">';
    }
    foreach ($datos['json_ld'] as $bloque) {
        if (!is_array($bloque)) {
            continue;
        }
        // JSON_HEX_TAG convierte < y > en < / >: un "</script>" dentro del nombre de un
        // producto no puede cerrar el <script> antes de tiempo.
        $json = json_encode($bloque, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG);
        if ($json === false) {
            continue;
        }
        $h[] = '<script data-seo type="application/ld+json">' . $json . '</script>';
    }
    return implode('', $h);
}

/**
 * Arma el index.html de la pagina. Devuelve el HTML o null si no se encontro donde inyectar.
 */
function seo_armar_html($index, $datos)
{
    $marca_inicio = '<!--seo:head-->';
    $marca_fin = '<!--/seo:head-->';
    $inicio = strpos($index, $marca_inicio);
    $fin = strpos($index, $marca_fin);
    if ($inicio === false || $fin === false || $fin < $inicio) {
        return null;
    }
    $desde = $inicio + strlen($marca_inicio);
    $html = substr($index, 0, $desde) . seo_armar_head($datos) . substr($index, $fin);

    // El overlay tapa el HTML estatico hasta que Vue monta y reemplaza #app entero (overlay
    // incluido). El estilo va adentro del bloque para no depender de nada del bundle.
    $cuerpo = '<style>.seo-cargando{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;background:#fff}</style>'
        . '<div class="seo-cargando" aria-hidden="true"></div>'
        . '<div class="seo-contenido">' . $datos['cuerpo_html'] . '</div>';

    // Minificado queda <div id=app></div>; sin minificar, <div id="app"></div>.
    $cantidad = 0;
    $html = preg_replace_callback(
        '/<div\s+id\s*=\s*(["\']?)app\1\s*>\s*<\/div>/i',
        function ($m) use ($cuerpo) {
            return '<div id="app">' . $cuerpo . '</div>';
        },
        $html,
        1,
        $cantidad
    );
    if (!is_string($html) || $cantidad !== 1) {
        return null;
    }
    return $html;
}

function seo_responder_robots($host)
{
    $lineas = array('User-agent: *', 'Allow: /');
    foreach (seo_rutas_privadas() as $ruta) {
        $lineas[] = 'Disallow: ' . $ruta;
    }
    if ($host !== '') {
        $lineas[] = '';
        $lineas[] = 'Sitemap: https://' . $host . '/sitemap.xml';
    }
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    http_response_code(200);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    if (!seo_es_head()) {
        echo implode("\n", $lineas) . "\n";
    }
    exit;
}

function seo_responder_sitemap($host)
{
    $xml = null;
    $api = seo_api_url();
    $commerce_id = seo_commerce_id();
    $archivo = null;
    if ($host !== '') {
        $dir = seo_dir_cache($host);
        $archivo = $dir !== null ? $dir . DIRECTORY_SEPARATOR . 'sitemap.xml' : null;
    }
    $cache = seo_cache_leer($archivo, SEO_TTL_SITEMAP);
    if ($cache !== null && $cache['fresca']) {
        $xml = $cache['datos'];
    } elseif ($api !== null && $commerce_id !== null && $host !== '') {
        // El sitemap puede ser grande (hasta 45 000 URLs): se le da mas tiempo que a una pagina.
        $url = $api . '/api/seo/sitemap/' . rawurlencode($commerce_id) . '?' . http_build_query(array('sitio' => 'https://' . $host));
        $respuesta = seo_http_get($url, 2, 20);
        if ($respuesta !== null && $respuesta[0] === 200
            && (strpos($respuesta[1], '<urlset') !== false || strpos($respuesta[1], '<sitemapindex') !== false)) {
            $xml = $respuesta[1];
            seo_cache_escribir($archivo, $xml);
        } elseif ($cache !== null) {
            $xml = $cache['datos'];
        }
    }
    if ($xml === null) {
        // Sin API y sin cache: un sitemap minimo con la home. Sigue siendo un sitemap valido.
        $home = $host !== '' ? 'https://' . $host . '/' : '/';
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
            . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'
            . htmlspecialchars($home, ENT_QUOTES | ENT_XML1, 'UTF-8') . '</loc></url></urlset>' . "\n";
    }
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    http_response_code(200);
    header('Content-Type: application/xml; charset=UTF-8');
    header('Cache-Control: public, max-age=3600');
    if (!seo_es_head()) {
        echo $xml;
    }
    exit;
}

/**
 * Con `php -S ... seo.php` (solo para probar en local) este archivo es el router de TODAS las
 * requests: hace lo que en Apache hace public/.htaccess. Los archivos reales se sirven tal cual,
 * salvo robots.txt, que en Apache tambien pasa por aca.
 */
function seo_servidor_embebido($ruta)
{
    if (PHP_SAPI !== 'cli-server') {
        return false;
    }
    if ($ruta === '/robots.txt' || $ruta === '/sitemap.xml' || $ruta === '/seo.php') {
        return false;
    }
    $archivo = __DIR__ . str_replace('/', DIRECTORY_SEPARATOR, rawurldecode($ruta));
    return $ruta !== '/' && is_file($archivo);
}

function seo_principal()
{
    $ruta = seo_ruta();

    if (seo_servidor_embebido($ruta)) {
        return false;
    }

    $host = seo_host();

    if ($ruta === '/robots.txt') {
        seo_responder_robots($host);
    }
    if ($ruta === '/sitemap.xml') {
        seo_responder_sitemap($host);
    }

    $metodo = isset($_SERVER['REQUEST_METHOD']) ? strtoupper($_SERVER['REQUEST_METHOD']) : 'GET';
    if ($metodo !== 'GET' && $metodo !== 'HEAD') {
        seo_fallback();
    }

    // /seo.php pedido directo (lo precachea el service worker) e /index.html: el index tal cual.
    if ($ruta === '/seo.php' || $ruta === '/index.html') {
        seo_fallback();
    }

    // Un archivo estatico que no existe (un .js viejo, una imagen borrada) no es una pagina: no se
    // le pregunta a la API y se responde como siempre.
    if (preg_match('/\.(js|css|map|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|otf|json|txt|xml|webmanifest|pdf|zip|mp4|php)$/i', $ruta)) {
        seo_fallback();
    }

    $api = seo_api_url();
    $commerce_id = seo_commerce_id();
    if ($api === null || $commerce_id === null || $host === '') {
        seo_fallback();
    }

    $index = @file_get_contents(seo_ruta_index());
    if ($index === false || $index === '') {
        seo_fallback();
    }

    $dir = seo_dir_cache($host);
    $archivo = $dir !== null ? $dir . DIRECTORY_SEPARATOR . md5($ruta) . '.json' : null;

    $datos = null;
    $cache = seo_cache_leer($archivo, SEO_TTL_PAGINA);
    if ($cache !== null && $cache['fresca']) {
        $datos = seo_validar_pagina($cache['datos']);
    }
    if ($datos === null) {
        $url = $api . '/api/seo/pagina/' . rawurlencode($commerce_id) . '?' . http_build_query(array(
            'ruta' => $ruta,
            'sitio' => 'https://' . $host,
        ));
        $respuesta = seo_http_get($url, 2, 3);
        if ($respuesta !== null && $respuesta[0] === 200) {
            $datos = seo_validar_pagina($respuesta[1]);
            if ($datos !== null) {
                seo_cache_escribir($archivo, $respuesta[1]);
            }
        }
        if ($datos === null && $cache !== null) {
            // La API fallo: mejor la respuesta vencida que el index pelado.
            $datos = seo_validar_pagina($cache['datos']);
        }
    }
    if ($datos === null) {
        seo_fallback();
    }

    $html = seo_armar_html($index, $datos);
    if ($html === null) {
        seo_fallback();
    }

    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    http_response_code($datos['estado']);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache');
    if (!seo_es_head()) {
        echo $html;
    }
    exit;
}

ob_start();
try {
    $resultado = seo_principal();
    if ($resultado === false) {
        // Solo con el servidor embebido: que sirva el archivo estatico pedido.
        ob_end_clean();
        return false;
    }
} catch (Throwable $e) {
    seo_fallback();
}
