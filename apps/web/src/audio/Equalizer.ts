import {
  FRECUENCIAS_EQ,
  EQ_FACTOR_Q,
  EQ_GANANCIA_MIN,
  EQ_GANANCIA_MAX,
} from '@emepetre/shared';

/**
 * Ecualizador paramétrico de 10 bandas usando BiquadFilterNode.
 * Cada banda es un filtro peaking conectado en serie.
 */
export class Ecualizador {
  private filtros: BiquadFilterNode[] = [];
  private _ganancias: number[];
  private contexto: AudioContext;

  constructor(contexto: AudioContext) {
    this.contexto = contexto;
    this._ganancias = new Array(FRECUENCIAS_EQ.length).fill(0);

    // Crear un filtro peaking para cada frecuencia
    this.filtros = FRECUENCIAS_EQ.map((frecuencia, indice) => {
      const filtro = this.contexto.createBiquadFilter();
      filtro.type = 'peaking';
      filtro.frequency.value = frecuencia;
      filtro.Q.value = EQ_FACTOR_Q;
      filtro.gain.value = this._ganancias[indice];
      return filtro;
    });

    // Conectar filtros en serie
    for (let i = 0; i < this.filtros.length - 1; i++) {
      this.filtros[i].connect(this.filtros[i + 1]);
    }
  }

  /** Nodo de entrada (primer filtro) */
  get entrada(): AudioNode {
    return this.filtros[0];
  }

  /** Nodo de salida (último filtro) */
  get salida(): AudioNode {
    return this.filtros[this.filtros.length - 1];
  }

  /** Ganancias actuales de todas las bandas */
  get ganancias(): number[] {
    return [...this._ganancias];
  }

  /** Establecer la ganancia de una banda específica */
  establecerBanda(indice: number, ganancia: number): void {
    if (indice < 0 || indice >= this.filtros.length) {
      console.warn(`[EQ] Índice de banda inválido: ${indice}`);
      return;
    }

    const gananciaLimitada = Math.max(EQ_GANANCIA_MIN, Math.min(EQ_GANANCIA_MAX, ganancia));
    this._ganancias[indice] = gananciaLimitada;
    this.filtros[indice].gain.setValueAtTime(
      gananciaLimitada,
      this.contexto.currentTime,
    );
  }

  /** Establecer todas las ganancias de una vez */
  establecerTodas(ganancias: number[]): void {
    if (ganancias.length !== this.filtros.length) {
      console.warn(`[EQ] Se esperan ${this.filtros.length} ganancias, se recibieron ${ganancias.length}`);
      return;
    }

    ganancias.forEach((ganancia, indice) => {
      this.establecerBanda(indice, ganancia);
    });
  }

  /** Resetear todas las bandas a 0 dB */
  resetear(): void {
    this._ganancias = new Array(this.filtros.length).fill(0);
    this.filtros.forEach((filtro) => {
      filtro.gain.setValueAtTime(0, this.contexto.currentTime);
    });
  }

  /** Obtener los nodos de respuesta en frecuencia para visualización */
  obtenerRespuestaFrecuencia(
    frecuencias: Float32Array,
  ): { magnitudes: Float32Array; fases: Float32Array } {
    const magnitudes = new Float32Array(frecuencias.length);
    const fases = new Float32Array(frecuencias.length);
    const magnitudesTemp = new Float32Array(frecuencias.length);
    const fasesTemp = new Float32Array(frecuencias.length);

    // Inicializar magnitudes a 1 (0 dB)
    magnitudes.fill(1);
    fases.fill(0);

    this.filtros.forEach((filtro) => {
      filtro.getFrequencyResponse(frecuencias as Float32Array<ArrayBuffer>, magnitudesTemp as Float32Array<ArrayBuffer>, fasesTemp as Float32Array<ArrayBuffer>);
      for (let i = 0; i < frecuencias.length; i++) {
        magnitudes[i] *= magnitudesTemp[i];
        fases[i] += fasesTemp[i];
      }
    });

    return { magnitudes, fases };
  }

  /** Desconectar todos los filtros */
  desconectar(): void {
    this.filtros.forEach((filtro) => {
      try {
        filtro.disconnect();
      } catch {
        // Ignorar errores de desconexión
      }
    });
  }
}
