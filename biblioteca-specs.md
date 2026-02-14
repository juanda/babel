# Sistema de Gestión de Biblioteca Personal

## Resumen Ejecutivo

Desarrollar una aplicación de escritorio multiplataforma para la gestión de una biblioteca personal de libros físicos. La aplicación será una Progressive Web App (PWA) construida con tecnologías web modernas (HTML, CSS, JavaScript) y empaquetada como aplicación de escritorio usando Electron, con Bun como runtime y gestor de paquetes.

## Stack Tecnológico

### Core
- **Runtime & Package Manager**: Bun (última versión estable)
- **Desktop Framework**: Electron (proceso principal y renderer)
- **Frontend**: HTML5, CSS3, JavaScript vanilla (ES6+) o framework ligero (opcional: Lit, Alpine.js)
- **Base de Datos**: SQLite (mejor-db para integración con Bun)
- **Build Tool**: Electron Builder para empaquetado multiplataforma

### Librerías Recomendadas
- **UI Components**: Sin dependencias pesadas, CSS moderno con variables CSS
- **Iconos**: Lucide Icons o similar (SVG)
- **Validación**: Zod (validación de esquemas)
- **Gestión de estado**: Store simple basado en observables o Proxy
- **Búsqueda**: Fuse.js para búsqueda difusa
- **Exportación**: SheetJS para Excel, jsPDF para PDF

## Arquitectura de la Aplicación

### Estructura de Procesos Electron

```
┌─────────────────────────────────────┐
│      Main Process (Node.js)         │
│  - Gestión de ventanas              │
│  - Ciclo de vida de la app          │
│  - Acceso a sistema de archivos     │
│  - Base de datos SQLite             │
└──────────────┬──────────────────────┘
               │ IPC (Inter-Process Communication)
┌──────────────┴──────────────────────┐
│   Renderer Process (Chromium)       │
│  - UI/UX (HTML/CSS/JS)              │
│  - Lógica de presentación           │
│  - Eventos de usuario               │
└─────────────────────────────────────┘
```

### Estructura de Directorios

```
biblioteca-app/
├── src/
│   ├── main/                    # Main Process
│   │   ├── index.js            # Entry point
│   │   ├── database/
│   │   │   ├── schema.sql
│   │   │   ├── migrations/
│   │   │   └── db.js           # Conexión y queries
│   │   ├── ipc/                # IPC handlers
│   │   │   ├── books.js
│   │   │   ├── authors.js
│   │   │   ├── loans.js
│   │   │   ├── users.js
│   │   │   └── reports.js
│   │   ├── services/           # Lógica de negocio
│   │   │   ├── bookService.js
│   │   │   ├── authorService.js
│   │   │   ├── loanService.js
│   │   │   └── userService.js
│   │   └── utils/
│   │       ├── backup.js
│   │       └── logger.js
│   │
│   ├── renderer/               # Renderer Process
│   │   ├── index.html
│   │   ├── styles/
│   │   │   ├── main.css
│   │   │   ├── variables.css
│   │   │   └── components/
│   │   ├── scripts/
│   │   │   ├── app.js
│   │   │   ├── router.js
│   │   │   ├── store.js
│   │   │   └── components/
│   │   │       ├── book-list.js
│   │   │       ├── book-form.js
│   │   │       ├── author-selector.js
│   │   │       ├── author-form.js
│   │   │       ├── loan-manager.js
│   │   │       └── search-bar.js
│   │   └── views/
│   │       ├── dashboard.html
│   │       ├── books.html
│   │       ├── authors.html
│   │       ├── loans.html
│   │       ├── users.html
│   │       └── reports.html
│   │
│   └── preload/
│       └── preload.js          # API Bridge (seguridad)
│
├── assets/
│   ├── icons/
│   └── images/
│
├── build/                      # Configuración de build
│   └── electron-builder.json
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── package.json
├── bunfig.toml                # Configuración de Bun
└── README.md
```

## Ejemplos de Queries Comunes

### Obtener libro con sus autores
```sql
SELECT 
    b.*,
    GROUP_CONCAT(a.name, ', ') as authors
FROM books b
LEFT JOIN book_authors ba ON b.id = ba.book_id
LEFT JOIN authors a ON ba.author_id = a.id
GROUP BY b.id;
```

