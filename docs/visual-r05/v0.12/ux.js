/* PanelBuilder v0.12 R01 · UX opt-in. Modelo y serializacion permanecen en v0.11. */
(function () {
  "use strict";
  if (new URLSearchParams(location.search).get("ux") !== "v012") return;
  var $ = function (id) { return document.getElementById(id); };
  var find = function (selector) { return document.querySelector(selector); };
  var hadProject = false;
  try { hadProject = !!localStorage.getItem("PanelBuilder_v11_visual_r05"); } catch (_) {}
  document.body.classList.add("ux-v012");
  document.title = "PanelBuilder · Diseño de cuadros · UX v0.12";
  if ($("wizard") && $("wizard").classList.contains("open")) $("skipWizard").click();

  var nav = document.createElement("nav");
  nav.id = "pb12-nav";
  nav.className = "pb12-nav";
  nav.setAttribute("aria-label", "Navegación principal");
  nav.innerHTML =
    "<button type='button' data-pb-view='unifilar'>Unifilar</button>" +
    "<button type='button' data-pb-view='physical'>Diseño físico</button>" +
    "<button type='button' data-pb-view='materials'>Materiales</button>" +
    "<div class='pb12-menu-wrap'><button type='button' id='pb12-menu-toggle' aria-expanded='false' aria-controls='pb12-menu'>☰ Menú</button>" +
    "<div id='pb12-menu' class='pb12-menu' hidden>" +
    "<button type='button' data-pb-command='home'>⌂ Inicio</button>" +
    "<button type='button' data-pb-view='catalog'>⌕ Catálogo</button>" +
    "<button type='button' data-pb-view='checks'>⚑ Comprobaciones</button>" +
    "<button type='button' data-pb-view='both'>▣ Vista combinada</button>" +
    "<div class='pb12-menu-separator'></div><label for='alternativeSelect'>Alternativa activa</label><div id='pb12-alt'></div><div id='pb12-duplicate'></div>" +
    "<label for='brandSelect'>Fabricante de referencia · comparar, no sustituir</label><div id='pb12-brand'></div><div id='pb12-brand-review'></div>" +
    "<div class='pb12-menu-separator'></div>" +
    "<button type='button' data-pb-command='import'>↑ Abrir proyecto JSON</button>" +
    "<button type='button' data-pb-command='export'>↓ Exportar proyecto JSON</button>" +
    "<button type='button' data-pb-command='wizard'>✧ Asistente original</button>" +
    "<a href='index.html' class='pb12-classic'>Volver a v0.11 clásica ↗</a></div></div>";
  find(".topbar").appendChild(nav);

  // Mover los nodos reales: conservan listeners y datos sin copiar ni reemplazar el estado.
  [["alternativeSelect","pb12-alt"],["duplicateBtn","pb12-duplicate"],["brandSelect","pb12-brand"],["openBrandReview","pb12-brand-review"]]
    .forEach(function (pair) { if ($(pair[0]) && $(pair[1])) $(pair[1]).appendChild($(pair[0])); });

  var toolbar = document.createElement("section");
  toolbar.id = "pb12-toolbar";
  toolbar.className = "pb12-toolbar";
  toolbar.setAttribute("aria-label", "Herramientas rápidas del unifilar");
  toolbar.innerHTML =
    "<strong>Añadir al esquema</strong>" +
    "<button type='button' data-pb-add='MCB'>＋ Magnetotérmico</button>" +
    "<button type='button' data-pb-add='RCD'>＋ Diferencial</button>" +
    "<button type='button' data-pb-add='SPD'>＋ SPD</button>" +
    "<button type='button' data-pb-add='CONTACT'>＋ Contactor</button>" +
    "<div class='pb12-library-anchor'><button type='button' id='pb12-more' aria-expanded='false' aria-controls='pb12-library'>Más ▾</button>" +
    "<div id='pb12-library' class='pb12-library' role='dialog' aria-label='Biblioteca de componentes' hidden>" +
      "<label for='pb12-search'>Buscar componentes</label><input type='search' id='pb12-search' placeholder='Protección, maniobra, neutro…' autocomplete='off'>" +
      "<div class='pb12-library-items'>" +
        "<p class='pb12-family'>Protecciones</p>" +
        "<button type='button' data-pb-add='MCB' data-keywords='automático magnetotermico curva'>Magnetotérmico 2P</button>" +
        "<button type='button' data-pb-add='MCB1' data-keywords='automático magnetotermico neutro'>Magnetotérmico 1P+N</button>" +
        "<button type='button' data-pb-add='RCD' data-keywords='diferencial residual'>Interruptor diferencial</button>" +
        "<button type='button' data-pb-add='SPD' data-keywords='sobretension derivacion PE'>SPD · derivación, no serie</button>" +
        "<p class='pb12-family'>Maniobra</p>" +
        "<button type='button' data-pb-add='SWITCH' data-keywords='seccionamiento corte'>Interruptor-seccionador</button>" +
        "<button type='button' data-pb-add='CONTACT' data-keywords='bobina maniobra'>Contactor</button>" +
      "</div>" +
      "<p id='pb12-empty' hidden>Sin resultados en las familias disponibles.</p>" +
      "<p class='pb12-pending'>Medida, control, automatización y accesorios: pendientes de modelado específico. No se insertan como protecciones ficticias.</p>" +
    "</div></div>";
  find(".workspace").insertBefore(toolbar, $("editorArea"));

  var home = document.createElement("section");
  home.id = "pb12-home";
  home.className = "pb12-home";
  home.setAttribute("role", "dialog");
  home.setAttribute("aria-modal", "true");
  home.setAttribute("aria-labelledby", "pb12-home-title");
  home.innerHTML =
    "<div class='pb12-home-inner'>" +
      "<div class='pb12-home-top'><strong>ϟ PanelBuilder <span>v0.12 · vista previa</span></strong><button type='button' data-pb-start='continue'>Continuar en el editor →</button></div>" +
      "<div class='pb12-home-intro'><p>DISEÑA CON CLARIDAD</p><h1 id='pb12-home-title'>Tu cuadro eléctrico, paso a paso.</h1>" +
      "<p>Empieza por lo que necesitas. Los detalles técnicos aparecerán cuando los necesites.</p></div>" +
      "<div class='pb12-cards'>" +
        "<button type='button' data-pb-start='create'><span>⑂</span><strong>Crear cuadro</strong><small>Construye un unifilar y distribuye los equipos en el cuadro.</small><em>→</em></button>" +
        "<button type='button' data-pb-start='budget'><span>▤</span><strong>Presupuestar materiales</strong><small>Añade referencias y cantidades sin dibujar un esquema.</small><em>→</em></button>" +
        "<button type='button' data-pb-start='open'><span>↥</span><strong>Abrir proyecto</strong><small>Recupera el trabajo desde un archivo JSON.</small><em>→</em></button>" +
        "<button type='button' data-pb-start='catalog'><span>⌕</span><strong>Consultar catálogo</strong><small>Explora fichas y referencias documentales por fabricante.</small><em>→</em></button>" +
      "</div><footer>Los proyectos se guardan en este navegador. Exporta JSON como copia de seguridad. No equivale a un diseño eléctrico certificado.</footer>" +
    "</div>";
  document.body.appendChild(home);


  // Las opciones de configuración pasan DEBAJO del dibujo del cuadro.
  // Se mueven nodos existentes, conservando sus eventos y atributos.
  var physicalLead = document.createElement("section");
  physicalLead.id = "pb12-physical-lead";
  physicalLead.className = "pb12-physical-lead";
  physicalLead.innerHTML =
    "<div><strong>Diseña el cuadro directamente</strong><small>Arrastra los equipos entre posiciones DIN. La propuesta es modular y requiere comprobación técnica.</small></div>" +
    "<button type='button' id='pb12-propose'>⚡ Proponer / recalcular distribución</button>";
  find(".workspace").insertBefore(physicalLead, $("editorArea"));
  $("pb12-propose").addEventListener("click", function () { $("proposeBtn").click(); });
  var physicalOptions = document.createElement("details");
  physicalOptions.id = "pb12-physical-options";
  physicalOptions.className = "pb12-physical-options";
  physicalOptions.innerHTML =
    "<summary>⚙ Opciones de envolvente y distribución · Cambiar filas, reserva y revisar alternativas</summary>" +
    "<div id='pb12-options-mount'></div>";
  find(".workspace").insertBefore(physicalOptions, $("extraArea"));
  if ($("actionBar")) $("pb12-options-mount").appendChild($("actionBar"));
  if ($("enclosureChoices")) $("pb12-options-mount").appendChild($("enclosureChoices"));

  var menu = $("pb12-menu"), library = $("pb12-library"), context;
  function setMenu(open) { menu.hidden = !open; $("pb12-menu-toggle").setAttribute("aria-expanded", String(open)); }
  function setLibrary(open) { library.hidden = !open; $("pb12-more").setAttribute("aria-expanded", String(open)); if (open) $("pb12-search").focus(); }
  function enter() { home.hidden = true; setMenu(false); setLibrary(false); }
  function go(view) {
    var link = find(".left-panel [data-view='" + view + "']");
    if (link) { link.click(); enter(); }
  }
  function newProject(mode) {
    if (hadProject && !confirm("Crear un proyecto nuevo sustituirá los datos guardados en este navegador. ¿Has exportado una copia JSON y quieres continuar?")) return;
    var button = find("[data-wizard='" + mode + "']");
    if (button) { button.click(); enter(); }
  }
  function add(kind) {
    var button = find(".left-panel [data-add='" + kind + "']") || find("#editorArea [data-add='" + kind + "']");
    if (button) { button.click(); setLibrary(false); }
  }
  function action(name) {
    if (name === "home") { home.hidden = false; setMenu(false); home.querySelector("[data-pb-start='create']").focus(); }
    else if (name === "import") { enter(); $("importBtn").click(); }
    else if (name === "export") $("exportBtn").click();
    else if (name === "wizard") { enter(); $("startGuide").click(); }
  }
  nav.addEventListener("click", function (e) {
    var target = e.target.closest("[data-pb-view],[data-pb-command],#pb12-menu-toggle");
    if (!target) return;
    if (target.id === "pb12-menu-toggle") setMenu(menu.hidden);
    else if (target.dataset.pbView) go(target.dataset.pbView);
    else if (target.dataset.pbCommand) action(target.dataset.pbCommand);
  });
  toolbar.addEventListener("click", function (e) {
    if (e.target.closest("#pb12-more")) { setLibrary(library.hidden); return; }
    var button = e.target.closest("[data-pb-add]");
    if (button) add(button.dataset.pbAdd);
  });
  $("pb12-search").addEventListener("input", function () {
    var needle = this.value.trim().toLocaleLowerCase("es");
    var count = 0;
    library.querySelectorAll("[data-pb-add]").forEach(function (el) {
      el.hidden = !(el.textContent + " " + (el.dataset.keywords || "")).toLocaleLowerCase("es").includes(needle);
      if (!el.hidden) count++;
    });
    library.querySelectorAll(".pb12-family").forEach(function (el) { el.hidden = !!needle; });
    $("pb12-empty").hidden = count !== 0;
  });
  home.addEventListener("click", function (e) {
    var start = e.target.closest("[data-pb-start]");
    if (!start) return;
    if (start.dataset.pbStart === "create") newProject("blank");
    else if (start.dataset.pbStart === "budget") hadProject ? go("materials") : newProject("budget");
    else if (start.dataset.pbStart === "open") action("import");
    else if (start.dataset.pbStart === "catalog") go("catalog");
    else if (start.dataset.pbStart === "continue") enter();
  });

  context = document.createElement("div");
  context.id = "pb12-context";
  context.className = "pb12-context";
  context.setAttribute("role", "menu");
  context.setAttribute("aria-label", "Acciones del dispositivo");
  context.hidden = true;
  context.innerHTML =
    "<button type='button' role='menuitem' data-pb-context='edit'>✎ Editar propiedades</button>" +
    "<button type='button' role='menuitem' data-pb-context='MCB'>＋ Magnetotérmico después</button>" +
    "<button type='button' role='menuitem' data-pb-context='RCD'>＋ Diferencial después</button>" +
    "<button type='button' role='menuitem' data-pb-context='SPD'>＋ Derivar SPD (no serie)</button>";
  document.body.appendChild(context);
  var contextDevice = null;
  document.addEventListener("contextmenu", function (e) {
    var node = e.target.closest(".diagram-node[data-device]");
    if (!node || !home.hidden || !$("diagramViewport") || !$("diagramViewport").contains(node)) return;
    e.preventDefault();
    contextDevice = node.dataset.device;
    context.hidden = false;
    context.style.left = Math.max(8, Math.min(e.clientX, innerWidth - context.offsetWidth - 8)) + "px";
    context.style.top = Math.max(8, Math.min(e.clientY, innerHeight - context.offsetHeight - 8)) + "px";
  });
  context.addEventListener("click", function (e) {
    var button = e.target.closest("[data-pb-context]");
    if (!button) return;
    context.hidden = true;
    var node = Array.from(document.querySelectorAll(".diagram-node[data-device]")).find(function (el) { return el.dataset.device === contextDevice; });
    if (!node) return;
    if (button.dataset.pbContext === "edit") node.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    else { node.dispatchEvent(new MouseEvent("click", { bubbles: true })); add(button.dataset.pbContext); }
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest("#pb12-context")) context.hidden = true;
    if (!e.target.closest(".pb12-menu-wrap")) setMenu(false);
    if (!e.target.closest("#pb12-toolbar")) setLibrary(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!home.hidden) { enter(); return; }
    context.hidden = true;
    setMenu(false); setLibrary(false);
  });

  // Reflejar cambios de vista hechos por los controles v0.11 sin interceptar su lógica.
  function syncNav() {
    nav.querySelectorAll("[data-pb-view]").forEach(function (el) {
      var original = find(".left-panel [data-view='" + el.dataset.pbView + "']");
      var active = !!(original && original.classList.contains("active"));
      el.classList.toggle("active", active);
      el.setAttribute("aria-current", active ? "page" : "false");
    });
  }
  new MutationObserver(syncNav).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  syncNav();
  home.querySelector("[data-pb-start='create']").focus();
})();