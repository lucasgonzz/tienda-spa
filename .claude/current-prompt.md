# Prompt 357 — Advises: fix del flujo de notificación (orden, transición 0→stock, aislamiento de fallos)

## Contexto

Auditoría del flujo "Avisarme cuando esté disponible" (13/7/2026). Tres bugs reales en
`empresa-api`, todos en el camino que manda el mail cuando entra stock.

### Bug 1 — `StockMovementController` chequea los avisos con el stock desactualizado

`@empresa-api/app/Http/Controllers/Stock/StockMovementController.php`, método `setArticleStock()`
(línea ~368):

```php
$this->checkGlobalStock();                                        // línea 376

ArticleHelper::checkAdvises($this->article);                      // línea 378  ← ANTES

ArticleHelper::setArticleStockFromAddresses($this->article, false); // línea 380  ← DESPUÉS
```

`checkGlobalStock()` **solo** actualiza `$article->stock` para artículos **sin depósitos y sin
variantes** (mirá su propio `if`). Para los artículos que sí usan depósitos o variantes, el stock
real recién se calcula en `setArticleStockFromAddresses()` — o sea, en la línea 378
`$this->article->stock` **todavía tiene el valor viejo (0)** y el mail nunca se manda.

El otro punto de entrada, `@empresa-api/app/Http/Controllers/Stock/SetArticleStock/SetArticleStock.php`,
tiene el orden **correcto** (`setArticleStockFromAddresses` y después `checkAdvises`). O sea que hoy
los dos caminos se comportan distinto. Hay que unificarlos.

### Bug 2 — Un email roto rompe la operación de stock del ERP

`QUEUE_CONNECTION` es `sync` por default (`config/queue.php` y `.env.example`), así que
`ProcessSendAdviseMail` **no se encola: corre dentro del request** que setea el stock. Hoy:

```php
// ArticleHelper::checkAdvises
foreach ($advises as $advise) {
    ProcessSendAdviseMail::dispatch($advise, $article);   // sin try/catch
}

// ProcessSendAdviseMail::handle
Mail::to($this->advise->email)->send(new AdviseMail($this->article));  // sin try/catch
$this->advise->delete();
```

Si un `advise` tiene email vacío o inválido, `Mail::to('')` tira excepción → sube por
`checkAdvises()` → `setArticleStock()` → **falla el ingreso de stock del ERP**. Y como la excepción
corta el `foreach`, los suscriptores válidos que venían después tampoco reciben nada.

### Bug 3 — El borrado del aviso está desacoplado del envío real

`@empresa-api/app/Mail/Advise.php` tiene el gate `if (env('SEND_MAILS', false))` **adentro de
`build()`**: si está en false, `build()` no devuelve nada, el `send()` no manda un carajo... y el
Job igual hace `$this->advise->delete()`. Resultado: **el aviso se borra sin haber notificado
nunca**, en silencio. El cliente de la tienda queda sin mail y sin suscripción.

## Ramas

- empresa-api: develop

## Archivos

@empresa-api/app/Http/Controllers/Helpers/ArticleHelper.php — método `checkAdvises()` (línea ~670).
@empresa-api/app/Http/Controllers/Stock/StockMovementController.php — método `setArticleStock()` (línea ~368).
@empresa-api/app/Http/Controllers/Stock/SetArticleStock/SetArticleStock.php — método `set_article_stock()`.
@empresa-api/app/Jobs/ProcessSendAdviseMail.php
@empresa-api/app/Mail/Advise.php
@empresa-api/resources/views/emails/articles/advise.blade.php — solo lectura, para confirmar qué
variables espera (`$article`, `$user`, `$article_url`, `$logo_url`).
@empresa-api/config/app.php — solo lectura, para la tarea 5.

## Tareas

### 1. `ArticleHelper::checkAdvises()` — reescribir

Nueva firma: `static function checkAdvises($article, $stock_anterior = null)`.

Comportamiento:

- **Todo el cuerpo va envuelto en un try/catch general** que loguea el error y **no lo re-lanza**.
  Regla de oro de este prompt: **notificar avisos NUNCA puede romper una operación de stock**. Un
  fallo mandando mails es un problema de mails, no de stock.