### Buscar libros por autor
```sql
SELECT b.* 
FROM books b
JOIN book_authors ba ON b.id = ba.book_id
JOIN authors a ON ba.author_id = a.id
WHERE a.name LIKE '%García Márquez%';
```

### Top 10 autores con más libros
```sql
SELECT 
    a.name,
    COUNT(DISTINCT ba.book_id) as book_count
FROM authors a
JOIN book_authors ba ON a.id = ba.author_id
GROUP BY a.id
ORDER BY book_count DESC
LIMIT 10;
```

### Libros con múltiples autores
```sql
SELECT 
    b.title,
    GROUP_CONCAT(a.name || ' (' || ba.role || ')', ', ') as authors
FROM books b
JOIN book_authors ba ON b.id = ba.book_id
JOIN authors a ON ba.author_id = a.id
GROUP BY b.id
HAVING COUNT(ba.author_id) > 1;
```

### Autores que han colaborado juntos
```sql
SELECT 
    a1.name as author1,
    a2.name as author2,
    COUNT(*) as collaborations
FROM book_authors ba1
JOIN book_authors ba2 ON ba1.book_id = ba2.book_id AND ba1.author_id < ba2.author_id
JOIN authors a1 ON ba1.author_id = a1.id
JOIN authors a2 ON ba2.author_id = a2.id
GROUP BY a1.id, a2.id
ORDER BY collaborations DESC;
```

## Modelo de Datos

### Esquema de Base de Datos (SQLite)

```sql
-- Tabla: authors (autores normalizados)
CREATE TABLE authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    biography TEXT,
    birth_date TEXT,                 -- ISO 8601 date
    death_date TEXT,                 -- ISO 8601 date
    nationality TEXT,
    photo_url TEXT,
    website TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: books
CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    isbn TEXT UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    publisher TEXT,
    publication_date TEXT,           -- ISO 8601 date
    edition TEXT,
    language TEXT DEFAULT 'es',
    pages INTEGER,
    format TEXT,                     -- 'hardcover', 'paperback', 'ebook'
    genre TEXT,                      -- Categoría principal
    tags TEXT,                       -- JSON array de tags
    description TEXT,
    cover_url TEXT,
    location TEXT,                   -- Ubicación física (estante, caja)
    condition TEXT,                  -- 'excellent', 'good', 'fair', 'poor'
    acquisition_date TEXT,
    acquisition_source TEXT,         -- 'purchase', 'gift', 'exchange'
    purchase_price REAL,
    current_value REAL,
    notes TEXT,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    read_status TEXT DEFAULT 'unread', -- 'unread', 'reading', 'completed'
    favorite BOOLEAN DEFAULT 0,
    loanable BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: book_authors (relación many-to-many entre libros y autores)
CREATE TABLE book_authors (
    book_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    author_order INTEGER DEFAULT 1,  -- Orden del autor (1 = principal, 2 = coautor, etc.)
    role TEXT DEFAULT 'author',      -- 'author', 'editor', 'translator', 'illustrator'
    PRIMARY KEY (book_id, author_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);

-- Tabla: users (personas que pueden tomar prestado)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    notes TEXT,
    trust_level INTEGER DEFAULT 3 CHECK(trust_level >= 1 AND trust_level <= 5),
    active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: loans (préstamos)
CREATE TABLE loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    loan_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    return_date TEXT,                -- NULL si aún no se ha devuelto
    status TEXT DEFAULT 'active',    -- 'active', 'returned', 'overdue', 'lost'
    condition_on_loan TEXT,
    condition_on_return TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla: reading_history
CREATE TABLE reading_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    start_date TEXT,
    finish_date TEXT,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Tabla: collections (colecciones personalizadas)
CREATE TABLE collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT,                      -- Color hex para UI
    icon TEXT,                       -- Nombre del icono
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: book_collections (relación many-to-many)
CREATE TABLE book_collections (
    book_id INTEGER NOT NULL,
    collection_id INTEGER NOT NULL,
    added_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (book_id, collection_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

-- Índices para optimizar consultas
CREATE INDEX idx_authors_name ON authors(name);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_genre ON books(genre);
CREATE INDEX idx_book_authors_book_id ON book_authors(book_id);
CREATE INDEX idx_book_authors_author_id ON book_authors(author_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_book_id ON loans(book_id);
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_due_date ON loans(due_date);
```

