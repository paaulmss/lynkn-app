# LYNKN Client

Frontend de LYNKN construido con React, TypeScript, Vite y Capacitor. Esta parte contiene la aplicacion web, la experiencia movil embebida en Android/iOS y las vistas principales de usuario.

## Tecnologias

- React 19
- TypeScript
- Vite
- Capacitor 6
- React Router
- MapLibre GL
- i18next / react-i18next
- Socket.IO client
- Supabase client
- PrimeReact
- Vitest
- ESLint

## Estructura principal

```txt
lynkn-client/
  android/              Proyecto Android de Capacitor
  ios/                  Proyecto iOS de Capacitor
  public/               Recursos publicos
  src/
    api/                Configuracion Axios y Supabase
    assets/             Logos e imagenes locales
    components/         Componentes reutilizables
    context/            AuthProvider y estado global
    hooks/              Hooks personalizados
    pages/              Vistas principales
    services/           Servicios de auth, chat, categorias, IA
    types/              Tipos compartidos
    utils/              Utilidades
  capacitor.config.ts
  package.json
```

## Vistas incluidas

- Home publica con cambio de idioma y tema.
- Login y Register.
- Explorer con mapa, buscador, filtros, perfiles y posts.
- Create Post con direccion y posicion en mapa.
- Post Detail con estado de solicitud.
- Messages con chats de eventos aceptados.
- Requests para ver solicitudes del usuario.
- Notifications para aceptar/rechazar y consultar avisos.
- Profile con posts, mapa, seguidores y edicion.
- Settings con idioma, tema, verificacion y acciones de cuenta.
- Admin panel para gestion y actividad.

## Variables de entorno

Crea o revisa `lynkn-client/.env`:

```env
VITE_API_URL=http://localhost:4000
VITE_MOBILE_API_URL=https://tu-backend-publico.com
VITE_SOCKET_URL=https://tu-backend-publico.com
VITE_STADIA_API_KEY=tu_stadia_key
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=tu_google_client_id
```

Notas:

- `VITE_API_URL` se usa en navegador web local.
- `VITE_MOBILE_API_URL` se usa en Android/iOS con Capacitor.
- `VITE_SOCKET_URL` es opcional; si no existe, el chat usa la misma base que la API.
- En Android no uses `localhost` para conectar con un backend del PC. Usa un backend publico HTTPS o la IP correcta.

## Instalacion

```powershell
cd lynkn-client
npm install
```

## Desarrollo web

```powershell
npm run dev
```

Vite se levanta con `--host`, lo que permite probar desde otros dispositivos de la red si el firewall lo permite.

## Build de produccion

```powershell
npm run build
```

El resultado queda en `dist/`.

## Preview del build

```powershell
npm run preview
```

## Testing y calidad

```powershell
npm run lint
npm run test
```

`npm run test` ejecuta Vitest en modo run.

## Android con Capacitor

Sincroniza el build web con Android:

```powershell
npm run cap:sync
```

Abrir con Android Studio:

```powershell
npm run cap:android
```

Ejecutar con Capacitor:

```powershell
npm run cap:run:android
```

Ejecutar con Gradle desde terminal:

```powershell
cd android
.\gradlew assembleDebug
.\gradlew installDebug
```

Mas detalle en [android/README.md](./android/README.md).

## Flujo de API y autenticacion

Las llamadas HTTP usan `src/api/axiosConfig.ts`.

- Web local usa `VITE_API_URL`.
- Plataforma nativa Capacitor usa `VITE_MOBILE_API_URL`.
- El token JWT se guarda en `localStorage` como `lynkn_token`.
- El usuario se guarda en `localStorage` como `lynkn_user`.

El chat usa `src/services/chatService.ts` con Socket.IO.

## Supabase en cliente

El cliente usa `src/api/supabaseClient.ts` para ciertas consultas y realtime:

- Mensajes.
- Participaciones.
- Posts propios/aceptados.
- Actualizaciones en tiempo real.

La seguridad real debe mantenerse en backend y reglas de Supabase.

## Cambios de tema e idioma

La app usa:

- `i18n.ts` para traducciones ES/EN.
- `localStorage` para persistir tema e idioma.
- Clases globales sobre `body` para `light-mode`.

## Recomendaciones para demo

- Compila y sincroniza antes de instalar Android:

```powershell
npm run cap:sync
```

- Prueba con datos moviles para asegurar que no dependes de la red del centro.
- Verifica login, explorer, solicitud de unirse, aceptacion y chat.

## Problemas comunes

### Android no hace login

Comprueba que `VITE_MOBILE_API_URL` apunta a un backend publico HTTPS y que el backend permite CORS para Capacitor.

### Cambios no aparecen en Android

Ejecuta:

```powershell
npm run cap:sync
```

Despues reinstala la app.

### Mapa no carga

Comprueba `VITE_STADIA_API_KEY`.

### Google login falla

Comprueba `VITE_GOOGLE_CLIENT_ID` y la configuracion OAuth del proyecto.
