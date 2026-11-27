<?php
/**
 * Runner de tests para public/seo.php (mision og-imagen-android).
 *
 * Lee de stdin un JSON con la forma {"modo": "armar"|"validar", ...} y escribe el resultado en stdout:
 *  - modo "armar" (por defecto): {"index": "<html>", "datos": {...nueve claves...}} -> imprime el HTML
 *    que arma seo_armar_html() (o "NULL" si devuelve null).
 *  - modo "validar": {"json": "<texto json de la API>"} -> imprime el JSON del array que devuelve
 *    seo_validar_pagina() (o "NULL").
 *
 * Define SEO_SIN_EJECUTAR antes de incluir seo.php para que las funciones se carguen sin correr
 * seo_principal() (que serviria la pagina y haria exit). Sin sintaxis nueva: corre en PHP 8.1 del host.
 */

// Impide que seo.php ejecute su flujo principal al incluirse.
define('SEO_SIN_EJECUTAR', true);

require __DIR__ . '/../../public/seo.php';

// Entrada completa por stdin.
$entrada = json_decode((string) stream_get_contents(STDIN), true);
if (!is_array($entrada)) {
    fwrite(STDERR, "entrada invalida\n");
    exit(2);
}

$modo = isset($entrada['modo']) ? $entrada['modo'] : 'armar';

if ($modo === 'validar') {
    $resultado = seo_validar_pagina($entrada['json']);
    echo $resultado === null ? 'NULL' : json_encode($resultado);
    exit(0);
}

$html = seo_armar_html($entrada['index'], $entrada['datos']);
echo $html === null ? 'NULL' : $html;
