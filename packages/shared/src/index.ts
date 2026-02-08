// Tipos compartidos
export type {
  Pista,
  ArchivoPista,
  ListaReproduccion,
  EntradaHistorial,
  PresetEcualizador,
  ConfiguracionApp,
  EntradaLog,
  EstadoSalud,
  EstadoReproductor,
  CrearPistaDto,
  ActualizarPistaDto,
  CrearListaDto,
  ActualizarListaDto,
  RespuestaPaginada,
  OpcionesOrdenamiento,
  FiltrosBusqueda,
  NodoCarpeta,
} from './types';

export { ModoRepeticion } from './types';

// Constantes compartidas
export {
  VERSION_APP,
  NOMBRE_APP,
  NOMBRE_BD,
  VERSION_BD,
  FRECUENCIAS_EQ,
  ETIQUETAS_FRECUENCIAS,
  EQ_GANANCIA_MIN,
  EQ_GANANCIA_MAX,
  PREAMP_MIN,
  PREAMP_MAX,
  EQ_FACTOR_Q,
  PRESETS_ECUALIZADOR,
  CONFIGURACION_POR_DEFECTO,
  FORMATOS_AUDIO_SOPORTADOS,
  EXTENSIONES_ACEPTADAS,
  TAMANO_MAXIMO_ARCHIVO,
  ATAJOS_TECLADO,
  INCREMENTO_VOLUMEN,
  INCREMENTO_SEEK,
} from './constants';
