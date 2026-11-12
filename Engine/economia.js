/**
 * Módulo de Economia e Finanças
 * Responsável pela gestão do caixa, cálculo de transporte e taxas.
 */
export class Economia {
  constructor(saldoInicial = 50000) {
    this.saldo = saldoInicial;
    this.custoTransportePorKm = 0.02; // R$ por unidade transportada por km
  }

  podeGastar(valor) {
    return this.saldo >= valor;
  }

  debitar(valor, motivo = "Despesa genérica") {
    if (!this.podeGastar(valor)) return false;
    this.saldo -= valor;
    return true;
  }

  creditar(valor, motivo = "Receita") {
    this.saldo += valor;
  }

  calcularCustoFrete(distanciaKm, quantidade) {
    // Custo base mínimo de R$ 50 para despacho + taxa por distância/unidade
    if (distanciaKm === 0) return 20; // Frete intramunicipal simbólico
    return Math.round(50 + (distanciaKm * this.custoTransportePorKm * (quantidade / 10)));
  }
}