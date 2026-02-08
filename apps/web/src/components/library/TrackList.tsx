import React, { useCallback, useState, useEffect, useMemo } from 'react';
import type { Pista, FiltrosBusqueda, OpcionesOrdenamiento } from '@emepetre/shared';
import { obtenerTodasLasPistas, buscarPistas } from '../../db';
import { PistaItem } from './TrackItem';
import { EstadoVacio, SkeletonLoader } from '../common/index';
import { IconoMusica, IconoBuscar, IconoImportar } from '../common/Icons';
import { IconoCarpetaEscanear } from '../common/Icons';
import { useUIStore } from '../../store/uiStore';
import { abrirSelectorArchivos, importarArchivos } from '../../services/fileImporter';
import {
  seleccionarCarpeta,
  seleccionarCarpetaFallback,
  importarCarpeta,
  importarCarpetaFallback,
  soportaFileSystemAccess,
} from '../../services/folderScanner';
import { debounce } from '../../utils';

export function ListaPistas() {
  const [pistas, setPistas] = useState<Pista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [importando, setImportando] = useState(false);
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });
  const [ordenamiento, setOrdenamiento] = useState<OpcionesOrdenamiento>({
    campo: 'agregadoEn',
    direccion: 'desc',
  });
  const [filtroGenero, setFiltroGenero] = useState('');
  const { consultaBusqueda, agregarNotificacion } = useUIStore();

  const cargarPistas = useCallback(async () => {
    setCargando(true);
    try {
      const filtros: FiltrosBusqueda = {};
      if (consultaBusqueda) filtros.consulta = consultaBusqueda;
      if (filtroGenero) filtros.genero = filtroGenero;

      const resultado = await buscarPistas(filtros, ordenamiento);
      setPistas(resultado);
    } catch (error) {
      console.error('[Biblioteca] Error al cargar pistas:', error);
      agregarNotificacion('error', 'Error al cargar la biblioteca');
    } finally {
      setCargando(false);
    }
  }, [consultaBusqueda, filtroGenero, ordenamiento, agregarNotificacion]);

  const cargarPistasDebounced = useMemo(
    () => debounce(cargarPistas as (...args: unknown[]) => void, 300),
    [cargarPistas],
  );

  useEffect(() => {
    cargarPistasDebounced();
  }, [cargarPistasDebounced]);

  const manejarImportar = useCallback(async () => {
    const archivos = await abrirSelectorArchivos();
    if (!archivos || archivos.length === 0) return;

    setImportando(true);
    setProgreso({ actual: 0, total: archivos.length });

    try {
      const resultado = await importarArchivos(archivos, (actual, total) => {
        setProgreso({ actual, total });
      });

      if (resultado.exitosas.length > 0) {
        agregarNotificacion(
          'exito',
          `${resultado.exitosas.length} pista(s) importada(s) correctamente`,
        );
      }
      if (resultado.duplicadas.length > 0) {
        agregarNotificacion(
          'advertencia',
          `${resultado.duplicadas.length} archivo(s) duplicado(s) omitido(s)`,
        );
      }
      if (resultado.fallidas.length > 0) {
        agregarNotificacion(
          'error',
          `${resultado.fallidas.length} archivo(s) no pudieron importarse`,
        );
      }

      // Recargar la lista
      await cargarPistas();
    } catch (error) {
      console.error('[Biblioteca] Error en importación:', error);
      agregarNotificacion('error', 'Error durante la importación');
    } finally {
      setImportando(false);
    }
  }, [agregarNotificacion, cargarPistas]);

  const manejarEliminar = useCallback(
    (id: string) => {
      setPistas((prev) => prev.filter((p) => p.id !== id));
    },
    [],
  );

  // Escanear carpeta
  const manejarEscanearCarpeta = useCallback(async () => {
    setImportando(true);
    setProgreso({ actual: 0, total: 0 });

    try {
      let resultado;

      if (soportaFileSystemAccess()) {
        const dirHandle = await seleccionarCarpeta();
        if (!dirHandle) {
          setImportando(false);
          return;
        }
        resultado = await importarCarpeta(dirHandle, (p) => {
          if (p.fase === 'importando') {
            setProgreso({ actual: p.actual, total: p.total });
          }
        });
      } else {
        const seleccion = await seleccionarCarpetaFallback();
        if (!seleccion) {
          setImportando(false);
          return;
        }
        resultado = await importarCarpetaFallback(seleccion.archivos, seleccion.nombre, (p) => {
          if (p.fase === 'importando') {
            setProgreso({ actual: p.actual, total: p.total });
          }
        });
      }

      if (resultado.total === 0) {
        agregarNotificacion('advertencia', 'No se encontraron archivos de audio en la carpeta');
      } else {
        if (resultado.exitosas.length > 0) {
          agregarNotificacion(
            'exito',
            `${resultado.exitosas.length} pista(s) importada(s) desde "${resultado.carpetaRaiz}"`,
          );
        }
        if (resultado.duplicadas.length > 0) {
          agregarNotificacion(
            'advertencia',
            `${resultado.duplicadas.length} archivo(s) duplicado(s) omitido(s)`,
          );
        }
        if (resultado.fallidas.length > 0) {
          agregarNotificacion(
            'error',
            `${resultado.fallidas.length} archivo(s) no pudieron importarse`,
          );
        }
      }

      await cargarPistas();
    } catch (error) {
      console.error('[Biblioteca] Error al escanear carpeta:', error);
      agregarNotificacion('error', 'Error al escanear la carpeta');
    } finally {
      setImportando(false);
    }
  }, [agregarNotificacion, cargarPistas]);

  const generos = useMemo(() => {
    const set = new Set(pistas.map((p) => p.genero).filter(Boolean));
    return Array.from(set).sort();
  }, [pistas]);

  if (cargando) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <SkeletonLoader className="w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <SkeletonLoader className="h-3 w-3/4" />
              <SkeletonLoader className="h-2 w-1/2" />
            </div>
            <SkeletonLoader className="h-3 w-10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Barra de herramientas */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-3 flex-1">
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <IconoBuscar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Buscar pistas..."
              value={consultaBusqueda}
              onChange={(e) => useUIStore.getState().establecerBusqueda(e.target.value)}
              className="input pl-9"
              aria-label="Buscar en la biblioteca"
            />
          </div>

          {/* Filtro de género */}
          <select
            value={filtroGenero}
            onChange={(e) => setFiltroGenero(e.target.value)}
            className="input w-auto"
            aria-label="Filtrar por género"
          >
            <option value="">Todos los géneros</option>
            {generos.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* Ordenamiento */}
          <select
            value={`${ordenamiento.campo}-${ordenamiento.direccion}`}
            onChange={(e) => {
              const [campo, direccion] = e.target.value.split('-') as [
                OpcionesOrdenamiento['campo'],
                OpcionesOrdenamiento['direccion'],
              ];
              setOrdenamiento({ campo, direccion });
            }}
            className="input w-auto"
            aria-label="Ordenar por"
          >
            <option value="agregadoEn-desc">Recientes primero</option>
            <option value="agregadoEn-asc">Más antiguas primero</option>
            <option value="titulo-asc">Título A-Z</option>
            <option value="titulo-desc">Título Z-A</option>
            <option value="artista-asc">Artista A-Z</option>
            <option value="artista-desc">Artista Z-A</option>
            <option value="duracion-asc">Más cortas</option>
            <option value="duracion-desc">Más largas</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={manejarEscanearCarpeta}
            disabled={importando}
            className="btn-primary"
            aria-label="Escanear carpeta de audio"
            title="Escanear una carpeta completa"
          >
            <IconoCarpetaEscanear className="w-4 h-4" />
            <span className="hidden sm:inline">Carpeta</span>
          </button>

          <button
            onClick={manejarImportar}
            disabled={importando}
            className="btn-primary"
            aria-label="Importar archivos de audio"
          >
            <IconoImportar className="w-4 h-4" />
            {importando
              ? `Importando ${progreso.actual}/${progreso.total}...`
              : 'Importar'}
          </button>
        </div>
      </div>

      {/* Contador */}
      <div className="px-4 py-2 text-xs text-surface-500">
        {pistas.length} pista{pistas.length !== 1 ? 's' : ''} en la biblioteca
      </div>

      {/* Lista de pistas */}
      <div className="flex-1 overflow-y-auto px-2" role="grid" aria-label="Lista de pistas">
        {pistas.length === 0 ? (
          <EstadoVacio
            icono={<IconoMusica className="w-16 h-16" />}
            titulo="Tu biblioteca está vacía"
            descripcion="Importa archivos MP3 para comenzar a disfrutar de tu música favorita"
            accion={
              <button onClick={manejarImportar} className="btn-primary">
                <IconoImportar className="w-4 h-4" />
                Importar música
              </button>
            }
          />
        ) : (
          pistas.map((pista, indice) => (
            <PistaItem
              key={pista.id}
              pista={pista}
              indice={indice}
              listaPistas={pistas}
              onEliminar={manejarEliminar}
            />
          ))
        )}
      </div>
    </div>
  );
}
