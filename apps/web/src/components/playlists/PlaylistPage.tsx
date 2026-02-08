import React, { useState, useEffect, useCallback } from 'react';
import type { ListaReproduccion, Pista } from '@emepetre/shared';
import {
  obtenerTodasLasListas,
  crearLista,
  eliminarLista,
  exportarLista,
  importarLista,
  obtenerPista,
} from '../../db';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { EstadoVacio, Modal, Caratula } from '../common/index';
import { IconoLista, IconoMas, IconoEliminar, IconoExportar, IconoImportar, IconoPlay } from '../common/Icons';
import { formatearTiempo } from '../../utils';

export function PaginaPlaylists() {
  const [listas, setListas] = useState<ListaReproduccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalCrear, setModalCrear] = useState(false);
  const [nombreNueva, setNombreNueva] = useState('');
  const [descripcionNueva, setDescripcionNueva] = useState('');
  const [listaSeleccionada, setListaSeleccionada] = useState<ListaReproduccion | null>(null);
  const [pistasDeLista, setPistasDeLista] = useState<Pista[]>([]);

  const { cargarYReproducir } = usePlayerStore();
  const { agregarNotificacion } = useUIStore();

  const cargarListas = useCallback(async () => {
    setCargando(true);
    try {
      const resultado = await obtenerTodasLasListas();
      setListas(resultado);
    } catch {
      agregarNotificacion('error', 'Error al cargar playlists');
    } finally {
      setCargando(false);
    }
  }, [agregarNotificacion]);

  useEffect(() => {
    cargarListas();
  }, [cargarListas]);

  const manejarCrear = useCallback(async () => {
    if (!nombreNueva.trim()) return;
    await crearLista(nombreNueva.trim(), descripcionNueva.trim());
    setNombreNueva('');
    setDescripcionNueva('');
    setModalCrear(false);
    await cargarListas();
    agregarNotificacion('exito', 'Playlist creada correctamente');
  }, [nombreNueva, descripcionNueva, cargarListas, agregarNotificacion]);

  const manejarEliminar = useCallback(async (id: string) => {
    await eliminarLista(id);
    if (listaSeleccionada?.id === id) {
      setListaSeleccionada(null);
      setPistasDeLista([]);
    }
    await cargarListas();
    agregarNotificacion('info', 'Playlist eliminada');
  }, [listaSeleccionada, cargarListas, agregarNotificacion]);

  const manejarExportar = useCallback(async (id: string) => {
    const json = await exportarLista(id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `playlist-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      agregarNotificacion('exito', 'Playlist exportada correctamente');
    }
  }, [agregarNotificacion]);

  const manejarImportar = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const texto = await file.text();
      const resultado = await importarLista(texto);
      if (resultado) {
        await cargarListas();
        agregarNotificacion('exito', `Playlist "${resultado.nombre}" importada`);
      } else {
        agregarNotificacion('error', 'Formato de playlist no válido');
      }
    };
    input.click();
  }, [cargarListas, agregarNotificacion]);

  const seleccionarLista = useCallback(async (lista: ListaReproduccion) => {
    setListaSeleccionada(lista);
    const pistas: Pista[] = [];
    for (const id of lista.pistaIds) {
      const pista = await obtenerPista(id);
      if (pista) pistas.push(pista);
    }
    setPistasDeLista(pistas);
  }, []);

  const reproducirLista = useCallback(() => {
    if (pistasDeLista.length > 0) {
      cargarYReproducir(pistasDeLista[0], pistasDeLista);
    }
  }, [pistasDeLista, cargarYReproducir]);

  if (cargando) {
    return <div className="p-8 text-center text-surface-400">Cargando playlists...</div>;
  }

  // Vista de detalle de playlist seleccionada
  if (listaSeleccionada) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <button
            onClick={() => { setListaSeleccionada(null); setPistasDeLista([]); }}
            className="text-sm text-primary-500 hover:underline mb-3"
          >
            ← Volver a playlists
          </button>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <IconoLista className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{listaSeleccionada.nombre}</h2>
              {listaSeleccionada.descripcion && (
                <p className="text-sm text-surface-500 mt-1">{listaSeleccionada.descripcion}</p>
              )}
              <p className="text-xs text-surface-400 mt-1">{pistasDeLista.length} pistas</p>
            </div>
            {pistasDeLista.length > 0 && (
              <button onClick={reproducirLista} className="btn-primary ml-auto">
                <IconoPlay className="w-4 h-4" />
                Reproducir
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {pistasDeLista.length === 0 ? (
            <div className="text-center py-12 text-surface-400">
              Esta playlist no tiene pistas
            </div>
          ) : (
            pistasDeLista.map((pista, indice) => (
              <div
                key={pista.id}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer"
                onClick={() => cargarYReproducir(pista, pistasDeLista)}
              >
                <span className="w-6 text-center text-xs text-surface-400">{indice + 1}</span>
                <Caratula src={pista.caratula} size="sm" alt={pista.titulo} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{pista.titulo}</p>
                  <p className="text-xs text-surface-500 line-clamp-1">{pista.artista}</p>
                </div>
                <span className="text-xs text-surface-400 tabular-nums">{formatearTiempo(pista.duracion)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cabecera */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700">
        <h2 className="text-lg font-semibold">Playlists</h2>
        <div className="flex gap-2">
          <button onClick={manejarImportar} className="btn-secondary text-sm">
            <IconoImportar className="w-4 h-4" />
            Importar
          </button>
          <button onClick={() => setModalCrear(true)} className="btn-primary text-sm">
            <IconoMas className="w-4 h-4" />
            Nueva Playlist
          </button>
        </div>
      </div>

      {/* Lista de playlists */}
      <div className="flex-1 overflow-y-auto p-4">
        {listas.length === 0 ? (
          <EstadoVacio
            icono={<IconoLista className="w-16 h-16" />}
            titulo="No hay playlists"
            descripcion="Crea tu primera playlist para organizar tu música"
            accion={
              <button onClick={() => setModalCrear(true)} className="btn-primary">
                <IconoMas className="w-4 h-4" />
                Crear playlist
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listas.map((lista) => (
              <div
                key={lista.id}
                className="card p-4 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => seleccionarLista(lista)}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                    <IconoLista className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); manejarExportar(lista.id); }}
                      className="btn-icon w-8 h-8"
                      aria-label="Exportar playlist"
                    >
                      <IconoExportar className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); manejarEliminar(lista.id); }}
                      className="btn-icon w-8 h-8 text-red-400"
                      aria-label="Eliminar playlist"
                    >
                      <IconoEliminar className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold mt-3 line-clamp-1">{lista.nombre}</h3>
                <p className="text-xs text-surface-500 mt-1">
                  {lista.pistaIds.length} pista{lista.pistaIds.length !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de crear playlist */}
      <Modal
        abierto={modalCrear}
        onCerrar={() => setModalCrear(false)}
        titulo="Nueva Playlist"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={nombreNueva}
              onChange={(e) => setNombreNueva(e.target.value)}
              className="input"
              placeholder="Mi playlist..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && manejarCrear()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
            <textarea
              value={descripcionNueva}
              onChange={(e) => setDescripcionNueva(e.target.value)}
              className="input resize-none"
              rows={3}
              placeholder="Describe tu playlist..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModalCrear(false)} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={manejarCrear}
              className="btn-primary"
              disabled={!nombreNueva.trim()}
            >
              Crear
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