- Si `$article` es null o no tiene `id` → return.
- Calcular `$stock_actual = is_null($article->stock) ? 0 : (float) $article->stock;`
- Si `$stock_actual < 1` → return (no hay stock, no hay nada que avisar).
- **Disparar solo en la transición sin-stock → con-stock:** si `$stock_anterior` no es null y
  `(float) $stock_anterior >= 1` → return. El artículo ya tenía stock antes de este movimiento, así
  que este movimiento no es un "ingreso de stock" para el que estaba esperando. Sin esto, una
  **venta** que deja el stock en 3 también dispara el mail "ingresó nuevo stock", que es
  semánticamente falso.
  Si `$stock_anterior` viene null (llamadas viejas), mantener el comportamiento actual (dispara con
  `stock >= 1`) para no romper ningún call site que no se actualice.
- Traer los advises del artículo. Si no hay ninguno → return.
- Recorrerlos con un **try/catch adentro del `foreach`**, de modo que un advise roto no corte a los
  demás:
  - Normalizar: `$email = trim((string) $advise->email);`
  - Si el email está vacío o `filter_var($email, FILTER_VALIDATE_EMAIL)` da false → loguear como
    warning, **borrar la fila** (`$advise->delete()`) y `continue`. Son las filas basura que dejó el
    endpoint sin validar (ver prompts 354/355).
  - Si `env('SEND_MAILS', false)` es false → loguear info y `continue` **SIN borrar la fila** (el
    aviso queda pendiente para cuando los mails estén habilitados). Este es el gate que hoy vive mal
    adentro de `Mail\Advise::build()` (ver tarea 4).
  - Si está todo bien → `ProcessSendAdviseMail::dispatch($advise, $article);`

### 2. `StockMovementController::setArticleStock()` — arreglar el orden y pasar el stock anterior

- **Antes** de `$this->checkFromAddress()`, capturar el stock previo:
  `$stock_anterior = is_null($this->article->stock) ? 0 : (float) $this->article->stock;`
- **Mover** la llamada `ArticleHelper::checkAdvises(...)` para que quede **DESPUÉS** de
  `ArticleHelper::setArticleStockFromAddresses($this->article, false);` (hoy está antes).
- Pasarle el stock anterior: `ArticleHelper::checkAdvises($this->article, $stock_anterior);`

### 3. `SetArticleStock::set_article_stock()` — pasar el stock anterior

Este archivo **ya tiene el orden correcto** (no mover nada). Solo:
- Capturar `$stock_anterior` al principio, antes de `CheckFromAddress::check_from_address(...)`,
  igual que arriba.
- Pasarlo: `ArticleHelper::checkAdvises($article, $stock_anterior);`

### 4. `Mail\Advise` — sacar el gate de `build()` y manejar el usuario nulo

- **Sacar** el `if (env('SEND_MAILS', false))` de `build()`. Ese gate ahora vive en `checkAdvises()`
  y en el Job (tareas 1 y 5). `build()` tiene que **siempre** devolver el mailable armado — un
  `build()` que no devuelve nada es lo que hoy permite que se borre el aviso sin mandar el mail.
- Declarar la propiedad `public $article;` explícitamente en la clase (hoy se asigna
  `$this->article` sin declararla — funciona por propiedades dinámicas, pero eso está deprecado y
  además el checker lo va a marcar).
- Si `UserHelper::getFullModel()` devuelve **null** (puede pasar: sin sesión de auth cae a
  `config('app.USER_ID')`, que puede no estar seteado), **lanzar una excepción** con un mensaje
  claro. El Job la captura (tarea 5) y **no borra el aviso**, así que se reintenta en el próximo
  ingreso de stock. Hoy, con `$user` null, el blade explota en `$user->online`.

### 5. `ProcessSendAdviseMail` — no romper nunca el request y borrar solo si el mail salió

Reescribir `handle()`:

- Declarar `public $tries = 3;` y agregar un método `failed(\Exception $e)` que loguee el fallo
  definitivo (no borra el aviso).
