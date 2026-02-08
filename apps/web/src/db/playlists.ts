import { abrirBD } from './database';
import type { ListaReproduccion } from '@emepetre/shared';

/** Obtener todas las listas de reproducción */
export async function obtenerTodasLasListas(): Promise<ListaReproduccion[]> {
  const db = await abrirBD();
  return db.getAll('listas');
}

/** Obtener una lista por ID */
export async function obtenerLista(id: string): Promise<ListaReproduccion | undefined> {
  const db = await abrirBD();
  return db.get('listas', id);
}

/** Crear una nueva lista de reproducción */
export async function crearLista(
  nombre: string,
  descripcion: string = '',
  pistaIds: string[] = [],
): Promise<ListaReproduccion> {
  const db = await abrirBD();
  const ahora = Date.now();
  const lista: ListaReproduccion = {
    id: `pl_${ahora}_${Math.random().toString(36).substring(2, 9)}`,
    nombre,
    descripcion,
    pistaIds,
    creadoEn: ahora,
    actualizadoEn: ahora,
    caratula: null,
  };

  await db.put('listas', lista);
  return lista;
}

/** Actualizar una lista de reproducción */
export async function actualizarLista(
  id: string,
  datos: Partial<Pick<ListaReproduccion, 'nombre' | 'descripcion' | 'pistaIds' | 'caratula'>>,
): Promise<ListaReproduccion | undefined> {
  const db = await abrirBD();
  const lista = await db.get('listas', id);
  if (!lista) return undefined;

  Object.assign(lista, datos, { actualizadoEn: Date.now() });
  await db.put('listas', lista);
  return lista;
}

/** Eliminar una lista de reproducción */
export async function eliminarLista(id: string): Promise<void> {
  const db = await abrirBD();
  await db.delete('listas', id);
}

/** Agregar pistas a una lista */
export async function agregarPistasALista(
  listaId: string,
  pistaIds: string[],
): Promise<ListaReproduccion | undefined> {
  const db = await abrirBD();
  const lista = await db.get('listas', listaId);
  if (!lista) return undefined;

  const idsExistentes = new Set(lista.pistaIds);
  const nuevosIds = pistaIds.filter((id) => !idsExistentes.has(id));
  lista.pistaIds = [...lista.pistaIds, ...nuevosIds];
  lista.actualizadoEn = Date.now();

  await db.put('listas', lista);
  return lista;
}

/** Remover una pista de una lista */
export async function removerPistaDeLista(
  listaId: string,
  pistaId: string,
): Promise<ListaReproduccion | undefined> {
  const db = await abrirBD();
  const lista = await db.get('listas', listaId);
  if (!lista) return undefined;

  lista.pistaIds = lista.pistaIds.filter((id) => id !== pistaId);
  lista.actualizadoEn = Date.now();

  await db.put('listas', lista);
  return lista;
}

/** Reordenar pistas en una lista */
export async function reordenarPistasEnLista(
  listaId: string,
  pistaIds: string[],
): Promise<ListaReproduccion | undefined> {
  const db = await abrirBD();
  const lista = await db.get('listas', listaId);
  if (!lista) return undefined;

  lista.pistaIds = pistaIds;
  lista.actualizadoEn = Date.now();

  await db.put('listas', lista);
  return lista;
}

/** Exportar una lista como JSON */
export async function exportarLista(id: string): Promise<string | null> {
  const db = await abrirBD();
  const lista = await db.get('listas', id);
  if (!lista) return null;

  const datosExportacion = {
    version: '1.0.0',
    tipo: 'emepetre-playlist',
    exportadoEn: new Date().toISOString(),
    lista: {
      nombre: lista.nombre,
      descripcion: lista.descripcion,
      pistaIds: lista.pistaIds,
    },
  };

  return JSON.stringify(datosExportacion, null, 2);
}

/** Importar una lista desde JSON */
export async function importarLista(json: string): Promise<ListaReproduccion | null> {
  try {
    const datos = JSON.parse(json);
    if (datos.tipo !== 'emepetre-playlist') {
      console.error('[DB] Formato de playlist no válido');
      return null;
    }

    return await crearLista(
      datos.lista.nombre || 'Playlist importada',
      datos.lista.descripcion || '',
      datos.lista.pistaIds || [],
    );
  } catch (error) {
    console.error('[DB] Error al importar playlist:', error);
    return null;
  }
}
