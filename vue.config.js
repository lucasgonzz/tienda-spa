let webpack = require('webpack')

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

            return copyArgs
        })

        // Titulo y metadatos de la pagina, resueltos en tiempo de build. admin-api escribe estas
        // variables en el .env del clone antes de compilar (EcommerceInstallationService), una vez
        // por cliente. Los fallbacks existen para que el build local y cualquier build sin esas
        // variables sigan funcionando: nunca deben producirse ni un crash ni un "undefined" en el
        // HTML. Los cuatro valores se escapan con escapeHtmlAttribute antes de inyectarse porque
        // html-webpack-plugin interpola sin escapar (ver comentario del helper mas arriba).
        config.plugin('html').tap(args => {
            // Nombre del comercio: variable local (no propiedad "name:") para no matchear el sed
            // que admin-api corre sobre este archivo para patchear el bloque "pwa" (ver seccion
            // "Que NO tocar" del prompt 270-03).
            const siteName = process.env.VUE_APP_SITE_NAME || 'Tienda'

            args[0].title           = escapeHtmlAttribute(siteName)
            args[0].siteName        = escapeHtmlAttribute(siteName)
            args[0].siteDescription = escapeHtmlAttribute(process.env.VUE_APP_SITE_DESCRIPTION || '')
            args[0].siteImage       = escapeHtmlAttribute(process.env.VUE_APP_SITE_IMAGE || '')
            args[0].siteUrl         = escapeHtmlAttribute(process.env.VUE_APP_SITE_URL || '')

            return args
        })
    },
    devServer: {
        host: 'tienda.local',
        port: '8081'
    },
    pwa: {
        workboxOptions: {
            skipWaiting: true
        },

        // Estos valores son un fallback: en produccion admin-api los reescribe por cliente antes
        // de compilar, en EcommerceInstallationService::patch_spa_vue_config() (grupo 208).
        themeColor: "#c5111d",
        name: "Tienda",

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