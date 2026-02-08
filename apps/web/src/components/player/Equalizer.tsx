import React, { useState, useCallback } from 'react';
import { useAudioEngine } from '../../hooks';
import {
  PRESETS_ECUALIZADOR,
  ETIQUETAS_FRECUENCIAS,
  EQ_GANANCIA_MIN,
  EQ_GANANCIA_MAX,
  PREAMP_MIN,
  PREAMP_MAX,
} from '@emepetre/shared';
import type { PresetEcualizador } from '@emepetre/shared';
import { useUIStore } from '../../store/uiStore';
import { IconoCerrar } from '../common/Icons';

export function PanelEcualizador() {
  const { ecualizadorAbierto, alternarEcualizador } = useUIStore();
  const { motor, aplicarPreset } = useAudioEngine();

  const [presetActual, setPresetActual] = useState('plano');
  const [ganancias, setGanancias] = useState<number[]>(new Array(10).fill(0));
  const [preamp, setPreamp] = useState(0);

  const manejarCambioBanda = useCallback(
    (indice: number, valor: number) => {
      const nuevasGanancias = [...ganancias];
      nuevasGanancias[indice] = valor;
      setGanancias(nuevasGanancias);
      motor.establecerBandaEQ(indice, valor);
      setPresetActual('personalizado');
    },
    [ganancias, motor],
  );

  const manejarCambioPreamp = useCallback(
    (valor: number) => {
      setPreamp(valor);
      motor.establecerPreamp(valor);
    },
    [motor],
  );

  const manejarSeleccionPreset = useCallback(
    (preset: PresetEcualizador) => {
      setPresetActual(preset.id);
      setGanancias([...preset.ganancias]);
      setPreamp(preset.preamp);
      aplicarPreset(preset);
    },
    [aplicarPreset],
  );

  const resetear = useCallback(() => {
    const plano = PRESETS_ECUALIZADOR.find((p) => p.id === 'plano')!;
    manejarSeleccionPreset(plano);
  }, [manejarSeleccionPreset]);

  if (!ecualizadorAbierto) return null;

  return (
    <div
      className="fixed right-0 top-0 bottom-20 w-80 bg-white dark:bg-surface-800
        border-l border-surface-200 dark:border-surface-700 shadow-xl z-30
        flex flex-col animate-slide-up overflow-hidden"
      role="dialog"
      aria-label="Ecualizador"
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
        <h2 className="font-semibold">Ecualizador</h2>
        <button onClick={alternarEcualizador} className="btn-icon" aria-label="Cerrar ecualizador">
          <IconoCerrar />
        </button>
      </div>

      {/* Presets */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 block">
          Preset
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS_ECUALIZADOR.map((preset) => (
            <button
              key={preset.id}
              onClick={() => manejarSeleccionPreset(preset)}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                presetActual === preset.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600'
              }`}
            >
              {preset.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Preamp */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
            Preamp
          </label>
          <span className="text-xs tabular-nums font-mono">
            {preamp > 0 ? '+' : ''}{preamp.toFixed(1)} dB
          </span>
        </div>
        <input
          type="range"
          min={PREAMP_MIN}
          max={PREAMP_MAX}
          step={0.5}
          value={preamp}
          onChange={(e) => manejarCambioPreamp(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer
            bg-surface-200 dark:bg-surface-700
            accent-primary-500"
          aria-label="Preamp"
        />
      </div>

      {/* Bandas del ecualizador */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex gap-2 items-end h-full min-h-[200px] py-4">
          {ganancias.map((ganancia, indice) => (
            <div key={indice} className="flex-1 flex flex-col items-center gap-2 h-full">
              <span className="text-xs tabular-nums font-mono text-surface-500">
                {ganancia > 0 ? '+' : ''}{ganancia}
              </span>
              <div className="flex-1 flex items-center justify-center">
                <input
                  type="range"
                  min={EQ_GANANCIA_MIN}
                  max={EQ_GANANCIA_MAX}
                  step={0.5}
                  value={ganancia}
                  onChange={(e) => manejarCambioBanda(indice, parseFloat(e.target.value))}
                  className="w-1.5 appearance-none cursor-pointer accent-primary-500
                    bg-surface-200 dark:bg-surface-700 rounded-full"
                  style={{
                    writingMode: 'vertical-lr',
                    direction: 'rtl',
                    height: '100%',
                    minHeight: '120px',
                  }}
                  aria-label={`Banda ${ETIQUETAS_FRECUENCIAS[indice]} Hz`}
                />
              </div>
              <span className="text-[10px] font-medium text-surface-400">
                {ETIQUETAS_FRECUENCIAS[indice]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="p-4 border-t border-surface-200 dark:border-surface-700">
        <button
          onClick={resetear}
          className="btn-secondary w-full text-sm"
        >
          Restablecer a Plano
        </button>
      </div>
    </div>
  );
}
