import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { TracksService } from './tracks.service';
import { CrearPistaDto, ActualizarPistaDto } from './dto/track.dto';

@Controller('tracks')
export class TracksController {
  private readonly logger = new Logger(TracksController.name);

  constructor(private readonly tracksService: TracksService) {}

  @Get()
  obtenerTodas() {
    return {
      datos: this.tracksService.obtenerTodas(),
      total: this.tracksService.obtenerTodas().length,
    };
  }

  @Get('stats')
  obtenerEstadisticas() {
    return this.tracksService.obtenerEstadisticas();
  }

  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    const pista = this.tracksService.obtenerPorId(id);
    if (!pista) {
      throw new NotFoundException(`Pista con ID "${id}" no encontrada`);
    }
    return pista;
  }

  @Post()
  crear(@Body() datos: CrearPistaDto) {
    this.logger.log(`Creando pista: ${datos.titulo}`);
    return this.tracksService.crear(datos);
  }

  @Put(':id')
  actualizar(@Param('id') id: string, @Body() datos: ActualizarPistaDto) {
    const pista = this.tracksService.actualizar(id, datos);
    if (!pista) {
      throw new NotFoundException(`Pista con ID "${id}" no encontrada`);
    }
    return pista;
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    const eliminada = this.tracksService.eliminar(id);
    if (!eliminada) {
      throw new NotFoundException(`Pista con ID "${id}" no encontrada`);
    }
    return { mensaje: 'Pista eliminada correctamente', id };
  }
}
