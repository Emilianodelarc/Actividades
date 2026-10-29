# Actividades — consignas + editor de código (ES / EN / PT)

Cada clase de un curso tiene dos piezas, en tres idiomas (español neutro, inglés y portugués de Brasil):

- **Consigna** (`consigna.html`): las instrucciones, con la plantilla `consigna-schools`.
- **Actividad** (`index.html`): un editor de código HTML / CSS / JS con vista previa en vivo, consola y **verificación automática** de lo que pide la consigna. Se inserta por iframe.

Vista previa de todo el catálogo: `index.html` en la raíz.

## Estructura

```
assets/editor.js, editor.css          motor de las actividades (compartido)
tools/generar.py                      genera las páginas a partir de las fuentes
catalogo.js                           índice de cursos (generado)
cursos/<curso>/curso.json             título y descripción del curso (es/en/pt)
cursos/<curso>/NN-<actividad>/
    fuente/                           ← lo que se edita
        actividad.json                título, archivos, verificaciones, heredarDe
        consigna.es.html / .en / .pt  contenido del <article> de la consigna
        inicial.es.html / .css / .js  código inicial (opcional, por idioma o común: inicial.html)
    es/ en/ pt/                       ← generado: consigna.html + index.html
```

## Crear una actividad nueva

1. Crear `cursos/<curso>/NN-nombre/fuente/` con `actividad.json` y las tres consignas.
2. Ejecutar `python3 tools/generar.py` (avisa si falta alguna traducción).
3. Commit y push. Vercel publica solo.

### `actividad.json`

```json
{
  "titulo": { "es": "...", "en": "...", "pt": "..." },
  "archivos": ["html", "css", "js"],
  "heredarDe": "01-actividad-anterior",
  "verificaciones": [
    { "tipo": "existe", "selector": "body > header", "mensaje": { "es": "...", "en": "...", "pt": "..." } }
  ]
}
```

| Tipo | Campos | Qué comprueba |
|---|---|---|
| `existe` | `selector` | El elemento existe en la vista previa |
| `cantidad` | `selector`, `igual` o `minimo`/`maximo` | Cantidad de elementos |
| `texto` | `selector`, `valor` o `contiene` (pueden ser `{es,en,pt}`) | Texto del elemento (ignora espacios y mayúsculas) |
| `atributo` | `selector`, `atributo`, `valor`/`contiene` opcional | Atributo presente o con un valor |
| `estilo` | `selector`, `propiedad`, `valor` | Estilo calculado (acepta `#hex`, nombres, `px`) |
| `codigo` | `archivo`, `regex`, `flags` | El código escrito cumple una expresión regular |
| `consola` | `contiene` | Algo se mostró con `console.log` |
| `funcion` | `cuerpo` | JS propio que recibe `(doc, win, codigo, consola)` y devuelve true/false |

## Insertar en la plataforma

```html
<!-- Actividad -->
<iframe src="https://actividades-tau.vercel.app/cursos/desarrollo-web/02-mi-primer-header/es/index.html"
        width="100%" height="760" style="border:0;" title="Actividad"></iframe>
```

La consigna se puede insertar igual (`consigna.html`) o copiar el bloque `<div>…</div>` en la plataforma.

Al verificar, la actividad envía al sitio contenedor:

```js
window.addEventListener("message", e => {
  if (e.data?.tipo === "actividad-resultado") {
    // { id, lang, correctas, total, completa }
  }
});
```

El código del alumno se guarda en su navegador; el botón **Traer código de la actividad anterior** recupera lo que hizo en la actividad indicada en `heredarDe`.

## Reglas de las consignas

| Elemento | Uso |
|---|---|
| `<h2>` | Título. `<i>` para resaltar. |
| `<p class="contexto-consigna">` | Introducción o contexto. |
| `<p class="copy-warning">` | Copiar código de la actividad anterior. |
| `<h3>` | Dónde trabajar ("En tu HTML:", "Coloca estilos en tu CSS:", "En el archivo JS:"). |
| `<ul>` / `<li>` | Pasos; listas anidadas para subpasos. |
| `<input class="texto-copiable" size="N" value="..." disabled>` | Texto corto para copiar. |
| `<p class="texto-copiable">` | Texto largo para copiar. |
| Bloque de código | Copiado del editor de PG. |
| `<b>` | Todo lo que se resalta. Etiquetas: `<b><i>&lt;h1&gt;&lt;/h1&gt;</i></b>`. |

Traducción: español neutro con tuteo; inglés en imperativo; portugués de Brasil con "você". El código, las etiquetas y las clases no se traducen.
