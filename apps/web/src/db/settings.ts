import { abrirBD } from './database';
import { CONFIGURACION_POR_DEFECTO } from '@emepetre/shared';
import type { ConfiguracionApp } from '@emepetre/shared';

const CLAVE_CONFIG = 'config-principal';

/** Obtener la configuración de la aplicación */
export async function obtenerConfiguracion(): Promise<ConfiguracionApp> {
  try {
    const db = await abrirBD();
    const registro = await db.get('configuracion', CLAVE_CONFIG);
    if (registro) {
      return { ...CONFIGURACION_POR_DEFECTO, ...registro.datos };
    }
  } catch (error) {
    console.warn('[DB] Error al leer configuración, usando valores por defecto:', error);
  }
  return { ...CONFIGURACION_POR_DEFECTO };
}

/** Guardar la configuración de la aplicación */
export async function guardarConfiguracion(config: ConfiguracionApp): Promise<void> {
  const db = await abrirBD();
  await db.put('configuracion', { id: CLAVE_CONFIG, datos: config });
}

/** Actualizar parcialmente la configuración */
export async function actualizarConfiguracion(
  parcial: Partial<ConfiguracionApp>,
): Promise<ConfiguracionApp> {
  const configActual = await obtenerConfiguracion();
  const configNueva = { ...configActual, ...parcial };
  await guardarConfiguracion(configNueva);
  return configNueva;
}

/** Restablecer la configuración a valores por defecto */
export async function restablecerConfiguracion(): Promise<ConfiguracionApp> {
  const config = { ...CONFIGURACION_POR_DEFECTO };
  await guardarConfiguracion(config);
  return config;
}

/** Guardar el estado de la última reproducción para restaurar al recargar */
export async function guardarEstadoReproduccion(
  pistaId: string | null,
  posicion: number,
  volumen: number,
): Promise<void> {
  await actualizarConfiguracion({
    ultimaPistaId: pistaId,
    ultimaPosicion: posicion,
    volumen,
  });
}

/** Recuperar el estado de la última reproducción */
export async function recuperarEstadoReproduccion(): Promise<{
  pistaId: string | null;
  posicion: number;
  volumen: number;
}> {
  const config = await obtenerConfiguracion();
  return {
    pistaId: config.ultimaPistaId,
    posicion: config.ultimaPosicion,
    volumen: config.volumen,
  };
}
