import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { NOMBRE_BD, VERSION_BD } from '@emepetre/shared';
import type {
  Pista,
  ArchivoPista,
  ListaReproduccion,
  EntradaHistorial,
  ConfiguracionApp,
} from '@emepetre/shared';

/** Esquema de la base de datos IndexedDB */
interface EsquemaBD extends DBSchema {
  pistas: {
    key: string;
    value: Pista;
    indexes: {
      'por-titulo': string;
      'por-artista': string;
      'por-album': string;
      'por-genero': string;
      'por-agregado': number;
      'por-favorito': number;
    };
  };
  archivos: {
    key: string;
    value: ArchivoPista;
  };
  listas: {
    key: string;
    value: ListaReproduccion;
    indexes: {
      'por-nombre': string;
      'por-creado': number;
    };
  };
  historial: {
    key: string;
    value: EntradaHistorial;
    indexes: {
      'por-pista': string;
      'por-fecha': number;
    };
  };
  configuracion: {
    key: string;
    value: { id: string; datos: ConfiguracionApp };
  };
}

let dbInstancia: IDBPDatabase<EsquemaBD> | null = null;

/** Abrir o crear la base de datos */
export async function abrirBD(): Promise<IDBPDatabase<EsquemaBD>> {
  if (dbInstancia) return dbInstancia;

  dbInstancia = await openDB<EsquemaBD>(NOMBRE_BD, VERSION_BD, {
    upgrade(db) {
      // Almacén de pistas (metadatos)
      if (!db.objectStoreNames.contains('pistas')) {
        const storePistas = db.createObjectStore('pistas', { keyPath: 'id' });
        storePistas.createIndex('por-titulo', 'titulo');
        storePistas.createIndex('por-artista', 'artista');
        storePistas.createIndex('por-album', 'album');
        storePistas.createIndex('por-genero', 'genero');
        storePistas.createIndex('por-agregado', 'agregadoEn');
        storePistas.createIndex('por-favorito', 'favorito' as unknown as string);
      }

      // Almacén de archivos de audio (datos binarios)
      if (!db.objectStoreNames.contains('archivos')) {
        db.createObjectStore('archivos', { keyPath: 'id' });
      }

      // Almacén de listas de reproducción
      if (!db.objectStoreNames.contains('listas')) {
        const storeListas = db.createObjectStore('listas', { keyPath: 'id' });
        storeListas.createIndex('por-nombre', 'nombre');
        storeListas.createIndex('por-creado', 'creadoEn');
      }

      // Almacén de historial
      if (!db.objectStoreNames.contains('historial')) {
        const storeHistorial = db.createObjectStore('historial', { keyPath: 'id' });
        storeHistorial.createIndex('por-pista', 'pistaId');
        storeHistorial.createIndex('por-fecha', 'reproducidoEn');
      }

      // Almacén de configuración
      if (!db.objectStoreNames.contains('configuracion')) {
        db.createObjectStore('configuracion', { keyPath: 'id' });
      }
    },
  });

  return dbInstancia;
}

/** Cerrar la conexión a la base de datos */
export function cerrarBD(): void {
  if (dbInstancia) {
    dbInstancia.close();
    dbInstancia = null;
  }
}

/** Obtener estadísticas de la base de datos */
export async function obtenerEstadisticasBD(): Promise<{
  pistas: number;
  archivos: number;
  listas: number;
  historial: number;
  disponible: boolean;
}> {
  try {
    const db = await abrirBD();
    const [pistas, archivos, listas, historial] = await Promise.all([
      db.count('pistas'),
      db.count('archivos'),
      db.count('listas'),
      db.count('historial'),
    ]);

    return { pistas, archivos, listas, historial, disponible: true };
  } catch {
    return { pistas: 0, archivos: 0, listas: 0, historial: 0, disponible: false };
  }
}

export type { EsquemaBD };
