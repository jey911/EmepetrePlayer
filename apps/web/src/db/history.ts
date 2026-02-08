import { abrirBD } from './database';
import type { EntradaHistorial } from '@emepetre/shared';

/** Registrar reproducción en el historial */
export async function registrarReproduccion(
  pistaId: string,
  duracionEscuchada: number = 0,
): Promise<void> {
  const db = await abrirBD();
  const entrada: EntradaHistorial = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    pistaId,
    reproducidoEn: Date.now(),
    duracionEscuchada,
  };
  await db.put('historial', entrada);
}

/** Obtener el historial completo ordenado por fecha descendente */
export async function obtenerHistorial(limite: number = 50): Promise<EntradaHistorial[]> {
  const db = await abrirBD();
  const todo = await db.getAll('historial');
  return todo
    .sort((a, b) => b.reproducidoEn - a.reproducidoEn)
    .slice(0, limite);
}

/** Obtener pistas recientes (IDs únicos) */
export async function obtenerRecientes(limite: number = 20): Promise<string[]> {
  const historial = await obtenerHistorial(200);
  const vistos = new Set<string>();
  const recientes: string[] = [];

  for (const entrada of historial) {
    if (!vistos.has(entrada.pistaId)) {
      vistos.add(entrada.pistaId);
      recientes.push(entrada.pistaId);
      if (recientes.length >= limite) break;
    }
  }

  return recientes;
}

/** Obtener las pistas más reproducidas */
export async function obtenerMasReproducidas(limite: number = 20): Promise<{ pistaId: string; veces: number }[]> {
  const db = await abrirBD();
  const todo = await db.getAll('historial');

  const conteo = new Map<string, number>();
  todo.forEach((entrada) => {
    conteo.set(entrada.pistaId, (conteo.get(entrada.pistaId) || 0) + 1);
  });

  return Array.from(conteo.entries())
    .map(([pistaId, veces]) => ({ pistaId, veces }))
    .sort((a, b) => b.veces - a.veces)
    .slice(0, limite);
}

/** Limpiar el historial */
export async function limpiarHistorial(): Promise<void> {
  const db = await abrirBD();
  await db.clear('historial');
}

/** Eliminar entradas de una pista específica del historial */
export async function eliminarHistorialPista(pistaId: string): Promise<void> {
  const db = await abrirBD();
  const todo = await db.getAll('historial');
  const tx = db.transaction('historial', 'readwrite');
  
  await Promise.all([
    ...todo
      .filter((e) => e.pistaId === pistaId)
      .map((e) => tx.store.delete(e.id)),
    tx.done,
  ]);
}
