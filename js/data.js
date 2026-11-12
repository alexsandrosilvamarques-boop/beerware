/**
 * BEERWARE — MÓDULO DE DADOS
 * Responsabilidade: Catálogo imutável de configurações, cervejas, cidades e metas.
 */

window.BeerwareData = {
  VERSAO_ESTADO: 5,
  CHAVE_STORAGE: "beerware_save_modular_v5",

  CONFIG_BASE: Object.freeze({
    SALDO_INICIAL: 50000,
    CUSTO_NOVA_FABRICA: 30000,
    CUSTO_EXPANSAO_TANQUE: 15000,
    CAPACIDADE_TANQUE_BASE: 1000,
    INCREMENTO_TANQUE: 500,
    TAXA_ARMAZENAGEM_BARRIL: 0.50,
    MANUTENCAO_FABRICA_BASE: 800
  }),

  CATALOGO_CERVEJAS: Object.freeze([
    {
      id: "pilsen",
      nome: "Pilsen Puro Malte",
      estilo: "Leve e Refrescante",
      custoInsumo: 2.50,
      precoPadrao: 8.00,
      sabor: 4,
      forca: 4
    },
    {
      id: "ipa",
      nome: "Mantiqueira IPA",
      estilo: "Cítrica & Amarga",
      custoInsumo: 5.50,
      precoPadrao: 16.00,
      sabor: 9,
      forca: 7
    },
    {
      id: "bock",
      nome: "Bock Imperial",
      estilo: "Maltada & Encorpada",
      custoInsumo: 6.80,
      precoPadrao: 20.00,
      sabor: 8,
      forca: 9
    }
  ]),

  CATALOGO_CIDADES: Object.freeze([
    {
      id: "rj",
      nome: "Rio de Janeiro",
      clima: "☀️ Tropical Quente",
      populacao: "6.7M hab.",
      perfilTexto: "Exige cerveja leve trincando de gelada. Rejeita amargor alto e preços abusivos.",
      demandaBase: 1400,
      afinidades: { pilsen: 1.6, ipa: 0.5, bock: 0.3 },
      toleranciaPreco: 14.0,
      marketingPadrao: 500,
      remessaPadrao: { pilsen: 400, ipa: 0, bock: 0 }
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
      marketingPadrao: 1000,
      remessaPadrao: { pilsen: 300, ipa: 200, bock: 0 }
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
      marketingPadrao: 300,
      remessaPadrao: { pilsen: 100, ipa: 0, bock: 0 }
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
      marketingPadrao: 300,
      remessaPadrao: { pilsen: 0, ipa: 0, bock: 150 }
    }
  ]),

  METAS_INICIAIS: Object.freeze([
    { id: "m1", titulo: "Primeira Fornada", desc: "Vender 500 barris no total em um único mês.", meta: 500, progresso: 0, premio: 8000, status: "ativa" },
    { id: "m2", titulo: "Invasão Carioca", desc: "Alcançar 25% de Market Share no Rio de Janeiro.", meta: 25, progresso: 10, premio: 15000, status: "ativa" },
    { id: "m3", titulo: "Barão do Malte", desc: "Acumular R$ 100.000 em caixa livre.", meta: 100000, progresso: 50000, premio: 25000, status: "ativa" },
    { id: "m4", titulo: "Império Nacional", desc: "Instalar cervejarias em 3 cidades diferentes.", meta: 3, progresso: 1, premio: 40000, status: "ativa" }
  ])
};