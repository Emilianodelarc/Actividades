#!/usr/bin/env python3
"""
Genera las páginas publicables de cada actividad a partir de su carpeta `fuente/`.

Uso:  python3 tools/generar.py            (desde la raíz del repo)

Por cada  cursos/<curso>/<actividad>/fuente/  genera:
    cursos/<curso>/<actividad>/{es,en,pt}/consigna.html   consigna con la plantilla consigna-schools
    cursos/<curso>/<actividad>/{es,en,pt}/index.html      actividad con editor de código (para iframe)
y actualiza  catalogo.js  (lo usa index.html de la raíz).
"""
import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
IDIOMAS = ["es", "en", "pt"]
HTML_LANG = {"es": "es", "en": "en", "pt": "pt-BR"}
EXT = {"html": "html", "css": "css", "js": "js"}
CM = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16"
FUENTES = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
           '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
           '  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">')

ESTILOS_CONSIGNA = """    <style>
        #consigna-schools p, #consigna-schools li {font-size:18px;}
        #consigna-schools h2{font-family: SourceSansPro, sans-serif; font-size: 24px; font-weight: bold;}
        #consigna-schools h3{font-family: SourceSansPro, sans-serif; font-size: 18px; font-weight: bold;}
        #consigna-schools p.copy-warning{font-style: italic; font-weight:bold;}
        #consigna-schools p.contexto-consigna{font-style: italic;}
        #consigna-schools .texto-copiable{padding:2px; background-color: #E0E0E0; border: 1px solid #D9D9D9; font-size: 15px; color: #222; font-style:italic;}
        #consigna-schools input.texto-copiable{text-align:center;}
    </style>"""

errores = []


def txt(campo, lang, donde):
    if isinstance(campo, dict):
        if lang not in campo:
            errores.append(f"{donde}: falta la traducción '{lang}'")
        return campo.get(lang) or campo.get("es", "")
    return campo or ""


def pagina_consigna(lang, titulo, cuerpo):
    cuerpo = "\n".join("      " + l if l.strip() else "" for l in cuerpo.strip("\n").splitlines())
    return f"""<!DOCTYPE html>
<html lang="{HTML_LANG[lang]}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{titulo}</title>
  {FUENTES}
  <style>
    body {{ margin: 0; padding: 16px; background: #FFFFFF; color: #222; font-family: SourceSansPro, "Source Sans 3", sans-serif; }}
  </style>
</head>
<body>
  <div>
{ESTILOS_CONSIGNA}
    <article id="consigna-schools">
{cuerpo}
    </article>
  </div>
</body>
</html>
"""


def pagina_actividad(lang, config):
    datos = json.dumps(config, ensure_ascii=False, indent=2).replace("</", "<\\/")
    return f"""<!DOCTYPE html>
<html lang="{HTML_LANG[lang]}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{config["titulo"]}</title>
  {FUENTES}
  <link rel="stylesheet" href="{CM}/codemirror.min.css">
  <link rel="stylesheet" href="../../../../assets/editor.css">
</head>
<body>
  <div class="act">
    <header class="act-top">
      <h1 id="act-titulo"></h1>
      <div class="act-acciones">
        <button class="btn" id="btn-inherit" type="button" hidden></button>
        <button class="btn" id="btn-reset" type="button"></button>
        <button class="btn" id="btn-run" type="button"></button>
        <button class="btn btn-primario" id="btn-check" type="button"></button>
      </div>
    </header>
    <div class="act-main">
      <section class="panel">
        <div class="tabs" id="tabs-editor"><span class="tab-info" id="tab-info"></span></div>
        <div class="editor-host" id="editor-host"></div>
      </section>
      <section class="panel">
        <div class="tabs" id="tabs-preview">
          <button class="tab activo" id="tab-preview" type="button"></button>
          <button class="tab" id="tab-console" type="button"></button>
        </div>
        <iframe class="preview-frame" id="preview" title="preview"></iframe>
        <pre class="consola oculto" id="consola"></pre>
      </section>
    </div>
    <section class="resultados" aria-live="polite">
      <h2 id="res-titulo"></h2>
      <p class="vacio" id="res-vacio"></p>
      <ul id="res-lista"></ul>
      <p class="resumen" id="res-resumen"></p>
    </section>
  </div>
  <script src="{CM}/codemirror.min.js"></script>
  <script src="{CM}/mode/xml/xml.min.js"></script>
  <script src="{CM}/mode/javascript/javascript.min.js"></script>
  <script src="{CM}/mode/css/css.min.js"></script>
  <script src="{CM}/mode/htmlmixed/htmlmixed.min.js"></script>
  <script src="{CM}/addon/fold/xml-fold.min.js"></script>
  <script src="{CM}/addon/edit/closetag.min.js"></script>
  <script src="{CM}/addon/edit/closebrackets.min.js"></script>
  <script>
window.ACTIVIDAD = {datos};
  </script>
  <script src="../../../../assets/editor.js"></script>
</body>
</html>
"""


