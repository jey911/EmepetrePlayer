import { create } from 'zustand';

interface EstadoUI {
  // Tema
  tema: 'claro' | 'oscuro' | 'sistema';
  temaEfectivo: 'claro' | 'oscuro';

  // Navegación
  paginaActual: string;
  sidebarAbierto: boolean;

  // Paneles
  colaAbierta: boolean;
  ecualizadorAbierto: boolean;
  modalActivo: string | null;

  // Búsqueda
  consultaBusqueda: string;

  // Notificaciones
  notificaciones: Array<{
    id: string;
    tipo: 'info' | 'exito' | 'error' | 'advertencia';
    mensaje: string;
    timestamp: number;
  }>;

  // Acciones
  establecerTema: (tema: 'claro' | 'oscuro' | 'sistema') => void;
  alternarSidebar: () => void;
  alternarCola: () => void;
  alternarEcualizador: () => void;
  abrirModal: (id: string) => void;
  cerrarModal: () => void;
  establecerBusqueda: (consulta: string) => void;
  agregarNotificacion: (tipo: 'info' | 'exito' | 'error' | 'advertencia', mensaje: string) => void;
  removerNotificacion: (id: string) => void;
  navegarA: (pagina: string) => void;
}

function detectarTemaSistema(): 'claro' | 'oscuro' {
  if (typeof window === 'undefined') return 'oscuro';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}

function aplicarTemaDOM(tema: 'claro' | 'oscuro'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (tema === 'oscuro') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useUIStore = create<EstadoUI>((set, get) => ({
  tema: 'oscuro',
  temaEfectivo: 'oscuro',
  paginaActual: '/',
  sidebarAbierto: true,
  colaAbierta: false,
  ecualizadorAbierto: false,
  modalActivo: null,
  consultaBusqueda: '',
  notificaciones: [],

  establecerTema: (tema) => {
    const efectivo = tema === 'sistema' ? detectarTemaSistema() : tema;
    aplicarTemaDOM(efectivo);
    set({ tema, temaEfectivo: efectivo });
  },

  alternarSidebar: () => set({ sidebarAbierto: !get().sidebarAbierto }),

  alternarCola: () => set({ colaAbierta: !get().colaAbierta }),

  alternarEcualizador: () => set({ ecualizadorAbierto: !get().ecualizadorAbierto }),

  abrirModal: (id) => set({ modalActivo: id }),

  cerrarModal: () => set({ modalActivo: null }),

  establecerBusqueda: (consulta) => set({ consultaBusqueda: consulta }),

  agregarNotificacion: (tipo, mensaje) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    set({
      notificaciones: [...get().notificaciones, { id, tipo, mensaje, timestamp: Date.now() }],
    });

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      get().removerNotificacion(id);
    }, 5000);
  },

  removerNotificacion: (id) => {
    set({ notificaciones: get().notificaciones.filter((n) => n.id !== id) });
  },

  navegarA: (pagina) => set({ paginaActual: pagina }),
}));

// Inicializar tema
if (typeof window !== 'undefined') {
  const temaGuardado = localStorage.getItem('emepetre-tema') as 'claro' | 'oscuro' | 'sistema' | null;
  const tema = temaGuardado || 'oscuro';
  const efectivo = tema === 'sistema' ? detectarTemaSistema() : tema;
  aplicarTemaDOM(efectivo);

  // Escuchar cambios del tema del sistema
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const state = useUIStore.getState();
    if (state.tema === 'sistema') {
      const nuevoEfectivo = detectarTemaSistema();
      aplicarTemaDOM(nuevoEfectivo);
      useUIStore.setState({ temaEfectivo: nuevoEfectivo });
    }
  });

  // Persistir cambios de tema
  useUIStore.subscribe((state) => {
    localStorage.setItem('emepetre-tema', state.tema);
  });
}
