import { describe, it, expect } from 'vitest';
import {
  formatearTiempo,
  formatearTiempoLargo,
  formatearTamano,
  mezclarArray,
  sanitizarTexto,
  debounce,
} from '../utils';

describe('formatearTiempo', () => {
  it('debería formatear 0 como 0:00', () => {
    expect(formatearTiempo(0)).toBe('0:00');
  });

  it('debería formatear segundos correctamente', () => {
    expect(formatearTiempo(65)).toBe('1:05');
  });

  it('debería formatear minutos largos correctamente', () => {
    // formatearTiempo solo devuelve MM:SS
    expect(formatearTiempo(3661)).toBe('61:01');
  });

  it('debería usar formatearTiempoLargo para incluir horas', () => {
    expect(formatearTiempoLargo(3661)).toBe('1:01:01');
  });

  it('debería manejar NaN devolviendo 0:00', () => {
    expect(formatearTiempo(NaN)).toBe('0:00');
  });

  it('debería manejar Infinity devolviendo 0:00', () => {
    expect(formatearTiempo(Infinity)).toBe('0:00');
  });

  it('debería manejar valores negativos', () => {
    expect(formatearTiempo(-10)).toBe('0:00');
  });
});

describe('formatearTamano', () => {
  it('debería formatear bytes', () => {
    expect(formatearTamano(500)).toBe('500.0 B');
  });

  it('debería formatear kilobytes', () => {
    expect(formatearTamano(1024)).toBe('1.0 KB');
  });

  it('debería formatear megabytes', () => {
    expect(formatearTamano(1048576)).toBe('1.0 MB');
  });

  it('debería formatear gigabytes', () => {
    expect(formatearTamano(1073741824)).toBe('1.0 GB');
  });

  it('debería retornar 0 B para cero', () => {
    expect(formatearTamano(0)).toBe('0 B');
  });
});

describe('mezclarArray', () => {
  it('debería devolver un array de la misma longitud', () => {
    const arr = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }];
    const resultado = mezclarArray(arr);
    expect(resultado).toHaveLength(arr.length);
  });

  it('debería contener los mismos elementos', () => {
    const arr = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const resultado = mezclarArray(arr);
    expect(resultado.map(x => x.id).sort()).toEqual(['1', '2', '3']);
  });

  it('no debería modificar el array original', () => {
    const arr = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const originalIds = arr.map(x => x.id);
    mezclarArray(arr);
    expect(arr.map(x => x.id)).toEqual(originalIds);
  });

  it('debería manejar un array vacío', () => {
    expect(mezclarArray([])).toEqual([]);
  });
});

describe('sanitizarTexto', () => {
  it('debería escapar etiquetas HTML como entidades', () => {
    const resultado = sanitizarTexto('<script>alert("xss")</script>');
    expect(resultado).toContain('&lt;');
    expect(resultado).not.toContain('<script>');
  });

  it('debería preservar texto normal', () => {
    expect(sanitizarTexto('hola mundo')).toBe('hola mundo');
  });

  it('debería manejar texto vacío', () => {
    expect(sanitizarTexto('')).toBe('');
  });
});

describe('debounce', () => {
  it('debería retrasar la ejecución', async () => {
    let contador = 0;
    const fn = debounce(() => { contador++; }, 50);

    fn();
    fn();
    fn();

    expect(contador).toBe(0);

    await new Promise((r) => setTimeout(r, 100));
    expect(contador).toBe(1);
  });
});
