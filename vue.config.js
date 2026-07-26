let webpack = require('webpack')
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