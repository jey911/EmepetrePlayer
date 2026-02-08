import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '../store/playerStore';
import { ModoRepeticion } from '@emepetre/shared';

describe('playerStore', () => {
  beforeEach(() => {
    const store = usePlayerStore.getState();
    // Reset store
    usePlayerStore.setState({
      pistaActual: null,
      reproduciendo: false,
      tiempoActual: 0,
      duracion: 0,
      volumen: 0.8,
      silenciado: false,
      cargando: false,
      aleatorio: false,
      repeticion: ModoRepeticion.DESACTIVADO,
      cola: [],
      colaOriginal: [],
      indiceCola: -1,
      historialReproduccion: [],
    });
  });

  it('debería tener el estado inicial correcto', () => {
    const state = usePlayerStore.getState();
    expect(state.pistaActual).toBeNull();
    expect(state.reproduciendo).toBe(false);
    expect(state.volumen).toBe(0.8);
    expect(state.aleatorio).toBe(false);
    expect(state.repeticion).toBe(ModoRepeticion.DESACTIVADO);
    expect(state.cola).toEqual([]);
  });

  it('debería alternar el modo aleatorio', () => {
    usePlayerStore.getState().alternarAleatorio();
    expect(usePlayerStore.getState().aleatorio).toBe(true);

    usePlayerStore.getState().alternarAleatorio();
    expect(usePlayerStore.getState().aleatorio).toBe(false);
  });

  it('debería ciclar los modos de repetición', () => {
    const { ciclarRepeticion } = usePlayerStore.getState();

    ciclarRepeticion();
    expect(usePlayerStore.getState().repeticion).toBe(ModoRepeticion.TODAS);

    ciclarRepeticion();
    expect(usePlayerStore.getState().repeticion).toBe(ModoRepeticion.UNA);

    ciclarRepeticion();
    expect(usePlayerStore.getState().repeticion).toBe(ModoRepeticion.DESACTIVADO);
  });

  it('debería establecer el volumen correctamente', () => {
    usePlayerStore.getState().establecerVolumen(0.5);
    expect(usePlayerStore.getState().volumen).toBe(0.5);
  });

  it('debería almacenar el volumen tal como se pasa', () => {
    // La store no clampea; la responsabilidad de clampear es del caller
    usePlayerStore.getState().establecerVolumen(0.3);
    expect(usePlayerStore.getState().volumen).toBe(0.3);
  });

  it('debería alternar silencio', () => {
    usePlayerStore.getState().alternarSilencio();
    expect(usePlayerStore.getState().silenciado).toBe(true);

    usePlayerStore.getState().alternarSilencio();
    expect(usePlayerStore.getState().silenciado).toBe(false);
  });

  it('debería actualizar el tiempo de reproducción', () => {
    usePlayerStore.getState().actualizarTiempo(30, 180);
    const state = usePlayerStore.getState();
    expect(state.tiempoActual).toBe(30);
    expect(state.duracion).toBe(180);
  });

  it('debería agregar pistas a la cola', () => {
    const pistaMock = {
      id: 'test-1',
      titulo: 'Test Track',
      artista: 'Test Artist',
      album: 'Test Album',
      genero: 'Test',
      duracion: 180,
      tamano: 5000000,
      formato: 'audio/mpeg' as const,
      fechaAgregado: Date.now(),
      favorito: false,
      reproduciones: 0,
      caratula: null,
      archivoId: 'file-1',
    };

    usePlayerStore.getState().agregarACola(pistaMock);
    expect(usePlayerStore.getState().cola).toHaveLength(1);
    expect(usePlayerStore.getState().cola[0].id).toBe('test-1');
  });
});
