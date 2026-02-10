// Atualiza o ano automaticamente no footer (sem quebrar se o elemento não existir)
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
