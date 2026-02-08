import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  verificar() {
    return {
      estado: 'activo',
      servicio: 'EmepetrePlayer API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoria: {
        usada: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unidad: 'MB',
      },
    };
  }
}
