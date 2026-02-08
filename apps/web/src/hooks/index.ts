import { useEffect, useCallback, useRef } from 'react';
import { obtenerMotorAudio } from '../audio';
import type { PresetEcualizador } from '@emepetre/shared';

/**
 * Hook para interactuar con el motor de audio.
 * Provee acceso a la instancia del motor y funciones auxiliares.
 */
export function useAudioEngine() {
  const motorRef = useRef(obtenerMotorAudio());

  const inicializar = useCallback(async () => {
    await motorRef.current.inicializar();
  }, []);

  const aplicarPreset = useCallback((preset: PresetEcualizador) => {
    motorRef.current.establecerEcualizador(preset.ganancias);
    motorRef.current.establecerPreamp(preset.preamp);
  }, []);

  const obtenerDatosFrecuencia = useCallback(() => {
    return motorRef.current.obtenerDatosFrecuencia();
  }, []);

  const obtenerDatosOndas = useCallback(() => {
    return motorRef.current.obtenerDatosOndas();
  }, []);

  return {
    motor: motorRef.current,
    inicializar,
    aplicarPreset,
    obtenerDatosFrecuencia,
    obtenerDatosOndas,
  };
}

/**
 * Hook para atajos de teclado globales del reproductor.
 */
export function useKeyboardShortcuts(handlers: {
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onMute: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
  onSearch: () => void;
}) {
  useEffect(() => {
    const manejar = (e: KeyboardEvent) => {
      // No capturar atajos si el foco está en un input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlers.onPlayPause();
          break;
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) {
            handlers.onNext();
          }
          break;
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) {
            handlers.onPrevious();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          handlers.onVolumeUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handlers.onVolumeDown();
          break;
        case 'm':
        case 'M':
          handlers.onMute();
          break;
        case 's':
        case 'S':
          if (!e.ctrlKey && !e.metaKey) {
            handlers.onShuffle();
          }
          break;
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) {
            handlers.onRepeat();
          }
          break;
        case '/':
          e.preventDefault();
          handlers.onSearch();
          break;
      }
    };

    window.addEventListener('keydown', manejar);
    return () => window.removeEventListener('keydown', manejar);
  }, [handlers]);
}

/**
 * Hook para la Media Session API (controles del sistema).
 */
export function useMediaSession(datos: {
  titulo?: string;
  artista?: string;
  album?: string;
  caratula?: string | null;
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSeek?: (tiempo: number) => void;
}) {
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const artworkArray: MediaImage[] = [];
    if (datos.caratula) {
      artworkArray.push({ src: datos.caratula, sizes: '512x512', type: 'image/jpeg' });
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: datos.titulo || 'Sin título',
      artist: datos.artista || 'Artista desconocido',
      album: datos.album || '',
      artwork: artworkArray,
    });

    if (datos.onPlay) {
      navigator.mediaSession.setActionHandler('play', datos.onPlay);
    }
    if (datos.onPause) {
      navigator.mediaSession.setActionHandler('pause', datos.onPause);
    }
    if (datos.onNext) {
      navigator.mediaSession.setActionHandler('nexttrack', datos.onNext);
    }
    if (datos.onPrevious) {
      navigator.mediaSession.setActionHandler('previoustrack', datos.onPrevious);
    }
    if (datos.onSeek) {
      navigator.mediaSession.setActionHandler('seekto', (detalles) => {
        if (detalles.seekTime !== undefined) {
          datos.onSeek!(detalles.seekTime);
        }
      });
    }

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      } catch {
        // Ignorar errores al limpiar
      }
    };
  }, [datos.titulo, datos.artista, datos.album, datos.caratula, datos.onPlay, datos.onPause, datos.onNext, datos.onPrevious, datos.onSeek]);
}
