/**
 * BEERWARE — GERENCIADOR DE ESTADO E PERSISTÊNCIA
 * Responsável por criar, validar, modificar e persistir o estado no localStorage.
 */

import {
  VERSAO_ESTADO,
  CHAVE_STORAGE,
  CONFIG_BASE,
  CATALOGO_CERVEJAS,
  CATALOGO_CIDADES,
  METAS_INICIAIS
} from "./data.js";

class StateManager {
  constructor() {
    this.estado = null;
  }

  // Gera um estado virgem completo e seguro
  criarEstadoInicial() {
    return {
      versao: VERSAO_ESTADO,
      caixa: CONFIG_BASE.SALDO_INICIAL,
      mes: 1,
      historicoDRE: [],
      cervejas: CATALOGO_CERVEJAS.map(c => ({
        id: c.id,
        nome: c.nome,
        estilo: c.estilo,
        custoInsumo: c.custoInsumo,
        preco: c.precoPadrao
      })),
      cidades: CATALOGO_CIDADES.map(cid => ({
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
          capacidadeTanques: CONFIG_BASE.CAPACIDADE_TANQUE_BASE,
          nivelTanques: 1,
          galpaoEstoque: { pilsen: 100, ipa: 50, bock: 0 },
          ordemBrassagem: { pilsen: 600, ipa: 300, bock: 100 }
        }
      ],
      metas: METAS_INICIAIS.map(m => ({ ...m }))
    };
  }

  // Validador de integridade estrutural
  validarEstado(dados) {
    if (!dados || typeof dados !== "object") return false;
    if (dados.versao !== VERSAO_ESTADO) return false;
    if (typeof dados.caixa !== "number" || isNaN(dados.caixa)) return false;
    if (!Array.isArray(dados.cervejas) || dados.cervejas.length === 0) return false;
    if (!Array.isArray(dados.cidades) || dados.cidades.length === 0) return false;
    if (!Array.isArray(dados.fabricas) || dados.fabricas.length === 0) return false;
    return true;
  }

  carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE_STORAGE);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (this.validarEstado(parsed)) {
          this.estado = parsed;
          return this.estado;
        }
      }
    } catch (e) {
      console.warn("⚠️ Dados corrompidos no storage. Restaurando padrão de segurança.");
    }

    // Fallback: cria e salva novo estado limpo
    this.estado = this.criarEstadoInicial();
    this.salvar();
    return this.estado;
  }

  salvar() {
    try {
      if (this.estado) {
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(this.estado));
      }
    } catch (e) {
      console.error("❌ Erro ao salvar estado no localStorage:", e);
    }
  }

  resetar() {
    try {
      localStorage.removeItem(CHAVE_STORAGE);
    } catch (e) {}
    this.estado = this.criarEstadoInicial();
    this.salvar();
    return this.estado;
  }

  get() {
    return this.estado;
  }

  // Métodos de mutação seguros com auto-save
  atualizarCaixa(delta) {
    this.estado.caixa += delta;
    this.salvar();
  }

  calcularPatrimonio() {
    let valorEstoque = 0;
    this.estado.fabricas.forEach(f => {
      this.estado.cervejas.forEach(b => {
        valorEstoque += (f.galpaoEstoque[b.id] || 0) * b.custoInsumo;
      });
    });
    const valorImobilizado = this.estado.fabricas.length * CONFIG_BASE.CUSTO_NOVA_FABRICA;
    return this.estado.caixa + valorEstoque + valorImobilizado;
  }
}

export const state = new StateManager();