## Funcionalidades Principales

### 1. Gestión de Libros

#### 1.1 Catálogo de Libros
- **Agregar libros**: Formulario completo con validación
- **Búsqueda por ISBN**: Autocompletado con API externa (opcional: Open Library API, Google Books API)
- **Entrada manual**: Para libros sin ISBN o raros
- **Gestión de autores**: 
  - Autocompletar desde lista de autores existentes
  - Crear nuevos autores on-the-fly al agregar libros
  - Asignar múltiples autores a un libro
  - Especificar orden de autores (principal, coautor)
  - Roles de autor (autor, editor, traductor, ilustrador)
- **Edición masiva**: Actualizar múltiples libros simultáneamente
- **Eliminación**: Con confirmación y verificación de préstamos activos
- **Importación**: CSV, Excel, o desde otros sistemas (formato configurable)
- **Exportación**: CSV, Excel, PDF

#### 1.2 Búsqueda y Filtrado
- **Búsqueda avanzada**: Por título, autor, ISBN, género, tags
- **Búsqueda difusa**: Tolerante a errores tipográficos
- **Filtros múltiples**:
  - Por autor específico
  - Estado de lectura (no leído, leyendo, completado)
  - Disponibilidad (disponible, prestado)
  - Género/Categoría
  - Ubicación física
  - Rango de fechas
  - Calificación
  - Condición física
- **Ordenamiento**: Por título, autor, fecha de adquisición, calificación, etc.
- **Vistas**: Lista, cuadrícula con portadas, tabla detallada

#### 1.3 Visualización de Libros
- **Ficha detallada**: Vista completa de información del libro
- **Portadas**: Descarga y almacenamiento local de portadas
- **Historial**: Ver historial de préstamos y lecturas
- **Estadísticas**: Tiempo en biblioteca, veces prestado, etc.

#### 1.4 Organización
- **Tags/Etiquetas**: Sistema flexible de etiquetado
- **Colecciones personalizadas**: Crear y gestionar colecciones temáticas
- **Ubicación física**: Sistema de ubicación personalizable (estante, caja, habitación)
- **Favoritos**: Marcar libros favoritos

### 2. Gestión de Préstamos

#### 2.1 Crear Préstamo
- **Selección de libro**: Verificar disponibilidad
- **Selección de usuario**: Autocompletar desde lista existente
- **Fecha de préstamo**: Por defecto hoy
- **Fecha de devolución**: Configurable (7, 14, 30 días por defecto)
- **Estado del libro**: Registrar condición al prestarse
- **Notas**: Campo libre para observaciones

#### 2.2 Seguimiento de Préstamos
- **Dashboard de préstamos activos**: Vista rápida
- **Préstamos vencidos**: Destacar con color/icono
- **Notificaciones**: Avisos de próximos vencimientos (3 días antes, 1 día antes)
- **Historial completo**: Todos los préstamos pasados

#### 2.3 Devolución de Libros
- **Registro de devolución**: Fecha automática o manual
- **Estado del libro**: Registrar condición al devolverse
- **Comparación**: Alertar si hay cambio en condición
- **Actualización automática**: Marcar libro como disponible

#### 2.4 Gestión de Usuarios Prestatarios
- **CRUD de usuarios**: Crear, leer, actualizar, eliminar
- **Información de contacto**: Email, teléfono, dirección
- **Nivel de confianza**: Sistema de 1-5 estrellas
- **Historial de préstamos**: Ver préstamos por usuario
- **Estadísticas**: Libros prestados, tasa de devolución a tiempo, etc.
- **Bloqueo temporal**: Deshabilitar préstamos a usuarios problemáticos

### 2.5 Gestión de Autores

#### 2.5.1 CRUD de Autores
- **Crear autor**: Formulario con información biográfica
- **Editar autor**: Actualizar información existente
- **Eliminar autor**: Con verificación de libros asociados
- **Vista de autor**: Perfil completo del autor

#### 2.5.2 Información del Autor
- **Datos básicos**: Nombre completo (único)
- **Biografía**: Texto libre descriptivo
- **Fechas**: Nacimiento y fallecimiento
- **Nacionalidad**: País de origen
- **Foto**: URL o archivo local
- **Website**: Enlace a sitio web oficial o Wikipedia
- **Notas**: Información adicional personalizada

