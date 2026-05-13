# LYNKN

LYNKN es una aplicacion social para crear quedadas, descubrir eventos cercanos, solicitar acceso, gestionar participantes y hablar por chat cuando el organizador acepta la solicitud. El proyecto esta dividido en frontend web/movil, backend API y proyecto Android generado con Capacitor.

## Estructura

```txt
lynkn-app/
  lynkn-client/      Frontend React, Vite, Capacitor y Android/iOS
  lynkn-server/      Backend NestJS, Supabase, Socket.IO y Auth
  README.md          Guia general del repositorio
```

## Stack principal

- Frontend: React 19, TypeScript, Vite, React Router, MapLibre, i18next, PrimeReact, Socket.IO client.
- Backend: NestJS, TypeScript, Supabase, Socket.IO, JWT, Google Auth, Gemini.
- Base de datos y storage: Supabase.
- Movil: Capacitor 6 con Android.
- Testing frontend: Vitest.

## Requisitos

- Node.js 20 o superior recomendado.
- npm.
- Cuenta/proyecto de Supabase configurado.
- Backend desplegado o ejecutandose en local.
- Para Android: Android SDK, Platform Tools y un dispositivo con depuracion USB o emulador.

## Instalacion rapida

Instala dependencias en cada parte:

```powershell
cd lynkn-server
npm install

cd ..\lynkn-client
npm install
```

## Variables de entorno

El cliente usa `lynkn-client/.env`:

```env
VITE_API_URL=http://localhost:4000
VITE_MOBILE_API_URL=https://tu-backend-publico.com
VITE_SOCKET_URL=https://tu-backend-publico.com
VITE_STADIA_API_KEY=tu_api_key
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_GOOGLE_CLIENT_ID=tu_google_client_id
```

El servidor usa `lynkn-server/.env`:

```env
PORT=4000
JWT_SECRET=una_clave_segura
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_service_role_o_key_servidor
GOOGLE_CLIENT_ID=tu_google_client_id
GEMINI_API_KEY=tu_gemini_api_key
```

No subas claves reales a GitHub. Usa variables de entorno del proveedor en produccion.

## Ejecutar en local

Backend:

```powershell
cd lynkn-server
npm run start:dev
```

Frontend:

```powershell
cd lynkn-client
npm run dev
```

Por defecto:

- Cliente: `http://localhost:5173`
- Backend local recomendado: `http://localhost:4000`
- Backend en produccion usado por movil: definido en `VITE_MOBILE_API_URL`

## Comandos utiles

Cliente:

```powershell
npm run dev
npm run build
npm run lint
npm run test
npm run cap:sync
```

Servidor:

```powershell
npm run start:dev
npm run build
npm run start:prod
```

Android:

```powershell
cd lynkn-client
npm run cap:sync
cd android
.\gradlew assembleDebug
.\gradlew installDebug
```

## Flujo de la app

1. El usuario se registra o inicia sesion.
2. El perfil pasa por verificacion.
3. El usuario puede explorar eventos en mapa o vista de posts.
4. Puede solicitar unirse a eventos con plazas limitadas o acceder directamente a eventos ilimitados.
5. El organizador acepta o rechaza solicitudes.
6. Al aceptar, el chat del evento queda disponible para el usuario aceptado, sin esperar a que el evento llegue al aforo maximo.
7. Los participantes aceptados pueden enviar mensajes en tiempo real.

## Despliegue recomendado

- Frontend web: Vercel.
- Backend: Render, Railway, Fly.io o un VPS Node.
- Supabase: base de datos, auth auxiliar, storage y realtime.
- Android: build local con Gradle/Capacitor apuntando a `VITE_MOBILE_API_URL`.

Para una presentacion fuera de tu red local, usa siempre backend publico HTTPS. No dependas de `localhost` ni de la IP del ordenador.

## Documentacion por modulo

- [Cliente web y movil](./lynkn-client/README.md)
- [Servidor API](./lynkn-server/README.md)
- [Android](./lynkn-client/android/README.md)

## Verificacion antes de entregar

```powershell
cd lynkn-server
npm run build

cd ..\lynkn-client
npm run lint
npm run test
npm run build
npm run cap:sync
```

Si todo pasa, el proyecto queda listo para web y para generar una APK/debug build de Android.
