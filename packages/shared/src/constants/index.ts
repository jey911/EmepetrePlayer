import type { PresetEcualizador, ConfiguracionApp } from '../types';

/** Versión de la aplicación */
export const VERSION_APP = '1.0.0';

/** Nombre de la aplicación */
export const NOMBRE_APP = 'EmepetrePlayer';

/** Nombre de la base de datos IndexedDB */
export const NOMBRE_BD = 'emepetre-player-db';

/** Versión de la base de datos IndexedDB */
export const VERSION_BD = 1;

/** Frecuencias centrales del ecualizador de 10 bandas (Hz) */
export const FRECUENCIAS_EQ: number[] = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

/** Etiquetas legibles para las frecuencias del ecualizador */
export const ETIQUETAS_FRECUENCIAS: string[] = [
  '32',
  '64',
  '125',
  '250',
  '500',
  '1K',
  '2K',
  '4K',
  '8K',
  '16K',
];

/** Ganancia mínima del ecualizador (dB) */
export const EQ_GANANCIA_MIN = -12;

/** Ganancia máxima del ecualizador (dB) */
export const EQ_GANANCIA_MAX = 12;

/** Ganancia mínima del preamp (dB) */
export const PREAMP_MIN = -12;

/** Ganancia máxima del preamp (dB) */
export const PREAMP_MAX = 12;

/** Factor Q para los filtros del ecualizador */
export const EQ_FACTOR_Q = 1.4;

/** Presets de ecualizador predefinidos */
export const PRESETS_ECUALIZADOR: PresetEcualizador[] = [
  {
    id: 'plano',
    nombre: 'Plano',
    ganancias: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    preamp: 0,
    esPersonalizado: false,
  },
  {
    id: 'rock',
    nombre: 'Rock',
    ganancias: [4, 3, 2, 1, -1, -1, 1, 2, 3, 4],
    preamp: -1,
    esPersonalizado: false,
  },
  {
    id: 'pop',
    nombre: 'Pop',
    ganancias: [-1, 1, 3, 4, 3, 1, -1, -2, -1, 1],
    preamp: 0,
    esPersonalizado: false,
  },
  {
    id: 'clasica',
    nombre: 'Clásica',
    ganancias: [3, 2, 1, 0, 0, 0, 0, 1, 2, 3],
    preamp: -1,
    esPersonalizado: false,
  },
  {
    id: 'bass-boost',
    nombre: 'Bass Boost',
    ganancias: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
    preamp: -2,
    esPersonalizado: false,
  },
  {
    id: 'vocal',
    nombre: 'Vocal',
    ganancias: [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1],
    preamp: 0,
    esPersonalizado: false,
  },
  {
    id: 'electronica',
    nombre: 'Electrónica',
    ganancias: [4, 3, 1, 0, -2, 1, 0, 2, 4, 5],
    preamp: -1,
    esPersonalizado: false,
  },
  {
    id: 'jazz',
    nombre: 'Jazz',
    ganancias: [2, 1, 0, 2, -2, -2, 0, 1, 2, 3],
    preamp: 0,
    esPersonalizado: false,
  },
];

/** Configuración por defecto de la aplicación */
export const CONFIGURACION_POR_DEFECTO: ConfiguracionApp = {
  tema: 'oscuro',
  presetEcualizadorId: 'plano',
  presetsPersonalizados: [],
  volumen: 0.8,
  volumenInicial: 0.8,
  ultimaPistaId: null,
  ultimaPosicion: 0,
  mostrarVisualizador: true,
  reanudarAlIniciar: true,
  crossfade: false,
  crossfadeDuracion: 3,
  ecualizadorActivo: true,
};

/** Formatos de audio soportados */
export const FORMATOS_AUDIO_SOPORTADOS = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/m4a',
  'audio/webm',
];

/** Extensiones de archivo aceptadas para importar */
export const EXTENSIONES_ACEPTADAS = '.mp3,.wav,.ogg,.flac,.aac,.m4a,.webm';

/** Tamaño máximo de archivo (100MB) */
export const TAMANO_MAXIMO_ARCHIVO = 100 * 1024 * 1024;

/** Atajos de teclado */
export const ATAJOS_TECLADO = {
  REPRODUCIR_PAUSAR: ' ',
  SIGUIENTE: 'ArrowRight',
  ANTERIOR: 'ArrowLeft',
  SUBIR_VOLUMEN: 'ArrowUp',
  BAJAR_VOLUMEN: 'ArrowDown',
  SILENCIAR: 'm',
  ALEATORIO: 's',
  REPETIR: 'r',
  BUSCAR: '/',
  FAVORITO: 'f',
} as const;

/** Incremento de volumen por tecla */
export const INCREMENTO_VOLUMEN = 0.05;

/** Incremento de seek por tecla (segundos) */
export const INCREMENTO_SEEK = 5;
