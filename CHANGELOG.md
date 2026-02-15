# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato está inspirado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

## [v1.0.0-beta3] - 2026-02-15

### Changed
- Rediseño visual completo de la interfaz con estilo Brutalist Web Design (paleta, tipografía, layout y componentes).

### Fixed
- Importación de ISBN al usar resultados de búsqueda en internet.

## [v1.0.0-beta2] - 2026-02-15

### Changed
- Pipeline CI/CD adaptado para usar `GITHUB_TOKEN` en GitHub Actions.
- Build configurado para no auto-publicar artefactos sin credenciales explícitas.

## [v1.0.0-beta1] - 2026-02-15

### Added
- CRUD funcional de libros, autores, usuarios, préstamos y colecciones.
- Seguimiento de lectura con historial y estadísticas básicas.
- Gestión de colecciones desde el detalle de libro (agregar/quitar libro de colección).
- Búsqueda e importación de libros desde catálogos externos:
  - Open Library
  - Google Books
  - BNE (SRU)
- Modo de búsqueda avanzada con filtros (ISBN, título, autor, editorial, idioma, año, exact match y variantes).
- Subida de portada local y almacenamiento en `userData/covers`.
- Action de GitHub para generar instalables en Linux, macOS y Windows al etiquetar versiones.
- Iconos de aplicación para empaquetado (`.png`, `.ico`, `.icns`).
- Suite de tests unitarios para servicios críticos (`validators`, `bookService`, `authorService`, `userService`, `loanService`, `readingService`, `collectionService`).

### Changed
- Título de ventana fija con versión (`Mi Biblioteca v<version>`).
- README ampliado con:
  - setup de desarrollo
  - ejecución de tests
  - build de instalables
  - configuración de `GOOGLE_BOOKS_API_KEY`
- Metadatos de empaquetado Linux (`author.email`, `linux.maintainer`) para generar `.deb` correctamente.

### Fixed
- Eliminación de handlers inline (`onclick`) para cumplir CSP sin `unsafe-inline`.
- Compatibilidad de portadas externas forzando `http -> https` para evitar bloqueos CSP.
- Aceptación de `file://` en validación de URL de portada.
- Refresco inmediato de listas tras operaciones CRUD en usuarios, préstamos y colecciones.
- Visualización de autores en modal de detalle de colecciones.
- Indicador de estado de préstamo en cards/listado y detalle de libro.

[unreleased]: https://github.com/juanda/babel/compare/v1.0.0-beta2...HEAD
[v1.0.0-beta2]: https://github.com/juanda/babel/compare/v1.0.0-beta1...v1.0.0-beta2
[v1.0.0-beta1]: https://github.com/juanda/babel/releases/tag/v1.0.0-beta1
