/** Modos de repetición del reproductor */
export enum ModoRepeticion {
  DESACTIVADO = 'off',
  UNA = 'one',
  TODAS = 'all',
}

/** Estado del reproductor de audio */
export interface EstadoReproductor {
  pistaActualId: string | null;
  reproduciendo: boolean;
  tiempoActual: number;
  duracion: number;
  volumen: number;
  silenciado: boolean;
  aleatorio: boolean;
  repeticion: ModoRepeticion;
  cola: string[];
  indiceCola: number;
}

/** Pista de audio con sus metadatos */
export interface Pista {
  id: string;
  titulo: string;
  artista: string;
  album: string;
  genero: string;
  anio: number;
  duracion: number;
  caratula: string | null;
  tamanoArchivo: number;
  bitrate: number;
  frecuenciaMuestreo: number;
  agregadoEn: number;
  reproduciones: number;
  favorito: boolean;
  nombreArchivo: string;
  /** Ruta de la carpeta relativa a la carpeta raíz escaneada */
  carpeta?: string;
  /** Nombre de la carpeta raíz escaneada */
  carpetaRaiz?: string;
}

/** Datos del archivo de audio almacenado */
export interface ArchivoPista {
  id: string;
  datos: ArrayBuffer;
  tipo: string;
}

/** Lista de reproducción */
export interface ListaReproduccion {
  id: string;
  nombre: string;
  descripcion: string;
  pistaIds: string[];
  creadoEn: number;
  actualizadoEn: number;
  caratula: string | null;
}

/** Entrada del historial de reproducción */
export interface EntradaHistorial {
  id: string;
  pistaId: string;
  reproducidoEn: number;
  duracionEscuchada: number;
}

/** Preset del ecualizador */
export interface PresetEcualizador {
  id: string;
  nombre: string;
  ganancias: number[];
  preamp: number;
  esPersonalizado: boolean;
}

/** Configuración general de la aplicación */
export interface ConfiguracionApp {
  tema: 'claro' | 'oscuro' | 'sistema';
  presetEcualizadorId: string;
  presetsPersonalizados: PresetEcualizador[];
  volumen: number;
  volumenInicial: number;
  ultimaPistaId: string | null;
  ultimaPosicion: number;
  mostrarVisualizador: boolean;
  reanudarAlIniciar: boolean;
  crossfade: boolean;
  crossfadeDuracion: number;
  ecualizadorActivo: boolean;
}

/** Entrada de log para diagnóstico */
export interface EntradaLog {
  id: string;
  nivel: 'info' | 'warn' | 'error' | 'debug';
  mensaje: string;
  timestamp: number;
  datos?: unknown;
}

/** Estado de salud del servicio */
export interface EstadoSalud {
  servicio: string;
  estado: 'activo' | 'inactivo' | 'error';
  version: string;
  timestamp: number;
  detalles?: Record<string, unknown>;
}

/** DTO para crear una pista (API) */
export interface CrearPistaDto {
  titulo: string;
  artista: string;
  album: string;
  genero?: string;
  anio?: number;
  duracion: number;
}

/** DTO para actualizar una pista (API) */
export interface ActualizarPistaDto {
  titulo?: string;
  artista?: string;
  album?: string;
  genero?: string;
  anio?: number;
  favorito?: boolean;
}

/** DTO para crear una lista de reproducción (API) */
export interface CrearListaDto {
  nombre: string;
  descripcion?: string;
  pistaIds?: string[];
}

/** DTO para actualizar una lista de reproducción (API) */
export interface ActualizarListaDto {
  nombre?: string;
  descripcion?: string;
  pistaIds?: string[];
}

/** Respuesta paginada genérica */
export interface RespuestaPaginada<T> {
  datos: T[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

/** Opciones de ordenamiento */
export interface OpcionesOrdenamiento {
  campo: 'titulo' | 'artista' | 'album' | 'duracion' | 'agregadoEn' | 'reproduciones';
  direccion: 'asc' | 'desc';
}

/** Filtros de búsqueda */
export interface FiltrosBusqueda {
  consulta?: string;
  genero?: string;
  artista?: string;
  album?: string;
  favoritos?: boolean;
  anioDesde?: number;
  anioHasta?: number;
  carpeta?: string;
  carpetaRaiz?: string;
}

/** Nodo de carpeta para la vista de árbol */
export interface NodoCarpeta {
  nombre: string;
  ruta: string;
  subcarpetas: NodoCarpeta[];
  cantidadPistas: number;
}
