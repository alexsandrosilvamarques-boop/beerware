import { Economia } from './engine/economia.js';
import { Reputacao } from './engine/reputacao.js';
import { simularConsumo } from './engine/simularRodada.js';

class GameApp {
  constructor() {
    this.mesAtual = 1;
    this.economia = new Economia(50000);
    this.reputacao = new Reputacao(50);

    // Estado interno do jogador
    this.fabricas = []; // Guarda objetos de cidades onde tem fábrica
    this.ordensLogistica = []; // Fila de distribuição para a rodada

    // Caches dos arquivos externos
    this.dataCidades = [];
    this.dataCervejas = [];
    this.dataEventos = [];
    this.lang = {};

    this.custoFabrica = 20000;
  }

  async init() {
    await this.carregarRecursos();
    this.setupEventListeners();
    this.atualizarInterface();
    this.log("Bem-vindo ao Beerware! Construa sua primeira fábrica para começar.");
  }

  async carregarRecursos() {
    try {
      const [resCidades, resCervejas, resEventos, resLang] = await Promise.all([
        fetch('data/cidades.json').then(r => r.json()),
        fetch('data/cervejas.json').then(r => r.json()),
        fetch('data/eventos.json').then(r => r.json()),
        fetch('lang/pt-br.json').then(r => r.json())
      ]);

      this.dataCidades = resCidades;
      this.dataCervejas = resCervejas;
      this.dataEventos = resEventos;
      this.lang = resLang;

      this.popularSeletores();
    } catch (err) {
      console.error("Falha ao carregar dados JSON:", err);
      alert("Erro ao carregar dados do jogo. Certifique-se de estar rodando em um servidor local.");
    }
  }

  popularSeletores() {
    const selFactoryCity = document.getElementById('select-factory-city');
    const selTargetCity = document.getElementById('select-target-city');
    const selBeer = document.getElementById('select-beer');

    selFactoryCity.innerHTML = '';
    selTargetCity.innerHTML = '';
    selBeer.innerHTML = '';

    this.dataCidades.forEach(c => {
      selFactoryCity.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
      selTargetCity.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    });

    this.dataCervejas.forEach(b => {
      selBeer.innerHTML += `<option value="${b.id}">${b.nome} (R$ ${b.precoVendaPadrao.toFixed(2)})</option>`;
    });
  }

  setupEventListeners() {
    document.getElementById('btn-build-factory').addEventListener('click', () => this.construirFabrica());
    document.getElementById('btn-dispatch').addEventListener('click', () => this.enviarCerveja());
    document.getElementById('btn-advance-turn').addEventListener('click', () => this.processarRodada());
  }

  construirFabrica() {
    const cidadeId = document.getElementById('select-factory-city').value;
    const cidade = this.dataCidades.find(c => c.id === cidadeId);

    if (this.fabricas.some(f => f.cidadeId === cidadeId)) {
      alert("Você já possui uma fábrica nesta cidade!");
      return;
    }

    if (this.economia.debitar(this.custoFabrica, "Construção de Fábrica")) {
      this.fabricas.push({
        cidadeId: cidade.id,
        nomeCidade: cidade.nome,
        capacidadePorRodada: 200
      });
      this.log(`Fábrica construída com sucesso em ${cidade.nome}! (-R$ ${this.custoFabrica})`);
      this.atualizarListaFabricas();
      this.atualizarInterface();
    } else {
      alert("Saldo insuficiente para construir fábrica!");
    }
  }

  atualizarListaFabricas() {
    const selOrigem = document.getElementById('select-source-factory');
    const factoryListDiv = document.getElementById('factory-list');

    selOrigem.innerHTML = '';
    if (this.fabricas.length === 0) {
      factoryListDiv.innerHTML = "Nenhuma fábrica ativa.";
      return;
    }

    factoryListDiv.innerHTML = this.fabricas
      .map(f => `• Fábrica ${f.nomeCidade} (Capacidade: ${f.capacidadePorRodada} un/mês)`)
      .join('<br>');

    this.fabricas.forEach(f => {
      selOrigem.innerHTML += `<option value="${f.cidadeId}">${f.nomeCidade}</option>`;
    });
  }

