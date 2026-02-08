#!/usr/bin/env python3
"""
Script de validación del proyecto EmepetrePlayer.
Verifica la estructura del proyecto, archivos críticos, manifesto PWA,
configuración de TypeScript, y más.

Uso:
    python scripts/validate_project.py

Retorna código de salida 0 si todo está correcto, 1 si hay errores.
"""

import os
import sys
import json
import re
from pathlib import Path
from typing import List, Tuple

# Colores para la salida
class Colores:
    VERDE = '\033[92m'
    ROJO = '\033[91m'
    AMARILLO = '\033[93m'
    AZUL = '\033[94m'
    NEGRITA = '\033[1m'
    FIN = '\033[0m'

def ok(mensaje: str) -> None:
    print(f"  {Colores.VERDE}✅{Colores.FIN} {mensaje}")

def error(mensaje: str) -> None:
    print(f"  {Colores.ROJO}❌{Colores.FIN} {mensaje}")

def advertencia(mensaje: str) -> None:
    print(f"  {Colores.AMARILLO}⚠️{Colores.FIN} {mensaje}")

def seccion(titulo: str) -> None:
    print(f"\n{Colores.AZUL}{Colores.NEGRITA}📋 {titulo}{Colores.FIN}")
    print(f"  {'─' * 50}")


# Directorio raíz del proyecto
RAIZ = Path(__file__).resolve().parent.parent


# ───────────────────────────────────────────────────────
# Archivos y directorios obligatorios
# ───────────────────────────────────────────────────────

ARCHIVOS_OBLIGATORIOS = [
    # Raíz
    "package.json",
    "tsconfig.base.json",
    ".gitignore",
    ".prettierrc",
    "README.md",

    # Shared
    "packages/shared/package.json",
    "packages/shared/src/index.ts",
    "packages/shared/src/types/index.ts",
    "packages/shared/src/constants/index.ts",

    # API
    "apps/api/package.json",
    "apps/api/tsconfig.json",
    "apps/api/nest-cli.json",
    "apps/api/src/main.ts",
    "apps/api/src/app.module.ts",
    "apps/api/src/app.controller.ts",
    "apps/api/src/app.service.ts",
    "apps/api/src/health/health.controller.ts",
    "apps/api/src/health/health.module.ts",
    "apps/api/src/tracks/tracks.controller.ts",
    "apps/api/src/tracks/tracks.service.ts",
    "apps/api/src/tracks/tracks.module.ts",
    "apps/api/src/playlists/playlists.controller.ts",
    "apps/api/src/playlists/playlists.service.ts",
    "apps/api/src/playlists/playlists.module.ts",

    # Web
    "apps/web/package.json",
    "apps/web/tsconfig.json",
    "apps/web/vite.config.ts",
    "apps/web/tailwind.config.ts",
    "apps/web/postcss.config.js",
    "apps/web/index.html",
    "apps/web/src/main.tsx",
    "apps/web/src/App.tsx",
    "apps/web/src/index.css",
    "apps/web/src/vite-env.d.ts",

    # Audio Engine
    "apps/web/src/audio/AudioEngine.ts",
    "apps/web/src/audio/Equalizer.ts",
    "apps/web/src/audio/Limiter.ts",
    "apps/web/src/audio/index.ts",

    # DB
    "apps/web/src/db/database.ts",
    "apps/web/src/db/tracks.ts",
    "apps/web/src/db/playlists.ts",
    "apps/web/src/db/history.ts",
    "apps/web/src/db/settings.ts",
    "apps/web/src/db/index.ts",

    # Store
    "apps/web/src/store/playerStore.ts",
    "apps/web/src/store/uiStore.ts",

    # Hooks
    "apps/web/src/hooks/index.ts",

    # Servicios
    "apps/web/src/services/fileImporter.ts",

    # Utils
    "apps/web/src/utils/index.ts",

    # Componentes
    "apps/web/src/components/common/Icons.tsx",
    "apps/web/src/components/common/index.tsx",
    "apps/web/src/components/player/PlayerBar.tsx",
    "apps/web/src/components/player/Equalizer.tsx",
    "apps/web/src/components/player/Queue.tsx",
    "apps/web/src/components/library/TrackItem.tsx",
    "apps/web/src/components/library/TrackList.tsx",
    "apps/web/src/components/playlists/PlaylistPage.tsx",
    "apps/web/src/components/settings/SettingsPage.tsx",
    "apps/web/src/components/diagnostics/DiagnosticsPanel.tsx",
    "apps/web/src/components/layout/Sidebar.tsx",
]

