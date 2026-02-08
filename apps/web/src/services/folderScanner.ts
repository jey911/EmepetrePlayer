import { parseBlob } from 'music-metadata-browser';
import type { Pista, ArchivoPista } from '@emepetre/shared';
import { TAMANO_MAXIMO_ARCHIVO } from '@emepetre/shared';
import { generarId, uint8ArrayABase64 } from '../utils';
import { guardarPista, guardarArchivo } from '../db';
import { abrirBD } from '../db';

/** Archivo encontrado durante el escaneo con su ruta relativa */
export interface ArchivoEncontrado {
  archivo: File;
  rutaRelativa: string;
  carpeta: string;
}

/** Resultado del escaneo de carpeta */
export interface ResultadoEscaneo {
  exitosas: Pista[];
  fallidas: Array<{ nombre: string; ruta: string; error: string }>;
  duplicadas: string[];
  total: number;
  carpetaRaiz: string;
}

/** Progreso del escaneo */
export interface ProgresoEscaneo {
  fase: 'escaneando' | 'importando';
  actual: number;
  total: number;
  archivoActual?: string;
}

// Extensiones de audio soportadas
const EXTENSIONES_AUDIO = /\.(mp3|wav|ogg|flac|aac|m4a|webm)$/i;

/**
 * Verifica si el navegador soporta la File System Access API
 */
export function soportaFileSystemAccess(): boolean {
  return 'showDirectoryPicker' in window;
}

/**
 * Abre el diálogo nativo de selección de carpeta (File System Access API)
 * @returns FileSystemDirectoryHandle o null si el usuario canceló
 */
export async function seleccionarCarpeta(): Promise<FileSystemDirectoryHandle | null> {
  if (!soportaFileSystemAccess()) {
    return null;
  }

  try {
    const handle = await (window as unknown as { showDirectoryPicker: (opts?: object) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker({
      mode: 'read',
    });
    return handle;
  } catch (error) {
    // El usuario canceló el diálogo
    if (error instanceof DOMException && error.name === 'AbortError') {
      return null;
    }
    throw error;
  }
}

/**
 * Escanea recursivamente una carpeta en busca de archivos de audio
 */
async function escanearDirectorioRecursivo(
  dirHandle: FileSystemDirectoryHandle,
  rutaBase: string,
  archivosEncontrados: ArchivoEncontrado[],
  onProgreso?: (cantidad: number) => void,
): Promise<void> {
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      if (EXTENSIONES_AUDIO.test(entry.name)) {
        const fileHandle = entry as FileSystemFileHandle;
        const archivo = await fileHandle.getFile();
        const carpeta = rutaBase;

        archivosEncontrados.push({
          archivo,
          rutaRelativa: rutaBase ? `${rutaBase}/${entry.name}` : entry.name,
          carpeta,
        });

        onProgreso?.(archivosEncontrados.length);
      }
    } else if (entry.kind === 'directory') {
      const subDir = entry as FileSystemDirectoryHandle;
      const nuevaRuta = rutaBase ? `${rutaBase}/${entry.name}` : entry.name;
      await escanearDirectorioRecursivo(subDir, nuevaRuta, archivosEncontrados, onProgreso);
    }
  }
}

/**
 * Escanea una carpeta seleccionada y devuelve todos los archivos de audio encontrados
 */
export async function escanearCarpeta(
  dirHandle: FileSystemDirectoryHandle,
  onProgreso?: (cantidad: number) => void,
): Promise<ArchivoEncontrado[]> {
  const archivos: ArchivoEncontrado[] = [];
  await escanearDirectorioRecursivo(dirHandle, '', archivos, onProgreso);

  // Ordenar por ruta para mantener el orden de carpetas
  archivos.sort((a, b) => a.rutaRelativa.localeCompare(b.rutaRelativa));

  return archivos;
}

/**
 * Importa todos los archivos de audio de una carpeta escaneada
 */
