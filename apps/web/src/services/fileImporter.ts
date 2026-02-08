import { parseBlob } from 'music-metadata-browser';
import type { Pista, ArchivoPista } from '@emepetre/shared';
import { TAMANO_MAXIMO_ARCHIVO, FORMATOS_AUDIO_SOPORTADOS } from '@emepetre/shared';
import { generarId, uint8ArrayABase64 } from '../utils';
import { existeDuplicado, guardarPista, guardarArchivo } from '../db';

export interface ResultadoImportacion {
  exitosas: Pista[];
  fallidas: Array<{ nombre: string; error: string }>;
  duplicadas: string[];
  total: number;
}

/** Importar múltiples archivos de audio */
export async function importarArchivos(
  archivos: FileList | File[],
  onProgreso?: (actual: number, total: number) => void,
): Promise<ResultadoImportacion> {
  const resultado: ResultadoImportacion = {
    exitosas: [],
    fallidas: [],
    duplicadas: [],
    total: archivos.length,
  };

  for (let i = 0; i < archivos.length; i++) {
    const archivo = archivos[i];
    onProgreso?.(i + 1, archivos.length);

    try {
      // Validar tipo de archivo
      if (!FORMATOS_AUDIO_SOPORTADOS.includes(archivo.type) && !archivo.name.match(/\.(mp3|wav|ogg|flac|aac|m4a|webm)$/i)) {
        resultado.fallidas.push({
          nombre: archivo.name,
          error: `Formato no soportado: ${archivo.type || 'desconocido'}`,
        });
        continue;
      }

      // Validar tamaño
      if (archivo.size > TAMANO_MAXIMO_ARCHIVO) {
        resultado.fallidas.push({
          nombre: archivo.name,
          error: `Archivo demasiado grande (máx. 100MB)`,
        });
        continue;
      }

      // Verificar duplicados
      const esDuplicado = await existeDuplicado(archivo.name, archivo.size);
      if (esDuplicado) {
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

      // Crear objeto pista
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
      };

      // Leer archivo como ArrayBuffer
      const arrayBuffer = await archivo.arrayBuffer();

      // Crear objeto archivo
      const archivoPista: ArchivoPista = {
        id,
        datos: arrayBuffer,
        tipo: archivo.type || 'audio/mpeg',
      };

      // Guardar en IndexedDB
      await guardarPista(pista);
      await guardarArchivo(archivoPista);

      resultado.exitosas.push(pista);
    } catch (error) {
      console.error(`[Importar] Error al procesar "${archivo.name}":`, error);
      resultado.fallidas.push({
        nombre: archivo.name,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  return resultado;
}

/** Abrir diálogo de selección de archivos */
export function abrirSelectorArchivos(): Promise<FileList | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mp3,.wav,.ogg,.flac,.aac,.m4a,.webm';
    input.multiple = true;

    input.onchange = () => {
      resolve(input.files);
    };

    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
}
