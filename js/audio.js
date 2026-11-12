
/**
 * BEERWARE — MÓDULO DE ÁUDIO PROCEDURAL
 * Responsabilidade: Gerar e reproduzir efeitos sonoros táteis via Web Audio API.
 * Não depende de regras de negócio nem de arquivos externos.
 */

(function() {
  class AudioManager {
    constructor() {
      this.ctx = null;
    }

    // Inicializa o contexto de áudio no primeiro toque do usuário
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }

    // Sintetizador base de onda sonora com decaimento exponencial
    tocarTom(frequencia, tipo = "sine", duracao = 0.1, volume = 0.08) {
      try {
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const ganho = this.ctx.createGain();

        osc.type = tipo;
        osc.frequency.setValueAtTime(frequencia, this.ctx.currentTime);

        ganho.gain.setValueAtTime(volume, this.ctx.currentTime);
        ganho.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duracao);

        osc.connect(ganho);
        ganho.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duracao);
      } catch (e) {
        // Falha silenciosa para navegadores com áudio desabilitado
      }
    }

    // Som de toque nos botões e abas
    click() {
      this.tocarTom(380, "triangle", 0.04, 0.05);
    }

    // Tilintar de moedas de ouro / vendas
    coin() {
      this.tocarTom(987, "square", 0.08, 0.06);
      setTimeout(() => this.tocarTom(1318, "square", 0.18, 0.07), 70);
    }

    // Fanfarra triunfante ao bater uma meta
    fanfarra() {
      this.tocarTom(523, "triangle", 0.1, 0.08); // Dó
      setTimeout(() => this.tocarTom(659, "triangle", 0.1, 0.08), 100); // Mi
      setTimeout(() => this.tocarTom(783, "triangle", 0.1, 0.08), 200); // Sol
      setTimeout(() => this.tocarTom(1046, "square", 0.25, 0.1), 300);  // Dó agudo
    }

    // Zumbido de saldo insuficiente ou erro
    alert() {
      this.tocarTom(220, "sawtooth", 0.18, 0.09);
    }
  }

  window.BeerwareAudio = new AudioManager();
})();