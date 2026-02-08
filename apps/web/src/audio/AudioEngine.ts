import { Ecualizador } from './Equalizer';
import { Limitador } from './Limiter';

/** Eventos emitidos por el motor de audio */
export type EventoAudio =
  | 'tiempoActualizado'
  | 'finalizado'
  | 'cargado'
  | 'error'
  | 'estadoCambiado';

type CallbackEvento = (datos?: unknown) => void;

/**
 * Motor de audio principal basado en Web Audio API.
 * Cadena de procesamiento:
 *   Source -> Preamp -> Ecualizador (10 bandas) -> Limitador -> MasterGain -> Analyser -> Destination
 */
export class MotorAudio {
  private contexto: AudioContext | null = null;
  private fuente: AudioBufferSourceNode | null = null;
  private bufferActual: AudioBuffer | null = null;
  private preampNodo: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private analizador: AnalyserNode | null = null;
  private ecualizador: Ecualizador | null = null;
  private limitador: Limitador | null = null;

  private _reproduciendo: boolean = false;
  private _tiempoInicio: number = 0;
  private _offset: number = 0;
  private _volumen: number = 0.8;
  private _silenciado: boolean = false;
  private _volumenAnterior: number = 0.8;
  private _preamp: number = 0;

  private frameId: number | null = null;
  private listeners: Map<EventoAudio, Set<CallbackEvento>> = new Map();

  constructor() {
    // Lazy initialization del AudioContext
  }

  /** Inicializar el contexto de audio (debe llamarse tras interacción del usuario) */
  async inicializar(): Promise<void> {
    if (this.contexto) return;

    try {
      this.contexto = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      // Crear nodos de la cadena de procesamiento
      this.preampNodo = this.contexto.createGain();
      this.preampNodo.gain.value = this.dbALineal(this._preamp);

      this.ecualizador = new Ecualizador(this.contexto);
      this.limitador = new Limitador(this.contexto);

      this.masterGain = this.contexto.createGain();
      this.masterGain.gain.value = this._silenciado ? 0 : this._volumen;

      this.analizador = this.contexto.createAnalyser();
      this.analizador.fftSize = 2048;
      this.analizador.smoothingTimeConstant = 0.8;

      // Conectar cadena: Preamp -> EQ -> Limitador -> MasterGain -> Analyser -> Destination
      this.preampNodo.connect(this.ecualizador.entrada);
      this.ecualizador.salida.connect(this.limitador.nodo);
      this.limitador.nodo.connect(this.masterGain);
      this.masterGain.connect(this.analizador);
      this.analizador.connect(this.contexto.destination);

      console.info('[Audio] Motor de audio inicializado correctamente');
    } catch (error) {
      console.error('[Audio] Error al inicializar el motor de audio:', error);
      this.emitir('error', error);
      throw error;
    }
  }

  /** Cargar un ArrayBuffer de audio */
  async cargar(arrayBuffer: ArrayBuffer): Promise<void> {
    if (!this.contexto) {
      await this.inicializar();
    }

    try {
      // Detener reproducción actual completamente antes de cargar nueva pista
      this.detenerFuente();
      this._reproduciendo = false;
      this._offset = 0;
      this._tiempoInicio = 0;
      this.detenerActualizacionTiempo();

      // Decodificar el audio
      this.bufferActual = await this.contexto!.decodeAudioData(arrayBuffer.slice(0));

      this.emitir('cargado', {
        duracion: this.bufferActual.duration,
        canales: this.bufferActual.numberOfChannels,
        frecuenciaMuestreo: this.bufferActual.sampleRate,
      });

      console.info(`[Audio] Audio cargado: ${this.bufferActual.duration.toFixed(1)}s`);
    } catch (error) {
      console.error('[Audio] Error al cargar audio:', error);
      this.emitir('error', { mensaje: 'Error al decodificar el archivo de audio', error });
      throw error;
    }
  }

  /** Reproducir el audio cargado */
  reproducir(): void {
    if (!this.contexto || !this.bufferActual || !this.preampNodo) return;

    // Si ya está reproduciendo, no hacer nada
    if (this._reproduciendo) return;

    // Reanudar contexto si está suspendido y esperar a que esté listo
    if (this.contexto.state === 'suspended') {
      this.contexto.resume().then(() => {
        // Verificar de nuevo tras la reactivación asíncrona
        if (!this._reproduciendo && this.bufferActual) {
          this.iniciarReproduccionInterna();
        }
      });
      return;
    }

    this.iniciarReproduccionInterna();
  }

