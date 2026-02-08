import { Injectable, Logger } from '@nestjs/common';

interface ListaMemoria {
  id: string;
  nombre: string;
  descripcion: string;
  pistaIds: string[];
  creadoEn: string;
  actualizadoEn: string;
}

@Injectable()
export class PlaylistsService {
  private readonly logger = new Logger(PlaylistsService.name);
  private listas: Map<string, ListaMemoria> = new Map();

  obtenerTodas(): ListaMemoria[] {
    this.logger.log(`Obteniendo ${this.listas.size} playlists`);
    return Array.from(this.listas.values());
  }

  obtenerPorId(id: string): ListaMemoria | undefined {
    return this.listas.get(id);
  }

  crear(datos: Partial<ListaMemoria>): ListaMemoria {
    const id = this.generarId();
    const ahora = new Date().toISOString();
    const lista: ListaMemoria = {
      id,
      nombre: datos.nombre || 'Nueva Playlist',
      descripcion: datos.descripcion || '',
      pistaIds: datos.pistaIds || [],
      creadoEn: ahora,
      actualizadoEn: ahora,
    };
    this.listas.set(id, lista);
    this.logger.log(`Playlist creada: ${lista.nombre} (${id})`);
    return lista;
  }

  actualizar(id: string, datos: Partial<ListaMemoria>): ListaMemoria | null {
    const lista = this.listas.get(id);
    if (!lista) return null;

    const actualizada = {
      ...lista,
      ...datos,
      id,
      actualizadoEn: new Date().toISOString(),
    };
    this.listas.set(id, actualizada);
    this.logger.log(`Playlist actualizada: ${actualizada.nombre} (${id})`);
    return actualizada;
  }

  eliminar(id: string): boolean {
    const resultado = this.listas.delete(id);
    if (resultado) {
      this.logger.log(`Playlist eliminada: ${id}`);
    }
    return resultado;
  }

  private generarId(): string {
    return `pl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
