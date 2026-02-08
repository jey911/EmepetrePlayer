import React from 'react';
import { IconoMusica } from './Icons';
import { useUIStore } from '../../store/uiStore';

interface CaratulaProps {
  src: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const tamanos = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-48 h-48',
};

const iconoTamanos = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-16 h-16',
};

export function Caratula({ src, alt = 'Carátula', size = 'md', className = '' }: CaratulaProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${tamanos[size]} rounded-lg object-cover flex-shrink-0 ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`${tamanos[size]} rounded-lg flex-shrink-0 flex items-center justify-center
        bg-gradient-to-br from-primary-500/20 to-primary-700/20
        dark:from-primary-400/10 dark:to-primary-600/10 ${className}`}
      role="img"
      aria-label={alt}
    >
      <IconoMusica className={`${iconoTamanos[size]} text-primary-400`} />
    </div>
  );
}

export function SkeletonLoader({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function EstadoVacio({
  icono,
  titulo,
  descripcion,
  accion,
}: {
  icono: React.ReactNode;
  titulo: string;
  descripcion: string;
  accion?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-surface-300 dark:text-surface-600 mb-4">{icono}</div>
      <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-2">
        {titulo}
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mb-6">
        {descripcion}
      </p>
      {accion}
    </div>
  );
}

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: React.ReactNode;
  ancho?: 'sm' | 'md' | 'lg';
}

const anchosModal = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({ abierto, onCerrar, titulo, children, ancho = 'md' }: ModalProps) {
  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCerrar}
        aria-hidden="true"
      />
      <div
        className={`relative ${anchosModal[ancho]} w-full bg-white dark:bg-surface-800
          rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700
          animate-fade-in`}
      >
        <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
          <h2 id="modal-titulo" className="text-lg font-semibold">
            {titulo}
          </h2>
          <button
            onClick={onCerrar}
            className="btn-icon"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Notificaciones() {
  const notificaciones = useUIStore((s) => s.notificaciones);
  const removerNotificacion = useUIStore((s) => s.removerNotificacion);

  if (notificaciones.length === 0) return null;

  const colores: Record<string, string> = {
    info: 'bg-primary-500',
    exito: 'bg-green-500',
    error: 'bg-red-500',
    advertencia: 'bg-yellow-500',
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm" role="alert">
      {notificaciones.map((n) => (
        <div
          key={n.id}
          className={`${colores[n.tipo] || colores.info} text-white px-4 py-3 rounded-lg shadow-lg
            flex items-center justify-between gap-3 animate-slide-down`}
        >
          <span className="text-sm">{n.mensaje}</span>
          <button
            onClick={() => removerNotificacion(n.id)}
            className="text-white/80 hover:text-white flex-shrink-0"
            aria-label="Cerrar notificación"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