#### 2.5.3 Búsqueda y Autocompletado
- **Búsqueda de autores**: Por nombre con fuzzy search
- **Autocompletar**: Al agregar/editar libros
- **Sugerencias**: Prevenir duplicados mostrando autores similares
- **Vista de todos los autores**: Lista completa con filtros

#### 2.5.4 Estadísticas de Autor
- **Libros en biblioteca**: Total de libros del autor
- **Libros leídos**: Cuántos has completado
- **Libros prestados**: Actualmente en préstamo
- **Calificación promedio**: De tus lecturas
- **Género principal**: Género más común del autor en tu colección

#### 2.5.5 Vista Detallada de Autor
- **Perfil completo**: Biografía, foto, fechas
- **Lista de libros**: Todos los libros del autor en tu biblioteca
- **Gráficos**: Distribución de géneros, años de publicación
- **Coautores**: Otros autores con los que ha colaborado
- **Línea de tiempo**: Historial de lecturas de este autor

### 3. Seguimiento de Lecturas

#### 3.1 Estado de Lectura
- **Marcar como**: No leído, Leyendo, Completado
- **Fecha de inicio**: Al comenzar a leer
- **Fecha de finalización**: Al completar
- **Progreso**: Opcional - porcentaje o página actual

#### 3.2 Reseñas y Calificaciones
- **Calificación**: Sistema de 1-5 estrellas
- **Reseña personal**: Campo de texto libre
- **Citas favoritas**: Guardar pasajes memorables

#### 3.3 Estadísticas de Lectura
- **Libros leídos**: Por año, mes, total
- **Promedio de lectura**: Libros por mes
- **Gráficos**: Visualización de tendencias
- **Metas de lectura**: Establecer y seguir objetivos anuales

### 4. Reportes y Estadísticas

#### 4.1 Dashboard Principal
- **Resumen general**:
  - Total de libros en biblioteca
  - Libros prestados actualmente
  - Préstamos vencidos
  - Libros leídos este año
  - Valor estimado de la colección
- **Gráficos visuales**:
  - Distribución por género
  - Libros por año de adquisición
  - Tendencias de lectura
  - Estado de préstamos

#### 4.2 Reportes Generados
- **Inventario completo**: Lista detallada de todos los libros
- **Reporte de préstamos**: Activos, históricos, por usuario
- **Reporte de valor**: Valoración de la colección
- **Reporte de lecturas**: Estadísticas de lectura personal
- **Libros perdidos/no devueltos**: Lista de seguimiento
- **Exportación**: PDF, Excel, CSV

#### 4.3 Analíticas
- **Autores más leídos**: Top 10 autores con más lecturas completadas
- **Autores en biblioteca**: Top autores con más libros en colección
- **Autores más prestados**: Ranking por préstamos
- **Géneros favoritos**: Distribución
- **Tendencias temporales**: Lecturas por mes/año
- **Tasa de préstamo**: Libros más prestados
- **Usuarios más activos**: Ranking de prestatarios
- **Coautorías**: Red de autores que colaboran juntos

### 5. Configuración y Administración

#### 5.1 Configuración General
- **Datos de la biblioteca**: Nombre, descripción
- **Preferencias de visualización**: Tema (claro/oscuro), idioma
- **Formato de fechas**: Configurable según región
- **Moneda**: Para valoraciones

#### 5.2 Configuración de Préstamos
- **Duración predeterminada**: Días de préstamo estándar
- **Límite por usuario**: Máximo de libros simultáneos
- **Recordatorios**: Configurar notificaciones
- **Políticas**: Texto personalizable para condiciones de préstamo

#### 5.3 Backup y Restauración
- **Backup automático**: Programar copias de seguridad
- **Backup manual**: Crear copia cuando se requiera
- **Restauración**: Desde archivo de backup
- **Exportación de datos**: Exportar toda la base de datos

#### 5.4 Importación/Exportación
- **Formatos soportados**: CSV, Excel, JSON
- **Mapeo de campos**: Configurar correspondencia de columnas
- **Validación**: Verificar datos antes de importar
- **Logs de importación**: Registro de errores y éxitos

### 6. Funcionalidades Avanzadas (Opcional/Futuro)

