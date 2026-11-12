/**
 * BEERWARE — ENGINE REFEITA COM SALVAMENTO AUTOMÁTICO E VENDAS ATIVAS
 */

// 1. Áudio Sintetizado (Zero downloads)
const SFX = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  },
  play(f = 440, type = "sine", d = 0.1) {
    try {
      this.init();
      if (this.ctx.state === "suspended") this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);
      g.gain.setValueAtTime(0.08, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + d);
    } catch(e){}
  },
  coin() {
    this.play(987, "square", 0.08);
    setTimeout(() => this.play(1318, "square", 0.18), 70);
  },
  click() { this.play(350, "triangle", 0.05); }
};

// 2. Estado Padrão Inicial
const DEFAULT_STATE = {
  caixa: 50000,
  mes: 1,
  lucroUltimoMes: 0,
  cervejas: [
    { id: "pilsen", nome: "Loirinha Puro Malte", custo: 2.20, preco: 7.50, sabor: 4, forca: 4 },
    { id: "ipa", nome: "Mantiqueira IPA", custo: 5.00, preco: 15.00, sabor: 9, forca: 7 },
    { id: "bock", nome: "Bock Imperial", custo: 6.20, preco: 19.00, sabor: 8, forca: 9 }
  ],
  cidades: [
    { id: "sp", nome: "São Paulo", demanda: 1200, prefSabor: 8, prefForca: 6, maxPreco: 18.0, marketing: 1000, sharePlayer: 15 },
    { id: "rj", nome: "Rio de Janeiro", demanda: 900, prefSabor: 4, prefForca: 4, maxPreco: 14.0, marketing: 500, sharePlayer: 10 },
    { id: "bh", nome: "Belo Horizonte", demanda: 750, prefSabor: 9, prefForca: 7, maxPreco: 13.0, marketing: 500, sharePlayer: 10 },
    { id: "cwb", nome: "Curitiba", demanda: 600, prefSabor: 7, prefForca: 8, maxPreco: 17.0, marketing: 200, sharePlayer: 10 }
  ],
  fabricas: [
    { id: "fab_sp", cidadeId: "sp", capacidade: 600, producaoAlvo: { pilsen: 400, ipa: 200, bock: 0 } }
  ]
};

class BeerwareTycoon {
  constructor() {
    this.state = this.carregarJogo();
  }

  // --- PERSISTÊNCIA (LOCALSTORAGE) ---
  salvarJogo() {
    localStorage.setItem("beerware_save_v2", JSON.stringify(this.state));
  }

