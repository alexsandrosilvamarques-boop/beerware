/**
 * Módulo de Reputação e Imagem da Marca
 * Influencia diretamente a receptividade dos consumidores.
 */
export class Reputacao {
  constructor(pontosIniciais = 50) {
    this.pontos = pontosIniciais; // Escala 0 a 100
  }

  ajustar(pontos) {
    this.pontos = Math.max(0, Math.min(100, this.pontos + pontos));
  }

  getMultiplicadorMercado() {
    // Reputação 50 = fator 1.0 (neutro)
    // Reputação 100 = 1.5x nas vendas
    return 0.5 + (this.pontos / 100);
  }
}