/** Formatear segundos a MM:SS */
export function formatearTiempo(segundos: number): string {
  if (!isFinite(segundos) || segundos < 0) return '0:00';
  const minutos = Math.floor(segundos / 60);
  const segs = Math.floor(segundos % 60);
  return `${minutos}:${segs.toString().padStart(2, '0')}`;
}

/** Formatear segundos a HH:MM:SS para duraciones largas */
export function formatearTiempoLargo(segundos: number): string {
  if (!isFinite(segundos) || segundos < 0) return '0:00:00';
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = Math.floor(segundos % 60);

  if (horas > 0) {
    return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  }
  return `${minutos}:${segs.toString().padStart(2, '0')}`;
}

/** Formatear bytes a tamaño legible */
export function formatearTamano(bytes: number): string {
  if (bytes === 0) return '0 B';
  const unidades = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${unidades[i]}`;
}

/** Formatear bitrate a texto legible */
export function formatearBitrate(bitrate: number): string {
  if (bitrate === 0) return 'Desconocido';
  return `${Math.round(bitrate / 1000)} kbps`;
}

/** Formatear frecuencia de muestreo */
export function formatearFrecuencia(hz: number): string {
  if (hz === 0) return 'Desconocida';
  return `${(hz / 1000).toFixed(1)} kHz`;
}

/** Mezclar un array aleatoriamente (Fisher-Yates) manteniendo un elemento primero */
export function mezclarArray<T extends { id?: string }>(
  array: T[],
  primerElementoId?: string | null,
): T[] {
  const copia = [...array];
  
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  // Mover el elemento especificado al inicio si existe
  if (primerElementoId) {
    const indice = copia.findIndex((item) => item.id === primerElementoId);
    if (indice > 0) {
      const [elemento] = copia.splice(indice, 1);
      copia.unshift(elemento);
    }
  }

  return copia;
}

/** Sanitizar texto para prevenir XSS */
export function sanitizarTexto(texto: string): string {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

/** Generar un ID único */
export function generarId(prefijo: string = 'id'): string {
  return `${prefijo}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Debounce para funciones */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Convertir Uint8Array a base64 (para carátulas) */
export function uint8ArrayABase64(datos: Uint8Array, mimeType: string): string {
  let binario = '';
  for (let i = 0; i < datos.length; i++) {
    binario += String.fromCharCode(datos[i]);
  }
  return `data:${mimeType};base64,${btoa(binario)}`;
}

/** Verificar si el navegador soporta Web Audio API */
export function soportaWebAudio(): boolean {
  return !!(window.AudioContext || (window as unknown as { webkitAudioContext: unknown }).webkitAudioContext);
}

/** Verificar si el navegador soporta Service Workers */
export function soportaServiceWorker(): boolean {
  return 'serviceWorker' in navigator;
}

/** Verificar si el navegador soporta IndexedDB */
export function soportaIndexedDB(): boolean {
  return 'indexedDB' in window;
}

/** Detectar si es un dispositivo iOS */
export function esIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Detectar si es standalone (instalado como PWA) */
export function esPWAInstalada(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}
