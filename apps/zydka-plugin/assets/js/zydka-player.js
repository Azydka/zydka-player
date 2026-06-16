"use strict";
(() => {
  // src/index.ts
  function bootstrap() {
    const root = document.getElementById("zydka-player-root");
    if (!root) return;
    console.log("[Zydka Player] Root element found \u2014 player bootstrap ready.");
  }
  document.addEventListener("DOMContentLoaded", bootstrap);
})();