#### 6.1 Integración con APIs Externas
- **Open Library API**: Autocompletar datos de libros
- **Google Books API**: Información adicional y portadas
- **ISBN Database**: Validación y búsqueda

#### 6.2 Escáner de Código de Barras
- **Lectura de ISBN**: Mediante cámara web o escáner USB
- **Adición rápida**: Agregar libros escaneando ISBN

#### 6.3 Sincronización en la Nube (Opcional)
- **Backup en la nube**: Dropbox, Google Drive, OneDrive
- **Sincronización**: Entre múltiples dispositivos

#### 6.4 Gestión de Series
- **Detección de series**: Agrupar libros de una serie
- **Tracking de series**: Progreso en series de libros
- **Ordenamiento**: Por orden de lectura

## Requisitos No Funcionales

### Rendimiento
- **Inicio de aplicación**: < 3 segundos
- **Búsquedas**: < 500ms para colecciones de hasta 10,000 libros
- **Carga de vistas**: < 1 segundo
- **Base de datos**: Optimizada con índices apropiados

### Seguridad
- **Context Isolation**: Habilitado en Electron
- **Node Integration**: Deshabilitado en renderer
- **Preload Scripts**: Usar para exponer APIs de forma segura
- **Validación de entrada**: Todas las entradas de usuario
- **Prevención de SQL Injection**: Usar prepared statements
- **CSP (Content Security Policy)**: Configurado apropiadamente

### Usabilidad
- **Interfaz intuitiva**: Diseño limpio y moderno
- **Navegación clara**: Menú lateral o superior
- **Feedback visual**: Confirmaciones, errores, loading states
- **Atajos de teclado**: Acciones comunes accesibles
- **Responsive**: Adaptable a diferentes tamaños de ventana
- **Accesibilidad**: Cumplir con WCAG 2.1 nivel AA

### Mantenibilidad
- **Código modular**: Separación clara de responsabilidades
- **Comentarios**: Documentación inline cuando sea necesario
- **Logging**: Sistema de logs para debugging
- **Tests**: Cobertura mínima del 60% en lógica de negocio
- **Convenciones**: ESLint configurado con reglas estándar

### Compatibilidad
- **Sistemas operativos**: Windows 10+, macOS 10.13+, Linux (Ubuntu 20.04+)
- **Arquitecturas**: x64, ARM64 (para Apple Silicon)
- **Actualización automática**: Soporte para auto-updates

## Diseño de UI/UX

### Principios de Diseño
1. **Simplicidad**: Interfaz limpia, sin elementos innecesarios
2. **Consistencia**: Patrones de diseño coherentes en toda la app
3. **Feedback**: Respuesta visual inmediata a acciones del usuario
4. **Accesibilidad**: Contraste adecuado, tamaños de fuente ajustables
5. **Productividad**: Flujos de trabajo eficientes para tareas comunes

### Paleta de Colores
- **Tema Claro**:
  - Primario: #2563eb (Azul)
  - Secundario: #7c3aed (Púrpura)
  - Éxito: #059669 (Verde)
  - Advertencia: #d97706 (Ámbar)
  - Error: #dc2626 (Rojo)
  - Fondo: #ffffff
  - Superficie: #f9fafb
  - Texto: #111827

- **Tema Oscuro**:
  - Primario: #3b82f6
  - Secundario: #8b5cf6
  - Éxito: #10b981
  - Advertencia: #f59e0b
  - Error: #ef4444
  - Fondo: #0f172a
  - Superficie: #1e293b
  - Texto: #f1f5f9

### Componentes UI Principales
1. **Barra de navegación**: Menú lateral colapsable o barra superior
2. **Barra de búsqueda**: Global, siempre accesible
3. **Cards de libros**: Vista de cuadrícula con portada y datos básicos
4. **Tablas**: Vista detallada con ordenamiento y filtrado
5. **Formularios**: Campos bien organizados con validación en tiempo real
6. **Modales**: Para acciones de confirmación o formularios rápidos
7. **Notificaciones**: Toast messages para feedback
8. **Gráficos**: Charts.js o similar para estadísticas

### Flujos de Usuario Críticos

