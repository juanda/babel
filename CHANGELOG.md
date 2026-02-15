# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato está inspirado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

## [v1.0.0] - 2026-02-15

### Added
- Generación de signatura CDU en el formulario de libros, con sugerencia automática y edición manual.
- Persistencia de `CDU` y `signatura` en libros (modelo, validación y base de datos).
- Estado de impresión de tejuelo por libro (`label_printed`) con checkbox editable en crear/editar.
- Flujo completo de impresión de tejuelos:
  - Botón en listado de libros.
  - Pantalla dedicada de configuración.
  - Plantillas 65/24/21 etiquetas por hoja.
  - Salida a PDF o envío directo a impresora.
  - Inclusión de QR local con la signatura.

### Changed
- El filtro de libros pasó de `Tejuelo impreso` a `Tejuelo no impreso`.
- La impresión de tejuelos ahora toma todos los libros del resultado actual (sin selección manual por checks).
- README ampliado con explicación del cálculo de CDU/signatura.

### Fixed
- Al cambiar entre vista cards/lista en libros ya no desaparecen los filtros/buscador.
- Alineación de la columna de acciones en la vista tabla de libros.
- En importación desde búsqueda externa, al pulsar `Usar` se oculta el listado de resultados para continuar más fluido.

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

[unreleased]: https://github.com/juanda/babel/compare/v1.0.0...HEAD
[v1.0.0]: https://github.com/juanda/babel/compare/v1.0.0-beta3...v1.0.0
[v1.0.0-beta3]: https://github.com/juanda/babel/compare/v1.0.0-beta2...v1.0.0-beta3
[v1.0.0-beta2]: https://github.com/juanda/babel/compare/v1.0.0-beta1...v1.0.0-beta2
[v1.0.0-beta1]: https://github.com/juanda/babel/releases/tag/v1.0.0-beta1
