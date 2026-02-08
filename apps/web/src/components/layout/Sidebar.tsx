import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  IconoBiblioteca,
  IconoLista,
  IconoAjustes,
  IconoDiagnostico,
  IconoCerrar,
  IconoMusica,
} from '../common/Icons';
import { useUIStore } from '../../store/uiStore';
import { NOMBRE_APP } from '@emepetre/shared';

const enlacesNav = [
  { ruta: '/', etiqueta: 'Biblioteca', icono: IconoBiblioteca },
  { ruta: '/listas', etiqueta: 'Playlists', icono: IconoLista },
  { ruta: '/ajustes', etiqueta: 'Ajustes', icono: IconoAjustes },
  { ruta: '/diagnostico', etiqueta: 'Diagnóstico', icono: IconoDiagnostico },
];

export function Sidebar() {
  const sidebarAbierto = useUIStore((s) => s.sidebarAbierto);
  const alternarSidebar = useUIStore((s) => s.alternarSidebar);

  return (
    <>
      {/* Overlay para móvil */}
      {sidebarAbierto && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={alternarSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64 
          bg-white dark:bg-surface-900 
          border-r border-surface-200 dark:border-surface-700
          transform transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0 md:z-0
          flex flex-col
          ${sidebarAbierto ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="navigation"
        aria-label="Navegación principal"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <IconoMusica className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-surface-900 dark:text-white">
              {NOMBRE_APP}
            </span>
          </div>
          <button
            className="btn-icon md:hidden"
            onClick={alternarSidebar}
            aria-label="Cerrar menú"
          >
            <IconoCerrar className="w-5 h-5" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {enlacesNav.map(({ ruta, etiqueta, icono: Icono }) => (
            <NavLink
              key={ruta}
              to={ruta}
              end={ruta === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                 transition-colors duration-150
                 ${
                   isActive
                     ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                     : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                 }`
              }
              onClick={() => {
                // Cerrar sidebar en móvil al navegar
                if (window.innerWidth < 768) {
                  alternarSidebar();
                }
              }}
            >
              <Icono className="w-5 h-5 flex-shrink-0" />
              <span>{etiqueta}</span>
            </NavLink>
          ))}
        </nav>

        {/* Pie del sidebar */}
        <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700">
          <p className="text-xs text-surface-400 dark:text-surface-500 text-center">
            © {new Date().getFullYear()} {NOMBRE_APP}
          </p>
        </div>
      </aside>
    </>
  );
}
