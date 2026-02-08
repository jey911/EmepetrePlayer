import { describe, it, expect } from 'vitest';
import {
  VERSION_APP,
  NOMBRE_APP,
  FRECUENCIAS_EQ,
  ETIQUETAS_FRECUENCIAS,
  PRESETS_ECUALIZADOR,
  CONFIGURACION_POR_DEFECTO,
  FORMATOS_AUDIO_SOPORTADOS,
  TAMANO_MAXIMO_ARCHIVO,
} from '@emepetre/shared';

describe('Constantes compartidas', () => {
  it('debería tener la versión correcta', () => {
    expect(VERSION_APP).toBe('1.0.0');
  });

  it('debería tener el nombre correcto', () => {
    expect(NOMBRE_APP).toBe('EmepetrePlayer');
  });

  it('debería tener 10 frecuencias de ecualizador', () => {
    expect(FRECUENCIAS_EQ).toHaveLength(10);
    expect(FRECUENCIAS_EQ[0]).toBe(32);
    expect(FRECUENCIAS_EQ[9]).toBe(16000);
  });

  it('debería tener 10 etiquetas de frecuencia', () => {
    expect(ETIQUETAS_FRECUENCIAS).toHaveLength(10);
  });

  it('debería tener presets de ecualizador', () => {
    expect(PRESETS_ECUALIZADOR.length).toBeGreaterThan(0);
    const plano = PRESETS_ECUALIZADOR.find((p) => p.id === 'plano');
    expect(plano).toBeDefined();
    expect(plano!.ganancias.every((g) => g === 0)).toBe(true);
  });

  it('debería tener una configuración por defecto válida', () => {
    expect(CONFIGURACION_POR_DEFECTO.tema).toBe('oscuro');
    expect(CONFIGURACION_POR_DEFECTO.volumen).toBeGreaterThan(0);
    expect(CONFIGURACION_POR_DEFECTO.volumen).toBeLessThanOrEqual(1);
  });

  it('debería soportar formatos de audio comunes', () => {
    expect(FORMATOS_AUDIO_SOPORTADOS).toContain('audio/mpeg');
    expect(FORMATOS_AUDIO_SOPORTADOS).toContain('audio/mp3');
  });

  it('debería tener un tamaño máximo de archivo de 100MB', () => {
    expect(TAMANO_MAXIMO_ARCHIVO).toBe(100 * 1024 * 1024);
  });
});
