# Actividades (iframe) — ES / EN / PT

Repositorio de consignas para cargar por **iframe**. Cada actividad tiene tres versiones: español neutro (`es`), inglés (`en`) y portugués (`pt`).

## Estructura

```
actividades/
├── index.html                  # Vista previa con selector de idioma
├── _plantilla/index.html       # Plantilla base para nuevas actividades
└── 01-mi-primer-header/
    ├── es/index.html
    ├── en/index.html
    └── pt/index.html
```

Convención de nombres: `NN-nombre-en-kebab-case/{es,en,pt}/index.html`.

## Cómo insertar una actividad

```html
<iframe src="https://TU-DOMINIO/actividades/01-mi-primer-header/es/index.html"
        width="100%" height="640" style="border:0;" title="Actividad 01"></iframe>
```

Cambiá `es` por `en` o `pt` para el otro idioma. Se puede publicar gratis con GitHub Pages (Settings → Pages → rama `main`).

## Reglas de las consignas

| Elemento | Uso |
|---|---|
| `<div>` + `<style>` + `<article id="consigna-schools">` | Contenedor obligatorio; todo va dentro del `article`. |
| `<h2>` | Título. `<i>` para resaltar una palabra. |
| `<p class="contexto-consigna">` | Introducción o contexto. |
| `<p class="copy-warning">` | Aviso cuando hay que copiar código de una actividad anterior. |
| `<h3>` | Dónde trabajar ("En tu HTML:", "Coloca estilos en tu CSS:", "En el archivo JS:"). Variar el texto. |
| `<ul>` / `<li>` | Pasos. Listas anidadas para subpasos. |
| `<input class="texto-copiable" size="N" value="..." disabled>` | Textos cortos para copiar. |
| `<p class="texto-copiable">` | Textos largos para copiar. |
| Bloque de código | Copiado del editor de PG y pegado en la consigna. |
| `<b>` | Todo lo que se quiera resaltar. Etiquetas: `<b><i>&lt;h1&gt;&lt;/h1&gt;</i></b>`. |

## Traducciones

- **Español neutro:** tuteo (copia, coloca), sin voseo ni regionalismos.
- **Inglés:** imperativo directo (copy, add, paste).
- **Português (BR):** "você", imperativo (copie, coloque).
- Los nombres de etiquetas, propiedades CSS y código **no se traducen**. Los textos para copiar sí, salvo que sean código.
