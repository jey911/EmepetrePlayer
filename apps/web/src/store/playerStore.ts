import { create } from 'zustand';
import { ModoRepeticion } from '@emepetre/shared';
import type { Pista } from '@emepetre/shared';
import { obtenerMotorAudio } from '../audio';
import { obtenerArchivo, incrementarReproducciones, registrarReproduccion, guardarEstadoReproduccion } from '../db';
import { mezclarArray } from '../utils';

interface EstadoPlayer {
  // Estado de reproducción
  pistaActual: Pista | null;
  reproduciendo: boolean;
  tiempoActual: number;
  duracion: number;
  volumen: number;
  silenciado: boolean;
  cargando: boolean;

  // Modo
  aleatorio: boolean;
  repeticion: ModoRepeticion;

  // Cola
  cola: Pista[];
  colaOriginal: Pista[];
  indiceCola: number;
  historialReproduccion: string[];

  // Acciones
  cargarYReproducir: (pista: Pista, cola?: Pista[]) => Promise<void>;
  reproducir: () => void;
  pausar: () => void;
  detener: () => void;
  siguiente: () => void;
  anterior: () => void;
  buscarTiempo: (tiempo: number) => void;
  establecerVolumen: (volumen: number) => void;
  alternarSilencio: () => void;
  alternarAleatorio: () => void;
  ciclarRepeticion: () => void;
  establecerCola: (pistas: Pista[], indice?: number) => void;
  moverEnCola: (desde: number, hasta: number) => void;
  removerDeCola: (indice: number) => void;
  agregarACola: (pista: Pista) => void;
  actualizarTiempo: (tiempo: number, duracion: number) => void;
  restaurarEstado: (pista: Pista, posicion: number, volumen: number) => void;
}

