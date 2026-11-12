/**
 * BEERWARE — ORQUESTRADOR
 * Responsabilidade: Inicializar dependências, navegação de abas e atualizar o HUD.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Verificação de Segurança de Carregamento
  if (!window.BeerwareData || !window.BeerwareState) {
    const banner = document.createElement("div");
    banner.style = "position:fixed;top:0;left:0;right:0;background:#b91c1c;color:#fff;padding:16px;z-index:9999;font-weight:bold;text-align:center;";
    banner.innerHTML = "❌ ERRO: O arquivo <code>js/data.js</code> ou <code>js/state.js</code> não foi encontrado!<br>Verifique se eles foram criados exatamente dentro da pasta <b>js/</b>.";
    document.body.appendChild(banner);
    return;
  }

  const State = window.BeerwareState;
  State.carregar();

  // 1. Atualiza Indicadores do HUD
  function atualizarHUD() {
    const dados = State.get();
    document.getElementById("val-caixa").textContent = `R$ ${dados.caixa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    document.getElementById("val-patrimonio").textContent = `R$ ${State.calcularPatrimonio().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    document.getElementById("val-mes").textContent = `Mês ${dados.mes}`;
    document.getElementById("news-headline").textContent = "Cervejaria Matriz operando em São Paulo. Mercado aguarda primeira safra.";
  }

  // 2. Navegação entre Abas
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

  // 3. Botão de Reset
  const btnReset = document.getElementById("btn-reset-save");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (confirm("Deseja apagar todo o progresso e reiniciar o império com R$ 50.000?")) {
        State.resetar();
        atualizarHUD();
        alert("Império reiniciado com sucesso!");
      }
    });
  }

  atualizarHUD();
  console.log("🍺 Beerware pronto! Módulos carregados com sucesso.");
});