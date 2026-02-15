# Cómo estoy haciendo esta aplicación

- Sábado, 14/02/2026, 18:00 comienzo la aplicación

He comenzado por preguntar a claude web:

```
Quiero construir un software para la gestión de mi biblioteca de libros físicos. Quiero que sea una aplicación web escrita en javascript + html + css, pero que se pueda instalar como aplicación de escritorio usando electron. Quiero usar bun como entorno de ejecución y gestor de paquetes de javascript. Ayúdame a elaborar un prompt para claude code o codex con el que construir la aplicación. Añade las funcionalidades más típicas de una aplicación para la gestión de bibliotecas, incluyendo préstamos. Vamos a usar markdown para escribir las especificaciones.
```

Claude me ha presentado una propuesta. La he revisado. Lo único que he cambiad ha sido una parte del modelo de datos: claude había metido a los autores como un campo json dentro de libros, pero yo quiero que los autores tengan su tabla propia. Se lo he dicho y ha modificado el documento de especificaciones. Finalmente el punto de partida para claude code será [biblioteca-specs](biblioteca-specs.md)

Al cabo de unos 30-40 minutos me he quedado sin tokens en la ventana de 5 horas. Por eso he continuado con codex. Le he dicho:

```
este directorio contiene el código de la aplicación de biblioteca
    especificada en biblioteca-specs.md. Claude a iniciado la
    implementación siguiendo el plan /home/juanda/.claude/plans/
    golden-snuggling-engelbart.md, continúa tu la implementación. A
  ver si lo haces mejor que claude ;-)
```

Y ha continuado el desarrollo. Ha llegado a un esqueleto básico en el que todavía no funcionan los formularios de entrada de datos. 

El siguiente paso, sugerido por codex, ha sido implementar tests. Y así he continuado.

- Sábado, 14/02/2026, 19:35. Esqueleto de la aplicación completamente funcional

- Sábado, 14/02/2026, 20:20. He corregido algunos fallos y pulido algunas partes.

- Domingo, 15/02/2026, 8:30. Comienzo a trabajar.

- Domingo, 15/02/2026, 10:18. Corrijo algunos fallos y sigo puliendo