export const usePlayerStore = create<EstadoPlayer>((set, get) => ({
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

  cargarYReproducir: async (pista: Pista, cola?: Pista[]) => {
    const motor = obtenerMotorAudio();

    set({ cargando: true });

    try {
      await motor.inicializar();

      // Obtener archivo de audio de IndexedDB
      const archivo = await obtenerArchivo(pista.id);
      if (!archivo) {
        console.error('[Player] Archivo de audio no encontrado:', pista.id);
        set({ cargando: false });
        return;
      }

      await motor.cargar(archivo.datos);

      // Configurar cola si se proporcionó
      if (cola) {
        const indice = cola.findIndex((p) => p.id === pista.id);
        set({
          colaOriginal: [...cola],
          cola: get().aleatorio ? mezclarArray(cola, pista.id) : [...cola],
          indiceCola: get().aleatorio
            ? 0
            : indice >= 0
              ? indice
              : 0,
        });
      }

      set({
        pistaActual: pista,
        tiempoActual: 0,
        duracion: motor.duracion,
        cargando: false,
        historialReproduccion: [...get().historialReproduccion, pista.id],
      });

      motor.reproducir();
      set({ reproduciendo: true });

      // Registrar en historial e incrementar reproducciones
      await incrementarReproducciones(pista.id);
      await registrarReproduccion(pista.id);

      // Configurar callback de finalización
      motor.off('finalizado', get().siguiente);
      motor.on('finalizado', () => {
        const state = get();
        if (state.repeticion === ModoRepeticion.UNA) {
          motor.buscar(0);
          motor.reproducir();
        } else {
          get().siguiente();
        }
      });

      // Configurar actualización de tiempo
      motor.on('tiempoActualizado', (datos: unknown) => {
        const d = datos as { tiempoActual: number; duracion: number };
        set({ tiempoActual: d.tiempoActual, duracion: d.duracion });
      });

    } catch (error) {
      console.error('[Player] Error al cargar pista:', error);
      set({ cargando: false });
    }
  },

  reproducir: () => {
    const motor = obtenerMotorAudio();
    motor.reproducir();
    set({ reproduciendo: true });
  },

  pausar: () => {
    const motor = obtenerMotorAudio();
    motor.pausar();
    set({ reproduciendo: false });

    // Persistir estado
    const state = get();
    if (state.pistaActual) {
      guardarEstadoReproduccion(state.pistaActual.id, motor.tiempoActual, state.volumen);
    }
  },

  detener: () => {
    const motor = obtenerMotorAudio();
    motor.detener();
    set({ reproduciendo: false, tiempoActual: 0 });
  },

  siguiente: () => {
    const { cola, indiceCola, repeticion } = get();
    if (cola.length === 0) return;

    let nuevoIndice = indiceCola + 1;

    if (nuevoIndice >= cola.length) {
      if (repeticion === ModoRepeticion.TODAS) {
        nuevoIndice = 0;
      } else {
        set({ reproduciendo: false });
        return;
      }
    }

    const siguientePista = cola[nuevoIndice];
    if (siguientePista) {
      set({ indiceCola: nuevoIndice });
      get().cargarYReproducir(siguientePista);
    }
  },

  anterior: () => {
    const motor = obtenerMotorAudio();
    const { cola, indiceCola } = get();

    // Si han pasado más de 3 segundos, reiniciar la pista actual
    if (motor.tiempoActual > 3) {
      motor.buscar(0);
      return;
    }

    if (cola.length === 0) return;

    let nuevoIndice = indiceCola - 1;
    if (nuevoIndice < 0) {
      nuevoIndice = cola.length - 1;
    }

    const pistaAnterior = cola[nuevoIndice];
    if (pistaAnterior) {
      set({ indiceCola: nuevoIndice });
      get().cargarYReproducir(pistaAnterior);
    }
  },

  buscarTiempo: (tiempo: number) => {
    const motor = obtenerMotorAudio();
    motor.buscar(tiempo);
    set({ tiempoActual: tiempo });
  },

  establecerVolumen: (volumen: number) => {
    const motor = obtenerMotorAudio();
    motor.establecerVolumen(volumen);
    set({ volumen, silenciado: false });
  },

  alternarSilencio: () => {
    const motor = obtenerMotorAudio();
    motor.alternarSilencio();
    set({ silenciado: !get().silenciado });
  },

  alternarAleatorio: () => {
    const { aleatorio, colaOriginal, pistaActual } = get();
    const nuevoAleatorio = !aleatorio;

    if (nuevoAleatorio) {
      const colaMezclada = mezclarArray(colaOriginal, pistaActual?.id);
      const nuevoIndice = pistaActual
        ? colaMezclada.findIndex((p) => p.id === pistaActual.id)
        : 0;
      set({ aleatorio: true, cola: colaMezclada, indiceCola: Math.max(0, nuevoIndice) });
    } else {
      const nuevoIndice = pistaActual
        ? colaOriginal.findIndex((p) => p.id === pistaActual.id)
        : 0;
      set({ aleatorio: false, cola: [...colaOriginal], indiceCola: Math.max(0, nuevoIndice) });
    }
  },

  ciclarRepeticion: () => {
    const { repeticion } = get();
    const ciclo: ModoRepeticion[] = [
      ModoRepeticion.DESACTIVADO,
      ModoRepeticion.TODAS,
      ModoRepeticion.UNA,
    ];
    const indiceActual = ciclo.indexOf(repeticion);
    const siguiente = ciclo[(indiceActual + 1) % ciclo.length];
    set({ repeticion: siguiente });
  },

  establecerCola: (pistas: Pista[], indice: number = 0) => {
    const { aleatorio, pistaActual } = get();
    set({
      colaOriginal: [...pistas],
      cola: aleatorio ? mezclarArray(pistas, pistaActual?.id) : [...pistas],
      indiceCola: indice,
    });
  },

  moverEnCola: (desde: number, hasta: number) => {
    const { cola } = get();
    const nuevaCola = [...cola];
    const [movido] = nuevaCola.splice(desde, 1);
    nuevaCola.splice(hasta, 0, movido);
    set({ cola: nuevaCola });
  },

  removerDeCola: (indice: number) => {
    const { cola, indiceCola } = get();
    const nuevaCola = cola.filter((_, i) => i !== indice);
    const nuevoIndice = indice < indiceCola ? indiceCola - 1 : indiceCola;
    set({ cola: nuevaCola, indiceCola: Math.min(nuevoIndice, nuevaCola.length - 1) });
  },

  agregarACola: (pista: Pista) => {
    set({ cola: [...get().cola, pista] });
  },

  actualizarTiempo: (tiempo: number, duracion: number) => {
    set({ tiempoActual: tiempo, duracion });
  },

  restaurarEstado: (pista: Pista, _posicion: number, volumen: number) => {
    set({ pistaActual: pista, volumen });
  },
}));
