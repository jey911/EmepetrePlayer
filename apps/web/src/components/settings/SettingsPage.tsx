import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { IconoSol, IconoLuna } from '../common/Icons';
import { obtenerConfiguracion, guardarConfiguracion, restablecerConfiguracion } from '../../db';
import { CONFIGURACION_POR_DEFECTO } from '@emepetre/shared';
import type { ConfiguracionApp } from '@emepetre/shared';

export function PaginaAjustes() {
  const tema = useUIStore((s) => s.tema);
  const establecerTema = useUIStore((s) => s.establecerTema);
  const agregarNotificacion = useUIStore((s) => s.agregarNotificacion);

  const [config, setConfig] = useState<ConfiguracionApp>(CONFIGURACION_POR_DEFECTO);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerConfiguracion().then((c) => {
      if (c) setConfig(c);
    });
  }, []);

  const guardarCambios = async () => {
    setGuardando(true);
    try {
      await guardarConfiguracion(config);
      agregarNotificacion('exito', 'Configuración guardada correctamente');
    } catch {
      agregarNotificacion('error', 'Error al guardar la configuración');
    }
    setGuardando(false);
  };

  const restaurar = async () => {
    try {
      await restablecerConfiguracion();
      setConfig(CONFIGURACION_POR_DEFECTO);
      establecerTema('oscuro');
      agregarNotificacion('info', 'Configuración restablecida a valores predeterminados');
    } catch {
      agregarNotificacion('error', 'Error al restablecer la configuración');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold">Ajustes</h2>

      {/* Tema */}
      <div className="card p-4">
        <h3 className="font-semibold mb-4">Apariencia</h3>
        <div className="flex gap-3">
          {(['claro', 'oscuro', 'sistema'] as const).map((t) => (
            <button
              key={t}
              onClick={() => establecerTema(t)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-150
                ${
                  tema === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-300 dark:hover:bg-surface-600'
                }
              `}
            >
              {t === 'claro' && <IconoSol className="w-4 h-4" />}
              {t === 'oscuro' && <IconoLuna className="w-4 h-4" />}
              {t === 'sistema' && (
                <span className="w-4 h-4 flex items-center justify-center text-xs">🖥️</span>
              )}
              <span className="capitalize">{t}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reproducción */}
      <div className="card p-4">
        <h3 className="font-semibold mb-4">Reproducción</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm text-surface-700 dark:text-surface-300">
              Continuar donde se dejó al reiniciar
            </span>
            <input
              type="checkbox"
              checked={config.reanudarAlIniciar}
              onChange={(e) => setConfig({ ...config, reanudarAlIniciar: e.target.checked })}
              className="w-5 h-5 text-primary-600 bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600 rounded focus:ring-primary-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm text-surface-700 dark:text-surface-300">
              Crossfade entre pistas
            </span>
            <input
              type="checkbox"
              checked={config.crossfade}
              onChange={(e) => setConfig({ ...config, crossfade: e.target.checked })}
              className="w-5 h-5 text-primary-600 bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600 rounded focus:ring-primary-500"
            />
          </label>

          {config.crossfade && (
            <div>
              <label className="text-sm text-surface-500">
                Duración del crossfade: {config.crossfadeDuracion}s
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={config.crossfadeDuracion}
                onChange={(e) =>
                  setConfig({ ...config, crossfadeDuracion: parseFloat(e.target.value) })
                }
                className="w-full mt-1"
              />
            </div>
          )}

          <div>
            <label className="text-sm text-surface-500">
              Volumen predeterminado: {Math.round(config.volumenInicial * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.volumenInicial}
              onChange={(e) =>
                setConfig({ ...config, volumenInicial: parseFloat(e.target.value) })
              }
              className="w-full mt-1"
            />
          </div>
        </div>
      </div>

      {/* Ecualizador */}
      <div className="card p-4">
        <h3 className="font-semibold mb-4">Ecualizador</h3>
        <label className="flex items-center justify-between">
          <span className="text-sm text-surface-700 dark:text-surface-300">
            Habilitar ecualizador por defecto
          </span>
          <input
            type="checkbox"
            checked={config.ecualizadorActivo}
            onChange={(e) => setConfig({ ...config, ecualizadorActivo: e.target.checked })}
            className="w-5 h-5 text-primary-600 bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600 rounded focus:ring-primary-500"
          />
        </label>
      </div>

      {/* Acciones */}
      <div className="flex gap-3">
        <button onClick={guardarCambios} disabled={guardando} className="btn-primary">
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button onClick={restaurar} className="btn-secondary">
          Restablecer valores
        </button>
      </div>
    </div>
  );
}
