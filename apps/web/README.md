# @emepetre/web — Frontend PWA

Interfaz de usuario del reproductor de música EmepetrePlayer.

## Stack

- React 18 + TypeScript (strict)
- Vite 5 como bundler
- TailwindCSS 3.4 para estilos
- Zustand 4.5 para estado global
- IndexedDB (vía `idb`) como almacenamiento
- Web Audio API para procesamiento de audio
- Service Worker para modo offline

## Estructura

```
src/
├── audio/          # Motor de audio Web Audio API
│   ├── AudioEngine.ts   # Motor principal (singleton)
│   ├── Equalizer.ts     # Ecualizador paramétrico 10 bandas
│   └── Limiter.ts       # Limitador soft-clip
├── components/     # Componentes React
│   ├── common/     # Íconos, Modal, Caratula, Skeleton
│   ├── player/     # Barra de reproductor, Ecualizador, Cola
│   ├── library/    # Lista de pistas, Item de pista
│   ├── playlists/  # Gestión de playlists
│   ├── settings/   # Página de ajustes
│   ├── diagnostics/ # Panel de diagnóstico
│   └── layout/     # Sidebar
├── db/             # Capa de persistencia IndexedDB
├── hooks/          # useAudioEngine, useKeyboardShortcuts, useMediaSession
├── services/       # Importador de archivos
├── store/          # Zustand stores (player + UI)
└── utils/          # Utilidades y helpers
```

## Comandos

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run test         # Tests unitarios
npm run test:watch   # Tests en modo watch
npm run test:coverage # Tests con cobertura
```
