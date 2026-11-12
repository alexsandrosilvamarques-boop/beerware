/**
 * BEERWARE — ORQUESTRADOR
 * Etapa 3: Integração do Sistema de Áudio Tátil
 */

document.addEventListener("DOMContentLoaded", () => {
  // Verificação de Dependências
  if (!window.BeerwareData || !window.BeerwareState || !window.BeerwareAudio) {
    console.error("Módulos ausentes na inicialização.");
    return;
  }

  const State = window.BeerwareState;
  const Audio = window.BeerwareAudio;

  State.carregar();

  function atualizarHUD() {
    const dados = State.get();
    document.getElementById("val-caixa").textContent = `R$ ${dados.caixa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    document.getElementById("val-patrimonio").textContent = `R$ ${State.calcularPatrimonio().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    document.getElementById("val-mes").textContent = `Mês ${dados.mes}`;
    document.getElementById("news-headline").textContent = "Cervejaria Matriz operando em São Paulo. Mercado aguarda primeira safra.";
  }

  // Navegação de Abas com Feedback Sonoro Tátil
  const tabs = document.querySelectorAll(".nav-tab");
  const panes = document.querySelectorAll(".tab-pane");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      Audio.click(); // 🔊 Som de clique retrô

      tabs.forEach(t => t.classList.remove("active"));
      panes.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const targetPane = document.getElementById(tab.dataset.tab);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // Botão de Teste de Moeda no "Passar Mês" (temporário até a simulação entrar)
  const btnNext = document.getElementById("btn-next-turn");
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      Audio.coin(); // 🔊 Som de moedas
    });
  }

  // Botão de Reset
  const btnReset = document.getElementById("btn-reset-save");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      Audio.alert(); // 🔊 Som de alerta
      if (confirm("Deseja apagar todo o progresso e reiniciar com R$ 50.000?")) {
        State.resetar();
        atualizarHUD();
        Audio.fanfarra(); // 🔊 Fanfarra de reinício
      }
    });
  }

  atualizarHUD();
  console.log("🍺 Beerware — Etapa 3 pronta. Áudio procedural ativado!");
});