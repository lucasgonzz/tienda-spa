/*
 * Configuración de la tienda en tiempo de ejecución: define window.__CC_CONFIG__ (misión
 * versiones-tienda, 1/10/2026). La lee src/runtime_config.js (función env) y public/seo.php.
 *
 * ESTE ES EL DEFAULT VACÍO que viaja en el repo y en el bundle de cada versión. En producción
 * admin-api lo PISA al desplegar una versión de ecommerce en un cliente (instalación o
 * actualización) con los valores de esa tienda, todos strings:
 *
 *   window.__CC_CONFIG__ = {"VUE_APP_API_URL":"https://api.<dominio>","VUE_APP_COMMERCE_ID":"123",...};
 *
 * Claves: VUE_APP_API_URL, VUE_APP_COMMERCE_ID, VUE_APP_APP_URL, VUE_APP_SITE_NAME,
 * VUE_APP_SITE_DESCRIPTION, VUE_APP_SITE_IMAGE, VUE_APP_SITE_URL, VUE_APP_PUSHER_KEY,
 * VUE_APP_PUSHER_CLUSTER, VUE_APP_GOOGLE_MAPS_API_KEY, VUE_APP_FIREBASE_API_KEY.
 *
 * Vacío, cada env('VUE_APP_X') cae a process.env, o sea al .env con el que se compiló: así anda
 * `npm run serve` en desarrollo y así anda una tienda compilada por la vía vieja (con .env, en
 * el VPS de builds), sin ningún error en la consola.
 *
 * Lo carga public/index.html síncrono y ANTES que cualquier otro script, porque los stores leen
 * la URL de la API al importarse. No entra al precache del service worker (vue.config.js) y el
 * .htaccess lo sirve con Cache-Control: no-cache: un config viejo cacheado dejaría la tienda
 * apuntando a otra API o a otro comercio.
 */
window.__CC_CONFIG__ = window.__CC_CONFIG__ || {};
