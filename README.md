# Mi Biblioteca

Aplicación de escritorio para gestionar una biblioteca personal de libros físicos.

Permite administrar libros y autores, registrar préstamos y devoluciones, seguir lecturas, crear colecciones y consultar métricas básicas. Está construida con Electron y una base de datos SQLite local.

## Stack tecnológico

- Runtime y gestor de paquetes: `Bun`
- Aplicación de escritorio: `Electron`
- Frontend: `HTML`, `CSS`, `JavaScript` (vanilla)
- Base de datos: `SQLite` (`better-sqlite3`)
- Validación: `zod`
- Búsqueda: `fuse.js`
- Empaquetado: `electron-builder`

## Requisitos previos

- `Bun` instalado (versión moderna, recomendada 1.3+)
- Herramientas de compilación nativas para módulos Node (por `better-sqlite3`)
- Git

Opcional para builds firmados/distribuibles:
- Certificados de firma para Windows/macOS
- Notarización de Apple para distribuir fuera de desarrollo

## Configuración del entorno de desarrollo

1. Clona el repositorio y entra al proyecto.
2. Instala dependencias:

```bash
bun install
```

Esto ejecuta también `electron-rebuild` vía `postinstall`, necesario para `better-sqlite3` en Electron.

3. Levanta la app en desarrollo:

```bash
bun run dev
```

### Búsqueda de libros en internet (Open Library + Google Books)

La app soporta búsqueda/importación de libros desde catálogos externos.

- `Open Library`: se usa por defecto sin configuración extra.
- `Google Books`: opcional, recomendado para mejor cobertura.

Para habilitar Google Books con tu propia cuota, define `GOOGLE_BOOKS_API_KEY` antes de arrancar la app:

```bash
export GOOGLE_BOOKS_API_KEY="tu_api_key"
bun run dev
```

Sin `GOOGLE_BOOKS_API_KEY`, la integración puede seguir funcionando con límites más restrictivos.

## Comandos útiles

- Ejecutar tests:

```bash
bun test
```

- Lint:

```bash
bun run lint
```

- Formatear:

```bash
bun run format
```

## Cómo validar que los tests pasan

Antes de abrir PR o generar instalables, ejecuta:

```bash
bun test
```

Resultado esperado: todos los tests en verde (`pass`) y `0 fail`.

## Generar instalables

Salida de build en `dist/`.

### Build general

```bash
bun run build
```

### Windows

Genera instaladores/artefactos según configuración (`nsis`, `portable`):

```bash
bun run build:win
```

### macOS

Genera `dmg` y `zip`:

```bash
bun run build:mac
```

### Linux

Genera `AppImage` y `deb`:

```bash
bun run build:linux
```

## Notas importantes de empaquetado

- El build cruzado (por ejemplo, compilar macOS desde Linux) puede no estar soportado o requerir toolchains específicos.
- Para resultados más estables, construye cada plataforma desde su sistema operativo nativo.
- Si activas firma/notarización, configura variables de entorno y credenciales en CI o en tu shell local.

## Estructura principal

- `src/main`: proceso principal de Electron, IPC, servicios y acceso a BD
- `src/preload`: bridge seguro `contextBridge`
- `src/renderer`: interfaz (SPA hash router + componentes)
- `src/main/database/schema.sql`: esquema SQLite
- `tests/unit`: tests unitarios de servicios y validaciones
