let webpack = require('webpack')

/**
 * Build de RELEASE (misión versiones-tienda, 1/10/2026): lo prende GitHub Actions
 * (.github/workflows/release.yml) para compilar el bundle UNO por versión, el mismo para todos los
 * clientes. En ese modo, lo que hasta acá se cocinaba por cliente en el HTML y en el manifest
 * (nombre, descripción, URL, imagen y color del comercio) sale con tokens literales `__CC_*__` que
 * admin-api reemplaza al desplegar la versión en cada tienda. El resto de los valores por cliente
 * (URL de la API, id del comercio, Pusher...) los lee la tienda en runtime de config.js (ver
 * src/runtime_config.js).
 *
 * Sin la variable (desarrollo, y la vía vieja que compila por cliente en el VPS de builds con un
 * .env) este archivo se comporta EXACTAMENTE como antes.
 *
 * NO se llama VUE_APP_* a propósito: vue-cli mete en el bundle toda variable VUE_APP_*, y esta solo
 * le sirve a este archivo al compilar.
 *
 * Contrato con admin-api (los tokens y dónde aparecen):
 *   __CC_SITE_NAME__        title, og:site_name, og:title, twitter:title, noscript,
 *                           apple-mobile-web-app-title y manifest.json (name, short_name)
 *   __CC_SITE_DESCRIPTION__ description, og:description, twitter:description
 *   __CC_SITE_URL__         og:url
 *   __CC_SITE_IMAGE__       og:image, twitter:image
 *   __CC_THEME_COLOR__      meta theme-color, color del mask-icon y manifest.json (theme_color)
 * No cambiarles el texto sin cambiar también el admin: si queda alguno sin reemplazar, el admin
 * frena el despliegue.
 * @type {boolean}
 */
const releaseBuild = process.env.TIENDA_RELEASE_BUILD === '1'

/**
 * Escapa un valor para que sea seguro dentro de un atributo HTML del template de index.html.
 * html-webpack-plugin usa templates de lodash, donde `<%= %>` interpola crudo (sin escapar),
 * asi que un nombre de comercio con comillas, `<`, `>` o `&` podria romper el HTML o cortar
 * un atributo `content="..."` si no se sanitiza antes de inyectarlo.
 * @param {*} value Valor a escapar (titulo, descripcion, url o imagen del comercio).
 * @returns {string} Valor convertido a string con los caracteres especiales de HTML escapados.
 */
