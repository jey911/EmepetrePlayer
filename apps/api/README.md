# @emepetre/api — Backend NestJS

API REST del reproductor de música EmepetrePlayer.

## Stack

- NestJS 10
- TypeScript 5.3
- class-validator / class-transformer
- Jest para testing

## Estructura

```
src/
├── main.ts              # Bootstrap de la aplicación
├── app.module.ts        # Módulo raíz
├── app.controller.ts    # Controller raíz (info)
├── app.service.ts       # Servicio raíz
├── health/              # Health check endpoint
├── tracks/              # Módulo de pistas
│   ├── tracks.controller.ts
│   ├── tracks.service.ts
│   └── dto/
├── playlists/           # Módulo de playlists
│   ├── playlists.controller.ts
│   ├── playlists.service.ts
│   └── dto/
└── common/
    ├── filters/         # HttpExceptionFilter
    ├── interceptors/    # LoggingInterceptor
    └── middleware/       # LoggerMiddleware
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api` | Información de la API |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/tracks` | Listar pistas |
| `POST` | `/api/tracks` | Crear pista |
| `GET` | `/api/playlists` | Listar playlists |
| `POST` | `/api/playlists` | Crear playlist |

## Comandos

```bash
npm run start:dev    # Desarrollo con watch
npm run build        # Build de producción
npm run test         # Tests unitarios
npm run test:cov     # Tests con cobertura
```