  enviarCerveja() {
    if (this.fabricas.length === 0) {
      alert("Você precisa ter pelo menos uma fábrica antes de despachar produto!");
      return;
    }

    const cidadeOrigemId = document.getElementById('select-source-factory').value;
    const cidadeDestinoId = document.getElementById('select-target-city').value;
    const cervejaId = document.getElementById('select-beer').value;
    const quantidade = parseInt(document.getElementById('input-amount').value, 10);

    const cidadeOrigem = this.dataCidades.find(c => c.id === cidadeOrigemId);
    const distancia = cidadeOrigem.distancias[cidadeDestinoId] ?? 200;
    const frete = this.economia.calcularCustoFrete(distancia, quantidade);

    if (!this.economia.podeGastar(frete)) {
      alert("Saldo insuficiente para pagar o frete logístico!");
      return;
    }

    this.economia.debitar(frete, "Custo Logístico de Frete");
    
    // Registra a remessa para ser vendida na virada do mês
    this.ordensLogistica.push({
      cidadeOrigemId,
      cidadeDestinoId,
      cervejaId,
      quantidade,
      fretePago: frete
    });

    this.log(`Remessa agendada: ${quantidade} un. para ${cidadeDestinoId.toUpperCase()} (Frete pago: R$ ${frete.toFixed(2)})`);
    this.atualizarInterface();
  }

  processarRodada() {
    this.log(`--- Processando Mês ${this.mesAtual} ---`);

    // 1. Processar vendas das ordens despachadas
    let receitaMes = 0;
    this.ordensLogistica.forEach(ordem => {
      const cidade = this.dataCidades.find(c => c.id === ordem.cidadeDestinoId);
      const cerveja = this.dataCervejas.find(b => b.id === ordem.cervejaId);
      
      const resultado = simularConsumo(
        cidade,
        cerveja,
        ordem.quantidade,
        this.reputacao.getMultiplicadorMercado()
      );

      this.economia.creditar(resultado.receita);
      receitaMes += resultado.receita;

      this.log(`Vendas em ${cidade.nome}: ${resultado.unidadesVendidas}/${ordem.quantidade} barris de ${cerveja.nome}. Faturamento: R$ ${resultado.receita.toFixed(2)}.`);

      if (resultado.sobraEstoque > 0) {
        this.log(`Aviso: ${resultado.sobraEstoque} barris sobraram em ${cidade.nome} e foram descartados.`);
      }
    });

    // Limpa remessas entregues
    this.ordensLogistica = [];

    // 2. Disparar evento aleatório ocasional
    this.verificarEventos();

    // 3. Atualizar Mês
    this.mesAtual += 1;
    this.atualizarInterface();
    this.log(`--- Fim do Mês. Lucro Bruto de Vendas: R$ ${receitaMes.toFixed(2)} ---`);
  }

  verificarEventos() {
    // Sorteia chance de ocorrer evento na rodada
    const eventoSorteado = this.dataEventos.find(evt => Math.random() < evt.chance);
    if (eventoSorteado) {
      this.log(`[EVENTO] ${eventoSorteado.titulo}: ${eventoSorteado.descricao}`);
    }
  }

  log(msg) {
    const box = document.getElementById('game-logs');
    const p = document.createElement('div');
    p.textContent = `> ${msg}`;
    box.appendChild(p);
    box.scrollTop = box.scrollHeight;
  }

  atualizarInterface() {
    document.getElementById('val-cash').textContent = `R$ ${this.economia.saldo.toFixed(2)}`;
    document.getElementById('val-turn').textContent = this.mesAtual;
    document.getElementById('val-reputation').textContent = `${this.reputacao.pontos}%`;
  }
}

// Inicializa a aplicação
window.addEventListener('DOMContentLoaded', () => {
  const app = new GameApp();
  app.init();
});