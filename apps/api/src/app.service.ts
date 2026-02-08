import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  obtenerInfo() {
    return {
      nombre: 'EmepetrePlayer API',
      version: '1.0.0',
      descripcion: 'API del reproductor de música MP3 corporativo',
      estado: 'activo',
      timestamp: new Date().toISOString(),
    };
  }
}
