import React from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { Caratula } from '../common/index';
import { IconoCerrar, IconoArrastre, IconoPlay } from '../common/Icons';
import { formatearTiempo } from '../../utils';
import type { Pista } from '@emepetre/shared';

export function PanelCola() {
  const { colaAbierta, alternarCola } = useUIStore();
  const { cola, indiceCola, pistaActual, cargarYReproducir, removerDeCola } = usePlayerStore();

  if (!colaAbierta) return null;

  return (
    <div
      className="fixed right-0 top-0 bottom-20 w-80 bg-white dark:bg-surface-800
        border-l border-surface-200 dark:border-surface-700 shadow-xl z-30
        flex flex-col animate-slide-up"
      role="complementary"
      aria-label="Cola de reproducción"
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
        <div>
          <h2 className="font-semibold">Cola de reproducción</h2>
          <p className="text-xs text-surface-500">{cola.length} pistas</p>
        </div>
        <button onClick={alternarCola} className="btn-icon" aria-label="Cerrar cola">
          <IconoCerrar />
        </button>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {cola.length === 0 ? (
          <div className="flex items-center justify-center h-full text-surface-400 text-sm">
            Cola vacía
          </div>
        ) : (
          <ul className="py-2" role="list">
            {cola.map((pista: Pista, indice: number) => {
              const esActual = pista.id === pistaActual?.id && indice === indiceCola;
              return (
                <li
                  key={`${pista.id}-${indice}`}
                  className={`flex items-center gap-3 px-4 py-2 hover:bg-surface-100 dark:hover:bg-surface-700/50
                    transition-colors cursor-pointer group ${
                      esActual ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    }`}
                  onClick={() => {
                    usePlayerStore.setState({ indiceCola: indice });
                    cargarYReproducir(pista);
                  }}
                  role="listitem"
                >
                  <div className="flex-shrink-0 text-surface-300 cursor-grab" aria-hidden="true">
                    <IconoArrastre className="w-4 h-4" />
                  </div>

                  <Caratula src={pista.caratula} size="sm" alt={pista.titulo} />

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium line-clamp-1 ${
                      esActual ? 'text-primary-600 dark:text-primary-400' : ''
                    }`}>
                      {esActual && <IconoPlay className="w-3 h-3 inline mr-1" />}
                      {pista.titulo}
                    </p>
                    <p className="text-xs text-surface-500 line-clamp-1">{pista.artista}</p>
                  </div>

                  <span className="text-xs text-surface-400 tabular-nums flex-shrink-0">
                    {formatearTiempo(pista.duracion)}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removerDeCola(indice);
                    }}
                    className="btn-icon w-7 h-7 opacity-0 group-hover:opacity-100"
                    aria-label={`Remover ${pista.titulo} de la cola`}
                  >
                    <IconoCerrar className="w-3 h-3" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
