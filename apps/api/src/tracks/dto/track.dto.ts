import { IsString, IsOptional, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class CrearPistaDto {
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  titulo!: string;

  @IsString()
  @IsNotEmpty({ message: 'El artista es obligatorio' })
  artista!: string;

  @IsString()
  @IsOptional()
  album?: string;

  @IsString()
  @IsOptional()
  genero?: string;

  @IsNumber()
  @IsOptional()
  anio?: number;

  @IsNumber()
  @Min(0, { message: 'La duración debe ser positiva' })
  duracion!: number;
}

export class ActualizarPistaDto {
  @IsString()
  @IsOptional()
  titulo?: string;

  @IsString()
  @IsOptional()
  artista?: string;

  @IsString()
  @IsOptional()
  album?: string;

  @IsString()
  @IsOptional()
  genero?: string;

  @IsNumber()
  @IsOptional()
  anio?: number;

  @IsOptional()
  favorito?: boolean;
}
