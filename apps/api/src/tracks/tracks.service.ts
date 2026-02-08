import { Injectable, Logger } from '@nestjs/common';

interface PistaMemoria {
  id: string;
  titulo: string;
  artista: string;
  album: string;
  genero: string;
  anio: number;
  duracion: number;
  favorito: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

@Injectable()
export class TracksService {
  private readonly logger = new Logger(TracksService.name);
  private pistas: Map<string, PistaMemoria> = new Map();

  obtenerTodas(): PistaMemoria[] {
    this.logger.log(`Obteniendo ${this.pistas.size} pistas`);
    return Array.from(this.pistas.values());
  }

  obtenerPorId(id: string): PistaMemoria | undefined {
    return this.pistas.get(id);
  }

  crear(datos: Partial<PistaMemoria>): PistaMemoria {
    const id = this.generarId();
    const ahora = new Date().toISOString();
    const pista: PistaMemoria = {
      id,
      titulo: datos.titulo || 'Sin título',
      artista: datos.artista || 'Artista desconocido',
      album: datos.album || 'Álbum desconocido',
      genero: datos.genero || '',
      anio: datos.anio || 0,
      duracion: datos.duracion || 0,
      favorito: false,
      creadoEn: ahora,
      actualizadoEn: ahora,
    };
    this.pistas.set(id, pista);
    this.logger.log(`Pista creada: ${pista.titulo} (${id})`);
    return pista;
  }

  actualizar(id: string, datos: Partial<PistaMemoria>): PistaMemoria | null {
    const pista = this.pistas.get(id);
    if (!pista) return null;

    const actualizada = {
      ...pista,
      ...datos,
      id,
      actualizadoEn: new Date().toISOString(),
    };
    this.pistas.set(id, actualizada);
    this.logger.log(`Pista actualizada: ${actualizada.titulo} (${id})`);
    return actualizada;
  }

  eliminar(id: string): boolean {
    const resultado = this.pistas.delete(id);
    if (resultado) {
      this.logger.log(`Pista eliminada: ${id}`);
    }
    return resultado;
  }

  obtenerEstadisticas() {
    return {
      totalPistas: this.pistas.size,
      totalFavoritas: Array.from(this.pistas.values()).filter((p) => p.favorito).length,
      generosUnicos: new Set(Array.from(this.pistas.values()).map((p) => p.genero).filter(Boolean))
        .size,
      artistasUnicos: new Set(Array.from(this.pistas.values()).map((p) => p.artista)).size,
    };
  }

  private generarId(): string {
    return `trk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
