import React, { useCallback, useState } from 'react';
import type { Pista } from '@emepetre/shared';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { Caratula } from '../common/index';
import { IconoCorazon, IconoPlay, IconoPausa, IconoMas, IconoEliminar } from '../common/Icons';
import { formatearTiempo } from '../../utils';
import { alternarFavorito, eliminarPista as eliminarPistaBD } from '../../db';

interface PistaItemProps {
  pista: Pista;
  indice: number;
  listaPistas: Pista[];
  onEliminar?: (id: string) => void;
}

export function PistaItem({ pista, indice, listaPistas, onEliminar }: PistaItemProps) {
  const { pistaActual, reproduciendo, cargarYReproducir, pausar, reproducir } = usePlayerStore();
  const { agregarNotificacion } = useUIStore();
  const [favoritoLocal, setFavoritoLocal] = useState(pista.favorito);
  const esActual = pistaActual?.id === pista.id;

  const manejarClick = useCallback(() => {
    if (esActual && reproduciendo) {
      pausar();
    } else if (esActual) {
      reproducir();
    } else {
      cargarYReproducir(pista, listaPistas);
    }
  }, [esActual, reproduciendo, pausar, reproducir, cargarYReproducir, pista, listaPistas]);

  const manejarFavorito = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const actualizada = await alternarFavorito(pista.id);
    if (actualizada) {
      setFavoritoLocal(actualizada.favorito);
      if (pistaActual?.id === pista.id) {
        usePlayerStore.setState((state) => ({
          pistaActual: state.pistaActual ? { ...state.pistaActual, favorito: actualizada.favorito } : null,
        }));
      }
    }
  }, [pista.id, pistaActual?.id]);

  const manejarEliminar = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await eliminarPistaBD(pista.id);
    onEliminar?.(pista.id);
    agregarNotificacion('info', `"${pista.titulo}" eliminada de la biblioteca`);
  }, [pista.id, pista.titulo, onEliminar, agregarNotificacion]);

  const manejarAgregarCola = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    usePlayerStore.getState().agregarACola(pista);
    agregarNotificacion('exito', `"${pista.titulo}" agregada a la cola`);
  }, [pista, agregarNotificacion]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer group
        transition-colors duration-100
        ${esActual
          ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
          : 'hover:bg-surface-100 dark:hover:bg-surface-800'
        }`}
      onClick={manejarClick}
      role="row"
      aria-selected={esActual}
      aria-label={`${pista.titulo} por ${pista.artista}`}
    >
      {/* Número o indicador de reproducción */}
      <div className="w-8 text-center flex-shrink-0">
        {esActual ? (
          <button className="text-primary-500" aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}>
            {reproduciendo ? <IconoPausa className="w-4 h-4" /> : <IconoPlay className="w-4 h-4" />}
          </button>
        ) : (
          <span className="text-xs text-surface-400 group-hover:hidden">{indice + 1}</span>
        )}
        {!esActual && (
          <button
            className="hidden group-hover:block text-surface-500"
            aria-label={`Reproducir ${pista.titulo}`}
          >
            <IconoPlay className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Carátula */}
      <Caratula src={pista.caratula} size="sm" alt={pista.titulo} />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium line-clamp-1 ${
          esActual ? 'text-primary-600 dark:text-primary-400' : ''
        }`}>
          {pista.titulo}
        </p>
        <p className="text-xs text-surface-500 line-clamp-1">
          {pista.artista} {pista.album && pista.album !== 'Álbum desconocido' ? `• ${pista.album}` : ''}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={manejarFavorito}
          className={`btn-icon w-8 h-8 ${favoritoLocal ? 'text-red-500' : 'opacity-0 group-hover:opacity-100'}`}
          aria-label={favoritoLocal ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <IconoCorazon className="w-4 h-4" relleno={favoritoLocal} />
        </button>

        <button
          onClick={manejarAgregarCola}
          className="btn-icon w-8 h-8 opacity-0 group-hover:opacity-100"
          aria-label="Agregar a la cola"
        >
          <IconoMas className="w-4 h-4" />
        </button>

        <button
          onClick={manejarEliminar}
          className="btn-icon w-8 h-8 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500"
          aria-label="Eliminar pista"
        >
          <IconoEliminar className="w-4 h-4" />
        </button>
      </div>

      {/* Duración */}
      <span className="text-xs text-surface-400 tabular-nums flex-shrink-0 w-12 text-right">
        {formatearTiempo(pista.duracion)}
      </span>
    </div>
  );
}