  /** Lógica interna para iniciar la reproducción una vez el contexto está activo */
  private iniciarReproduccionInterna(): void {
    if (!this.contexto || !this.bufferActual || !this.preampNodo) return;

    this.crearFuente();
    this.fuente!.start(0, this._offset);
    this._tiempoInicio = this.contexto.currentTime - this._offset;
    this._reproduciendo = true;

    this.iniciarActualizacionTiempo();
    this.emitir('estadoCambiado', { reproduciendo: true });
  }

  /** Pausar la reproducción */
  pausar(): void {
    if (!this._reproduciendo || !this.contexto) return;

    this._offset = this.contexto.currentTime - this._tiempoInicio;
    this.detenerFuente();
    this._reproduciendo = false;
    this.detenerActualizacionTiempo();
    this.emitir('estadoCambiado', { reproduciendo: false });
  }

  /** Detener la reproducción completamente */
  detener(): void {
    this.detenerFuente();
    this._offset = 0;
    this._reproduciendo = false;
    this.detenerActualizacionTiempo();
    this.emitir('tiempoActualizado', { tiempoActual: 0, duracion: this.duracion });
    this.emitir('estadoCambiado', { reproduciendo: false });
  }

  /** Saltar a una posición específica (en segundos) */
  buscar(tiempo: number): void {
    if (!this.bufferActual) return;

    const tiempoLimitado = Math.max(0, Math.min(tiempo, this.bufferActual.duration));
    const estabaReproduciendo = this._reproduciendo;

    if (this._reproduciendo) {
      this.detenerFuente();
    }

    this._offset = tiempoLimitado;

    if (estabaReproduciendo) {
      this.crearFuente();
      this.fuente!.start(0, this._offset);
      this._tiempoInicio = this.contexto!.currentTime - this._offset;
      this._reproduciendo = true;
    }

    this.emitir('tiempoActualizado', { tiempoActual: this._offset, duracion: this.duracion });
  }

  /** Establecer el volumen (0 a 1) */
  establecerVolumen(volumen: number): void {
    this._volumen = Math.max(0, Math.min(1, volumen));
    if (this.masterGain && !this._silenciado) {
      this.masterGain.gain.setValueAtTime(this._volumen, this.contexto!.currentTime);
    }
  }

