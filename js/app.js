/**
 * BEERWARE — ORQUESTRADOR PRINCIPAL
 * Etapa 1: Validação do esqueleto e navegação de abas
 */

document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.nav-tab');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPane = document.getElementById(tab.dataset.tab);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });

  console.log("🍺 Beerware — Etapa 1 iniciada com sucesso. Abas operacionais.");
});