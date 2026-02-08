/**
 * Limitador suave anti-clipping usando DynamicsCompressorNode.
 * Previene la distorsión cuando el ecualizador amplifica demasiado.
 */
export class Limitador {
  private compresor: DynamicsCompressorNode;
  private contexto: AudioContext;
  private _activo: boolean = true;

  constructor(contexto: AudioContext) {
    this.contexto = contexto;
    this.compresor = this.contexto.createDynamicsCompressor();

    // Configuración de limitador suave
    this.compresor.threshold.value = -3; // Umbral en dB
    this.compresor.knee.value = 6; // Suavidad de la transición
    this.compresor.ratio.value = 12; // Ratio de compresión alto = limitador
    this.compresor.attack.value = 0.003; // Ataque rápido (3ms)
    this.compresor.release.value = 0.15; // Liberación moderada (150ms)
  }

  /** Nodo de entrada/salida del compresor */
  get nodo(): DynamicsCompressorNode {
    return this.compresor;
  }

  /** Estado activo/inactivo */
  get activo(): boolean {
    return this._activo;
  }

  /** Obtener la reducción de ganancia actual (para visualización) */
  get reduccion(): number {
    return this.compresor.reduction;
  }

  /** Establecer el umbral del limitador */
  establecerUmbral(valor: number): void {
    const limitado = Math.max(-50, Math.min(0, valor));
    this.compresor.threshold.setValueAtTime(limitado, this.contexto.currentTime);
  }

  /** Establecer la suavidad (knee) */
  establecerSuavidad(valor: number): void {
    const limitado = Math.max(0, Math.min(40, valor));
    this.compresor.knee.setValueAtTime(limitado, this.contexto.currentTime);
  }

  /** Establecer el ratio de compresión */
  establecerRatio(valor: number): void {
    const limitado = Math.max(1, Math.min(20, valor));
    this.compresor.ratio.setValueAtTime(limitado, this.contexto.currentTime);
  }

  /** Desconectar el compresor */
  desconectar(): void {
    try {
      this.compresor.disconnect();
    } catch {
      // Ignorar errores de desconexión
    }
  }
}
