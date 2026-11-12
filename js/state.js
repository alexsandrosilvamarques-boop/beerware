/**
 * BEERWARE — MÓDULO DE ESTADO
 * Responsabilidade: Criar, validar, persistir e fornecer acesso aos dados do jogador.
 */

(function() {
  const Data = window.BeerwareData;

  class StateManager {
    constructor() {
      this.estado = null;
    }

    criarEstadoInicial() {
      return {
        versao: Data.VERSAO_ESTADO,
        caixa: Data.CONFIG_BASE.SALDO_INICIAL,
        mes: 1,
        historicoDRE: [],
        cervejas: Data.CATALOGO_CERVEJAS.map(c => ({
          id: c.id,
          nome: c.nome,
          estilo: c.estilo,
          custoInsumo: c.custoInsumo,
          preco: c.precoPadrao
        })),
        cidades: Data.CATALOGO_CIDADES.map(cid => ({
          id: cid.id,
          nome: cid.nome,
          clima: cid.clima,
          populacao: cid.populacao,
          perfilTexto: cid.perfilTexto,
          demandaBase: cid.demandaBase,
          toleranciaPreco: cid.toleranciaPreco,
          afinidades: { ...cid.afinidades },
          remessaMensal: { ...cid.remessaPadrao },
          marketing: cid.marketingPadrao,
          sharePlayer: 10
        })),
        fabricas: [
          {
            id: "fab_sp",
            cidadeId: "sp",
            capacidadeTanques: Data.CONFIG_BASE.CAPACIDADE_TANQUE_BASE,
            nivelTanques: 1,
            galpaoEstoque: { pilsen: 100, ipa: 50, bock: 0 },
            ordemBrassagem: { pilsen: 600, ipa: 300, bock: 100 }
          }
        ],
        metas: Data.METAS_INICIAIS.map(m => ({ ...m }))
      };
    }

    validar(dados) {
      if (!dados || typeof dados !== "object") return false;
      if (dados.versao !== Data.VERSAO_ESTADO) return false;
      if (typeof dados.caixa !== "number" || isNaN(dados.caixa)) return false;
      if (!Array.isArray(dados.cervejas) || !Array.isArray(dados.cidades) || !Array.isArray(dados.fabricas)) return false;
      return true;
    }

    carregar() {
      try {
        const salvo = localStorage.getItem(Data.CHAVE_STORAGE);
        if (salvo) {
          const parsed = JSON.parse(salvo);
          if (this.validar(parsed)) {
            this.estado = parsed;
            return this.estado;
          }
        }
      } catch (e) {
        console.warn("⚠️ Recuperando com fallback limpo...");
      }

      this.estado = this.criarEstadoInicial();
      this.salvar();
      return this.estado;
    }

    salvar() {
      try {
        if (this.estado) {
          localStorage.setItem(Data.CHAVE_STORAGE, JSON.stringify(this.estado));
        }
      } catch (e) {
        console.error("Erro ao salvar:", e);
      }
    }

    resetar() {
      try {
        localStorage.removeItem(Data.CHAVE_STORAGE);
      } catch (e) {}
      this.estado = this.criarEstadoInicial();
      this.salvar();
      return this.estado;
    }

    get() {
      return this.estado;
    }

    calcularPatrimonio() {
      let valorEstoque = 0;
      this.estado.fabricas.forEach(f => {
        this.estado.cervejas.forEach(b => {
          valorEstoque += (f.galpaoEstoque[b.id] || 0) * b.custoInsumo;
        });
      });
      const valorFabricas = this.estado.fabricas.length * Data.CONFIG_BASE.CUSTO_NOVA_FABRICA;
      return this.estado.caixa + valorEstoque + valorFabricas;
    }
  }

  window.BeerwareState = new StateManager();
})();