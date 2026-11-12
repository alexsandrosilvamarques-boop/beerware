/**
 * BEERWARE TYCOON ENGINE — V3
 * Capacidade instalada real, estoque acumulativo, demografia regional,
 * DRE contábil, sistema de metas auditadas e salvamento contínuo.
 */

const SFX = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  },
  tone(freq, type = "sine", duration = 0.1, gainVal = 0.08) {
    try {
      this.init();
      if (this.ctx.state === "suspended") this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  },
  coin() {
    this.tone(987, "square", 0.08);
    setTimeout(() => this.tone(1318, "square", 0.18), 70);
  },
  fanfare() {
    this.tone(523, "triangle", 0.1);
    setTimeout(() => this.tone(659, "triangle", 0.1), 100);
    setTimeout(() => this.tone(783, "triangle", 0.1), 200);
    setTimeout(() => this.tone(1046, "square", 0.25), 300);
  },
  click() { this.tone(350, "triangle", 0.04, 0.05); },
  alert() { this.tone(200, "sawtooth", 0.2, 0.1); }
};

const DEFAULT_GAME_DATA = {
  caixa: 50000,
  mes: 1,
  historicoDRE: [],
  cervejas: [
    { id: "pilsen", nome: "Pilsen Puro Malte", estilo: "Leve e Refrescante", custoInsumo: 2.50, preco: 8.00, sabor: 4, forca: 4 },
    { id: "ipa", nome: "Mantiqueira IPA", estilo: "Cítrica & Amarga", custoInsumo: 5.50, preco: 16.00, sabor: 9, forca: 7 },
    { id: "bock", nome: "Bock Imperial", estilo: "Maltada & Alcoólica", custoInsumo: 6.80, preco: 20.00, sabor: 8, forca: 9 }
  ],
  cidades: [
    {
      id: "rj",
      nome: "Rio de Janeiro",
      clima: "☀️ Tropical Quente",
      populacao: "6.7M hab.",
      perfilTexto: "Exige cerveja leve trincando de gelada. Rejeita amargor alto e preços abusivos.",
      demandaBase: 1400,
      afinidades: { pilsen: 1.6, ipa: 0.5, bock: 0.3 },
      toleranciaPreco: 14.0,
      remessaMensal: { pilsen: 400, ipa: 0, bock: 0 },
      marketing: 500,
      sharePlayer: 10
    },
    {
      id: "sp",
      nome: "São Paulo",
      clima: "🏙️ Garoa Cosmopolita",
      populacao: "12.3M hab.",
      perfilTexto: "Mercado gigantesco e exigente. Consome grandes volumes de IPA e paga caro por qualidade.",
      demandaBase: 2200,
      afinidades: { pilsen: 1.0, ipa: 1.7, bock: 1.1 },
      toleranciaPreco: 22.0,
      remessaMensal: { pilsen: 300, ipa: 200, bock: 0 },
      marketing: 1000,
      sharePlayer: 15
    },
    {
      id: "bh",
      nome: "Belo Horizonte",
      clima: "🍻 Capital dos Botecos",
      populacao: "2.5M hab.",
      perfilTexto: "Cultura botequeira raíz. Busca o equilíbrio entre sabor de malte e preço justo.",
      demandaBase: 1100,
      afinidades: { pilsen: 1.2, ipa: 1.1, bock: 0.8 },
      toleranciaPreco: 15.0,
      remessaMensal: { pilsen: 100, ipa: 0, bock: 0 },
      marketing: 300,
      sharePlayer: 10
    },
    {
      id: "cwb",
      nome: "Curitiba",
      clima: "❄️ Frio Serrano",
      populacao: "1.9M hab.",
      perfilTexto: "Inverno rigoroso. O público adora estilos encorpados, torrados e com alto teor alcoólico.",
      demandaBase: 900,
      afinidades: { pilsen: 0.7, ipa: 1.2, bock: 1.8 },
      toleranciaPreco: 19.0,
      remessaMensal: { pilsen: 0, ipa: 0, bock: 150 },
      marketing: 300,
      sharePlayer: 10
    }
  ],
  fabricas: [
    {
      id: "fab_sp",
      cidadeId: "sp",
      capacidadeTanques: 1000,
      nivelTanques: 1,
      galpaoEstoque: { pilsen: 100, ipa: 50, bock: 0 },
      ordemBrassagem: { pilsen: 600, ipa: 300, bock: 100 }
    }
  ],
  metas: [
    { id: "m1", titulo: "Primeira Fornada", desc: "Produzir e vender 500 barris no total em um único mês.", meta: 500, progresso: 0, premio: 8000, status: "ativa" },
    { id: "m2", titulo: "Invasão Carioca", desc: "Alcançar 25% de Market Share no Rio de Janeiro.", meta: 25, progresso: 10, premio: 15000, status: "ativa" },
    { id: "m3", titulo: "Barão do Malte", desc: "Acumular R$ 100.000 em caixa livre.", meta: 100000, progresso: 50000, premio: 25000, status: "ativa" },
    { id: "m4", titulo: "Império Nacional", desc: "Instalar fábricas em 3 cidades diferentes.", meta: 3, progresso: 1, premio: 40000, status: "ativa" }
  ]
};

