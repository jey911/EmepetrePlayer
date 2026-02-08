import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../store/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      tema: 'oscuro',
      temaEfectivo: 'oscuro',
      paginaActual: '/',
      sidebarAbierto: true,
      colaAbierta: false,
      ecualizadorAbierto: false,
      modalActivo: null,
      consultaBusqueda: '',
      notificaciones: [],
    });
  });

  it('debería tener el estado inicial correcto', () => {
    const state = useUIStore.getState();
    expect(state.tema).toBe('oscuro');
    expect(state.sidebarAbierto).toBe(true);
    expect(state.colaAbierta).toBe(false);
    expect(state.ecualizadorAbierto).toBe(false);
    expect(state.notificaciones).toEqual([]);
  });

  it('debería alternar el sidebar', () => {
    useUIStore.getState().alternarSidebar();
    expect(useUIStore.getState().sidebarAbierto).toBe(false);

    useUIStore.getState().alternarSidebar();
    expect(useUIStore.getState().sidebarAbierto).toBe(true);
  });

  it('debería alternar la cola', () => {
    useUIStore.getState().alternarCola();
    expect(useUIStore.getState().colaAbierta).toBe(true);

    useUIStore.getState().alternarCola();
    expect(useUIStore.getState().colaAbierta).toBe(false);
  });

  it('debería alternar el ecualizador', () => {
    useUIStore.getState().alternarEcualizador();
    expect(useUIStore.getState().ecualizadorAbierto).toBe(true);
  });

  it('debería abrir y cerrar modales', () => {
    useUIStore.getState().abrirModal('test-modal');
    expect(useUIStore.getState().modalActivo).toBe('test-modal');

    useUIStore.getState().cerrarModal();
    expect(useUIStore.getState().modalActivo).toBeNull();
  });

  it('debería actualizar la búsqueda', () => {
    useUIStore.getState().establecerBusqueda('test query');
    expect(useUIStore.getState().consultaBusqueda).toBe('test query');
  });

  it('debería agregar y remover notificaciones', () => {
    useUIStore.getState().agregarNotificacion('exito', 'Test message');
    const notificaciones = useUIStore.getState().notificaciones;
    expect(notificaciones).toHaveLength(1);
    expect(notificaciones[0].tipo).toBe('exito');
    expect(notificaciones[0].mensaje).toBe('Test message');

    useUIStore.getState().removerNotificacion(notificaciones[0].id);
    expect(useUIStore.getState().notificaciones).toHaveLength(0);
  });

  it('debería navegar a una página', () => {
    useUIStore.getState().navegarA('/ajustes');
    expect(useUIStore.getState().paginaActual).toBe('/ajustes');
  });

  it('debería cambiar el tema', () => {
    useUIStore.getState().establecerTema('claro');
    expect(useUIStore.getState().tema).toBe('claro');
    expect(useUIStore.getState().temaEfectivo).toBe('claro');
  });
});
