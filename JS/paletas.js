/* PALETAS DE COLORES - LUDUS*/
(function () {
  "use strict";
  console.log("[LUDUS] paletas.js cargado correctamente");

  const STORAGE_KEY = "ludus-palette";
  const DEFAULT_PALETTE = "neon";
  const VALID_PALETTES = ["neon", "sunset", "forest", "cyber"];

  function applyPalette(name) {
    const palette = VALID_PALETTES.includes(name) ? name : DEFAULT_PALETTE;
    document.documentElement.setAttribute("data-palette", palette);
    try { localStorage.setItem(STORAGE_KEY, palette); } catch (e) {}
    console.log("[LUDUS] Paleta aplicada:", palette);
  }

  function getSavedPalette() {
    try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_PALETTE; }
    catch (e) { return DEFAULT_PALETTE; }
  }

  function initPalettes() {
    applyPalette(getSavedPalette());

    let intentos = 0;
    const MAX_INTENTOS = 120;

    function engancharBotones() {
      const botones = document.querySelectorAll("[data-palette-set]");
      if (botones.length === 0 && intentos < MAX_INTENTOS) {
        intentos++;
        requestAnimationFrame(engancharBotones);
        return;
      }
      console.log("[LUDUS] Enganchando", botones.length, "botones de paleta");
      botones.forEach(function (btn) {
        if (btn.dataset.paletteBound === "1") return;
        btn.dataset.paletteBound = "1";
        btn.addEventListener("click", function (ev) {
          ev.preventDefault();
          applyPalette(btn.getAttribute("data-palette-set"));
        });
      });
    }

    engancharBotones();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPalettes);
  } else {
    initPalettes();
  }
})();