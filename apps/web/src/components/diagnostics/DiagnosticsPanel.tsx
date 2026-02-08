import React, { useState, useEffect, useCallback } from 'react';
import {
  soportaWebAudio,
  soportaServiceWorker,
  soportaIndexedDB,
  esPWAInstalada,
  esIOS,
} from '../../utils';
import { obtenerEstadisticasBD } from '../../db';
import { obtenerMotorAudio } from '../../audio';
import { VERSION_APP } from '@emepetre/shared';

interface DiagnosticoInfo {
  webAudio: boolean;
  serviceWorker: boolean;
  indexedDB: boolean;
  estadoSW: string;
  pwaInstalada: boolean;
  iOS: boolean;
  bdEstadisticas: {
    pistas: number;
    archivos: number;
    listas: number;
    historial: number;
    disponible: boolean;
  };
  audioContexto: string;
  frecuenciaMuestreo: number;
}

export function PanelDiagnostico() {
  const [info, setInfo] = useState<DiagnosticoInfo | null>(null);
  const [logs, setLogs] = useState<Array<{ nivel: string; mensaje: string; timestamp: number }>>([]);

  const cargarDiagnostico = useCallback(async () => {
    const motor = obtenerMotorAudio();
    const bdStats = await obtenerEstadisticasBD();

    let estadoSW = 'No disponible';
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        if (reg.active) estadoSW = 'Activo';
        else if (reg.installing) estadoSW = 'Instalando';
        else if (reg.waiting) estadoSW = 'Esperando';
      } else {
        estadoSW = 'No registrado';
      }
    }

    setInfo({
      webAudio: soportaWebAudio(),
      serviceWorker: soportaServiceWorker(),
      indexedDB: soportaIndexedDB(),
      estadoSW,
      pwaInstalada: esPWAInstalada(),
      iOS: esIOS(),
      bdEstadisticas: bdStats,
      audioContexto: motor.estadoContexto,
      frecuenciaMuestreo: motor.frecuenciaMuestreo,
    });
  }, []);

  useEffect(() => {
    cargarDiagnostico();
  }, [cargarDiagnostico]);

  const indicator = (ok: boolean) => (
    <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
  );

  if (!info) {
    return <div className="p-8 text-center text-surface-400">Cargando diagnóstico...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold mb-4">Panel de Diagnóstico</h2>

      {/* Info general */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Información General</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-surface-500">Versión</span>
          <span className="font-mono">{VERSION_APP}</span>
          <span className="text-surface-500">PWA Instalada</span>
          <span>{info.pwaInstalada ? 'Sí' : 'No'}</span>
          <span className="text-surface-500">iOS</span>
          <span>{info.iOS ? 'Sí' : 'No'}</span>
        </div>
      </div>

      {/* Compatibilidad */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Compatibilidad</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            {indicator(info.webAudio)}
            <span>Web Audio API</span>
          </div>
          <div className="flex items-center gap-2">
            {indicator(info.serviceWorker)}
            <span>Service Worker ({info.estadoSW})</span>
          </div>
          <div className="flex items-center gap-2">
            {indicator(info.indexedDB)}
            <span>IndexedDB</span>
          </div>
        </div>
      </div>

      {/* Audio */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Motor de Audio</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-surface-500">Estado del contexto</span>
          <span className="font-mono">{info.audioContexto}</span>
          <span className="text-surface-500">Frecuencia de muestreo</span>
          <span className="font-mono">{info.frecuenciaMuestreo > 0 ? `${info.frecuenciaMuestreo} Hz` : 'N/A'}</span>
        </div>
      </div>

      {/* Base de datos */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Base de Datos (IndexedDB)</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-surface-500">Estado</span>
          <span className="flex items-center gap-2">
            {indicator(info.bdEstadisticas.disponible)}
            {info.bdEstadisticas.disponible ? 'Disponible' : 'No disponible'}
          </span>
          <span className="text-surface-500">Pistas</span>
          <span>{info.bdEstadisticas.pistas}</span>
          <span className="text-surface-500">Archivos de audio</span>
          <span>{info.bdEstadisticas.archivos}</span>
          <span className="text-surface-500">Playlists</span>
          <span>{info.bdEstadisticas.listas}</span>
          <span className="text-surface-500">Entradas de historial</span>
          <span>{info.bdEstadisticas.historial}</span>
        </div>
      </div>

      {/* iOS Instructions */}
      {info.iOS && !info.pwaInstalada && (
        <div className="card p-4 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20">
          <h3 className="font-semibold mb-3 text-primary-700 dark:text-primary-300">
            Instalar en iOS
          </h3>
          <ol className="text-sm space-y-2 text-primary-600 dark:text-primary-400 list-decimal list-inside">
            <li>Toca el botón de compartir en Safari (cuadrado con flecha hacia arriba)</li>
            <li>Desplázate hacia abajo y selecciona &quot;Agregar a pantalla de inicio&quot;</li>
            <li>Confirma tocando &quot;Agregar&quot;</li>
          </ol>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2">
        <button onClick={cargarDiagnostico} className="btn-secondary text-sm">
          Actualizar diagnóstico
        </button>
      </div>
    </div>
  );
}