#### Agregar un Libro Nuevo
1. Click en "Agregar Libro"
2. Modal/página con formulario
3. Opción 1: Ingresar ISBN → autocompletar (incluye autores)
4. Opción 2: Entrada manual de todos los campos
5. **Gestión de autores**:
   - Campo de autocompletar para buscar autores existentes
   - Seleccionar autor de la lista → se agrega al libro
   - Si el autor no existe: "Crear nuevo autor" inline o en modal
   - Posibilidad de agregar múltiples autores
   - Reordenar autores (arrastrar y soltar)
   - Especificar rol (autor, editor, traductor)
6. Cargar portada (URL o archivo local)
7. Guardar → Confirmación → Redirigir a vista del libro

#### Prestar un Libro
1. Desde vista de libro: Click "Prestar"
2. Modal de préstamo
3. Seleccionar usuario (autocompletar)
4. Establecer fecha de devolución
5. Registrar condición
6. Confirmar → Actualizar estado del libro → Notificación

#### Devolver un Libro
1. Desde lista de préstamos activos
2. Click "Devolver" en préstamo específico
3. Modal de devolución
4. Registrar condición de devolución
5. Comparar con condición inicial
6. Confirmar → Actualizar estado → Notificación

## Configuración de Desarrollo

### package.json (Ejemplo)

```json
{
  "name": "biblioteca-app",
  "version": "1.0.0",
  "description": "Sistema de gestión de biblioteca personal",
  "main": "src/main/index.js",
  "scripts": {
    "dev": "electron .",
    "build": "electron-builder",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux",
    "test": "bun test",
    "lint": "eslint src/**/*.js",
    "format": "prettier --write src/**/*.{js,css,html}"
  },
  "keywords": ["library", "books", "management", "electron"],
  "author": "Tu Nombre",
  "license": "MIT",
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.0",
    "fuse.js": "^7.0.0",
    "zod": "^3.22.4"
  },
  "build": {
    "appId": "com.tudominio.biblioteca",
    "productName": "Mi Biblioteca",
    "directories": {
      "output": "dist"
    },
    "files": [
      "src/**/*",
      "assets/**/*",
      "package.json"
    ],
    "win": {
      "target": ["nsis", "portable"],
      "icon": "assets/icons/icon.ico"
    },
    "mac": {
      "target": ["dmg", "zip"],
      "icon": "assets/icons/icon.icns",
      "category": "public.app-category.productivity"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "assets/icons/icon.png",
      "category": "Utility"
    }
  }
}
```

### bunfig.toml (Ejemplo)

```toml
[install]
# Configuración de instalación de paquetes
auto = "auto"
production = false

[run]
# Scripts que se pueden ejecutar con 'bun run'
shell = "bash"

[test]
# Configuración para testing
preload = ["./tests/setup.js"]
```

## Guía de Implementación

### Fase 1: Setup Inicial (Semana 1)
- [ ] Configurar proyecto con Bun
- [ ] Configurar Electron con estructura básica
- [ ] Implementar IPC básico entre main y renderer
- [ ] Configurar SQLite con better-sqlite3
- [ ] Crear esquema de base de datos
- [ ] Setup de ESLint y Prettier

### Fase 2: CRUD de Libros y Autores (Semana 2-3)
- [ ] Implementar servicios de base de datos para autores
- [ ] CRUD completo de autores con validación
- [ ] Implementar servicios de base de datos para libros
- [ ] Crear UI para listado de libros
- [ ] Implementar formulario de agregar/editar libro con selector de autores
- [ ] Componente de autocompletar para autores
- [ ] Implementar búsqueda básica (libros y autores)
- [ ] Implementar filtros y ordenamiento
- [ ] Gestión de portadas de libros
- [ ] Vista detallada de autor con sus libros

### Fase 3: Sistema de Préstamos (Semana 4)
- [ ] CRUD de usuarios prestatarios
- [ ] Lógica de préstamos (crear, devolver)
- [ ] UI para gestión de préstamos
- [ ] Dashboard de préstamos activos
- [ ] Cálculo de préstamos vencidos

### Fase 4: Tracking de Lecturas (Semana 5)
- [ ] Implementar estados de lectura
- [ ] Sistema de calificaciones y reseñas
- [ ] Historial de lecturas
- [ ] Estadísticas básicas de lectura

### Fase 5: Reportes y Estadísticas (Semana 6)
- [ ] Dashboard principal con métricas
- [ ] Generación de reportes
- [ ] Gráficos y visualizaciones
- [ ] Exportación de datos (CSV, Excel, PDF)