  carregarJogo() {
    const salvo = localStorage.getItem("beerware_save_v2");
    if (salvo) {
      try {
        return JSON.parse(salvo);
      } catch(e) {
        console.error("Erro ao carregar save, recriando...", e);
      }
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  resetarJogo() {
    if (confirm("Deseja apagar todo o progresso e começar uma nova cervejaria do zero?")) {
      localStorage.removeItem("beerware_save_v2");
      location.reload();
    }
  }

  init() {
    this.setupAbas();
    this.setupListeners();
    this.renderTudo();
  }

  setupAbas() {
    const tabs = document.querySelectorAll('.tab-link');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        SFX.click();
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
      });
    });
  }

  setupListeners() {
    document.getElementById('btn-next-turn').addEventListener('click', () => this.processarViradaMes());
    document.getElementById('btn-build-factory').addEventListener('click', () => this.construirFabrica());
    document.getElementById('btn-reset-game').addEventListener('click', () => this.resetarJogo());

    // Fechar Modal
    const fecharModal = () => document.getElementById('modal-report').classList.add('hidden');
    document.getElementById('btn-close-modal').addEventListener('click', fecharModal);
    document.getElementById('btn-ack-report').addEventListener('click', fecharModal);
  }

  renderTudo() {
    this.atualizarHUD();
    this.renderCidades();
    this.renderFabricas();
    this.renderCatalogo();
  }

  atualizarHUD() {
    document.getElementById('hud-cash').textContent = `R$ ${this.state.caixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('hud-month').textContent = this.state.mes;
    document.getElementById('hud-last-profit').textContent = `${this.state.lucroUltimoMes >= 0 ? '+' : ''}R$ ${this.state.lucroUltimoMes.toFixed(2)}`;
    document.getElementById('hud-last-profit').style.color = this.state.lucroUltimoMes >= 0 ? "var(--green)" : "var(--red)";
  }

  // --- RENDERIZADORES ---
  renderCidades() {
    const container = document.getElementById('cities-grid');
    container.innerHTML = "";

    this.state.cidades.forEach(c => {
      const shareRival = 100 - c.sharePlayer;
      const card = document.createElement('div');
      card.className = "card";
      card.innerHTML = `
        <div class="card-header">
          <span class="card-title">${c.nome}</span>
          <span class="tag">Demanda: ${c.demanda} barris/mês</span>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted); display:flex; justify-content:space-between;">
          <span>Sua Participação: <b>${c.sharePlayer}%</b></span>
          <span>MegaCerveja: <b>${shareRival}%</b></span>
        </div>
        <div class="progress-bar-bg">
          <div class="bar-player" style="width: ${c.sharePlayer}%;"></div>
          <div class="bar-rival" style="width: ${shareRival}%;"></div>
        </div>
        <div class="control-row">
          <div class="control-label">
            <span>Investimento em Marketing Mensal:</span>
            <span style="color:var(--gold);">R$ ${c.marketing}</span>
          </div>
          <input type="range" min="0" max="3000" step="100" value="${c.marketing}" 
            onchange="window.jogo.ajustarMarketing('${c.id}', this.value)"
            oninput="this.previousElementSibling.lastElementChild.textContent = 'R$ ' + this.value">
        </div>
      `;
      container.appendChild(card);
    });
  }

  renderFabricas() {
    const container = document.getElementById('breweries-grid');
    container.innerHTML = "";

    this.state.fabricas.forEach((f, idx) => {
      const cidade = this.state.cidades.find(c => c.id === f.cidadeId);
      const card = document.createElement('div');
      card.className = "card";

      card.innerHTML = `
        <div class="card-header">
          <span class="card-title">Cervejaria #${idx + 1} (${cidade.nome})</span>
          <span class="tag">Capacidade: ${f.capacidade} barris</span>
        </div>
        <div style="font-size:0.8rem; font-weight:700;">Meta de Produção Automática Mensal:</div>
        ${this.state.cervejas.map(b => `
          <div class="control-row">
            <div class="control-label">
              <span>${b.nome} (Custo: R$ ${b.custo.toFixed(2)}/un):</span>
              <span style="color:var(--amber);">${f.producaoAlvo[b.id] || 0} barris</span>
            </div>
            <input type="range" min="0" max="${f.capacidade}" step="50" value="${f.producaoAlvo[b.id] || 0}"
              onchange="window.jogo.ajustarMetaProducao('${f.id}', '${b.id}', this.value)"
              oninput="this.previousElementSibling.lastElementChild.textContent = this.value + ' barris'">
          </div>
        `).join('')}
      `;
      container.appendChild(card);
    });
  }

  renderCatalogo() {
    const container = document.getElementById('beer-catalog-grid');
    container.innerHTML = "";

    this.state.cervejas.map(b => {
      const card = document.createElement('div');
      card.className = "card";
      card.innerHTML = `
        <div class="card-header">
          <span class="card-title">${b.nome}</span>
          <span class="tag">Custo: R$ ${b.custo.toFixed(2)}</span>
        </div>
        <div class="control-row">
          <div class="control-label">
            <span>Preço de Venda Praticado:</span>
            <span style="font-size: 1rem; color:var(--green); font-weight:900;">R$ ${b.preco.toFixed(2)}</span>
          </div>
          <input type="range" min="4" max="25" step="0.5" value="${b.preco}"
            onchange="window.jogo.ajustarPreco('${b.id}', this.value)"
            oninput="this.previousElementSibling.lastElementChild.textContent = 'R$ ' + parseFloat(this.value).toFixed(2)">
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted);">
          Margem Bruta Unitária: <b>R$ ${(b.preco - b.custo).toFixed(2)}</b>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // --- MUTAÇÕES DE ESTADO ---
  ajustarMarketing(cidadeId, valor) {
    const cid = this.state.cidades.find(c => c.id === cidadeId);
    if (cid) {
      cid.marketing = parseInt(valor, 10);
      this.salvarJogo();
    }
  }

  ajustarPreco(cervejaId, valor) {
    const cerv = this.state.cervejas.find(b => b.id === cervejaId);
    if (cerv) {
      cerv.preco = parseFloat(valor);
      this.salvarJogo();
      this.renderCatalogo();
    }
  }

  ajustarMetaProducao(fabricaId, cervejaId, valor) {
    const fab = this.state.fabricas.find(f => f.id === fabricaId);
    if (fab) {
      fab.producaoAlvo[cervejaId] = parseInt(valor, 10);
      this.salvarJogo();
    }
  }

  construirFabrica() {
    const custo = 25000;
    if (this.state.caixa < custo) {
      alert("Saldo insuficiente! Construir uma fábrica requer R$ 25.000,00.");
      return;
    }

    const cidadesSemFabrica = this.state.cidades.filter(c => !this.state.fabricas.some(f => f.cidadeId === c.id));
    if (cidadesSemFabrica.length === 0) {
      alert("Você já construiu cervejarias em todas as capitais do país!");
      return;
    }

    const destino = cidadesSemFabrica[0];
    this.state.caixa -= custo;
    this.state.fabricas.push({
      id: "fab_" + destino.id,
      cidadeId: destino.id,
      capacidade: 600,
      producaoAlvo: { pilsen: 300, ipa: 150, bock: 50 }
    });

    SFX.coin();
    this.salvarJogo();
    this.renderTudo();
    alert(`🎉 Nova fábrica construída em ${destino.nome}!`);
  }

  // --- MOTOR ECONÔMICO: A VIRADA DO MÊS ---
  processarViradaMes() {
    SFX.coin();

    let totalProduzido = { pilsen: 0, ipa: 0, bock: 0 };
    let custoProducaoTotal = 0;

    // 1. Fabricação Automática
    this.state.fabricas.forEach(fab => {
      this.state.cervejas.forEach(b => {
        const qtd = fab.producaoAlvo[b.id] || 0;
        const custo = qtd * b.custo;
        if (this.state.caixa >= custo) {
          this.state.caixa -= custo;
          totalProduzido[b.id] += qtd;
          custoProducaoTotal += custo;
        }
      });
    });

    // 2. Custos de Marketing
    let custoMarketingTotal = 0;
    this.state.cidades.forEach(c => {
      if (this.state.caixa >= c.marketing) {
        this.state.caixa -= c.marketing;
        custoMarketingTotal += c.marketing;
      }
    });

    // 3. Simulação de Vendas e Demanda
    let faturamentoTotal = 0;
    let detalhesCidades = [];

    this.state.cidades.forEach(c => {
      let barrisVendidosCidade = 0;
      let receitaCidade = 0;

      this.state.cervejas.forEach(b => {
        if (totalProduzido[b.id] <= 0) return;

        // Fórmulas de Atratividade
        const fatorSabor = 1 - Math.abs(b.sabor - c.prefSabor) / 10;
        const fatorPreco = b.preco <= c.maxPreco ? 1.0 : Math.max(0.2, 1 - (b.preco - c.maxPreco) / 10);
        const fatorMkt = 1 + (c.marketing / 1500); // Publicidade impulsiona demanda

        const score = Math.max(0.1, (fatorSabor * 0.5 + fatorPreco * 0.5) * fatorMkt);
        const demandaEfetiva = Math.round((c.demanda / 3) * score * (c.sharePlayer / 50));

        // Quantidade vendida limitada pelo estoque disponível
        const vendidos = Math.min(totalProduzido[b.id], demandaEfetiva);
        totalProduzido[b.id] -= vendidos;

        const faturamento = vendidos * b.preco;
        faturamentoTotal += faturamento;
        receitaCidade += faturamento;
        barrisVendidosCidade += vendidos;
      });

      // Ganho de Market Share se vendeu bem
      if (barrisVendidosCidade > 100) {
        c.sharePlayer = Math.min(85, c.sharePlayer + 2);
      } else if (barrisVendidosCidade === 0) {
        c.sharePlayer = Math.max(5, c.sharePlayer - 3);
      }

      detalhesCidades.push(`📍 <b>${c.nome}:</b> Vendeu ${barrisVendidosCidade} barris. (+R$ ${receitaCidade.toFixed(2)})`);
    });

    // Adiciona o dinheiro das vendas
    this.state.caixa += faturamentoTotal;

    const freteEstimado = Math.round(faturamentoTotal * 0.05); // 5% de logística
    this.state.caixa -= freteEstimado;

    const lucroLiquido = faturamentoTotal - (custoProducaoTotal + custoMarketingTotal + freteEstimado);
    this.state.lucroUltimoMes = lucroLiquido;
    this.state.mes += 1;

    // Salva o novo estado imediatamente!
    this.salvarJogo();
    this.renderTudo();

    // 4. Exibir o Relatório Visual na Tela
    this.mostrarModalBalanço({
      faturamentoTotal,
      custoProducaoTotal,
      custoMarketingTotal,
      freteEstimado,
      lucroLiquido,
      detalhesCidades
    });
  }

  mostrarModalBalanço(dados) {
    document.getElementById('report-title').textContent = `Fechamento do Mês ${this.state.mes - 1}`;
    document.getElementById('rep-income').textContent = `+R$ ${dados.faturamentoTotal.toFixed(2)}`;
    document.getElementById('rep-prod-costs').textContent = `-R$ ${dados.custoProducaoTotal.toFixed(2)}`;
    document.getElementById('rep-freight').textContent = `-R$ ${dados.freteEstimado.toFixed(2)}`;
    document.getElementById('rep-marketing').textContent = `-R$ ${dados.custoMarketingTotal.toFixed(2)}`;

    const elNet = document.getElementById('rep-net-profit');
    elNet.textContent = `${dados.lucroLiquido >= 0 ? '+' : ''}R$ ${dados.lucroLiquido.toFixed(2)}`;
    elNet.className = dados.lucroLiquido >= 0 ? "text-green" : "text-red";

    const containerDet = document.getElementById('report-city-details');
    containerDet.innerHTML = dados.detalhesCidades.map(t => `<div>${t}</div>`).join('');

    document.getElementById('modal-report').classList.remove('hidden');
  }
}

// Inicia o jogo e expõe para o window
window.addEventListener('DOMContentLoaded', () => {
  window.jogo = new BeerwareTycoon();
  window.jogo.init();
});