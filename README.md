# 🎵 EmepetrePlayer

**Reproductor de música MP3 PWA corporativo con ecualizador avanzado de 10 bandas**

[![Node.js](https://img.shields.io/badge/Node.js-≥20-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red)](https://nestjs.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple)](https://web.dev/progressive-web-apps/)

---

## 📋 Descripción

EmepetrePlayer es una aplicación web progresiva (PWA) de grado corporativo para la reproducción de archivos de música MP3. Diseñada con un enfoque offline-first, utiliza IndexedDB como fuente de verdad y la Web Audio API para un procesamiento de audio profesional con ecualizador paramétrico de 10 bandas.

## 🚀 Características Principales

- **🎛️ Ecualizador de 10 bandas** — Frecuencias: 32Hz a 16kHz con preamp y 8 presets predefinidos
- **🔊 Motor de Audio Profesional** — Web Audio API con limitador soft-clip anti-clipping
- **📱 PWA Instalable** — Funciona offline, instalable en desktop y móvil
- **💾 Almacenamiento Local** — IndexedDB como fuente de verdad (sin dependencia de servidor)
- **🎨 Tema Claro/Oscuro/Sistema** — Diseño responsive con TailwindCSS
- **⌨️ Atajos de Teclado** — Control completo sin mouse
- **📊 Panel de Diagnóstico** — Monitoreo de estado del sistema en tiempo real
- **🔀 Cola de Reproducción** — Con aleatorio (Fisher-Yates) y modos de repetición
- **❤️ Favoritos** — Marca y filtra tus pistas favoritas
- **📂 Importación de Archivos** — Extracción automática de metadatos ID3 y carátulas
- **🎵 Playlists** — Crear, editar, exportar/importar en formato JSON
- **📺 Media Session API** — Controles del sistema operativo integrados

## 📁 Estructura del Proyecto

```
EmepetrePlayer/
├── apps/
│   ├── web/              # Frontend React PWA
│   │   ├── src/
│   │   │   ├── audio/    # Motor de audio (Web Audio API)
│   │   │   ├── components/ # Componentes React
│   │   │   ├── db/       # Capa de persistencia IndexedDB
│   │   │   ├── hooks/    # Hooks personalizados
│   │   │   ├── services/ # Servicios (importación de archivos)
│   │   │   ├── store/    # Estado global (Zustand)
│   │   │   └── utils/    # Utilidades
│   │   └── public/       # Recursos estáticos e íconos
│   └── api/              # Backend NestJS
│       └── src/
│           ├── health/   # Health check
│           ├── tracks/   # Módulo de pistas
│           ├── playlists/ # Módulo de playlists
│           └── common/   # Filtros, interceptores, middleware
├── packages/
│   └── shared/           # Tipos, constantes y enums compartidos
└── scripts/              # Scripts de utilidad
```

## 🛠️ Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| **Frontend** | React | 18.2 |
| **Lenguaje** | TypeScript | 5.3 (strict) |
| **Bundler** | Vite | 5.0 |
| **CSS** | TailwindCSS | 3.4 |
| **Estado** | Zustand | 4.5 |
| **Fetching** | TanStack Query | 5.17 |
| **Routing** | React Router | 6.21 |
| **DB Local** | idb (IndexedDB) | 8.0 |
| **Metadata** | music-metadata-browser | 2.5 |
| **Audio** | Web Audio API | Nativo |
| **Backend** | NestJS | 10.3 |
| **Testing** | Vitest / Jest | 1.2 / 29.7 |

## ⚡ Inicio Rápido

### Prerrequisitos

- **Node.js** ≥ 20.0.0
- **npm** ≥ 10.0.0

### Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd EmepetrePlayer

# Instalar dependencias (monorepo)
npm install
```

### Desarrollo

```bash
# Iniciar solo el frontend (http://localhost:5173)
npm run dev

# Iniciar solo el backend (http://localhost:3000)
npm run dev:api

# Iniciar ambos simultáneamente
npm run dev:all
```

### Build de Producción

```bash
# Build completo
npm run build

# Preview del build
npm -w apps/web run preview
```

### Testing

```bash
# Ejecutar todos los tests
npm test

# Tests del frontend
npm run test:web

# Tests del backend
npm run test:api

# Tests con cobertura
npm -w apps/web run test:coverage
```

### Otros Comandos

```bash
# Formatear código
npm run format

# Verificar formato
npm run format:check

# Limpiar builds
npm run clean

# Validar estructura del proyecto (Python)
npm run validate
```

## 🎛️ Motor de Audio

### Cadena de Señal

```
Fuente → Preamp (GainNode) → Ecualizador 10 bandas (BiquadFilterNode ×10)
       → Limitador (DynamicsCompressorNode) → Master Gain → Analyser → Destino
```

### Bandas del Ecualizador

| Banda | Frecuencia | Tipo |
|-------|-----------|------|
| 1 | 32 Hz | Peaking |
| 2 | 64 Hz | Peaking |
| 3 | 125 Hz | Peaking |
| 4 | 250 Hz | Peaking |
| 5 | 500 Hz | Peaking |
| 6 | 1 kHz | Peaking |
| 7 | 2 kHz | Peaking |
| 8 | 4 kHz | Peaking |
| 9 | 8 kHz | Peaking |
| 10 | 16 kHz | Peaking |

### Presets Disponibles

Plano, Rock, Pop, Clásica, Bass Boost, Vocal, Electrónica, Jazz

## ⌨️ Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Espacio` | Play / Pausa |
| `Ctrl + →` | Siguiente pista |
| `Ctrl + ←` | Pista anterior |
| `↑` | Subir volumen |
| `↓` | Bajar volumen |
| `M` | Silenciar / Restaurar |
| `S` | Alternar aleatorio |
| `R` | Ciclar modo de repetición |
| `/` | Enfocar barra de búsqueda |

## 📱 Instalación como PWA

### Chrome / Edge (Desktop)
1. Navega a la aplicación
2. Haz clic en el ícono de instalación en la barra de direcciones
3. Confirma la instalación

### iOS (Safari)
1. Navega a la aplicación en Safari
2. Toca el botón de compartir (cuadrado con flecha)
3. Selecciona "Agregar a pantalla de inicio"
4. Confirma tocando "Agregar"

### Android (Chrome)
1. Navega a la aplicación
2. Toca el menú ⋮ → "Instalar aplicación"
3. Confirma la instalación

## 🗄️ Base de Datos (IndexedDB)

### Almacenes (Object Stores)

| Almacén | Clave | Descripción |
|---------|-------|-------------|
| `pistas` | `id` | Metadatos de pistas de audio |
| `archivos` | `id` | Datos binarios de los archivos MP3 |
| `listas` | `id` | Playlists del usuario |
| `historial` | `id` | Historial de reproducciones |
| `configuracion` | `id` | Configuración de la aplicación |

## 📄 Licencia

Este proyecto es software privado corporativo. Todos los derechos reservados.

---

**Desarrollado con ❤️ por EmepetrePlayer Team**