DIRECTORIOS_OBLIGATORIOS = [
    "apps",
    "apps/api",
    "apps/web",
    "packages",
    "packages/shared",
    "apps/web/public",
    "apps/web/public/icons",
]


def validar_estructura() -> Tuple[int, int]:
    """Valida que todos los archivos y directorios obligatorios existan."""
    seccion("Estructura del Proyecto")
    errores = 0
    aciertos = 0

    # Directorios
    for directorio in DIRECTORIOS_OBLIGATORIOS:
        ruta = RAIZ / directorio
        if ruta.is_dir():
            ok(f"Directorio: {directorio}/")
            aciertos += 1
        else:
            error(f"Directorio faltante: {directorio}/")
            errores += 1

    # Archivos
    for archivo in ARCHIVOS_OBLIGATORIOS:
        ruta = RAIZ / archivo
        if ruta.is_file():
            ok(f"Archivo: {archivo}")
            aciertos += 1
        else:
            error(f"Archivo faltante: {archivo}")
            errores += 1

    return aciertos, errores


def validar_package_json() -> Tuple[int, int]:
    """Valida los package.json del proyecto."""
    seccion("Configuración de Paquetes (package.json)")
    errores = 0
    aciertos = 0

    # Root package.json
    raiz_pkg = RAIZ / "package.json"
    if raiz_pkg.is_file():
        with open(raiz_pkg, "r", encoding="utf-8") as f:
            pkg = json.load(f)

        # Workspaces
        if "workspaces" in pkg:
            workspaces = pkg["workspaces"]
            if "packages/*" in workspaces and "apps/*" in workspaces:
                ok("Workspaces configurados correctamente")
                aciertos += 1
            else:
                error("Workspaces incompletos")
                errores += 1
        else:
            error("Sin workspaces definidos")
            errores += 1

        # Scripts
        scripts_requeridos = ["dev", "build", "test", "lint", "format"]
        for script in scripts_requeridos:
            if script in pkg.get("scripts", {}):
                ok(f"Script raíz: {script}")
                aciertos += 1
            else:
                error(f"Script faltante: {script}")
                errores += 1

        # Engines
        if "engines" in pkg:
            node_version = pkg["engines"].get("node", "")
            if "20" in node_version:
                ok("Requiere Node.js ≥ 20")
                aciertos += 1
            else:
                advertencia(f"Versión de Node configurada: {node_version}")
        else:
            advertencia("Sin engines definidos")

    # Web package.json
    web_pkg = RAIZ / "apps" / "web" / "package.json"
    if web_pkg.is_file():
        with open(web_pkg, "r", encoding="utf-8") as f:
            pkg = json.load(f)

        deps_requeridas = [
            "react", "react-dom", "react-router-dom",
            "zustand", "idb", "@tanstack/react-query"
        ]
        for dep in deps_requeridas:
            if dep in pkg.get("dependencies", {}):
                ok(f"Dependencia web: {dep}")
                aciertos += 1
            else:
                error(f"Dependencia web faltante: {dep}")
                errores += 1

    return aciertos, errores


def validar_typescript() -> Tuple[int, int]:
    """Valida la configuración de TypeScript."""
    seccion("Configuración TypeScript")
    errores = 0
    aciertos = 0

    base_tsconfig = RAIZ / "tsconfig.base.json"
    if base_tsconfig.is_file():
        with open(base_tsconfig, "r", encoding="utf-8") as f:
            contenido = f.read()
            # Limpiar comentarios JSON (single-line)
            contenido_limpio = re.sub(r'//.*$', '', contenido, flags=re.MULTILINE)
            config = json.loads(contenido_limpio)

        opts = config.get("compilerOptions", {})
        if opts.get("strict") is True:
            ok("TypeScript strict mode activado")
            aciertos += 1
        else:
            error("TypeScript strict mode desactivado")
            errores += 1

        target = opts.get("target", "").upper()
        if "ES2022" in target or "ESNEXT" in target:
            ok(f"Target moderno: {opts.get('target')}")
            aciertos += 1
        else:
            advertencia(f"Target: {opts.get('target', 'no definido')}")

    return aciertos, errores