export async function importarCarpeta(
  dirHandle: FileSystemDirectoryHandle,
  onProgreso?: (progreso: ProgresoEscaneo) => void,
): Promise<ResultadoEscaneo> {
  const nombreCarpeta = dirHandle.name;

  const resultado: ResultadoEscaneo = {
    exitosas: [],
    fallidas: [],
    duplicadas: [],
    total: 0,
    carpetaRaiz: nombreCarpeta,
  };

  // Fase 1: Escanear la carpeta buscando archivos de audio
  onProgreso?.({ fase: 'escaneando', actual: 0, total: 0 });

  const archivosEncontrados = await escanearCarpeta(dirHandle, (cantidad) => {
    onProgreso?.({ fase: 'escaneando', actual: cantidad, total: 0 });
  });

  resultado.total = archivosEncontrados.length;

  if (archivosEncontrados.length === 0) {
    return resultado;
  }

  // Pre-cargar lista de archivos existentes para detección de duplicados en bloque
  // Esto evita abrir transacciones repetidas durante el bucle de importación
  const db = await abrirBD();
  const pistasExistentes = await db.getAll('pistas');
  const duplicadosSet = new Set(
    pistasExistentes.map((p) => `${p.nombreArchivo}::${p.tamanoArchivo}`),
  );

  // Fase 2: Importar cada archivo encontrado
  for (let i = 0; i < archivosEncontrados.length; i++) {
    const { archivo, carpeta } = archivosEncontrados[i];

    onProgreso?.({
      fase: 'importando',
      actual: i + 1,
      total: archivosEncontrados.length,
      archivoActual: archivo.name,
    });

    try {
      // Validar tamaño
      if (archivo.size > TAMANO_MAXIMO_ARCHIVO) {
        resultado.fallidas.push({
          nombre: archivo.name,
          ruta: carpeta,
          error: 'Archivo demasiado grande (máx. 100MB)',
        });
        continue;
      }

      // Verificar duplicados (usando el set en memoria, no la BD)
      const claveDuplicado = `${archivo.name}::${archivo.size}`;
      if (duplicadosSet.has(claveDuplicado)) {
        resultado.duplicadas.push(archivo.name);
        continue;
      }

      // Extraer metadatos
      const metadatos = await parseBlob(new Blob([archivo]));
      const id = generarId('trk');

      // Extraer carátula
      let caratula: string | null = null;
      if (metadatos.common.picture && metadatos.common.picture.length > 0) {
        const imagen = metadatos.common.picture[0];
        caratula = uint8ArrayABase64(imagen.data, imagen.format);
      }

      // Crear objeto pista con información de carpeta
      const pista: Pista = {
        id,
        titulo: metadatos.common.title || archivo.name.replace(/\.[^.]+$/, ''),
        artista: metadatos.common.artist || 'Artista desconocido',
        album: metadatos.common.album || 'Álbum desconocido',
        genero: metadatos.common.genre?.[0] || '',
        anio: metadatos.common.year || 0,
        duracion: metadatos.format.duration || 0,
        caratula,
        tamanoArchivo: archivo.size,
        bitrate: metadatos.format.bitrate || 0,
        frecuenciaMuestreo: metadatos.format.sampleRate || 0,
        agregadoEn: Date.now(),
        reproduciones: 0,
        favorito: false,
        nombreArchivo: archivo.name,
        carpeta: carpeta || undefined,
        carpetaRaiz: nombreCarpeta,
      };

      // Leer archivo como ArrayBuffer
      const arrayBuffer = await archivo.arrayBuffer();

      // Crear objeto archivo
      const archivoPista: ArchivoPista = {
        id,
        datos: arrayBuffer,
        tipo: archivo.type || 'audio/mpeg',
      };

      // Guardar en IndexedDB (con reintento si la conexión se cerró)
      await guardarConReintento(() => guardarPista(pista));
      await guardarConReintento(() => guardarArchivo(archivoPista));

      // Añadir al set de duplicados para evitar re-importar en la misma sesión
      duplicadosSet.add(claveDuplicado);

      resultado.exitosas.push(pista);
    } catch (error) {
      console.error(`[EscanearCarpeta] Error al procesar "${archivo.name}":`, error);
      resultado.fallidas.push({
        nombre: archivo.name,
        ruta: carpeta,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  return resultado;
}

/** Reintentar una operación de BD si la conexión se cerró */
async function guardarConReintento<T>(operacion: () => Promise<T>, intentos = 3): Promise<T> {
  for (let i = 0; i < intentos; i++) {
    try {
      return await operacion();
    } catch (error) {
      const esConexionCerrada =
        error instanceof DOMException &&
        (error.message.includes('connection is closing') ||
         error.message.includes('connection is closed'));

      if (esConexionCerrada && i < intentos - 1) {
        // Esperar un momento y reintentar (abrirBD reabrirá la conexión)
        await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Reintentos agotados');
}

/**
 * Fallback: seleccionar carpeta usando input con webkitdirectory
 * Para navegadores que no soportan la File System Access API
 */
export function seleccionarCarpetaFallback(): Promise<{ archivos: FileList; nombre: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    input.multiple = true;

    input.onchange = () => {
      if (input.files && input.files.length > 0) {
        // Extraer nombre de la carpeta raíz del webkitRelativePath
        const primerArchivo = input.files[0];
        const rutaRelativa = (primerArchivo as unknown as { webkitRelativePath: string }).webkitRelativePath;
        const nombreCarpeta = rutaRelativa.split('/')[0] || 'Carpeta';
        resolve({ archivos: input.files, nombre: nombreCarpeta });
      } else {
        resolve(null);
      }
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
}

/**
 * Importar archivos seleccionados con webkitdirectory (fallback)
 */
export async function importarCarpetaFallback(
  archivos: FileList,
  nombreCarpeta: string,
  onProgreso?: (progreso: ProgresoEscaneo) => void,
): Promise<ResultadoEscaneo> {
  const resultado: ResultadoEscaneo = {
    exitosas: [],
    fallidas: [],
    duplicadas: [],
    total: 0,
    carpetaRaiz: nombreCarpeta,
  };

  // Filtrar solo archivos de audio
  const archivosAudio: Array<{ archivo: File; carpeta: string }> = [];

  for (let i = 0; i < archivos.length; i++) {
    const archivo = archivos[i];
    if (EXTENSIONES_AUDIO.test(archivo.name)) {
      const rutaRelativa = (archivo as unknown as { webkitRelativePath: string }).webkitRelativePath;
      // Extraer la carpeta relativa (sin el nombre de la carpeta raíz y sin el archivo)
      const partes = rutaRelativa.split('/');
      // Remover el primer elemento (carpeta raíz) y el último (nombre del archivo)
      const carpeta = partes.slice(1, -1).join('/');
      archivosAudio.push({ archivo, carpeta });
    }
  }

  resultado.total = archivosAudio.length;

  if (archivosAudio.length === 0) {
    return resultado;
  }

  // Pre-cargar lista de archivos existentes para detección de duplicados en bloque
  const db = await abrirBD();
  const pistasExistentes = await db.getAll('pistas');
  const duplicadosSet = new Set(
    pistasExistentes.map((p) => `${p.nombreArchivo}::${p.tamanoArchivo}`),
  );

  for (let i = 0; i < archivosAudio.length; i++) {
    const { archivo, carpeta } = archivosAudio[i];

    onProgreso?.({
      fase: 'importando',
      actual: i + 1,
      total: archivosAudio.length,
      archivoActual: archivo.name,
    });

    try {
      if (archivo.size > TAMANO_MAXIMO_ARCHIVO) {
        resultado.fallidas.push({
          nombre: archivo.name,
          ruta: carpeta,
          error: 'Archivo demasiado grande (máx. 100MB)',
        });
        continue;
      }

      const claveDuplicado = `${archivo.name}::${archivo.size}`;
      if (duplicadosSet.has(claveDuplicado)) {
        resultado.duplicadas.push(archivo.name);
        continue;
      }

      const metadatos = await parseBlob(new Blob([archivo]));
      const id = generarId('trk');

      let caratula: string | null = null;
      if (metadatos.common.picture && metadatos.common.picture.length > 0) {
        const imagen = metadatos.common.picture[0];
        caratula = uint8ArrayABase64(imagen.data, imagen.format);
      }

      const pista: Pista = {
        id,
        titulo: metadatos.common.title || archivo.name.replace(/\.[^.]+$/, ''),
        artista: metadatos.common.artist || 'Artista desconocido',
        album: metadatos.common.album || 'Álbum desconocido',
        genero: metadatos.common.genre?.[0] || '',
        anio: metadatos.common.year || 0,
        duracion: metadatos.format.duration || 0,
        caratula,
        tamanoArchivo: archivo.size,
        bitrate: metadatos.format.bitrate || 0,
        frecuenciaMuestreo: metadatos.format.sampleRate || 0,
        agregadoEn: Date.now(),
        reproduciones: 0,
        favorito: false,
        nombreArchivo: archivo.name,
        carpeta: carpeta || undefined,
        carpetaRaiz: nombreCarpeta,
      };

      const arrayBuffer = await archivo.arrayBuffer();
      const archivoPista: ArchivoPista = {
        id,
        datos: arrayBuffer,
        tipo: archivo.type || 'audio/mpeg',
      };

      await guardarConReintento(() => guardarPista(pista));
      await guardarConReintento(() => guardarArchivo(archivoPista));

      duplicadosSet.add(claveDuplicado);

      resultado.exitosas.push(pista);
    } catch (error) {
      console.error(`[EscanearCarpeta] Error al procesar "${archivo.name}":`, error);
      resultado.fallidas.push({
        nombre: archivo.name,
        ruta: carpeta,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  return resultado;
}
