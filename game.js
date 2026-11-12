/**
 * BEERWARE — ENGINE REFEITA & EXPANDIDA
 * Sistema com áudio procedural (Web Audio API), concorrência e ciclo de estoque completo.
 */

// 1. Sintetizador de Som Retrô (Sem precisar carregar MP3s ou WAVs!)
const AudioFX = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
  },
  play(freq = 440, type = "sine", duration = 0.1) {
    try {
      this.init();
      if (this.ctx.state === "suspended") this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) { /* Navegadores que bloqueiam áudio automático */ }
  },
  coin() {
    this.play(987, "square", 0.08);
    setTimeout(() => this.play(1318, "square", 0.15), 80);
  },
  click() { this.play(300, "triangle", 0.04); },
  alert() { this.play(220, "sawtooth", 0.2); }
};

// 2. Base de Dados Confiável (Evita crash de CORS/JSON no GitHub e Celular)
const DB = {
  cervejas: [
    { id: "pilsen", nome: "Loirinha Carioca", tipo: "Pilsen Leve", sabor: 4, forca: 4, custo: 2.20, precoVenda: 7.50 },
    { id: "ipa", nome: "Lúpulo da Mantiqueira", tipo: "IPA Amarga", sabor: 9, forca: 7, custo: 5.00, precoVenda: 16.00 },
    { id: "bock", nome: "Bock Imperial Gaúcha", tipo: "Bock Encorpada", sabor: 8, forca: 9, custo: 6.20, precoVenda: 19.00 }
  ],
  cidades: [
    { id: "sp", nome: "São Paulo", pop: 12000000, demandaBase: 600, prefSabor: 8, prefForca: 6, maxPreco: 18.0, distancias: { sp: 0, rj: 430, bh: 580, cwb: 400 }, sharePlayer: 10, shareRival: 90 },
    { id: "rj", nome: "Rio de Janeiro", pop: 6700000, demandaBase: 450, prefSabor: 4, prefForca: 4, maxPreco: 14.0, distancias: { sp: 430, rj: 0, bh: 440, cwb: 850 }, sharePlayer: 10, shareRival: 90 },
    { id: "bh", nome: "Belo Horizonte", pop: 2500000, demandaBase: 380, prefSabor: 9, prefForca: 7, maxPreco: 13.0, distancias: { sp: 580, rj: 440, bh: 0, cwb: 980 }, sharePlayer: 10, shareRival: 90 },
    { id: "cwb", nome: "Curitiba", pop: 1900000, demandaBase: 300, prefSabor: 7, prefForca: 8, maxPreco: 17.0, distancias: { sp: 400, rj: 850, bh: 980, cwb: 0 }, sharePlayer: 10, shareRival: 90 }
  ],
  eventos: [
    { titulo: "Carnaval Fora de Época!", desc: "A procura por cervejas leves explode no Rio!", cidade: "rj", mult: 1.8 },
    { titulo: "Crise na Cadeia de Alumínio", desc: "Frete encareceu em todo território nacional.", cidade: "all", freteMult: 1.5 },
    { titulo: "Festival Gastronômico em BH", desc: "Bares mineiros pagam mais por IPAs aromáticas!", cidade: "bh", mult: 1.6 }
  ]
};

// 3. Estado Central do Jogo
class BeerEmpireGame {
  constructor() {
    this.caixa = 50000;
    this.mes = 1;
    this.reputacao = 50;
    this.lucroUltimoMes = 0;

    // Fábricas ativas do jogador (começa com uma em São Paulo para já começar jogando!)
    this.fabricas = [
      {
        id: "fab_sp",
        cidadeId: "sp",
        capacidadeLote: 250,
        estoque: { pilsen: 150, ipa: 50, bock: 0 }
      }
    ];

    // Fila de despachos aguardando fechamento do mês
    this.despachosPendentes = [];
  }

  init() {
    this.setupTabs();
    this.renderCidades();
    this.renderFabricas();
    this.popularSeletoresLogistica();
    this.atualizarHUD();
    this.setupEventosUI();
    this.log("🏢 Sua distribuidora iniciou operações! Você já possui uma fábrica em São Paulo.", "gold");
  }

