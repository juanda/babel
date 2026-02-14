# Cómo estoy haciendo esta aplicación

He comenzado por preguntar a claude web:

```
Quiero construir un software para la gestión de mi biblioteca de libros físicos. Quiero que sea una aplicación web escrita en javascript + html + css, pero que se pueda instalar como aplicación de escritorio usando electron. Quiero usar bun como entorno de ejecución y gestor de paquetes de javascript. Ayúdame a elaborar un prompt para claude code o codex con el que construir la aplicación. Añade las funcionalidades más típicas de una aplicación para la gestión de bibliotecas, incluyendo préstamos. Vamos a usar markdown para escribir las especificaciones.
```

Claude me ha presentado una propuesta. La he revisado. Lo único que he cambiad ha sido una parte del modelo de datos: claude había metido a los autores como un campo json dentro de libros, pero yo quiero que los autores tengan su tabla propia. Se lo he dicho y ha modificado el documento de especificaciones. Finalmente el punto de partida para claude code será [biblioteca-specs](biblioteca-specs.md)

He instalado en claude el plugin 
