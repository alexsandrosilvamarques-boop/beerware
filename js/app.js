/**
 * BEERWARE — ORQUESTRADOR PRINCIPAL
 * Etapa 2: Integração de Estado, Persistência e Atualização do HUD
 */

import { state } from "./state.js";

function atualizarHUD() {
  const dados = state.get();
  document.getElementById("val-caixa").textContent = `R$ ${dados.caixa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  document.getElementById("val-patrimonio").textContent = `R$ ${state.calcularPatrimonio().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  document.getElementById("val-mes").textContent = `Mês ${dados.mes}`;
  document.getElementById("news-headline").textContent = "Cervejaria Matriz operando em São Paulo. Mercado aguarda primeira safra.";
}

function inicializarNavegacaoAbas() {
  const tabs = document.querySelectorAll(".nav-tab");
  const panes = document.querySelectorAll(".tab-pane");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panes.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const targetPane = document.getElementById(tab.dataset.tab);
      if (targetPane) targetPane.classList.add("active");
    });
  });
}

function setupResetButton() {
  const btnReset = document.getElementById("btn-reset-save");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (confirm("Deseja apagar todo o progresso e reiniciar o império com R$ 50.000?")) {
        state.resetar();
        atualizarHUD();
        alert("Império reiniciado com sucesso!");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // 1. Carrega ou restaura o estado seguro
  state.carregar();

  // 2. Conecta eventos de interface
  inicializarNavegacaoAbas();
  setupResetButton();

  // 3. Renderiza o topo
  atualizarHUD();

  // Expõe no window apenas para facilitar inspeção nos testes da Etapa 2
  window.__stateDebug = state;

  console.log("🍺 Beerware — Etapa 2 concluída com sucesso. Estado carregado:", state.get());
});