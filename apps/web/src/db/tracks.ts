import { abrirBD } from './database';
import type { Pista, ArchivoPista, FiltrosBusqueda, OpcionesOrdenamiento } from '@emepetre/shared';

/** Obtener todas las pistas */
export async function obtenerTodasLasPistas(): Promise<Pista[]> {
  const db = await abrirBD();
  return db.getAll('pistas');
}

/** Obtener una pista por ID */
export async function obtenerPista(id: string): Promise<Pista | undefined> {
  const db = await abrirBD();
  return db.get('pistas', id);
}

/** Guardar una pista (crear o actualizar) */
export async function guardarPista(pista: Pista): Promise<void> {
  const db = await abrirBD();
  await db.put('pistas', pista);
}

/** Guardar múltiples pistas en una transacción */
export async function guardarPistas(pistas: Pista[]): Promise<void> {
  const db = await abrirBD();
  const tx = db.transaction('pistas', 'readwrite');
  await Promise.all([...pistas.map((pista) => tx.store.put(pista)), tx.done]);
}

/** Eliminar una pista y su archivo asociado */
export async function eliminarPista(id: string): Promise<void> {
  const db = await abrirBD();
  const tx1 = db.transaction('pistas', 'readwrite');
  await tx1.store.delete(id);
  await tx1.done;

  const tx2 = db.transaction('archivos', 'readwrite');
  await tx2.store.delete(id);
  await tx2.done;
}

/** Eliminar múltiples pistas */
export async function eliminarPistas(ids: string[]): Promise<void> {
  const db = await abrirBD();
  const txPistas = db.transaction('pistas', 'readwrite');
  const txArchivos = db.transaction('archivos', 'readwrite');
  await Promise.all([
    ...ids.map((id) => txPistas.store.delete(id)),
    txPistas.done,
  ]);
  await Promise.all([
    ...ids.map((id) => txArchivos.store.delete(id)),
    txArchivos.done,
  ]);
}

/** Alternar favorito de una pista */
export async function alternarFavorito(id: string): Promise<Pista | undefined> {
  const db = await abrirBD();
  const pista = await db.get('pistas', id);
  if (!pista) return undefined;

  pista.favorito = !pista.favorito;
  await db.put('pistas', pista);
  return pista;
}

/** Incrementar contador de reproducciones */
export async function incrementarReproducciones(id: string): Promise<void> {
  const db = await abrirBD();
  const pista = await db.get('pistas', id);
  if (pista) {
    pista.reproduciones += 1;
    await db.put('pistas', pista);
  }
}

/** Actualizar metadatos de una pista */
export async function actualizarMetadatos(
  id: string,
  datos: Partial<Pick<Pista, 'titulo' | 'artista' | 'album' | 'genero' | 'anio'>>,
): Promise<Pista | undefined> {
  const db = await abrirBD();
  const pista = await db.get('pistas', id);
  if (!pista) return undefined;

  Object.assign(pista, datos);
  await db.put('pistas', pista);
  return pista;
}

/** Guardar archivo de audio */
export async function guardarArchivo(archivo: ArchivoPista): Promise<void> {
  const db = await abrirBD();
  await db.put('archivos', archivo);
}

/** Obtener archivo de audio */
export async function obtenerArchivo(id: string): Promise<ArchivoPista | undefined> {
  const db = await abrirBD();
  return db.get('archivos', id);
}

/** Verificar si un archivo ya existe (detección de duplicados por nombre y tamaño) */
export async function existeDuplicado(nombreArchivo: string, tamano: number): Promise<boolean> {
  const db = await abrirBD();
  const pistas = await db.getAll('pistas');
  return pistas.some(
    (p) => p.nombreArchivo === nombreArchivo && p.tamanoArchivo === tamano,
  );
}

/** Buscar y filtrar pistas */
export async function buscarPistas(
  filtros: FiltrosBusqueda,
  ordenamiento?: OpcionesOrdenamiento,
): Promise<Pista[]> {
  const db = await abrirBD();
  let pistas = await db.getAll('pistas');

  // Aplicar filtros
  if (filtros.consulta) {
    const consulta = filtros.consulta.toLowerCase();
    pistas = pistas.filter(
      (p) =>
        p.titulo.toLowerCase().includes(consulta) ||
        p.artista.toLowerCase().includes(consulta) ||
        p.album.toLowerCase().includes(consulta) ||
        p.genero.toLowerCase().includes(consulta),
    );
  }

  if (filtros.genero) {
    pistas = pistas.filter((p) => p.genero.toLowerCase() === filtros.genero!.toLowerCase());
  }

  if (filtros.artista) {
    pistas = pistas.filter((p) => p.artista.toLowerCase() === filtros.artista!.toLowerCase());
  }

  if (filtros.album) {
    pistas = pistas.filter((p) => p.album.toLowerCase() === filtros.album!.toLowerCase());
  }

  if (filtros.favoritos) {
    pistas = pistas.filter((p) => p.favorito);
  }

  if (filtros.anioDesde !== undefined) {
    pistas = pistas.filter((p) => p.anio >= filtros.anioDesde!);
  }

  if (filtros.anioHasta !== undefined) {
    pistas = pistas.filter((p) => p.anio <= filtros.anioHasta!);
  }

  // Aplicar ordenamiento
  if (ordenamiento) {
    const { campo, direccion } = ordenamiento;
    pistas.sort((a, b) => {
      let valorA: string | number = a[campo];
      let valorB: string | number = b[campo];

      if (typeof valorA === 'string') {
        valorA = valorA.toLowerCase();
        valorB = (valorB as string).toLowerCase();
      }

      if (valorA < valorB) return direccion === 'asc' ? -1 : 1;
      if (valorA > valorB) return direccion === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return pistas;
}

/** Obtener géneros únicos */
export async function obtenerGeneros(): Promise<string[]> {
  const db = await abrirBD();
  const pistas = await db.getAll('pistas');
  const generos = new Set(pistas.map((p) => p.genero).filter(Boolean));
  return Array.from(generos).sort();
}

/** Obtener artistas únicos */
export async function obtenerArtistas(): Promise<string[]> {
  const db = await abrirBD();
  const pistas = await db.getAll('pistas');
  const artistas = new Set(pistas.map((p) => p.artista).filter(Boolean));
  return Array.from(artistas).sort();
}

/** Obtener álbumes únicos */
export async function obtenerAlbumes(): Promise<string[]> {
  const db = await abrirBD();
  const pistas = await db.getAll('pistas');
  const albumes = new Set(pistas.map((p) => p.album).filter(Boolean));
  return Array.from(albumes).sort();
}
