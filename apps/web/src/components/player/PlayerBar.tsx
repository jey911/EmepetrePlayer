import React, { useCallback, useRef } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { ModoRepeticion, INCREMENTO_VOLUMEN } from '@emepetre/shared';
import { formatearTiempo } from '../../utils';
import { Caratula } from '../common/index';
import {
  IconoPlay,
  IconoPausa,
  IconoAnterior,
  IconoSiguiente,
  IconoAleatorio,
  IconoRepetir,
  IconoRepetirUna,
  IconoVolumen,
  IconoVolumenBajo,
  IconoSilencio,
  IconoCorazon,
  IconoCola,
  IconoEcualizador,
} from '../common/Icons';
import { useUIStore } from '../../store/uiStore';
import { alternarFavorito } from '../../db';

export function BarraReproductor() {
  const {
    pistaActual,
    reproduciendo,
    tiempoActual,
    duracion,
    volumen,
    silenciado,
    aleatorio,
    repeticion,
    reproducir,
    pausar,
    siguiente,
    anterior,
    buscarTiempo,
    establecerVolumen,
    alternarSilencio,
    alternarAleatorio,
    ciclarRepeticion,
  } = usePlayerStore();

  const { alternarCola, alternarEcualizador } = useUIStore();

  const barraProgresoRef = useRef<HTMLDivElement>(null);
  const barraVolumenRef = useRef<HTMLDivElement>(null);

  const manejarClickProgreso = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!barraProgresoRef.current || duracion === 0) return;
      const rect = barraProgresoRef.current.getBoundingClientRect();
      const porcentaje = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      buscarTiempo(porcentaje * duracion);
    },
    [duracion, buscarTiempo],
  );

  const manejarClickVolumen = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!barraVolumenRef.current) return;
      const rect = barraVolumenRef.current.getBoundingClientRect();
      const porcentaje = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      establecerVolumen(porcentaje);
    },
    [establecerVolumen],
  );

  const manejarFavorito = useCallback(async () => {
    if (!pistaActual) return;
    await alternarFavorito(pistaActual.id);
    // Forzar actualización del store
    usePlayerStore.setState((state) => ({
      pistaActual: state.pistaActual
        ? { ...state.pistaActual, favorito: !state.pistaActual.favorito }
        : null,
    }));
  }, [pistaActual]);

  const porcentajeProgreso = duracion > 0 ? (tiempoActual / duracion) * 100 : 0;
  const porcentajeVolumen = volumen * 100;

  const IconoRepeticionActual =
    repeticion === ModoRepeticion.UNA ? IconoRepetirUna : IconoRepetir;
  const repeticionActiva = repeticion !== ModoRepeticion.DESACTIVADO;

  let IconoVolumenActual = IconoVolumen;
  if (silenciado || volumen === 0) {
    IconoVolumenActual = IconoSilencio;
  } else if (volumen < 0.5) {
    IconoVolumenActual = IconoVolumenBajo;
  }

  if (!pistaActual) {
    return (
      <footer
        className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-surface-900/80
          backdrop-blur-xl border-t border-surface-200 dark:border-surface-700
          flex items-center justify-center text-surface-400 dark:text-surface-500 safe-bottom z-40"
        role="contentinfo"
      >
        <p className="text-sm">Selecciona una pista para comenzar a reproducir</p>
      </footer>
    );
  }

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-surface-900/90
        backdrop-blur-xl border-t border-surface-200 dark:border-surface-700
        safe-bottom z-40"
      role="contentinfo"
      aria-label="Reproductor de audio"
    >
      {/* Barra de progreso global (arriba del player) */}
      <div
        ref={barraProgresoRef}
        className="slider-track h-1 rounded-none cursor-pointer group"
        onClick={manejarClickProgreso}
        role="slider"
        aria-label="Progreso de reproducción"
        aria-valuemin={0}
        aria-valuemax={duracion}
        aria-valuenow={tiempoActual}
        aria-valuetext={`${formatearTiempo(tiempoActual)} de ${formatearTiempo(duracion)}`}
        tabIndex={0}
      >
        <div
          className="slider-fill"
          style={{ width: `${porcentajeProgreso}%` }}
        />
        <div
          className="slider-thumb"
          style={{ left: `${porcentajeProgreso}%` }}
        />
      </div>

      <div className="flex items-center h-[72px] px-4 gap-4">
        {/* Info de la pista */}
        <div className="flex items-center gap-3 min-w-0 w-1/4">
          <Caratula src={pistaActual.caratula} size="sm" alt={pistaActual.titulo} />
          <div className="min-w-0">
            <p className="text-sm font-medium line-clamp-1">{pistaActual.titulo}</p>
            <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-1">
              {pistaActual.artista}
            </p>
          </div>
          <button
            onClick={manejarFavorito}
            className={`btn-icon flex-shrink-0 ${pistaActual.favorito ? 'text-red-500' : ''}`}
            aria-label={pistaActual.favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <IconoCorazon className="w-4 h-4" relleno={pistaActual.favorito} />
          </button>
        </div>

        {/* Controles centrales */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className="flex items-center gap-2">
            <button
              onClick={alternarAleatorio}
              className={`btn-icon ${aleatorio ? 'text-primary-500' : ''}`}
              aria-label={aleatorio ? 'Desactivar aleatorio' : 'Activar aleatorio'}
              aria-pressed={aleatorio}
            >
              <IconoAleatorio className="w-4 h-4" />
            </button>

            <button
              onClick={anterior}
              className="btn-icon"
              aria-label="Pista anterior"
            >
              <IconoAnterior />
            </button>

            <button
              onClick={reproduciendo ? pausar : reproducir}
              className="btn-icon-lg bg-primary-600 hover:bg-primary-700 text-white rounded-full w-10 h-10 flex items-center justify-center"
              aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
            >
              {reproduciendo ? (
                <IconoPausa className="w-5 h-5" />
              ) : (
                <IconoPlay className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={siguiente}
              className="btn-icon"
              aria-label="Siguiente pista"
            >
              <IconoSiguiente />
            </button>

            <button
              onClick={ciclarRepeticion}
              className={`btn-icon ${repeticionActiva ? 'text-primary-500' : ''}`}
              aria-label={`Repetición: ${repeticion}`}
            >
              <IconoRepeticionActual className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400 w-full max-w-md">
            <span className="w-10 text-right tabular-nums">{formatearTiempo(tiempoActual)}</span>
            <div className="flex-1" /> {/* Espacio ocupado por la barra superior */}
            <span className="w-10 tabular-nums">{formatearTiempo(duracion)}</span>
          </div>
        </div>

        {/* Controles derechos */}
        <div className="flex items-center gap-1 w-1/4 justify-end">
          <button
            onClick={alternarEcualizador}
            className="btn-icon"
            aria-label="Ecualizador"
          >
            <IconoEcualizador className="w-4 h-4" />
          </button>

          <button
            onClick={alternarCola}
            className="btn-icon"
            aria-label="Cola de reproducción"
          >
            <IconoCola className="w-4 h-4" />
          </button>

          <button
            onClick={alternarSilencio}
            className="btn-icon"
            aria-label={silenciado ? 'Activar sonido' : 'Silenciar'}
          >
            <IconoVolumenActual className="w-4 h-4" />
          </button>

          <div
            ref={barraVolumenRef}
            className="slider-track w-24 cursor-pointer group"
            onClick={manejarClickVolumen}
            role="slider"
            aria-label="Volumen"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(porcentajeVolumen)}
            tabIndex={0}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY < 0 ? INCREMENTO_VOLUMEN : -INCREMENTO_VOLUMEN;
              establecerVolumen(Math.max(0, Math.min(1, volumen + delta)));
            }}
          >
            <div
              className="slider-fill"
              style={{ width: `${porcentajeVolumen}%` }}
            />
            <div
              className="slider-thumb"
              style={{ left: `${porcentajeVolumen}%` }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