  /** Alternar silencio */
  alternarSilencio(): void {
    if (this._silenciado) {
      this._silenciado = false;
      this._volumen = this._volumenAnterior;
      if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(this._volumen, this.contexto!.currentTime);
      }
    } else {
      this._volumenAnterior = this._volumen;
      this._silenciado = true;
      if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(0, this.contexto!.currentTime);
      }
    }
  }

  /** Establecer el preamp en dB */
  establecerPreamp(db: number): void {
    this._preamp = Math.max(-12, Math.min(12, db));
    if (this.preampNodo && this.contexto) {
      this.preampNodo.gain.setValueAtTime(
        this.dbALineal(this._preamp),
        this.contexto.currentTime,
      );
    }
  }

  /** Establecer ganancias del ecualizador */
  establecerEcualizador(ganancias: number[]): void {
    this.ecualizador?.establecerTodas(ganancias);
  }

  /** Establecer una banda específica del ecualizador */
  establecerBandaEQ(indice: number, ganancia: number): void {
    this.ecualizador?.establecerBanda(indice, ganancia);
  }

  /** Resetear ecualizador a plano */
  resetearEcualizador(): void {
    this.ecualizador?.resetear();
    this.establecerPreamp(0);
  }

  /** Obtener datos de frecuencia para visualización */
  obtenerDatosFrecuencia(): Uint8Array {
    if (!this.analizador) return new Uint8Array(0);
    const datos = new Uint8Array(this.analizador.frequencyBinCount);
    this.analizador.getByteFrequencyData(datos);
    return datos;
  }

  /** Obtener datos de forma de onda para visualización */
  obtenerDatosOndas(): Uint8Array {
    if (!this.analizador) return new Uint8Array(0);
    const datos = new Uint8Array(this.analizador.frequencyBinCount);
    this.analizador.getByteTimeDomainData(datos);
    return datos;
  }

  // === Propiedades de solo lectura ===

  get reproduciendo(): boolean {
    return this._reproduciendo;
  }

  get tiempoActual(): number {
    if (!this._reproduciendo || !this.contexto) return this._offset;
    return this.contexto.currentTime - this._tiempoInicio;
  }

  get duracion(): number {
    return this.bufferActual?.duration || 0;
  }

  get volumen(): number {
    return this._volumen;
  }

  get silenciado(): boolean {
    return this._silenciado;
  }

  get preamp(): number {
    return this._preamp;
  }

  get gananciasEQ(): number[] {
    return this.ecualizador?.ganancias || new Array(10).fill(0);
  }

  get reduccionLimitador(): number {
    return this.limitador?.reduccion || 0;
  }

  get estadoContexto(): string {
    return this.contexto?.state || 'cerrado';
  }

  get frecuenciaMuestreo(): number {
    return this.contexto?.sampleRate || 0;
  }

  // === Gestión de eventos ===

  on(evento: EventoAudio, callback: CallbackEvento): void {
    if (!this.listeners.has(evento)) {
      this.listeners.set(evento, new Set());
    }
    this.listeners.get(evento)!.add(callback);
  }

  off(evento: EventoAudio, callback: CallbackEvento): void {
    this.listeners.get(evento)?.delete(callback);
  }

  /** Eliminar todos los listeners de un evento */
  offAll(evento: EventoAudio): void {
    this.listeners.get(evento)?.clear();
  }

  private emitir(evento: EventoAudio, datos?: unknown): void {
    this.listeners.get(evento)?.forEach((callback) => {
      try {
        callback(datos);
      } catch (error) {
        console.error(`[Audio] Error en listener de '${evento}':`, error);
      }
    });
  }

  // === Métodos privados ===

  private crearFuente(): void {
    if (!this.contexto || !this.bufferActual || !this.preampNodo) return;

    this.fuente = this.contexto.createBufferSource();
    this.fuente.buffer = this.bufferActual;
    this.fuente.connect(this.preampNodo);

    this.fuente.onended = () => {
      if (this._reproduciendo) {
        const tiempoActual = this.contexto!.currentTime - this._tiempoInicio;
        // Solo emitir finalizado si realmente terminó la pista
        if (tiempoActual >= this.bufferActual!.duration - 0.1) {
          this._reproduciendo = false;
          this._offset = 0;
          this.detenerActualizacionTiempo();
          this.emitir('finalizado');
          this.emitir('estadoCambiado', { reproduciendo: false });
        }
      }
    };
  }

  private detenerFuente(): void {
    if (this.fuente) {
      try {
        this.fuente.onended = null;
        this.fuente.stop();
        this.fuente.disconnect();
      } catch {
        // Ignorar errores al detener
      }
      this.fuente = null;
    }
  }

  private iniciarActualizacionTiempo(): void {
    this.detenerActualizacionTiempo();

    const actualizar = () => {
      if (this._reproduciendo) {
        this.emitir('tiempoActualizado', {
          tiempoActual: this.tiempoActual,
          duracion: this.duracion,
        });
        this.frameId = requestAnimationFrame(actualizar);
      }
    };

    this.frameId = requestAnimationFrame(actualizar);
  }

  private detenerActualizacionTiempo(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  private dbALineal(db: number): number {
    return Math.pow(10, db / 20);
  }

  /** Destruir el motor de audio y liberar recursos */
  destruir(): void {
    this.detener();
    this.detenerActualizacionTiempo();
    this.ecualizador?.desconectar();
    this.limitador?.desconectar();

    try {
      this.preampNodo?.disconnect();
      this.masterGain?.disconnect();
      this.analizador?.disconnect();
    } catch {
      // Ignorar errores de desconexión
    }

    if (this.contexto && this.contexto.state !== 'closed') {
      this.contexto.close();
    }

    this.contexto = null;
    this.fuente = null;
    this.bufferActual = null;
    this.preampNodo = null;
    this.masterGain = null;
    this.analizador = null;
    this.ecualizador = null;
    this.limitador = null;
    this.listeners.clear();

    console.info('[Audio] Motor de audio destruido');
  }
}

/** Instancia singleton del motor de audio */
let instanciaMotor: MotorAudio | null = null;

export function obtenerMotorAudio(): MotorAudio {
  if (!instanciaMotor) {
    instanciaMotor = new MotorAudio();
  }
  return instanciaMotor;
}

export function destruirMotorAudio(): void {
  instanciaMotor?.destruir();
  instanciaMotor = null;
}
