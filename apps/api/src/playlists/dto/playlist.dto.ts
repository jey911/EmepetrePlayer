import { IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class CrearListaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la playlist es obligatorio' })
  nombre!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsArray()
  @IsOptional()
  pistaIds?: string[];
}

export class ActualizarListaDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsArray()
  @IsOptional()
  pistaIds?: string[];
}
