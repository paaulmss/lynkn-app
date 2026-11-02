# Base de datos

Scripts de PostgreSQL para los workflows de Lynkn App. Están diseñados para Supabase y para un modelo en el que el navegador consume la API de NestJS.

## Contenido

| Archivo | Responsabilidad |
| --- | --- |
| `secure-workflows.sql` | Crear publicaciones, gestionar participaciones, controlar aforo y realizar borrados relacionados en una transacción |
| `legacy-function-hardening.sql` | Configurar las funciones auxiliares de contadores con referencias de esquema explícitas |
| `public-schema-hardening.sql` | Mantener el acceso de `service_role` y restringir el acceso directo de los roles cliente |
| `verify-workflows.sql` | Comprobar los workflows con registros temporales y revertirlos al finalizar |
| `rls-hardening.sql` | Política de acceso del backend y restricción de subida directa a Storage; script de configuración inicial |

## Requisitos

Estos scripts asumen que las tablas de la aplicación ya existen. No son una exportación completa del esquema ni una copia de los datos. El esquema simplificado de `lynkn-server/test/fixtures/schema.sql` es exclusivamente para pruebas y no debe utilizarse como esquema de producción.

Antes de aplicarlos a otra base de datos, revisar tablas, restricciones, triggers, políticas de Storage y duplicados. `secure-workflows.sql` crea índices únicos; si hay duplicados, la transacción falla sin eliminarlos automáticamente. El script de configuración inicial de RLS asume las políticas originales de Storage y no debe repetirse indiscriminadamente.

Orden de los workflows y restricciones adicionales:

1. `secure-workflows.sql`.
2. `legacy-function-hardening.sql`.
3. `public-schema-hardening.sql`.

Utiliza un usuario con permisos administrativos para instalar las funciones. NestJS las ejecuta con su clave privada de servidor; nunca debe utilizarse esa clave en el frontend.

## Verificación

Las pruebas de PostgreSQL embebido se ejecutan con:

```sh
npm --prefix lynkn-server test
```

`verify-workflows.sql` permite contrastar las funciones con el esquema real. Ejecuta siempre el archivo completo: crea registros temporales y termina con `ROLLBACK`. Las secuencias pueden avanzar aunque los registros se reviertan.

El borrado cubre las tablas de la aplicación. La limpieza de identidades externas de Supabase Auth o de archivos históricos de Storage requiere su propio flujo.