  // --- NAVEGAÇÃO E TABS ---
  setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        AudioFX.click();
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
      });
    });
  }

  // --- RENDERIZADORES VISUAIS ---
  renderCidades() {
    const container = document.getElementById('cities-container');
    container.innerHTML = "";

    DB.cidades.forEach(c => {
      const card = document.createElement('div');
      card.className = "city-card";
      card.innerHTML = `
        <div class="city-header">
          <span class="city-name">${c.nome}</span>
          <span class="tag">Demanda: ${c.demandaBase} barris</span>
        </div>
        <div class="city-tags">
          <span class="tag">Pref. Sabor: ${c.prefSabor}/10</span>
          <span class="tag">Pref. Força: ${c.prefForca}/10</span>
          <span class="tag">Preço Máx: R$ ${c.maxPreco.toFixed(2)}</span>
        </div>
        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">
          Domínio de Mercado (Você vs MegaCerveja S/A):
        </div>
        <div class="market-share-bar">
          <div class="ms-player" style="width: ${c.sharePlayer}%;" title="Você: ${c.sharePlayer}%"></div>
          <div class="ms-rival" style="width: ${c.shareRival}%;" title="MegaCerveja: ${c.shareRival}%"></div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  renderFabricas() {
    const container = document.getElementById('breweries-container');
    container.innerHTML = "";

    if (this.fabricas.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted);">Nenhuma fábrica em operação.</p>`;
      return;
    }

    this.fabricas.forEach((fab, idx) => {
      const cidade = DB.cidades.find(c => c.id === fab.cidadeId);
      const card = document.createElement('div');
      card.className = "brewery-card";
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b>Fábrica #${idx + 1} — ${cidade.nome}</b>
          <span class="tag">Capacidade Lote: ${fab.capacidadeLote} un</span>
        </div>
        <div><b>Estoque no Galpão:</b></div>
        <div class="stock-grid">
          ${DB.cervejas.map(cerveja => `
            <div class="stock-box">
              <div style="font-size:0.75rem;">${cerveja.nome}</div>
              <div style="font-size:1.1rem; font-weight:bold; color:var(--gold);">
                ${fab.estoque[cerveja.id] || 0} <small style="font-size:0.6rem; color:#fff;">barris</small>
              </div>
              <button class="btn-accent" style="padding: 3px 6px; font-size: 0.7rem; width:100%; margin-top:4px;"
                onclick="window.jogo.produzirLote('${fab.id}', '${cerveja.id}')">
                Brassagem (+50)
                <br><small>R$ ${(cerveja.custo * 50).toFixed(0)}</small>
              </button>
            </div>
          `).join('')}
        </div>
      `;
      container.appendChild(card);
    });
  }

  popularSeletoresLogistica() {
    const selSource = document.getElementById('log-source');
    const selBeer = document.getElementById('log-beer');
    const selTarget = document.getElementById('log-target');

    selSource.innerHTML = this.fabricas.map(f => {
      const c = DB.cidades.find(cid => cid.id === f.cidadeId);
      return `<option value="${f.id}">${c.nome}</option>`;
    }).join('');

    selBeer.innerHTML = DB.cervejas.map(b => 
      `<option value="${b.id}">${b.nome} (Venda: R$ ${b.precoVenda.toFixed(2)})</option>`
    ).join('');

    selTarget.innerHTML = DB.cidades.map(c => 
      `<option value="${c.id}">${c.nome}</option>`
    ).join('');

    this.recalcularEstimativaLogistica();
  }

  // --- REGRAS DE PRODUÇÃO E EXPANSÃO ---
  produzirLote(fabricaId, cervejaId) {
    const fabrica = this.fabricas.find(f => f.id === fabricaId);
    const cerveja = DB.cervejas.find(b => b.id === cervejaId);
    const qtd = 50;
    const custo = cerveja.custo * qtd;

    if (this.caixa < custo) {
      AudioFX.alert();
      alert("Caixa insuficiente para cobrir os insumos (malte, lúpulo e levedura)!");
      return;
    }

    this.caixa -= custo;
    fabrica.estoque[cervejaId] = (fabrica.estoque[cervejaId] || 0) + qtd;

    AudioFX.coin();
    this.log(`🏭 Produzidos 50 barris de ${cerveja.nome} por R$ ${custo.toFixed(2)}.`, "green");
    this.renderFabricas();
    this.atualizarHUD();
  }

  construirNovaFabrica() {
    const custo = 20000;
    if (this.caixa < custo) {
      AudioFX.alert();
      alert("Você precisa de R$ 20.000 para instalar uma nova fábrica!");
      return;
    }

    // Acha a primeira cidade sem fábrica
    const cidadesSemFabrica = DB.cidades.filter(c => !this.fabricas.some(f => f.cidadeId === c.id));
    if (cidadesSemFabrica.length === 0) {
      alert("Você já possui fábricas em todas as praças disponíveis!");
      return;
    }

    const destino = cidadesSemFabrica[0];
    this.caixa -= custo;
    this.fabricas.push({
      id: "fab_" + destino.id,
      cidadeId: destino.id,
      capacidadeLote: 250,
      estoque: { pilsen: 50, ipa: 0, bock: 0 }
    });

    AudioFX.coin();
    this.log(`🎉 Nova fábrica inaugurada em ${destino.nome}! (-R$ 20.000)`, "gold");
    this.renderFabricas();
    this.popularSeletoresLogistica();
    this.atualizarHUD();
  }

  // --- LOGÍSTICA ---
  recalcularEstimativaLogistica() {
    const selSource = document.getElementById('log-source').value;
    const selTarget = document.getElementById('log-target').value;
    const selBeer = document.getElementById('log-beer').value;
    const qtd = parseInt(document.getElementById('log-amount').value, 10) || 0;

    const fabrica = this.fabricas.find(f => f.id === selSource);
    if (!fabrica) return;

    const cidadeOrigem = DB.cidades.find(c => c.id === fabrica.cidadeId);
    const distancia = cidadeOrigem.distancias[selTarget] ?? 200;
    const frete = Math.round(30 + (distancia * 0.04 * (qtd / 5)));
    
    const cerveja = DB.cervejas.find(b => b.id === selBeer);
    const receitaEst = cerveja ? cerveja.precoVenda * qtd : 0;

    document.getElementById('est-frete').textContent = `R$ ${frete.toFixed(2)}`;
    document.getElementById('est-receita').textContent = `R$ ${receitaEst.toFixed(2)}`;
  }

  despacharCarga() {
    const fabId = document.getElementById('log-source').value;
    const cervejaId = document.getElementById('log-beer').value;
    const cidadeDestinoId = document.getElementById('log-target').value;
    const qtd = parseInt(document.getElementById('log-amount').value, 10);

    const fabrica = this.fabricas.find(f => f.id === fabId);
    if (!fabrica || (fabrica.estoque[cervejaId] || 0) < qtd) {
      AudioFX.alert();
      alert("Estoque insuficiente na fábrica selecionada! Realize uma brassagem antes.");
      return;
    }

    const cidadeOrigem = DB.cidades.find(c => c.id === fabrica.cidadeId);
    const distancia = cidadeOrigem.distancias[cidadeDestinoId] ?? 200;
    const frete = Math.round(30 + (distancia * 0.04 * (qtd / 5)));

    if (this.caixa < frete) {
      AudioFX.alert();
      alert("Sem saldo em caixa para pagar as transportadoras!");
      return;
    }

    // Debita estoque e frete
    this.caixa -= frete;
    fabrica.estoque[cervejaId] -= qtd;

    this.despachosPendentes.push({
      cidadeDestinoId,
      cervejaId,
      quantidade: qtd,
      frete
    });

    AudioFX.click();
    this.atualizarListaDespachos();
    this.renderFabricas();
    this.atualizarHUD();
    this.log(`🚛 Carga despachada para ${cidadeDestinoId.toUpperCase()}! Frete pago: R$ ${frete}.`, "green");
  }

  atualizarListaDespachos() {
    const list = document.getElementById('dispatch-queue-list');
    list.innerHTML = this.despachosPendentes.map((d, i) => {
      const c = DB.cidades.find(cid => cid.id === d.cidadeDestinoId);
      const b = DB.cervejas.find(bev => bev.id === d.cervejaId);
      return `<li><span>${d.quantidade} un. de <b>${b.nome}</b> $\\rightarrow$ ${c.nome}</span> <span>Aguardando virada</span></li>`;
    }).join('');
  }

  // --- MOTOR DE VENDAS E SIMULAÇÃO DE RODADA ---
  processarViradaMes() {
    AudioFX.coin();
    this.log(`\n================= FECHAMENTO DO MÊS ${this.mes} =================`, "gold");

    let faturamentoTotal = 0;

    // 1. Simular Vendas dos Despachos
    this.despachosPendentes.forEach(carga => {
      const cidade = DB.cidades.find(c => c.id === carga.cidadeDestinoId);
      const cerveja = DB.cervejas.find(b => b.id === carga.cervejaId);

      // Algoritmo de Afinidade: Sabor + Força + Preço vs Perfil da Cidade
      const afinidadeSabor = 1 - Math.abs(cerveja.sabor - cidade.prefSabor) / 10;
      const afinidadeForca = 1 - Math.abs(cerveja.forca - cidade.prefForca) / 10;
      const fatorPreco = cerveja.precoVenda <= cidade.maxPreco ? 1.0 : Math.max(0.2, 1 - (cerveja.precoVenda - cidade.maxPreco) / 10);
      
      const reputacaoMult = (this.reputacao / 50);
      const score = Math.max(0.1, (afinidadeSabor * 0.4 + afinidadeForca * 0.3 + fatorPreco * 0.3) * reputacaoMult);

      // Quantidade que o mercado absorveu
      const absorcaoMercado = Math.round(cidade.demandaBase * score);
      const vendidos = Math.min(carga.quantidade, absorcaoMercado);
      const faturamento = vendidos * cerveja.precoVenda;

      faturamentoTotal += faturamento;
      this.caixa += faturamento;

      // Ganho/Perda de Market Share
      const ganhoShare = Math.min(15, Math.round((vendidos / cidade.demandaBase) * 20));
      cidade.sharePlayer = Math.min(85, cidade.sharePlayer + ganhoShare);
      cidade.shareRival = 100 - cidade.sharePlayer;

      this.log(`📍 ${cidade.nome}: Vendeu ${vendidos}/${carga.quantidade} barris de ${cerveja.nome}. Faturamento: +R$ ${faturamento.toFixed(2)}.`, "green");

      if (carga.quantidade > vendidos) {
        this.log(`⚠️ Encalhe: ${carga.quantidade - vendidos} barris estragaram nos depósitos de ${cidade.nome}.`, "red");
      }
    });

    this.despachosPendentes = [];
    this.atualizarListaDespachos();

    // 2. Eventos Dinâmicos Aleatórios
    if (Math.random() < 0.4) {
      const evt = DB.eventos[Math.floor(Math.random() * DB.eventos.length)];
      document.getElementById('news-text').textContent = `${evt.titulo} — ${evt.desc}`;
      this.log(`📰 NOTÍCIA: ${evt.titulo} (${evt.desc})`, "gold");
    }

    // 3. Atualizar Estado
    this.lucroUltimoMes = faturamentoTotal;
    this.mes += 1;
    this.renderCidades();
    this.renderFabricas();
    this.atualizarHUD();
  }

  atualizarHUD() {
    document.getElementById('hud-cash').textContent = `R$ ${this.caixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('hud-month').textContent = this.mes;
    document.getElementById('hud-rep').textContent = `${this.reputacao}★`;
    document.getElementById('hud-last-profit').textContent = `+R$ ${this.lucroUltimoMes.toFixed(2)}`;
  }

  log(msg, cor = "") {
    const terminal = document.getElementById('game-logs');
    const el = document.createElement('div');
    el.className = `log-entry ${cor}`;
    el.textContent = `> ${msg}`;
    terminal.appendChild(el);
    terminal.scrollTop = terminal.scrollHeight;
  }

  setupEventosUI() {
    document.getElementById('btn-next-turn').addEventListener('click', () => this.processarViradaMes());
    document.getElementById('btn-open-modal-build').addEventListener('click', () => this.construirNovaFabrica());
    document.getElementById('btn-dispatch-beer').addEventListener('click', () => this.despacharCarga());

    // Recalcular custos na tela de logística ao mexer nos campos
    ['log-source', 'log-target', 'log-beer', 'log-amount'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => this.recalcularEstimativaLogistica());
      document.getElementById(id).addEventListener('input', () => this.recalcularEstimativaLogistica());
    });
  }
}

// Inicializa o jogo globalmente
window.addEventListener('DOMContentLoaded', () => {
  window.jogo = new BeerEmpireGame();
  window.jogo.init();
});