import React, { useCallback, useState, useEffect } from 'react';
import type { Pista, NodoCarpeta } from '@emepetre/shared';
import {
  obtenerCarpetasRaiz,
  obtenerEstructuraCarpetas,
  obtenerPistasPorCarpeta,
} from '../../db';
import {
  seleccionarCarpeta,
  seleccionarCarpetaFallback,
  importarCarpeta,
  importarCarpetaFallback,
  soportaFileSystemAccess,
} from '../../services/folderScanner';
import type { ProgresoEscaneo } from '../../services/folderScanner';
import { PistaItem } from '../library/TrackItem';
import { EstadoVacio, SkeletonLoader } from '../common/index';
import {
  IconoCarpeta,
  IconoCarpetaAbierta,
  IconoCarpetaEscanear,
  IconoFlecha,
  IconoRegresar,
  IconoMusica,
} from '../common/Icons';
import { useUIStore } from '../../store/uiStore';

/** Componente de nodo de árbol de carpetas */
function NodoArbol({
  nodo,
  nivel,
  carpetaSeleccionada,
  onSeleccionar,
}: {
  nodo: NodoCarpeta;
  nivel: number;
  carpetaSeleccionada: string | null;
  onSeleccionar: (ruta: string) => void;
}) {
  const [expandido, setExpandido] = useState(nivel === 0);
  const esSeleccionada = carpetaSeleccionada === nodo.ruta;
  const tieneSubcarpetas = nodo.subcarpetas.length > 0;

  return (
    <div>
      <button
        className={`
          w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors
          ${esSeleccionada
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
            : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
          }
        `}
        style={{ paddingLeft: `${12 + nivel * 16}px` }}
        onClick={() => {
          onSeleccionar(nodo.ruta);
          if (tieneSubcarpetas) setExpandido(!expandido);
        }}
      >
        {tieneSubcarpetas && (
          <IconoFlecha
            className="w-3 h-3 flex-shrink-0 transition-transform"
            direccion={expandido ? 'abajo' : 'derecha'}
          />
        )}
        {!tieneSubcarpetas && <span className="w-3" />}

        {expandido ? (
          <IconoCarpetaAbierta className="w-4 h-4 flex-shrink-0 text-amber-500" />
        ) : (
          <IconoCarpeta className="w-4 h-4 flex-shrink-0 text-amber-500" />
        )}

        <span className="truncate flex-1 text-left">{nodo.nombre}</span>

        {nodo.cantidadPistas > 0 && (
          <span className="text-xs text-surface-400 flex-shrink-0">
            {nodo.cantidadPistas}
          </span>
        )}
      </button>

      {expandido && tieneSubcarpetas && (
        <div>
          {nodo.subcarpetas.map((sub) => (
            <NodoArbol
              key={sub.ruta}
              nodo={sub}
              nivel={nivel + 1}
              carpetaSeleccionada={carpetaSeleccionada}
              onSeleccionar={onSeleccionar}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PaginaCarpetas() {
  const [carpetasRaiz, setCarpetasRaiz] = useState<string[]>([]);
  const [carpetaRaizSeleccionada, setCarpetaRaizSeleccionada] = useState<string | null>(null);
  const [estructura, setEstructura] = useState<NodoCarpeta | null>(null);
  const [carpetaSeleccionada, setCarpetaSeleccionada] = useState<string | null>(null);
  const [pistas, setPistas] = useState<Pista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [escaneando, setEscaneando] = useState(false);
  const [progreso, setProgreso] = useState<ProgresoEscaneo | null>(null);
  const { agregarNotificacion } = useUIStore();

  // Cargar carpetas raíz al montar
  const cargarCarpetas = useCallback(async () => {
    setCargando(true);
    try {
      const carpetas = await obtenerCarpetasRaiz();
      setCarpetasRaiz(carpetas);

      // Si hay una carpeta seleccionada, verificar que aún existe
      if (carpetaRaizSeleccionada && !carpetas.includes(carpetaRaizSeleccionada)) {
        setCarpetaRaizSeleccionada(null);
        setEstructura(null);
        setCarpetaSeleccionada(null);
        setPistas([]);
      }
    } catch (error) {
      console.error('[Carpetas] Error al cargar:', error);
    } finally {
      setCargando(false);
    }
  }, [carpetaRaizSeleccionada]);

  useEffect(() => {
    cargarCarpetas();
  }, [cargarCarpetas]);

  // Cargar estructura al seleccionar una carpeta raíz
  const seleccionarCarpetaRaiz = useCallback(async (nombre: string) => {
    setCarpetaRaizSeleccionada(nombre);
    setCarpetaSeleccionada(null);

    try {
      const arbol = await obtenerEstructuraCarpetas(nombre);
      setEstructura(arbol);

      // Cargar pistas de la raíz
      const pistasCarpeta = await obtenerPistasPorCarpeta(nombre, '');
      setPistas(pistasCarpeta);
    } catch (error) {
      console.error('[Carpetas] Error al cargar estructura:', error);
    }
  }, []);

  // Navegar a una subcarpeta
  const navegarACarpeta = useCallback(async (ruta: string) => {
    setCarpetaSeleccionada(ruta);

    if (carpetaRaizSeleccionada) {
      try {
        const pistasCarpeta = await obtenerPistasPorCarpeta(carpetaRaizSeleccionada, ruta);
        setPistas(pistasCarpeta);
      } catch (error) {
        console.error('[Carpetas] Error al cargar pistas:', error);
      }
    }
  }, [carpetaRaizSeleccionada]);

  // Escanear una nueva carpeta
  const manejarEscanearCarpeta = useCallback(async () => {
    setEscaneando(true);
    setProgreso(null);

    try {
      let resultado;

      if (soportaFileSystemAccess()) {
        // Usar File System Access API (Chrome, Edge)
        const dirHandle = await seleccionarCarpeta();
        if (!dirHandle) {
          setEscaneando(false);
          return;
        }

        resultado = await importarCarpeta(dirHandle, (p) => setProgreso(p));
      } else {
        // Fallback: usar input con webkitdirectory
        const seleccion = await seleccionarCarpetaFallback();
        if (!seleccion) {
          setEscaneando(false);
          return;
        }

        resultado = await importarCarpetaFallback(
          seleccion.archivos,
          seleccion.nombre,
          (p) => setProgreso(p),
        );
      }

      // Notificaciones de resultado
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

      // Recargar carpetas
      await cargarCarpetas();

      // Seleccionar la carpeta recién escaneada
      if (resultado.exitosas.length > 0) {
        await seleccionarCarpetaRaiz(resultado.carpetaRaiz);
      }
    } catch (error) {
      console.error('[Carpetas] Error al escanear:', error);
      agregarNotificacion('error', 'Error al escanear la carpeta');
    } finally {
      setEscaneando(false);
      setProgreso(null);
    }
  }, [agregarNotificacion, cargarCarpetas, seleccionarCarpetaRaiz]);

  // Volver a la lista de carpetas raíz
  const volverALista = useCallback(() => {
    setCarpetaRaizSeleccionada(null);
    setEstructura(null);
    setCarpetaSeleccionada(null);
    setPistas([]);
  }, []);

  if (cargando) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <SkeletonLoader className="w-8 h-8 rounded" />
            <SkeletonLoader className="h-4 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  // Vista de detalle de una carpeta raíz
  if (carpetaRaizSeleccionada && estructura) {
    return (
      <div className="flex flex-col h-full">
        {/* Cabecera */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-200 dark:border-surface-700">
          <button
            onClick={volverALista}
            className="btn-icon"
            aria-label="Volver a la lista de carpetas"
          >
            <IconoRegresar className="w-5 h-5" />
          </button>
          <IconoCarpetaAbierta className="w-6 h-6 text-amber-500" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate text-surface-900 dark:text-white">
              {carpetaRaizSeleccionada}
            </h2>
            <p className="text-xs text-surface-500">
              {carpetaSeleccionada
                ? `/${carpetaSeleccionada}`
                : 'Raíz de la carpeta'}
              {' · '}{pistas.length} pista{pistas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Panel de árbol de carpetas */}
          <div className="w-64 flex-shrink-0 border-r border-surface-200 dark:border-surface-700 overflow-y-auto bg-surface-50 dark:bg-surface-900/50">
            <div className="py-2">
              {/* Enlace a la raíz */}
              <button
                className={`
                  w-full flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors mx-1
                  ${carpetaSeleccionada === null || carpetaSeleccionada === ''
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
                  }
                `}
                onClick={() => navegarACarpeta('')}
              >
                <IconoCarpetaAbierta className="w-4 h-4 text-amber-500" />
                <span className="truncate flex-1 text-left">/ (raíz)</span>
                {estructura.cantidadPistas > 0 && (
                  <span className="text-xs text-surface-400">{estructura.cantidadPistas}</span>
                )}
              </button>

              {/* Árbol de subcarpetas */}
              {estructura.subcarpetas.map((sub) => (
                <NodoArbol
                  key={sub.ruta}
                  nodo={sub}
                  nivel={0}
                  carpetaSeleccionada={carpetaSeleccionada}
                  onSeleccionar={navegarACarpeta}
                />
              ))}
            </div>
          </div>

          {/* Panel de pistas */}
          <div className="flex-1 overflow-y-auto">
            {pistas.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <EstadoVacio
                  icono={<IconoMusica className="w-12 h-12" />}
                  titulo="Sin pistas en esta carpeta"
                  descripcion="Selecciona otra carpeta del árbol para ver sus pistas"
                />
              </div>
            ) : (
              <div className="px-2" role="grid" aria-label="Pistas de la carpeta">
                {pistas.map((pista, indice) => (
                  <PistaItem
                    key={pista.id}
                    pista={pista}
                    indice={indice}
                    listaPistas={pistas}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vista principal: lista de carpetas escaneadas
  return (
    <div className="flex flex-col h-full">
      {/* Cabecera */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-surface-200 dark:border-surface-700">
        <div>
          <h1 className="text-lg font-semibold text-surface-900 dark:text-white">
            Carpetas
          </h1>
          <p className="text-xs text-surface-500">
            Escanea carpetas para importar tu música organizada por subcarpetas
          </p>
        </div>

        <button
          onClick={manejarEscanearCarpeta}
          disabled={escaneando}
          className="btn-primary"
          aria-label="Escanear carpeta"
        >
          <IconoCarpetaEscanear className="w-4 h-4" />
          {escaneando
            ? progreso
              ? progreso.fase === 'escaneando'
                ? `Escaneando... ${progreso.actual} encontrados`
                : `Importando ${progreso.actual}/${progreso.total}...`
              : 'Preparando...'
            : 'Escanear carpeta'}
        </button>
      </div>

      {/* Barra de progreso */}
      {escaneando && progreso && progreso.fase === 'importando' && progreso.total > 0 && (
        <div className="px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between text-xs text-surface-600 dark:text-surface-400 mb-1">
            <span>Importando: {progreso.archivoActual}</span>
            <span>{Math.round((progreso.actual / progreso.total) * 100)}%</span>
          </div>
          <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-1.5">
            <div
              className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Lista de carpetas raíz */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {carpetasRaiz.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <EstadoVacio
              icono={<IconoCarpeta className="w-16 h-16" />}
              titulo="Sin carpetas escaneadas"
              descripcion="Selecciona una carpeta de tu equipo para escanear y organizar tu música automáticamente por subcarpetas"
              accion={
                <button
                  onClick={manejarEscanearCarpeta}
                  disabled={escaneando}
                  className="btn-primary"
                >
                  <IconoCarpetaEscanear className="w-4 h-4" />
                  Escanear carpeta
                </button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {carpetasRaiz.map((nombre) => (
              <button
                key={nombre}
                onClick={() => seleccionarCarpetaRaiz(nombre)}
                className="flex items-center gap-4 p-4 rounded-xl border border-surface-200 dark:border-surface-700 
                           bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-750
                           transition-colors text-left group"
              >
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <IconoCarpeta className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-900 dark:text-white truncate">
                    {nombre}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Carpeta escaneada
                  </p>
                </div>
                <IconoFlecha
                  className="w-4 h-4 text-surface-400 group-hover:text-surface-600 transition-colors"
                  direccion="derecha"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