def validar_pwa() -> Tuple[int, int]:
    """Valida la configuración PWA."""
    seccion("Configuración PWA")
    errores = 0
    aciertos = 0

    # Verificar vite.config.ts contiene VitePWA
    vite_config = RAIZ / "apps" / "web" / "vite.config.ts"
    if vite_config.is_file():
        with open(vite_config, "r", encoding="utf-8") as f:
            contenido = f.read()

        if "VitePWA" in contenido:
            ok("Plugin VitePWA configurado")
            aciertos += 1
        else:
            error("Plugin VitePWA no encontrado")
            errores += 1

        if "manifest" in contenido:
            ok("Manifiesto PWA incluido en la configuración")
            aciertos += 1
        else:
            error("Manifiesto PWA no encontrado")
            errores += 1

        if "workbox" in contenido:
            ok("Configuración de Workbox presente")
            aciertos += 1
        else:
            error("Configuración de Workbox no encontrada")
            errores += 1

        if "registerType" in contenido:
            ok("Tipo de registro de SW configurado")
            aciertos += 1
        else:
            advertencia("registerType no especificado")

    # Verificar index.html tiene meta tags PWA
    index_html = RAIZ / "apps" / "web" / "index.html"
    if index_html.is_file():
        with open(index_html, "r", encoding="utf-8") as f:
            contenido = f.read()

        meta_tags = [
            ("theme-color", "Meta theme-color"),
            ("apple-mobile-web-app-capable", "Meta apple-mobile-web-app-capable"),
            ("viewport", "Meta viewport"),
        ]
        for tag, nombre in meta_tags:
            if tag in contenido:
                ok(f"{nombre} presente")
                aciertos += 1
            else:
                error(f"{nombre} faltante")
                errores += 1

    # Verificar íconos
    icons_dir = RAIZ / "apps" / "web" / "public" / "icons"
    if icons_dir.is_dir():
        archivos_iconos = list(icons_dir.iterdir())
        if len(archivos_iconos) > 0:
            ok(f"Directorio de íconos con {len(archivos_iconos)} archivos")
            aciertos += 1
        else:
            error("Directorio de íconos vacío")
            errores += 1
    else:
        error("Directorio de íconos no encontrado")
        errores += 1

    return aciertos, errores


def validar_audio_engine() -> Tuple[int, int]:
    """Valida los archivos del motor de audio."""
    seccion("Motor de Audio")
    errores = 0
    aciertos = 0

    audio_dir = RAIZ / "apps" / "web" / "src" / "audio"

    # AudioEngine.ts
    engine_file = audio_dir / "AudioEngine.ts"
    if engine_file.is_file():
        with open(engine_file, "r", encoding="utf-8") as f:
            contenido = f.read()

        checks = [
            ("AudioContext", "Usa AudioContext"),
            ("GainNode", "Usa GainNode"),
            ("Ecualizador", "Integra el ecualizador"),
            ("Limitador", "Integra el limitador"),
        ]
        for patron, nombre in checks:
            if patron in contenido:
                ok(nombre)
                aciertos += 1
            else:
                error(f"{nombre} no encontrado")
                errores += 1

    # Equalizer.ts
    eq_file = audio_dir / "Equalizer.ts"
    if eq_file.is_file():
        with open(eq_file, "r", encoding="utf-8") as f:
            contenido = f.read()

        if "peaking" in contenido:
            ok("Ecualizador usa filtros peaking")
            aciertos += 1
        else:
            error("Filtros peaking no encontrados en ecualizador")
            errores += 1

    # Limiter.ts
    limiter_file = audio_dir / "Limiter.ts"
    if limiter_file.is_file():
        with open(limiter_file, "r", encoding="utf-8") as f:
            contenido = f.read()

        if "DynamicsCompressor" in contenido or "createDynamicsCompressor" in contenido:
            ok("Limitador usa DynamicsCompressor")
            aciertos += 1
        else:
            error("DynamicsCompressor no encontrado en limitador")
            errores += 1

    return aciertos, errores