class TycoonGame {
  constructor() {
    this.dados = this.carregar();
  }

  salvar() {
    localStorage.setItem("beerware_tycoon_v3", JSON.stringify(this.dados));
  }

  carregar() {
    const salvo = localStorage.getItem("beerware_tycoon_v3");
    if (salvo) {
      try { return JSON.parse(salvo); } catch(e) {}
    }
    return JSON.parse(JSON.stringify(DEFAULT_GAME_DATA));
  }

  resetar() {
    if (confirm("ATENÇÃO: Isso apagará todas as suas fábricas, receitas e saldo para começar um novo império. Deseja continuar?")) {
      localStorage.removeItem("beerware_tycoon_v3");
      location.reload();
    }
  }

  init() {
    this.setupAbas();
    this.setupListeners();
    this.atualizarTudo();
  }

  setupAbas() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        SFX.click();
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
      });
    });
  }

  setupListeners() {
    document.getElementById('btn-next-turn').addEventListener('click', () => this.fecharMes());
    document.getElementById('btn-nova-fabrica').addEventListener('click', () => this.comprarFabrica());
    document.getElementById('btn-reset-save').addEventListener('click', () => this.resetar());

    const fecharM = () => document.getElementById('modal-balanco').classList.add('hidden');
    document.getElementById('modal-btn-close').addEventListener('click', fecharM);
    document.getElementById('modal-btn-confirm').addEventListener('click', fecharM);
  }

  atualizarTudo() {
    this.atualizarHUD();
    this.renderCidades();
    this.renderFabricas();
    this.renderDRE();
    this.renderMetas();
    this.renderPrecos();
  }

  calcularPatrimonio() {
    let valorEstoque = 0;
    this.dados.fabricas.forEach(f => {
      this.dados.cervejas.forEach(b => {
        valorEstoque += (f.galpaoEstoque[b.id] || 0) * b.custoInsumo;
      });
    });
    const valorImobilizado = this.dados.fabricas.length * 30000;
    return this.dados.caixa + valorEstoque + valorImobilizado;
  }

  atualizarHUD() {
    document.getElementById('val-caixa').textContent = `R$ ${this.dados.caixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('val-patrimonio').textContent = `R$ ${this.calcularPatrimonio().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('val-mes').textContent = `Mês ${this.dados.mes}`;

    // Badge de metas prontas
    const prontas = this.dados.metas.filter(m => m.status === "pronta").length;
    const badge = document.getElementById('badge-metas');
    if (prontas > 0) {
      badge.textContent = prontas;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  // --- RENDERIZADORES ---

  renderCidades() {
    const grid = document.getElementById('grid-cidades');
    grid.innerHTML = "";

    this.dados.cidades.forEach(c => {
      const shareRival = 100 - c.sharePlayer;
      const card = document.createElement('div');
      card.className = "card";
      card.innerHTML = `
        <div class="card-top">
          <div>
            <div class="card-title">${c.nome}</div>
            <div class="city-climate">${c.clima} • ${c.populacao}</div>
          </div>
          <span class="tag-small">Demanda: ~${c.demandaBase} barris</span>
        </div>
        <p style="font-size:0.75rem; color:var(--text-muted);">${c.perfilTexto}</p>

        <div style="font-size:0.72rem; display:flex; justify-content:space-between; margin-top:4px;">
          <span>Você: <b>${c.sharePlayer}%</b></span>
          <span>MegaCerveja: <b>${shareRival}%</b></span>
        </div>
        <div class="market-bar-frame">
          <div class="market-player" style="width: ${c.sharePlayer}%;"></div>
          <div class="market-rival" style="width: ${shareRival}%;"></div>
        </div>

        <div class="info-box">
          <b>Plano de Remessa Mensal (Barris a Enviar):</b>
          ${this.dados.cervejas.map(b => `
            <div class="control-field" style="margin-top: 4px;">
              <div class="control-head">
                <span>${b.nome}:</span>
                <span style="color:var(--amber-bright);">${c.remessaMensal[b.id] || 0} un</span>
              </div>
              <input type="range" min="0" max="800" step="50" value="${c.remessaMensal[b.id] || 0}"
                oninput="window.tycoon.setRemessa('${c.id}', '${b.id}', this.value, this)">
            </div>
          `).join('')}
        </div>

        <div class="control-field">
          <div class="control-head">
            <span>Investimento em Trade Marketing:</span>
            <span style="color:var(--amber-bright);">R$ ${c.marketing}</span>
          </div>
          <input type="range" min="0" max="4000" step="100" value="${c.marketing}"
            oninput="window.tycoon.setMarketing('${c.id}', this.value, this)">
        </div>
      `;
      grid.appendChild(card);
    });
  }

  renderFabricas() {
    const grid = document.getElementById('grid-fabricas');
    grid.innerHTML = "";

    this.dados.fabricas.forEach((f, idx) => {
      const cidade = this.dados.cidades.find(c => c.id === f.cidadeId);
      const totalBrassagem = Object.values(f.ordemBrassagem).reduce((a, b) => a + b, 0);
      const percOcupacao = Math.min(100, Math.round((totalBrassagem / f.capacidadeTanques) * 100));

      const card = document.createElement('div');
      card.className = "card";
      card.innerHTML = `
        <div class="card-top">
          <div>
            <div class="card-title">Cervejaria #${idx + 1} (${cidade.nome})</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Tanques Nível ${f.nivelTanques}</div>
          </div>
          <button class="btn-accent" style="padding:4px 8px; font-size:0.7rem;" onclick="window.tycoon.expandirTanques('${f.id}')">
            + Expansão de Tanques (+500 un)
            <br><small>R$ 15.000</small>
          </button>
        </div>

        <div class="info-box">
          <div style="display:flex; justify-content:space-between; font-weight:800;">
            <span>Uso dos Tanques de Fermentação:</span>
            <span style="color:${totalBrassagem > f.capacidadeTanques ? 'var(--red)' : 'var(--amber-bright)'};">
              ${totalBrassagem} / ${f.capacidadeTanques} barris (${percOcupacao}%)
            </span>
          </div>
          <div class="market-bar-frame" style="margin-top:4px;">
            <div class="market-player" style="width: ${percOcupacao}%; background:${totalBrassagem > f.capacidadeTanques ? 'var(--red)' : 'var(--amber-core)'};"></div>
          </div>
        </div>

        <div>
          <b>Programar Brassagem Mensal (Produção):</b>
          ${this.dados.cervejas.map(b => `
            <div class="control-field" style="margin-top:4px;">
              <div class="control-head">
                <span>${b.nome} (Custo: R$ ${b.custoInsumo.toFixed(2)}):</span>
                <span style="color:var(--amber-bright);">${f.ordemBrassagem[b.id] || 0} barris</span>
              </div>
              <input type="range" min="0" max="${f.capacidadeTanques}" step="50" value="${f.ordemBrassagem[b.id] || 0}"
                oninput="window.tycoon.setBrassagem('${f.id}', '${b.id}', this.value, this)">
            </div>
          `).join('')}
        </div>

        <div class="info-box" style="background:#0c0f13;">
          <b>Estoque no Galpão (Armazenado):</b>
          <div style="display:flex; justify-content:space-around; margin-top:4px;">
            ${this.dados.cervejas.map(b => `
              <div>${b.nome.split(' ')[0]}: <b style="color:var(--green-bright);">${f.galpaoEstoque[b.id] || 0} un</b></div>
            `).join('')}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  renderPrecos() {
    const grid = document.getElementById('grid-cervejas');
    grid.innerHTML = "";

    this.dados.cervejas.forEach(b => {
      const card = document.createElement('div');
      card.className = "card";
      card.innerHTML = `
        <div class="card-top">
          <div>
            <div class="card-title">${b.nome}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${b.estilo}</div>
          </div>
          <span class="tag-small">Custo Insumos: R$ ${b.custoInsumo.toFixed(2)}</span>
        </div>

        <div class="control-field">
          <div class="control-head">
            <span>Preço na Prateleira:</span>
            <span style="font-size:1.1rem; color:var(--green-bright); font-weight:900;">R$ ${b.preco.toFixed(2)}</span>
          </div>
          <input type="range" min="4" max="28" step="0.5" value="${b.preco}"
            oninput="window.tycoon.setPreco('${b.id}', this.value, this)">
        </div>

        <div style="font-size:0.75rem; color:var(--text-muted); display:flex; justify-content:space-between;">
          <span>Margem Bruta Unitária:</span>
          <b style="color:#fff;">R$ ${(b.preco - b.custoInsumo).toFixed(2)} (${Math.round(((b.preco - b.custoInsumo) / b.preco) * 100)}%)</b>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  renderMetas() {
    const grid = document.getElementById('grid-metas');
    grid.innerHTML = "";

    this.dados.metas.forEach(m => {
      const card = document.createElement('div');
      card.className = `meta-card ${m.status === 'pronta' ? 'ready' : ''} ${m.status === 'resgatada' ? 'claimed' : ''}`;
      card.innerHTML = `
        <div>
          <div style="font-weight:900; font-size:0.95rem;">${m.titulo}</div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${m.desc}</div>
          <div style="font-size:0.72rem; color:var(--amber-bright); margin-top:4px;">
            Recompensa: <b>R$ ${m.premio.toLocaleString('pt-BR')}</b>
          </div>
        </div>
        <div>
          ${m.status === 'resgatada' ? '<span class="tag-small">Concluída ✔️</span>' : ''}
          ${m.status === 'ativa' ? `<span class="tag-small">${m.progresso}/${m.meta}</span>` : ''}
          ${m.status === 'pronta' ? `<button class="btn-claim" onclick="window.tycoon.resgatarMeta('${m.id}')">Resgatar 💰</button>` : ''}
        </div>
      `;
      grid.appendChild(card);
    });
  }

  renderDRE() {
    const container = document.getElementById('dre-container');
    if (!this.dados.historicoDRE || this.dados.historicoDRE.length === 0) {
      container.innerHTML = `<p class="text-muted">Nenhum fechamento realizado ainda. Passe o mês para auditar.</p>`;
      return;
    }

    const ult = this.dados.historicoDRE[this.dados.historicoDRE.length - 1];
    container.innerHTML = `
      <div class="dre-strip">
        <div style="font-weight:900; font-size:1rem; margin-bottom:8px;">Balanço Auditado do Mês ${ult.mes}</div>
        <div class="dre-row positive"><span>(+) Receita Bruta de Vendas</span><b>R$ ${ult.recBruta.toFixed(2)}</b></div>
        <div class="dre-row negative"><span>(-) Custos de Brassagem & Malte (CPV)</span><b>-R$ ${ult.custoInsumos.toFixed(2)}</b></div>
        <div class="dre-row negative"><span>(-) Fretes e Transporte Rodoviário</span><b>-R$ ${ult.custoFrete.toFixed(2)}</b></div>
        <div class="dre-row negative"><span>(-) Armazenagem de Sobras de Galpão</span><b>-R$ ${ult.custoGalpao.toFixed(2)}</b></div>
        <div class="dre-row negative"><span>(-) Manutenção dos Tanques Fabris</span><b>-R$ ${ult.custoManut.toFixed(2)}</b></div>
        <div class="dre-row negative"><span>(-) Investimento em Publicidade Regional</span><b>-R$ ${ult.custoMkt.toFixed(2)}</b></div>
        <hr class="dre-divider">
        <div class="dre-row result">
          <span>(=) RESULTADO LÍQUIDO DO EXERCÍCIO</span>
          <b style="color:${ult.lucroLiquido >= 0 ? 'var(--green-bright)' : 'var(--red)'};">
            ${ult.lucroLiquido >= 0 ? '+' : ''}R$ ${ult.lucroLiquido.toFixed(2)}
          </b>
        </div>
      </div>
    `;
  }

  // --- CONTROLES EM TEMPO REAL ---

  setRemessa(cidId, bevId, val, inputEl) {
    const cid = this.dados.cidades.find(c => c.id === cidId);
    if (cid) {
      cid.remessaMensal[bevId] = parseInt(val, 10);
      inputEl.previousElementSibling.lastElementChild.textContent = `${val} un`;
      this.salvar();
    }
  }

  setMarketing(cidId, val, inputEl) {
    const cid = this.dados.cidades.find(c => c.id === cidId);
    if (cid) {
      cid.marketing = parseInt(val, 10);
      inputEl.previousElementSibling.lastElementChild.textContent = `R$ ${val}`;
      this.salvar();
    }
  }

  setBrassagem(fabId, bevId, val, inputEl) {
    const fab = this.dados.fabricas.find(f => f.id === fabId);
    if (fab) {
      fab.ordemBrassagem[bevId] = parseInt(val, 10);
      inputEl.previousElementSibling.lastElementChild.textContent = `${val} barris`;
      this.salvar();
      this.renderFabricas(); // reavalia total dos tanques
    }
  }

  setPreco(bevId, val, inputEl) {
    const b = this.dados.cervejas.find(bev => bev.id === bevId);
    if (b) {
      b.preco = parseFloat(val);
      inputEl.previousElementSibling.lastElementChild.textContent = `R$ ${parseFloat(val).toFixed(2)}`;
      this.salvar();
    }
  }

  expandirTanques(fabId) {
    const fab = this.dados.fabricas.find(f => f.id === fabId);
    const custo = 15000;
    if (this.dados.caixa < custo) {
      SFX.alert();
      alert("Caixa insuficiente para expandir tanques! Custo: R$ 15.000.");
      return;
    }
    this.dados.caixa -= custo;
    fab.capacidadeTanques += 500;
    fab.nivelTanques += 1;
    SFX.coin();
    this.salvar();
    this.atualizarTudo();
  }

  comprarFabrica() {
    const custo = 30000;
    if (this.dados.caixa < custo) {
      SFX.alert();
      alert("Construir uma nova cervejaria requer R$ 30.000 em caixa.");
      return;
    }

    const livres = this.dados.cidades.filter(c => !this.dados.fabricas.some(f => f.cidadeId === c.id));
    if (livres.length === 0) {
      alert("Você já construiu fábricas em todas as praças do país!");
      return;
    }

    const destino = livres[0];
    this.dados.caixa -= custo;
    this.dados.fabricas.push({
      id: "fab_" + destino.id,
      cidadeId: destino.id,
      capacidadeTanques: 1000,
      nivelTanques: 1,
      galpaoEstoque: { pilsen: 100, ipa: 50, bock: 0 },
      ordemBrassagem: { pilsen: 400, ipa: 200, bock: 0 }
    });

    SFX.coin();
    this.salvar();
    this.atualizarTudo();
    alert(`🎉 Nova fábrica construída em ${destino.nome}!`);
  }

  resgatarMeta(metaId) {
    const m = this.dados.metas.find(meta => meta.id === metaId);
    if (m && m.status === 'pronta') {
      m.status = 'resgatada';
      this.dados.caixa += m.premio;
      SFX.fanfare();
      this.salvar();
      this.atualizarTudo();
      alert(`🏆 Recompensa Resgatada! +R$ ${m.premio.toLocaleString('pt-BR')} adicionados ao caixa.`);
    }
  }

  // --- MOTOR ECONÔMICO PRINCIPAL (VIRADA DO MÊS) ---

  fecharMes() {
    SFX.coin();

    // 1. Fabricação & Validação de Tanques
    let custoInsumos = 0;
    this.dados.fabricas.forEach(fab => {
      // Limita ao teto da fábrica
      const totalPedido = Object.values(fab.ordemBrassagem).reduce((a, b) => a + b, 0);
      const fatorCapacidade = totalPedido > fab.capacidadeTanques ? (fab.capacidadeTanques / totalPedido) : 1;

      this.dados.cervejas.forEach(b => {
        const programado = Math.round((fab.ordemBrassagem[b.id] || 0) * fatorCapacidade);
        const custo = programado * b.custoInsumo;

        if (this.dados.caixa >= custo && programado > 0) {
          this.dados.caixa -= custo;
          custoInsumos += custo;
          fab.galpaoEstoque[b.id] = (fab.galpaoEstoque[b.id] || 0) + programado;
        }
      });
    });

    // 2. Coleta de Estoque Central para Distribuição
    let estoqueTotalDisponivel = { pilsen: 0, ipa: 0, bock: 0 };
    this.dados.fabricas.forEach(fab => {
      this.dados.cervejas.forEach(b => {
        estoqueTotalDisponivel[b.id] += (fab.galpaoEstoque[b.id] || 0);
      });
    });

    // 3. Distribuição & Vendas por Cidade
    let recBruta = 0;
    let custoFrete = 0;
    let custoMkt = 0;
    let totalBarrisVendidos = 0;
    let logsAuditoria = [];

    this.dados.cidades.forEach(c => {
      // Desconta Marketing
      if (this.dados.caixa >= c.marketing) {
        this.dados.caixa -= c.marketing;
        custoMkt += c.marketing;
      }

      let vendidosNaCidade = 0;
      let faturadoNaCidade = 0;
      let faltouCerveja = false;

      this.dados.cervejas.forEach(b => {
        const planejado = c.remessaMensal[b.id] || 0;
        if (planejado <= 0) return;

        // Limita ao que existe fisicamente nos galpões
        const despachado = Math.min(planejado, estoqueTotalDisponivel[b.id]);
        if (despachado < planejado) faltouCerveja = true;

        estoqueTotalDisponivel[b.id] -= despachado;

        // Custo de frete por barril despachado
        const frete = Math.round(despachado * 0.85);
        this.dados.caixa -= frete;
        custoFrete += frete;

        // Simulação Cultural de Demanda
        const afinidade = c.afinidades[b.id] || 1.0;
        const fatorPreco = b.preco <= c.toleranciaPreco 
          ? 1.0 
          : Math.max(0.15, 1 - ((b.preco - c.toleranciaPreco) / c.toleranciaPreco));
        const bonusMkt = 1 + (c.marketing / 2000);

        const scoreAtracao = afinidade * fatorPreco * bonusMkt;
        const capacidadeAbsorcao = Math.round((c.demandaBase / 3) * scoreAtracao * (c.sharePlayer / 50));

        const vendidos = Math.min(despachado, capacidadeAbsorcao);
        const faturamento = vendidos * b.preco;

        recBruta += faturamento;
        faturadoNaCidade += faturamento;
        vendidosNaCidade += vendidos;
        totalBarrisVendidos += vendidos;

        // O que não vendeu na cidade volta para o estoque disponível
        const sobrou = despachado - vendidos;
        estoqueTotalDisponivel[b.id] += sobrou;
      });

      // Atualiza Market Share
      if (vendidosNaCidade > 150) {
        c.sharePlayer = Math.min(85, c.sharePlayer + 3);
      } else if (vendidosNaCidade === 0) {
        c.sharePlayer = Math.max(5, c.sharePlayer - 2);
      }

      logsAuditoria.push(`
        <div>
          <b>📍 ${c.nome}:</b> Vendeu <b>${vendidosNaCidade} barris</b> (Faturamento: R$ ${faturadoNaCidade.toFixed(2)}).
          ${faltouCerveja ? '<span style="color:var(--red);">⚠️ RUPTURA: Seus galpões não tinham estoque suficiente para suprir o pedido!</span>' : ''}
        </div>
      `);
    });

    // Devolve o estoque restante para os galpões das fábricas
    this.dados.fabricas.forEach((fab, i) => {
      this.dados.cervejas.forEach(b => {
        // Distribuição uniforme do estoque remanescente
        fab.galpaoEstoque[b.id] = Math.floor(estoqueTotalDisponivel[b.id] / this.dados.fabricas.length);
      });
    });

    // 4. Custos Fixos: Armazenagem de Estoque e Manutenção de Tanques
    let totalBarrisArmazenados = 0;
    this.dados.fabricas.forEach(fab => {
      totalBarrisArmazenados += Object.values(fab.galpaoEstoque).reduce((a, b) => a + b, 0);
    });
    const custoGalpao = Math.round(totalBarrisArmazenados * 0.50); // R$ 0,50 por barril parado
    const custoManut = this.dados.fabricas.length * 800; // R$ 800 por fábrica

    this.dados.caixa += recBruta;
    this.dados.caixa -= (custoGalpao + custoManut);

    const lucroLiquido = recBruta - (custoInsumos + custoFrete + custoGalpao + custoManut + custoMkt);

    // 5. Registro Contábil DRE
    const registroDRE = {
      mes: this.dados.mes,
      recBruta,
      custoInsumos,
      custoFrete,
      custoGalpao,
      custoManut,
      custoMkt,
      lucroLiquido
    };
    this.dados.historicoDRE.push(registroDRE);

    // 6. Auditoria de Metas
    this.avaliarMetas(totalBarrisVendidos);

    // 7. Próximo Mês & Exibição
    this.dados.mes += 1;
    this.salvar();
    this.atualizarTudo();

    this.exibirModalBalanco(registroDRE, logsAuditoria);
  }

  avaliarMetas(totalBarrisVendidos) {
    this.dados.metas.forEach(m => {
      if (m.status !== 'ativa') return;

      if (m.id === 'm1') {
        m.progresso = totalBarrisVendidos;
        if (m.progresso >= m.meta) m.status = 'pronta';
      }
      if (m.id === 'm2') {
        const rj = this.dados.cidades.find(c => c.id === 'rj');
        m.progresso = rj ? rj.sharePlayer : 0;
        if (m.progresso >= m.meta) m.status = 'pronta';
      }
      if (m.id === 'm3') {
        m.progresso = Math.round(this.dados.caixa);
        if (m.progresso >= m.meta) m.status = 'pronta';
      }
      if (m.id === 'm4') {
        m.progresso = this.dados.fabricas.length;
        if (m.progresso >= m.meta) m.status = 'pronta';
      }
    });
  }

  exibirModalBalanco(dre, logs) {
    document.getElementById('modal-titulo').textContent = `Balanço Auditado — Mês ${dre.mes}`;
    document.getElementById('m-rec-bruta').textContent = `+R$ ${dre.recBruta.toFixed(2)}`;
    document.getElementById('m-custo-insumos').textContent = `-R$ ${dre.custoInsumos.toFixed(2)}`;
    document.getElementById('m-custo-frete').textContent = `-R$ ${dre.custoFrete.toFixed(2)}`;
    document.getElementById('m-custo-galpao').textContent = `-R$ ${dre.custoGalpao.toFixed(2)}`;
    document.getElementById('m-custo-manut').textContent = `-R$ ${dre.custoManut.toFixed(