function escapeHtmlAttribute(value) {
    return String(value === null || value === undefined ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

/**
 * Escapa un valor para meterlo dentro de un string PHP entre comillas simples (public/seo.php).
 * Adentro de '...' PHP solo interpreta la barra invertida y la comilla simple.
 * @param {*} value URL de la API o id del comercio.
 * @returns {string}
 */
function escapePhpSingleQuoted(value) {
    return String(value === null || value === undefined ? '' : value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
}

module.exports = {
    lintOnSave: false,
    // configureWebpack: {
    //     plugins: [
    //         new webpack.ProvidePlugin({
    //             // other modules
    //             introJs: ['intro.js']
    //         })
    //     ]
    // },
    chainWebpack: config => {
        config.module
        .rule('vue')
        .use('vue-loader')
        .loader('vue-loader')
        .tap(options => {
            options.transformAssetUrls = {
                img: 'src',
                image: 'xlink:href',
                'b-avatar': 'src',
                'b-img': 'src',
                'b-img-lazy': ['src', 'blank-src'],
                'b-card': 'img-src',
                'b-card-img': 'src',
                'b-card-img-lazy': ['src', 'blank-src'],
                'b-carousel-slide': 'img-src',
                'b-embed': 'src'
            }
            return options
        })

        // Repositorio publico (grupo 220): public/firebase-messaging-sw.js es un service
        // worker estatico, no pasa por el bundle de Vue ni por html-webpack-plugin (como si
        // le pasa a index.html, que ya soporta interpolar VUE_APP_* directamente). Para
        // poder sacar la apiKey de Firebase del codigo fuente igual, se lo excluye del
        // copiado generico de /public que hace Vue CLI y se lo vuelve a copiar aparte con
        // un transform que reemplaza el placeholder __VUE_APP_FIREBASE_API_KEY__ por el
        // valor real tomado de la variable de entorno del build.
        config.plugin('copy').tap(copyArgs => {
            copyArgs[0][0].ignore = (copyArgs[0][0].ignore || []).concat({
                glob: 'firebase-messaging-sw.js',
                matchBase: false
            })

            copyArgs[0].push({
                from: 'public/firebase-messaging-sw.js',
                to: 'firebase-messaging-sw.js',
                transform(content) {
                    return content.toString()
                        .replace(/__VUE_APP_FIREBASE_API_KEY__/g, process.env.VUE_APP_FIREBASE_API_KEY || '')
                }
            })

            // Capa SEO (mision seo-tiendas, 23/9/2026): public/seo.php es PHP que corre en el
            // docroot de la tienda y le pide a tienda-api el head y el cuerpo de cada pagina.
            // Mismo mecanismo que el service worker de arriba: se excluye del copiado generico y
            // se copia aparte reemplazando la URL de la API y el id del comercio del build. Los
            // valores quedan dentro de un string PHP entre comillas simples, por eso se escapan.
            copyArgs[0][0].ignore = copyArgs[0][0].ignore.concat({
                glob: 'seo.php',
                matchBase: false
            })

            copyArgs[0].push({
                from: 'public/seo.php',
                to: 'seo.php',
                transform(content) {
                    return content.toString()
                        .replace(/__VUE_APP_API_URL__/g, () => escapePhpSingleQuoted(process.env.VUE_APP_API_URL || ''))
                        .replace(/__VUE_APP_COMMERCE_ID__/g, () => escapePhpSingleQuoted(process.env.VUE_APP_COMMERCE_ID || ''))
                }
            })

            return copyArgs
        })

        // Titulo y metadatos de la pagina, resueltos en tiempo de build. admin-api escribe estas
        // variables en el .env del clone antes de compilar (EcommerceInstallationService), una vez
        // por cliente. Los fallbacks existen para que el build local y cualquier build sin esas
        // variables sigan funcionando: nunca deben producirse ni un crash ni un "undefined" en el
        // HTML. Los cuatro valores se escapan con escapeHtmlAttribute antes de inyectarse porque
        // html-webpack-plugin interpola sin escapar (ver comentario del helper mas arriba).
        config.plugin('html').tap(args => {
            if (releaseBuild) {
                // Build de release: tokens literales que admin-api reemplaza por los valores de
                // cada tienda al desplegar (ver releaseBuild arriba). El default de la descripción
                // ("<nombre> - Tienda online...") también lo resuelve el admin en ese momento.
                // escapeHtmlAttribute no les cambia nada (no tienen caracteres especiales); se
                // pasa igual para que los dos caminos inyecten exactamente lo mismo.
                args[0].title           = escapeHtmlAttribute('__CC_SITE_NAME__')
                args[0].siteName        = escapeHtmlAttribute('__CC_SITE_NAME__')
                args[0].siteDescription = escapeHtmlAttribute('__CC_SITE_DESCRIPTION__')
                args[0].siteImage       = escapeHtmlAttribute('__CC_SITE_IMAGE__')
                args[0].siteUrl         = escapeHtmlAttribute('__CC_SITE_URL__')
            } else {
                // Nombre del comercio: variable local (no propiedad "name:") para no matchear el sed
                // que admin-api corre sobre este archivo para patchear el bloque "pwa" (ver seccion
                // "Que NO tocar" del prompt 270-03).
                const siteName = process.env.VUE_APP_SITE_NAME || 'Tienda'

                // Descripcion por defecto si el comercio no cargo meta_description en el admin: hasta
                // el 23/9/2026 salia content="" y Google armaba el snippet con el <noscript>.
                const siteDescription = process.env.VUE_APP_SITE_DESCRIPTION
                    || (siteName + ' - Tienda online. Comprá online con envío o retiro en el local.')

                args[0].title           = escapeHtmlAttribute(siteName)
                args[0].siteName        = escapeHtmlAttribute(siteName)
                args[0].siteDescription = escapeHtmlAttribute(siteDescription)
                args[0].siteImage       = escapeHtmlAttribute(process.env.VUE_APP_SITE_IMAGE || '')
                args[0].siteUrl         = escapeHtmlAttribute(process.env.VUE_APP_SITE_URL || '')
            }

            // Los marcadores <!--seo:head--> / <!--/seo:head--> de public/index.html tienen que
            // llegar al dist: public/seo.php reemplaza lo que hay entre los dos. En produccion
            // Vue CLI minifica con removeComments y se los comeria; ignoreCustomComments los
            // preserva. Se agrega a las opciones que ya arma @vue/cli-service (no se reemplazan)
            // y se conserva el /^!/ que html-minifier trae por defecto. En `serve` no hay
            // minificacion (minify no es un objeto) y no se toca nada.
            if (args[0].minify && typeof args[0].minify === 'object') {
                args[0].minify = Object.assign({}, args[0].minify, {
                    ignoreCustomComments: [/^!/, /^\/?seo:/],
                })

                // Build de release: los atributos conservan sus comillas. Vue CLI minifica con
                // removeAttributeQuotes, y como un token (__CC_SITE_NAME__) no tiene espacios, el
                // minificador lo dejaba como content=__CC_SITE_NAME__, sin comillas. Cuando el admin
                // lo reemplaza por "Mi Tienda", el atributo se corta en el espacio (content=Mi y un
                // atributo suelto Tienda) y la vista previa al compartir sale rota. Con comillas, el
                // reemplazo (escapado con htmlspecialchars ENT_QUOTES) siempre cae adentro de "...".
                // Fuera del release no se toca: ahí el valor real ya está al minificar y el
                // minificador deja las comillas cuando hacen falta.
                if (releaseBuild) {
                    args[0].minify.removeAttributeQuotes = false
                }
            }

            return args
        })
    },
    devServer: {
        host: 'tienda.local',
        port: '8081'
    },
    pwa: {
        workboxOptions: {
            skipWaiting: true,

            // El service worker nuevo toma el control de la pestaña que ya estaba abierta sin
            // recargarla. Con skipWaiting solo, esa pestaña quedaba sin service worker hasta recargar
            // (misión quitar-animacion-de-actualizacion, 16/10/2026).
            clientsClaim: true,

            // Los cuatro primeros son los que excluye @vue/cli-plugin-pwa por defecto (este array
            // los reemplaza, no se suma). seo.php y .htaccess son archivos de servidor: si entran al
            // precache, el service worker baja /seo.php al instalarse y lo guarda como si fuera un
            // asset (misión seo-tiendas).
            //
            // config.js (window.__CC_CONFIG__) lo escribe admin-api por tienda en cada despliegue: no
            // se precachea, para que el service worker nunca sirva la configuración de antes (otra
            // API, otro comercio) ni el default vacío que viene en el bundle (misión versiones-tienda).
            //
            // 🔴 NO sacar /index.html ni /manifest.json del precache (y no tocar este exclude para
            // eso): EcommerceDistCustomizer de admin-api falla cerrado si el precache no los trae con
            // `revision`, porque recalcula esa revision al personalizar cada tienda. Para que el
            // index.html deje de servirse caché-primero se usa directoryIndex (abajo), no el exclude.
            exclude: [/\.map$/, /img\/icons\//, /favicon\.ico$/, /^manifest.*\.js?$/, /seo\.php$/, /\.htaccess$/, /config\.js$/],

            // Por defecto Workbox atiende "/" desde el precache buscándolo como "/index.html" (ese es
            // el directoryIndex de precacheAndRoute), o sea caché primero: al entrar se mostraba la
            // versión ANTERIOR de la tienda y recién después, cuando el service worker bajaba la nueva,
            // aparecía la barra de "Descargando actualización" y se recargaba todo. Con un nombre de
            // directoryIndex que no existe, "/" deja de coincidir con una entrada del precache y la
            // navegación cae a la ruta de runtimeCaching de abajo (red primero). /index.html SIGUE
            // dentro del precache a propósito: es lo que exige el admin (ver el exclude) y además es
            // el respaldo (el único) para abrir la tienda sin conexión.
            directoryIndex: 'cc-sin-directory-index.html',

            // Las navegaciones (el documento HTML) van a la red primero, con el index.html del precache
            // como respaldo. Con internet, se entra directo a lo último: sin animación y sin recarga. La
            // actualización del resto de los archivos precacheados se hace en segundo plano y en
            // silencio. En la tienda esto importa más que en otros sitios: la navegación a "/" la
            // sirve public/seo.php (inyecta el SEO en el index.html), así que también tiene que
            // pedirse siempre a la red y no quedar fija en una copia vieja.
            //
            // 🔴 NO se guarda ninguna copia del HTML de cada visita (ni en cc-navegacion ni en otro lado):
            // el único respaldo es el /index.html del PRECACHE ACTIVO, que siempre es coherente con los
            // bundles (js/app.<hash>.js...) que ese mismo precache tiene guardados. Si se guardara el
            // HTML de cada visita online y el service worker nuevo no llegara a terminar de instalarse
            // (se corta la señal, se cierra el celular), quedaría el worker viejo con su precache viejo
            // y, sin conexión, el respaldo entregaría el HTML NUEVO, que pide un js/app.<hash nuevo>.js
            // que ese precache no tiene: pantalla en blanco. Además se estarían guardando URLs con
            // parámetros de un solo uso. Por eso cacheWillUpdate devuelve null y el respaldo (abajo)
            // sale siempre del precache. Quien "optimice" esto guardando copias vuelve al problema.
            //
            // ⚠️ Estas funciones se serializan con toString() DENTRO de service-worker.js (workbox-build
            // las copia como texto) y ese archivo NO pasa por babel: tienen que ser autocontenidas
            // (nada de este vue.config.js) y en ES5 (function y var; sin flechas, ?. ni async/await).
            // Ninguna línea de acá puede empezar con "name:" ni "themeColor:": el sed de admin-api
            // (patch_spa_vue_config, vía vieja) pisa esas líneas enteras; por eso es cacheName.
            //
            // ⚠️ Las funciones de `plugins` tienen DOS reglas más, propias de workbox-build 4.3.1, y
            // romperlas tira el build entero ("Unable to generate service worker from template"):
            //   1. Van NOMBRADAS (function requestWillFetch (args) {...}), no anónimas: workbox-build
            //      les saca los comentarios parseando el texto como un programa, y un
            //      "function (args) {...}" suelto no es un programa válido ("Unexpected token (1:9)").
            //   2. Cada sentencia termina en punto y coma: workbox-build junta el código de los plugins
            //      en UNA sola línea (oneLine), y sin ";" dos sentencias quedan pegadas y el service
            //      worker generado no compila (no hay salto de línea que active el ASI).
            // El urlPattern de abajo no pasa por ese camino: se copia tal cual, con sus saltos de línea.
            runtimeCaching: [{
                // Solo navegaciones del documento, de la propia app y sin extensión de archivo. Un pedido
                // de imagen, script o API no es una navegación y no entra acá. Un "/index.html" escrito
                // literal NO es una entrada normal (el start_url del manifest es "/"): lo atiende el
                // listener del precache, que se registra primero y responde caché-primero.
                urlPattern: function (args) {
                    if (!args.request || args.request.mode !== 'navigate') return false
                    var ruta = args.url.pathname
                    return !/\.[A-Za-z0-9]+$/.test(ruta)
                },
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'cc-navegacion',
                    // Si la red no contesta en 5 s se usa el index.html del precache (conexión mala o
                    // caída). Son 5 y no 3 a propósito: public/seo.php espera hasta 3 s a tienda-api para
                    // armar el SEO de la página. Con 3 s en el service worker los dos plazos coincidirían
                    // y, con la API lenta, se entregaría el index.html del precache (la versión vieja)
                    // aunque el servidor estuviera por contestar. Los 5 s le dejan margen.
                    networkTimeoutSeconds: 5,
                    plugins: [{
                        // Workbox IGNORA fetchOptions en las navegaciones (fetchWrapper de workbox-core),
                        // así que la revalidación contra el servidor se fuerza reescribiendo el pedido.
                        // Sin esto, un servidor que mande "Cache-Control: max-age" (o la caché heurística
                        // de LiteSpeed/nginx) entregaría un index.html viejo y volvería el problema.
                        requestWillFetch: function requestWillFetch (args) {
                            return new Request(args.request, { cache: 'no-cache' });
                        },
                        // Un 5xx del servidor (503 en un deploy, por ejemplo) no se le muestra a la persona:
                        // se trata como "sin red" y cae al index.html del precache.
                        fetchDidSucceed: function fetchDidSucceed (args) {
                            if (args.response && args.response.status >= 500) {
                                throw new Error('El servidor contestó ' + args.response.status);
                            }
                            return args.response;
                        },
                        // Nada se guarda en cc-navegacion: devolver null le dice a Workbox que la respuesta
                        // no es cacheable. Ver el 🔴 de arriba (coherencia con el precache activo).
                        cacheWillUpdate: function cacheWillUpdate () {
                            return null;
                        },
                        // Respaldo (sin red, 5xx o demora): SIEMPRE el /index.html del precache activo, que
                        // es coherente con los bundles que ese precache tiene guardados. No mira la caché
                        // de navegación (está vacía a propósito) ni la URL pedida: un link directo que
                        // nunca se visitó también abre la app, y el router de Vue resuelve la ruta.
                        cachedResponseWillBeUsed: function cachedResponseWillBeUsed () {
                            // `workbox` es una global que existe solo adentro de service-worker.js.
                            // eslint-disable-next-line no-undef
                            var clave = workbox.precaching.getCacheKeyForURL('/index.html');
                            return clave ? caches.match(clave) : null;
                        }
                    }]
                }
            }]
        },

        // Estos valores son un fallback: en la vía vieja admin-api los reescribe por cliente antes
        // de compilar, en EcommerceInstallationService::patch_spa_vue_config() (grupo 208), con un
        // sed que pisa la línea ENTERA que empieza con themeColor: / name: (y exige que haya una sola
        // línea name: en todo el archivo). Por eso cada uno sigue siendo UNA línea, con la condición
        // adentro. En el build de release (releaseBuild) salen los tokens que reemplaza el admin al
        // desplegar: van al manifest.json y a los meta theme-color / apple-mobile-web-app-title.
        themeColor: releaseBuild ? '__CC_THEME_COLOR__' : "#c5111d",
        name: releaseBuild ? '__CC_SITE_NAME__' : "Tienda",

        // Version de los iconos, para cache-busting. admin-api escribe VUE_APP_ICONS_VERSION en el
        // .env del clone (un timestamp nuevo en cada install y en cada update) antes de compilar, y
        // Vue CLI carga los .env ANTES de evaluar este archivo, asi que process.env ya la tiene.
        // El plugin la concatena como "?v=<valor>" a TODOS los <link> de icono que inyecta en el
        // <head>. Si la variable no estuviera definida queda '' y el plugin simplemente no agrega
        // el parametro: el build no se rompe.
        assetsVersion: process.env.VUE_APP_ICONS_VERSION || '',

        // Iconos que el plugin declara en el <head>. Se explicitan los cinco aunque cuatro
        // coincidan con el default del plugin, para que este bloque sea el UNICO lugar donde se
        // decide que iconos van al HTML (antes estaban declarados tambien a mano en
        // public/index.html y salian duplicados). El unico que cambia respecto del default es
        // appleTouchIcon: el plugin apunta por defecto a 152x152 y el set que genera
        // admin-api/deploy/tienda/generate_pwa_icons.js incluye el de 180x180, que es el que piden
        // los iOS actuales.
        iconPaths: {
            favicon32: 'img/icons/favicon-32x32.png',
            favicon16: 'img/icons/favicon-16x16.png',
            appleTouchIcon: 'img/icons/apple-touch-icon-180x180.png',
            maskIcon: 'img/icons/safari-pinned-tab.svg',
            msTileImage: 'img/icons/msapplication-icon-144x144.png',
        },

        backgroundColor: "#FFF",
        msTileColor: "#FFF",
        manifestOptions: {
          icons: [
            {
              src: "./img/icons/android-chrome-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "./img/icons/android-chrome-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "./img/icons/android-chrome-maskable-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "./img/icons/android-chrome-maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "./img/icons/apple-touch-icon-60x60.png",
              sizes: "60x60",
              type: "image/png",
            },
            {
              src: "./img/icons/apple-touch-icon-76x76.png",
              sizes: "76x76",
              type: "image/png",
            },
            {
              src: "./img/icons/apple-touch-icon-120x120.png",
              sizes: "120x120",
              type: "image/png",
            },
            {
              src: "./img/icons/apple-touch-icon-152x152.png",
              sizes: "152x152",
              type: "image/png",
            },
            {
              src: "./img/icons/apple-touch-icon-180x180.png",
              sizes: "180x180",
              type: "image/png",
            },
            {
              src: "./img/icons/apple-touch-icon.png",
              sizes: "180x180",
              type: "image/png",
            },
            {
              src: "./img/icons/favicon-16x16.png",
              sizes: "16x16",
              type: "image/png",
            },
            {
              src: "./img/icons/favicon-32x32.png",
              sizes: "32x32",
              type: "image/png",
            },
            {
              src: "./img/icons/msapplication-icon-144x144.png",
              sizes: "144x144",
              type: "image/png",
            },
            {
              src: "./img/icons/mstile-150x150.png",
              sizes: "150x150",
              type: "image/png",
            },
          ],
        },
    },
};