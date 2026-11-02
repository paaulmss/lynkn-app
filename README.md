# Lynkn App

Plataforma social para descubrir actividades cercanas, organizar eventos y conectar con otras personas. Combina un mapa interactivo, gestión de participantes y mensajería en tiempo real en una aplicación web con proyectos móviles de Capacitor.

## Funcionalidades

- Exploración de publicaciones en mapa y listado, con búsqueda y categorías.
- Creación de eventos con imagen, ubicación, fecha y límite de participantes.
- Solicitudes de participación, aprobación del organizador y control de aforo.
- Chat de evento y notificaciones en tiempo real.
- Perfiles, favoritos, seguimiento de usuarios y preferencias de idioma y tema.
- Inicio de sesión con contraseña o Google y verificación de perfiles.
- Panel de administración para usuarios, publicaciones y verificaciones.
- Moderación de texto e imágenes mediante Gemini.

## Tecnologías y arquitectura

| Área | Tecnologías |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router, MapLibre GL, i18next, PrimeReact |
| Backend | NestJS, TypeScript, Passport JWT, Socket.IO, class-validator |
| Datos y archivos | PostgreSQL y Storage en Supabase |
| Móvil | Capacitor, proyectos Android e iOS |
| Calidad | Jest, Vitest, PostgreSQL embebido con PGlite, ESLint y GitHub Actions |

El cliente accede a los datos a través de la API de NestJS. El backend organiza la lógica por módulos, valida las entradas con DTOs y obtiene la identidad del usuario desde su token. Los cambios de participación y los borrados relacionados se resuelven mediante funciones transaccionales de PostgreSQL. La base de datos utiliza RLS y acceso restringido al servidor para las tablas de la aplicación.

## Estructura

```text
lynkn-client/   Aplicación React y proyectos móviles
lynkn-server/   API NestJS, autenticación y tiempo real
database/      Funciones SQL y comprobaciones de integración
.github/       Integración continua
```

## Desarrollo local

Requisitos: Node.js 22 (mínimo 22.12), npm y un proyecto Supabase con el esquema de la aplicación. La moderación necesita una clave de Gemini; Google requiere su correspondiente cliente OAuth.

Instala las dependencias desde la raíz:

```sh
npm --prefix lynkn-server ci
npm --prefix lynkn-client ci
```

Copia `.env.example` a `.env` dentro de cada aplicación y completa los valores. Las claves privadas de Supabase, Gemini y JWT pertenecen exclusivamente al servidor. Las variables `VITE_*` son públicas y se incluyen en el navegador.

Ejecuta cada proceso en una terminal:

```sh
npm run dev:server
npm run dev:client
```

Cliente: `http://localhost:5173`. API: `http://localhost:4000`.

Consulta [database/README.md](database/README.md) para los requisitos y scripts de base de datos.

## Comprobaciones

Desde la raíz:

```sh
npm run build
npm test
npm run lint
```

Las pruebas cubren autorización HTTP, autenticación, WebSockets, moderación y reglas transaccionales de participación y borrado. Las comprobaciones SQL de integración utilizan transacciones revertidas para no conservar los datos de prueba.

## Web y móvil

El frontend se construye en `lynkn-client/dist` y dispone de configuración SPA para Vercel. El backend puede ejecutarse como servicio Node en Render o con el Dockerfile incluido. Configura las variables de entorno, los orígenes CORS y el cliente OAuth para cada entorno.

Para sincronizar el frontend con los proyectos móviles:

```sh
npm --prefix lynkn-client run cap:sync
```

Android requiere su SDK; iOS requiere macOS y Xcode. La configuración actual del backend está orientada a una única instancia: las sesiones temporales y parte del estado de tiempo real permanecen en memoria.