def leer_inicial(fuente, archivo, lang):
    for nombre in (f"inicial.{lang}.{EXT[archivo]}", f"inicial.{EXT[archivo]}"):
        p = fuente / nombre
        if p.exists():
            return p.read_text(encoding="utf-8")
    return ""


def generar_actividad(curso_dir, act_dir):
    fuente = act_dir / "fuente"
    spec = json.loads((fuente / "actividad.json").read_text(encoding="utf-8"))
    curso, act = curso_dir.name, act_dir.name
    donde = f"{curso}/{act}"
    archivos = spec.get("archivos", ["html", "css"])
    for i, v in enumerate(spec.get("verificaciones", [])):
        for lang in IDIOMAS:
            txt(v.get("mensaje"), lang, f"{donde} verificación {i + 1} (mensaje)")
    titulos = {}
    for lang in IDIOMAS:
        titulo = txt(spec["titulo"], lang, f"{donde} (titulo)")
        titulos[lang] = titulo
        cons = fuente / f"consigna.{lang}.html"
        if not cons.exists():
            errores.append(f"{donde}: falta fuente/consigna.{lang}.html")
            continue
        salida = act_dir / lang
        salida.mkdir(exist_ok=True)
        (salida / "consigna.html").write_text(pagina_consigna(lang, titulo, cons.read_text(encoding="utf-8")), encoding="utf-8")
        config = {
            "id": donde,
            "lang": lang,
            "titulo": titulo,
            "archivos": archivos,
            "heredarDe": f"{curso}/{spec['heredarDe']}" if spec.get("heredarDe") else None,
            "inicial": {a: leer_inicial(fuente, a, lang) for a in archivos},
            "verificaciones": spec.get("verificaciones", []),
        }
        (salida / "index.html").write_text(pagina_actividad(lang, config), encoding="utf-8")
    return {"id": act, "titulo": titulos}


def main():
    catalogo = []
    for curso_dir in sorted((RAIZ / "cursos").iterdir()):
        if not (curso_dir / "curso.json").exists():
            continue
        info = json.loads((curso_dir / "curso.json").read_text(encoding="utf-8"))
        acts = [generar_actividad(curso_dir, d) for d in sorted(curso_dir.iterdir())
                if (d / "fuente" / "actividad.json").exists()]
        catalogo.append({"id": curso_dir.name, "titulo": info["titulo"], "descripcion": info.get("descripcion", {}), "actividades": acts})
    (RAIZ / "catalogo.js").write_text(
        "// Generado por tools/generar.py — no editar a mano.\nwindow.CATALOGO = "
        + json.dumps(catalogo, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    total = sum(len(c["actividades"]) for c in catalogo)
    print(f"{len(catalogo)} curso(s), {total} actividad(es) generadas en {len(IDIOMAS)} idiomas.")
    if errores:
        print("\nProblemas encontrados:")
        for e in errores:
            print("  -", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