def validar_indexeddb() -> Tuple[int, int]:
    """Valida la capa de IndexedDB."""
    seccion("IndexedDB / Persistencia")
    errores = 0
    aciertos = 0

    db_dir = RAIZ / "apps" / "web" / "src" / "db"

    archivos_db = ["database.ts", "tracks.ts", "playlists.ts", "history.ts", "settings.ts", "index.ts"]
    for archivo in archivos_db:
        ruta = db_dir / archivo
        if ruta.is_file():
            ok(f"Módulo DB: {archivo}")
            aciertos += 1
        else:
            error(f"Módulo DB faltante: {archivo}")
            errores += 1

    # Verificar que database.ts usa idb
    database_file = db_dir / "database.ts"
    if database_file.is_file():
        with open(database_file, "r", encoding="utf-8") as f:
            contenido = f.read()

        if "openDB" in contenido or "from 'idb'" in contenido:
            ok("Usa librería 'idb' para IndexedDB")
            aciertos += 1
        else:
            error("No se encontró uso de librería 'idb'")
            errores += 1

        if "pistas" in contenido and "archivos" in contenido:
            ok("Object stores principales definidos")
            aciertos += 1
        else:
            error("Object stores principales no encontrados")
            errores += 1

    return aciertos, errores


def validar_tests() -> Tuple[int, int]:
    """Valida que existan archivos de test."""
    seccion("Archivos de Test")
    errores = 0
    aciertos = 0

    # Web tests
    test_dir = RAIZ / "apps" / "web" / "src" / "__tests__"
    if test_dir.is_dir():
        test_files = list(test_dir.glob("*.test.ts"))
        if len(test_files) >= 1:
            ok(f"Tests del frontend: {len(test_files)} archivos")
            aciertos += 1
        else:
            error("No se encontraron tests del frontend")
            errores += 1
    else:
        error("Directorio de tests del frontend no encontrado")
        errores += 1

    # Vitest config
    vitest_config = RAIZ / "apps" / "web" / "vitest.config.ts"
    if vitest_config.is_file():
        ok("vitest.config.ts presente")
        aciertos += 1
    else:
        error("vitest.config.ts faltante")
        errores += 1

    # API tests
    api_test = RAIZ / "apps" / "api" / "src" / "app.spec.ts"
    if api_test.is_file():
        ok("Test del backend presente")
        aciertos += 1
    else:
        api_test_alt = RAIZ / "apps" / "api" / "test" / "app.controller.spec.ts"
        if api_test_alt.is_file():
            ok("Test del backend presente (en test/)")
            aciertos += 1
        else:
            error("Test del backend no encontrado")
            errores += 1

    return aciertos, errores


def validar_node_modules() -> Tuple[int, int]:
    """Valida que node_modules exista (dependencias instaladas)."""
    seccion("Dependencias")
    errores = 0
    aciertos = 0

    nm = RAIZ / "node_modules"
    if nm.is_dir():
        ok("node_modules presente (dependencias instaladas)")
        aciertos += 1
    else:
        error("node_modules no encontrado. Ejecuta: npm install")
        errores += 1

    return aciertos, errores


def main():
    print(f"\n{Colores.NEGRITA}{'═' * 60}{Colores.FIN}")
    print(f"{Colores.NEGRITA} 🎵 EmepetrePlayer — Validación del Proyecto{Colores.FIN}")
    print(f"{Colores.NEGRITA}{'═' * 60}{Colores.FIN}")
    print(f"\n  Directorio raíz: {RAIZ}")

    total_ok = 0
    total_err = 0

    validaciones = [
        validar_estructura,
        validar_package_json,
        validar_typescript,
        validar_pwa,
        validar_audio_engine,
        validar_indexeddb,
        validar_tests,
        validar_node_modules,
    ]

    for validacion in validaciones:
        aciertos, errores = validacion()
        total_ok += aciertos
        total_err += errores

    # Resumen
    print(f"\n{Colores.NEGRITA}{'═' * 60}{Colores.FIN}")
    print(f"\n  {Colores.NEGRITA}📊 Resumen:{Colores.FIN}")
    print(f"  {Colores.VERDE}✅ Verificaciones exitosas: {total_ok}{Colores.FIN}")
    print(f"  {Colores.ROJO}❌ Errores encontrados:     {total_err}{Colores.FIN}")

    if total_err == 0:
        print(f"\n  {Colores.VERDE}{Colores.NEGRITA}🎉 ¡Proyecto validado exitosamente!{Colores.FIN}\n")
        return 0
    else:
        print(f"\n  {Colores.ROJO}{Colores.NEGRITA}⚠️ Se encontraron {total_err} error(es). Revisa los mensajes arriba.{Colores.FIN}\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
