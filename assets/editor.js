/*
 * Motor de actividades con editor de código (HTML / CSS / JS).
 * Lee la configuración de window.ACTIVIDAD (la genera tools/generar.py).
 *
 * Tipos de verificación:
 *   existe   { selector }                         el elemento existe en la vista previa
 *   cantidad { selector, minimo?, maximo?, igual? } cantidad de elementos
 *   texto    { selector, valor | contiene, mayusculas? }  texto del elemento
 *   atributo { selector, atributo, valor? | contiene? }   atributo presente / con valor
 *   estilo   { selector, propiedad, valor }        estilo calculado (acepta #hex, nombres, px…)
 *   codigo   { archivo: html|css|js, regex, flags? }  el código escrito cumple una expresión
 *   consola  { contiene }                          algo se mostró con console.log
 *   funcion  { cuerpo }                            JS propio: (doc, win, codigo, consola) => boolean
 */
(function () {
  "use strict";

  var UI = {
    es: {
      run: "Ejecutar", check: "Verificar", reset: "Reiniciar", preview: "Vista previa", console: "Consola",
      results: "Resultados", empty: "Cuando termines, presiona Verificar para revisar tu trabajo.",
      allOk: "¡Excelente! Completaste la actividad.", partial: "Vas bien: {ok} de {total}. Revisa los puntos marcados.",
      confirmReset: "¿Seguro que quieres volver al código inicial? Se perderán tus cambios.",
      inherit: "Traer código de la actividad anterior", noInherit: "No se encontró código guardado de la actividad anterior. Cópialo y pégalo manualmente.",
      confirmInherit: "Se reemplazará el código actual por el de la actividad anterior. ¿Continuar?",
      autosave: "Se guarda automáticamente"
    },
    en: {
      run: "Run", check: "Check", reset: "Reset", preview: "Preview", console: "Console",
      results: "Results", empty: "When you finish, press Check to review your work.",
      allOk: "Excellent! You completed the activity.", partial: "Good progress: {ok} of {total}. Review the marked items.",
      confirmReset: "Are you sure you want to go back to the starting code? Your changes will be lost.",
      inherit: "Bring code from the previous activity", noInherit: "No saved code was found for the previous activity. Copy and paste it manually.",
      confirmInherit: "Your current code will be replaced with the previous activity's code. Continue?",
      autosave: "Saved automatically"
    },
    pt: {
      run: "Executar", check: "Verificar", reset: "Reiniciar", preview: "Pré-visualização", console: "Console",
      results: "Resultados", empty: "Quando terminar, clique em Verificar para revisar seu trabalho.",
      allOk: "Excelente! Você concluiu a atividade.", partial: "Bom progresso: {ok} de {total}. Revise os itens marcados.",
      confirmReset: "Tem certeza de que quer voltar ao código inicial? Suas alterações serão perdidas.",
      inherit: "Trazer código da atividade anterior", noInherit: "Não foi encontrado código salvo da atividade anterior. Copie e cole manualmente.",
      confirmInherit: "O código atual será substituído pelo da atividade anterior. Continuar?",
      autosave: "Salvo automaticamente"
    }
  };

  var A = window.ACTIVIDAD;
  if (!A) return;
  var T = UI[A.lang] || UI.es;
  var ARCHIVOS = A.archivos || ["html", "css"];
  var NOMBRES = { html: "HTML", css: "CSS", js: "JS" };
  var MODOS = { html: "htmlmixed", css: "css", js: "javascript" };
  var CLAVE = "act:" + A.id + ":" + A.lang;

  // ---------- almacenamiento ----------
  function leer(clave) { try { var v = localStorage.getItem(clave); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function guardar(clave, v) { try { localStorage.setItem(clave, JSON.stringify(v)); } catch (e) {} }

  // ---------- DOM base ----------
  var $ = function (s, r) { return (r || document).querySelector(s); };
  document.title = A.titulo;
  $("#act-titulo").textContent = A.titulo;
  $("#btn-run").textContent = T.run;
  $("#btn-check").textContent = T.check;
  $("#btn-reset").textContent = T.reset;
  $("#tab-preview").textContent = T.preview;
  $("#tab-console").textContent = T.console;
  $("#res-titulo").textContent = T.results;
  $("#tab-info").textContent = T.autosave;
  var btnInherit = $("#btn-inherit");
  btnInherit.textContent = T.inherit;
  btnInherit.hidden = !A.heredarDe;

  // ---------- editores ----------
  var guardado = leer(CLAVE);
  var codigoInicial = {};
  ARCHIVOS.forEach(function (f) { codigoInicial[f] = (A.inicial && A.inicial[f]) || ""; });

  var tabs = $("#tabs-editor");
  var host = $("#editor-host");
  var editores = {};
  var hayCM = typeof window.CodeMirror === "function";

  ARCHIVOS.forEach(function (f, i) {
    var b = document.createElement("button");
    b.className = "tab" + (i === 0 ? " activo" : "");
    b.textContent = NOMBRES[f];
    b.dataset.archivo = f;
    b.type = "button";
    tabs.insertBefore(b, $("#tab-info"));

    var valor = guardado && typeof guardado[f] === "string" ? guardado[f] : codigoInicial[f];
    var cont = document.createElement("div");
    cont.className = "editor-pane" + (i === 0 ? "" : " oculto");
    cont.style.cssText = "position:absolute;inset:0;";
    host.appendChild(cont);

    if (hayCM) {
      var cm = window.CodeMirror(cont, {
        value: valor, mode: MODOS[f], lineNumbers: true, tabSize: 2, indentUnit: 2,
        lineWrapping: true, autoCloseTags: f === "html", autoCloseBrackets: true
      });
      cm.setSize("100%", "100%");
      cm.on("change", alCambiar);
      editores[f] = { get: function () { return cm.getValue(); }, set: function (v) { cm.setValue(v); }, refresh: function () { cm.refresh(); }, el: cont };
    } else {
      var ta = document.createElement("textarea");
      ta.spellcheck = false;
      ta.value = valor;
      ta.addEventListener("input", alCambiar);
      ta.addEventListener("keydown", function (e) {
        if (e.key === "Tab") { e.preventDefault(); var s = ta.selectionStart; ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s + 2; alCambiar(); }
      });
      cont.appendChild(ta);
      editores[f] = { get: function () { return ta.value; }, set: function (v) { ta.value = v; }, refresh: function () {}, el: cont };
    }
  });

  tabs.addEventListener("click", function (e) {
    var b = e.target.closest(".tab[data-archivo]");
    if (!b) return;
    tabs.querySelectorAll(".tab[data-archivo]").forEach(function (x) { x.classList.toggle("activo", x === b); });
    ARCHIVOS.forEach(function (f) { editores[f].el.classList.toggle("oculto", f !== b.dataset.archivo); });
    editores[b.dataset.archivo].refresh();
  });

  function codigo() { var c = {}; ARCHIVOS.forEach(function (f) { c[f] = editores[f].get(); }); return c; }

  // ---------- vista previa ----------
  var frame = $("#preview");
  var consolaEl = $("#consola");
  var lineasConsola = [];

  var CAPTURA = "<script>(function(){function s(t,a){try{parent.postMessage({__act:1,t:t,m:Array.prototype.map.call(a,function(x){try{return typeof x==='object'?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(' ')},'*')}catch(e){}}" +
    "['log','info','warn','error'].forEach(function(k){var o=console[k];console[k]=function(){s(k,arguments);o.apply(console,arguments)}});" +
    "window.addEventListener('error',function(e){s('error',[e.message])});})();<\/script>";

  function armarDocumento(c) {
    var html = c.html || "";
    var css = c.css ? "<style>\n" + c.css + "\n</style>" : "";
    var js = c.js ? "<script>\n" + c.js + "\n<\/script>" : "";
    if (!/<html[\s>]/i.test(html)) html = "<!DOCTYPE html><html><head></head><body>" + html + "</body></html>";
    if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, function (m) { return m + CAPTURA; });
    else html = CAPTURA + html;
    if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, css + "</head>");
    else html = css + html;
    if (/<\/body>/i.test(html)) html = html.replace(/<\/body>(?![\s\S]*<\/body>)/i, js + "</body>");
    else html += js;
    return html;
  }

  window.addEventListener("message", function (e) {
    if (!e.data || !e.data.__act || e.source !== frame.contentWindow) return;
    lineasConsola.push({ t: e.data.t, m: e.data.m });
    var linea = document.createElement("div");
    linea.className = e.data.t;
    linea.textContent = e.data.m;
    consolaEl.appendChild(linea);
  });

  function ejecutar() {
    return new Promise(function (resolve) {
      lineasConsola = [];
      consolaEl.textContent = "";
      frame.onload = function () { setTimeout(resolve, 120); };
      frame.srcdoc = armarDocumento(codigo());
    });
  }

  var tPrev = null, tSave = null;
  function alCambiar() {
    clearTimeout(tPrev); clearTimeout(tSave);
    tPrev = setTimeout(ejecutar, 700);
    tSave = setTimeout(function () { guardar(CLAVE, codigo()); }, 400);
  }

  var tabsPrev = $("#tabs-preview");
  tabsPrev.addEventListener("click", function (e) {
    var b = e.target.closest(".tab");
    if (!b) return;
    tabsPrev.querySelectorAll(".tab").forEach(function (x) { x.classList.toggle("activo", x === b); });
    var verConsola = b.id === "tab-console";
    frame.classList.toggle("oculto", verConsola);
    consolaEl.classList.toggle("oculto", !verConsola);
  });

  // ---------- verificaciones ----------
  function norm(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }
  function valorLang(v) { return v && typeof v === "object" && !Array.isArray(v) ? (v[A.lang] != null ? v[A.lang] : v.es) : v; }

  function estiloEsperado(doc, prop, valor) {
    var d = doc.createElement("div");
    d.style.setProperty(prop, valor);
    d.style.display = "none";
    doc.body.appendChild(d);
    var r = doc.defaultView.getComputedStyle(d).getPropertyValue(prop);
    d.remove();
    return r || valor;
  }

  function evaluar(v, doc, win, c) {
    var el, tx, esperado;
    try {
      switch (v.tipo) {
        case "existe":
          return !!doc.querySelector(v.selector);
        case "cantidad":
          var n = doc.querySelectorAll(v.selector).length;
          if (v.igual != null) return n === v.igual;
          return (v.minimo == null || n >= v.minimo) && (v.maximo == null || n <= v.maximo);
        case "texto":
          el = doc.querySelector(v.selector);
          if (!el) return false;
          tx = norm(el.textContent);
          var cmp = function (s) { return v.mayusculas ? s : s.toLowerCase(); };
          if (v.valor != null) return cmp(tx) === cmp(norm(valorLang(v.valor)));
          if (v.contiene != null) return cmp(tx).indexOf(cmp(norm(valorLang(v.contiene)))) !== -1;
          return tx.length > 0;
        case "atributo":
          el = doc.querySelector(v.selector);
          if (!el || !el.hasAttribute(v.atributo)) return false;
          tx = el.getAttribute(v.atributo);
          if (v.valor != null) return norm(tx) === norm(valorLang(v.valor));
          if (v.contiene != null) return tx.indexOf(valorLang(v.contiene)) !== -1;
          return true;
        case "estilo":
          el = doc.querySelector(v.selector);
          if (!el) return false;
          var real = win.getComputedStyle(el).getPropertyValue(v.propiedad);
          esperado = estiloEsperado(doc, v.propiedad, valorLang(v.valor));
          return norm(real) === norm(esperado);
        case "codigo":
          return new RegExp(v.regex, v.flags || "i").test(c[v.archivo] || "");
        case "consola":
          var buscado = norm(valorLang(v.contiene)).toLowerCase();
          return lineasConsola.some(function (l) { return norm(l.m).toLowerCase().indexOf(buscado) !== -1; });
        case "funcion":
          return !!(new Function("doc", "win", "codigo", "consola", v.cuerpo))(doc, win, c, lineasConsola.slice());
      }
    } catch (e) { return false; }
    return false;
  }

  function verificar() {
    return ejecutar().then(function () {
      var doc = frame.contentDocument, win = frame.contentWindow, c = codigo();
      var lista = $("#res-lista");
      lista.textContent = "";
      var ok = 0;
      (A.verificaciones || []).forEach(function (v) {
        var paso = evaluar(v, doc, win, c);
        if (paso) ok++;
        var li = document.createElement("li");
        li.className = paso ? "ok" : "bad";
        li.textContent = (paso ? "✓ " : "✗ ") + valorLang(v.mensaje);
        lista.appendChild(li);
      });
      var total = (A.verificaciones || []).length;
      var resumen = $("#res-resumen");
      var completa = ok === total && total > 0;
      resumen.className = "resumen" + (completa ? " ok" : "");
      resumen.textContent = completa ? T.allOk : T.partial.replace("{ok}", ok).replace("{total}", total);
      $("#res-vacio").classList.add("oculto");
      guardar(CLAVE, c);
      if (window.parent !== window) {
        try { window.parent.postMessage({ tipo: "actividad-resultado", id: A.id, lang: A.lang, correctas: ok, total: total, completa: completa }, "*"); } catch (e) {}
      }
      return { ok: ok, total: total };
    });
  }

  // ---------- botones ----------
  $("#btn-run").addEventListener("click", ejecutar);
  $("#btn-check").addEventListener("click", verificar);
  $("#btn-reset").addEventListener("click", function () {
    if (!confirm(T.confirmReset)) return;
    ARCHIVOS.forEach(function (f) { editores[f].set(codigoInicial[f]); });
    guardar(CLAVE, codigo());
    ejecutar();
  });
  btnInherit.addEventListener("click", function () {
    var previo = leer("act:" + A.heredarDe + ":" + A.lang);
    if (!previo) { alert(T.noInherit); return; }
    if (!confirm(T.confirmInherit)) return;
    ARCHIVOS.forEach(function (f) { if (typeof previo[f] === "string") editores[f].set(previo[f]); });
    guardar(CLAVE, codigo());
    ejecutar();
  });

  $("#res-vacio").textContent = T.empty;
  ejecutar();
  window.__actividad = { verificar: verificar, codigo: codigo, editores: editores };
})();
