/**
 * BEERWARE TYCOON — CONFIGURAÇÕES E DADOS GERAIS
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
    { id: "pilsen", nome: "Pilsen Puro Malte", estilo: "Leve e Refrescante", custoInsumo: 2.50, preco: 8.00 },
    { id: "ipa", nome: "Mantiqueira IPA", estilo: "Cítrica & Amarga", custoInsumo: 5.50, preco: 16.00 },
    { id: "bock", nome: "Bock Imperial", estilo: "Maltada & Alcoólica", custoInsumo: 6.80, preco: 20.00 }
  ],
  cidades: [
    {
      id: "rj",
      nome: "Rio de Janeiro",
      clima: "☀️ Tropical Quente",
      populacao: "6.7M hab.",
      perfilTexto: "Exige cerveja leve bem gelada. Rejeita amargor alto e preços abusivos.",
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
      perfilTexto: "Mercado gigantesco e exigente. Alto consumo de IPAs artesanais.",
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
      perfilTexto: "Cultura botequeira tradicional. Foco em custo-benefício.",
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
      perfilTexto: "Clima frio. Alta procura por estilos maltados e encorpados.",
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