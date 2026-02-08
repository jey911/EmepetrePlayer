import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { BarraReproductor } from './components/player/PlayerBar';
import { PanelEcualizador } from './components/player/Equalizer';
import { PanelCola } from './components/player/Queue';
import { Notificaciones, SkeletonLoader } from './components/common';
import { useUIStore } from './store/uiStore';
import { usePlayerStore } from './store/playerStore';
import { useKeyboardShortcuts, useMediaSession, useAudioEngine } from './hooks';
import { abrirBD } from './db';
import { recuperarEstadoReproduccion, obtenerPista } from './db';
import { IconoMenu } from './components/common/Icons';
import { INCREMENTO_VOLUMEN } from '@emepetre/shared';

// Lazy load de páginas
const ListaPistas = lazy(() =>
  import('./components/library/TrackList').then((m) => ({ default: m.ListaPistas }))
);
const PaginaPlaylists = lazy(() =>
  import('./components/playlists/PlaylistPage').then((m) => ({ default: m.PaginaPlaylists }))
);
const PaginaAjustes = lazy(() =>
  import('./components/settings/SettingsPage').then((m) => ({ default: m.PaginaAjustes }))
);
const PanelDiagnostico = lazy(() =>
  import('./components/diagnostics/DiagnosticsPanel').then((m) => ({
    default: m.PanelDiagnostico,
  }))
);
const PaginaCarpetas = lazy(() =>
  import('./components/folders/FolderBrowser').then((m) => ({
    default: m.PaginaCarpetas,
  }))
);

function FallbackCarga() {
  return (
    <div className="p-6 space-y-4">
      <SkeletonLoader className="h-8 w-48" />
      <SkeletonLoader className="h-64 w-full" />
    </div>
  );
}

export default function App() {
  const sidebarAbierto = useUIStore((s) => s.sidebarAbierto);
  const alternarSidebar = useUIStore((s) => s.alternarSidebar);
  const colaAbierta = useUIStore((s) => s.colaAbierta);
  const ecualizadorAbierto = useUIStore((s) => s.ecualizadorAbierto);

  const {
    reproducir,
    pausar,
    reproduciendo,
    siguiente,
    anterior,
    alternarSilencio,
    alternarAleatorio,
    ciclarRepeticion,
    volumen,
    establecerVolumen,
    pistaActual,
    restaurarEstado,
  } = usePlayerStore();

  const { inicializar } = useAudioEngine();

  // Inicializar base de datos y motor de audio
  useEffect(() => {
    const init = async () => {
      try {
        await abrirBD();
        // Intentar recuperar estado de reproducción previo
        const estadoGuardado = await recuperarEstadoReproduccion();
        if (estadoGuardado && estadoGuardado.pistaId) {
          const pista = await obtenerPista(estadoGuardado.pistaId);
          if (pista) {
            restaurarEstado(pista, estadoGuardado.posicion, estadoGuardado.volumen);
          }
        }
      } catch (error) {
        console.warn('[App] Error al inicializar:', error);
      }
    };
    init();
  }, [restaurarEstado]);

  // Atajos de teclado
  useKeyboardShortcuts({
    onPlayPause: () => (reproduciendo ? pausar() : reproducir()),
    onNext: siguiente,
    onPrevious: anterior,
    onVolumeUp: () => establecerVolumen(Math.min(1, volumen + INCREMENTO_VOLUMEN)),
    onVolumeDown: () => establecerVolumen(Math.max(0, volumen - INCREMENTO_VOLUMEN)),
    onMute: alternarSilencio,
    onShuffle: alternarAleatorio,
    onRepeat: ciclarRepeticion,
    onSearch: () => {
      const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
      searchInput?.focus();
    },
  });

  // Media Session API (controles del OS)
  useMediaSession({
    titulo: pistaActual?.titulo,
    artista: pistaActual?.artista,
    album: pistaActual?.album,
    caratula: pistaActual?.caratula,
    onPlay: reproducir,
    onPause: pausar,
    onNext: siguiente,
    onPrevious: anterior,
  });

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header móvil */}
        <header className="flex items-center h-14 px-4 border-b border-surface-200 dark:border-surface-700 md:hidden">
          <button
            className="btn-icon"
            onClick={alternarSidebar}
            aria-label="Abrir menú"
          >
            <IconoMenu className="w-5 h-5" />
          </button>
          <span className="ml-3 font-semibold text-lg">EmepetrePlayer</span>
        </header>

        {/* Área de contenido scrolleable */}
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<FallbackCarga />}>
            <Routes>
              <Route path="/" element={<ListaPistas />} />
              <Route path="/carpetas" element={<PaginaCarpetas />} />
              <Route path="/listas" element={<PaginaPlaylists />} />
              <Route path="/ajustes" element={<PaginaAjustes />} />
              <Route path="/diagnostico" element={<PanelDiagnostico />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>

        {/* Barra del reproductor */}
        <BarraReproductor />
      </div>

      {/* Paneles laterales derechos */}
      {ecualizadorAbierto && (
        <div className="hidden md:block w-80 border-l border-surface-200 dark:border-surface-700 overflow-y-auto bg-white dark:bg-surface-900">
          <PanelEcualizador />
        </div>
      )}

      {colaAbierta && (
        <div className="hidden md:block w-80 border-l border-surface-200 dark:border-surface-700 overflow-y-auto bg-white dark:bg-surface-900">
          <PanelCola />
        </div>
      )}

      {/* Notificaciones */}
      <Notificaciones />
    </div>
  );
}
