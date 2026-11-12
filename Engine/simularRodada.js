/**
 * Módulo de Simulação de Vendas e Demanda
 * Modela a física econômica do mês com base na compatibilidade cerveja-mercado.
 */
export function simularConsumo(cidade, cerveja, quantidadeEnviada, reputacaoFator) {
  const { preferenciaSabor, preferenciaForca, toleranciaPreco } = cidade.perfil;

  // 1. Afinidade do produto com a cidade (0.1 a 2.0)
  const afinidadeSabor = 1 - Math.abs(cerveja.sabor - preferenciaSabor) / 10;
  const afinidadeForca = 1 - Math.abs(cerveja.forca - preferenciaForca) / 10;
  
  // Penalidade se o preço for maior que a tolerância da cidade
  const fatorPreco = cerveja.precoVendaPadrao <= toleranciaPreco 
    ? 1.0 
    : Math.max(0.1, 1 - ((cerveja.precoVendaPadrao - toleranciaPreco) / toleranciaPreco));

  const afinidadeGeral = Math.max(0.2, (afinidadeSabor * 0.4 + afinidadeForca * 0.3 + fatorPreco * 0.3));

  // 2. Demanda efetiva calculada
  const demandaCalculada = Math.round(cidade.demandaBase * afinidadeGeral * reputacaoFator);

  // 3. Venda realizada (limitada pelo que foi entregue ou pela demanda real)
  const unidadesVendidas = Math.min(quantidadeEnviada, demandaCalculada);
  const receita = unidadesVendidas * cerveja.precoVendaPadrao;
  const sobraEstoque = quantidadeEnviada - unidadesVendidas;

  return {
    unidadesVendidas,
    sobraEstoque,
    receita,
    demandaEfetiva: demandaCalculada
  };
}