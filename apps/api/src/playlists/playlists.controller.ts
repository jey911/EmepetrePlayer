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
import { PlaylistsService } from './playlists.service';
import { CrearListaDto, ActualizarListaDto } from './dto/playlist.dto';

@Controller('playlists')
export class PlaylistsController {
  private readonly logger = new Logger(PlaylistsController.name);

  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  obtenerTodas() {
    return {
      datos: this.playlistsService.obtenerTodas(),
      total: this.playlistsService.obtenerTodas().length,
    };
  }

  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    const lista = this.playlistsService.obtenerPorId(id);
    if (!lista) {
      throw new NotFoundException(`Playlist con ID "${id}" no encontrada`);
    }
    return lista;
  }

  @Post()
  crear(@Body() datos: CrearListaDto) {
    this.logger.log(`Creando playlist: ${datos.nombre}`);
    return this.playlistsService.crear(datos);
  }

  @Put(':id')
  actualizar(@Param('id') id: string, @Body() datos: ActualizarListaDto) {
    const lista = this.playlistsService.actualizar(id, datos);
    if (!lista) {
      throw new NotFoundException(`Playlist con ID "${id}" no encontrada`);
    }
    return lista;
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    const eliminada = this.playlistsService.eliminar(id);
    if (!eliminada) {
      throw new NotFoundException(`Playlist con ID "${id}" no encontrada`);
    }
    return { mensaje: 'Playlist eliminada correctamente', id };
  }
}