### Fase 6: Funcionalidades Avanzadas (Semana 7-8)
- [ ] Sistema de colecciones
- [ ] Importación/exportación de datos
- [ ] Backup y restauración
- [ ] Configuración de la aplicación
- [ ] Notificaciones y recordatorios

### Fase 7: Polish y Distribución (Semana 9)
- [ ] Optimización de rendimiento
- [ ] Testing exhaustivo
- [ ] Documentación de usuario
- [ ] Configuración de electron-builder
- [ ] Builds para todas las plataformas

## Pruebas

### Tipos de Pruebas
1. **Unitarias**: Servicios y lógica de negocio
2. **Integración**: IPC y base de datos
3. **E2E**: Flujos de usuario completos
4. **Manual**: UI/UX y accesibilidad

### Herramientas
- Bun test runner (integrado)
- Playwright (para E2E con Electron)
- SQLite in-memory para tests de DB

## Consideraciones de Seguridad

### Mejores Prácticas Electron
1. **Deshabilitar Node Integration** en renderer process
2. **Habilitar Context Isolation**
3. **Usar preload scripts** para exponer APIs limitadas
4. **Validar todas las entradas** de usuario
5. **Content Security Policy** restrictiva
6. **Mantener Electron actualizado**
7. **Sanitizar datos** antes de renderizar HTML
8. **No usar `eval()` ni `new Function()`**

### Protección de Datos
- Base de datos local (no se envía a servidores externos)
- Backups encriptados (opcional)
- Validación de esquemas con Zod

## Documentación Requerida

### Para el Desarrollador
- README.md con instrucciones de setup
- Guía de arquitectura
- API de IPC documentada
- Esquema de base de datos comentado

### Para el Usuario
- Manual de usuario (PDF o HTML)
- FAQ
- Guía de inicio rápido
- Tutoriales en video (opcional)

## Entregables

1. **Código Fuente**: Repositorio completo en Git
2. **Ejecutables**: Instaladores para Windows, macOS, Linux
3. **Documentación**: Técnica y de usuario
4. **Tests**: Suite de pruebas con > 60% cobertura
5. **Assets**: Iconos, logos en todos los tamaños necesarios

## Criterios de Éxito

1. ✅ Aplicación funcional en las 3 plataformas principales
2. ✅ Todas las funcionalidades core implementadas
3. ✅ Rendimiento fluido (sin lag perceptible)
4. ✅ UI intuitiva y atractiva
5. ✅ Base de datos robusta sin pérdida de datos
6. ✅ Sistema de backup funcional
7. ✅ Documentación completa y clara
8. ✅ Instaladores que funcionan out-of-the-box

## Recursos Adicionales

### APIs Externas (Opcional)
- [Open Library API](https://openlibrary.org/developers/api) - Datos de libros
- [Google Books API](https://developers.google.com/books) - Información y portadas
- [ISBN DB](https://isbndb.com/) - Base de datos de ISBN

### Referencias de Diseño
- Material Design para componentes
- Tailwind CSS para utilidades (opcional)
- Diseño inspirado en: Calibre, Goodreads, Libib

### Comunidad y Soporte
- Electron Discord
- Bun Discord
- Stack Overflow tags: electron, sqlite, bun

---

## Notas Finales para Claude Code

### Prioridades de Implementación
1. **Funcionalidad antes que estética**: Hacer que funcione primero
2. **Código limpio y mantenible**: Seguir principios SOLID
3. **Seguridad**: No comprometer la seguridad por conveniencia
4. **Performance**: Optimizar queries de DB desde el inicio
5. **UX**: Feedback inmediato al usuario en todas las acciones

### Convenciones de Código
- **Nombres de variables**: camelCase
- **Nombres de archivos**: kebab-case
- **Constantes**: UPPER_SNAKE_CASE
- **Clases**: PascalCase
- **Funciones**: Verbos descriptivos (getUserById, createLoan, etc.)
- **Comentarios**: JSDoc para funciones públicas

### Git Workflow
- Commits atómicos con mensajes descriptivos
- Ramas por feature: `feature/loan-management`
- Main branch siempre estable

### Testing
- Escribir tests para lógica crítica (préstamos, cálculos)
- Tests de integración para IPC
- Al menos smoke tests para UI

¡Buena suerte con la implementación! 🚀📚