- El cuerpo de `handle()` va **entero dentro de un try/catch**:
  - Revalidar el email (`trim` + `filter_var`). Si es inválido → borrar la fila, loguear warning,
    return. (Cinturón y tiradores: `checkAdvises` ya filtró, pero el Job puede ser despachado desde
    otro lado.)
  - Si `env('SEND_MAILS', false)` es false → loguear y return **sin borrar**.
  - `Mail::to($email)->send(new AdviseMail($this->article));`
  - **Recién si el `send()` no tiró excepción**, hacer `$this->advise->delete();` y loguear el envío.
  - En el `catch`: loguear el error con el id del advise y el email, y **NO borrar la fila** — que
    quede pendiente para el próximo ingreso de stock. **No re-lanzar la excepción**: con
    `QUEUE_CONNECTION=sync` re-lanzarla rompería la operación de stock del ERP, que es exactamente
    el bug que este prompt viene a matar.

### 6. `article_url` en `Mail\Advise` — verificar la clave de config

`build()` hoy hace `if (config('app.APP_ENV') == 'production')` para decidir si arma el link al
artículo. **Verificar si la clave `APP_ENV` existe realmente en `@empresa-api/config/app.php`.**
Si NO existe (Laravel por defecto expone el entorno en `config('app.env')`, no en
`config('app.APP_ENV')`), esa condición es siempre falsa y **el botón "Ver artículo" nunca se
muestra en el mail**. En ese caso, reemplazarla por `config('app.env') == 'production'` (o
`app()->environment('production')`). Si la clave sí existe, dejarlo como está.

### 7. No tocar

- La línea `// ArticleHelper::checkAdvises($model);` comentada en `ArticleController` (~línea 434):
  dejarla comentada. Los avisos tienen que dispararse por **movimiento de stock**, no por editar un
  artículo.
- La lógica de `checkGlobalStock()`, `setArticleStockFromAddresses()`, `CheckCartAmount` ni ningún
  otro cálculo de stock. Este prompt **no cambia cómo se calcula el stock**: solo cambia **cuándo**
  se leen los avisos y cómo se aíslan sus fallos.
- La configuración SMTP — es el prompt 358.

## Constraint PHP 7.4 — obligatorio, releer antes de entregar

El servidor de producción corre **PHP 7.4**, sin excepción y sin importar la rama.
Están estrictamente prohibidos:
- Operador nullsafe `?->` → usar ternario: `($obj ? $obj->prop : null)`
- `match` expression → usar `switch` o array lookup
- `str_contains()` → usar `strpos($h, $n) !== false`
- `str_starts_with()` → usar `strncmp($h, $n, strlen($n)) === 0`
- `str_ends_with()` → usar `substr($h, -strlen($n)) === $n`
- Named arguments (`func(name: val)`) → usar argumentos posicionales
- Union types en firmas (`int|string`) → usar PHPDoc
- Constructor property promotion → declarar propiedades explícitamente
- `readonly`, `enum`, `Fiber`, `never`/`mixed`/`static` como tipo, non-capturing catch,
  `throw` como expresión → no disponibles en PHP 7

Ante la duda: si una sintaxis no existía antes de PHP 8.0, no usarla.
Antes de entregar, releer el código generado buscando específicamente esos patrones en los
5 archivos tocados. `filter_var`, `FILTER_VALIDATE_EMAIL` y `public $tries` son 100% PHP 7.4.

## Verificación esperada

Al terminar, confirmar explícitamente estos 4 puntos:

1. `checkAdvises` no puede lanzar ninguna excepción hacia arriba (try/catch general).
2. `ProcessSendAdviseMail::handle()` no puede lanzar ninguna excepción hacia arriba.
3. El `$advise->delete()` ocurre **solo** después de un `Mail::send()` exitoso (o cuando el email es
   inválido, que es un descarte deliberado).
4. En `StockMovementController`, `checkAdvises` quedó **después** de `setArticleStockFromAddresses`.

## Checker sugerido

opus

## Modelo sugerido

Claude Sonnet — toca el camino de stock (crítico en producción, con historial de bugs caros),
5 archivos interconectados, y cambia una firma de método usada desde dos call sites distintos.

Cuando termines, pushea empresa.

## Ejecución sugerida

cursor

