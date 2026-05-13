# LYNKN Server

Backend de LYNKN construido con NestJS. Expone la API REST, autenticacion, integracion con Supabase, gestion de posts, solicitudes, notificaciones, usuarios, administracion y mensajeria en tiempo real con Socket.IO.

## Tecnologias

- NestJS 11
- TypeScript
- Supabase JS
- Socket.IO
- JWT
- Google Auth
- Gemini API
- Express
- Multer
- TypeORM incluido en dependencias

## Estructura principal

```txt
lynkn-server/
  src/
    admin/            Panel y metricas de administracion
    auth/             Registro, login, Google login y JWT
    friends/          Seguidores/seguidos
    notifications/    Notificaciones
    posts/            Posts, participaciones y solicitudes
    socket/           WebSocket gateway
    users/            Usuarios, perfil y verificacion
    main.ts           Bootstrap NestJS y CORS
    supabase.service.ts
  Dockerfile
  package.json
  vercel.json
```

## Variables de entorno

Crea `lynkn-server/.env`:

```env
PORT=4000
JWT_SECRET=una_clave_segura
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_service_role_o_key_servidor
GOOGLE_CLIENT_ID=tu_google_client_id
GEMINI_API_KEY=tu_gemini_api_key
```

Notas importantes:

- `SUPABASE_KEY` debe ser una clave apta para servidor. No la expongas en el cliente.
- En produccion define estas variables en Render/Railway/Fly/VPS, no dentro del repositorio.
- `PORT` en Render suele venir definido por la plataforma. Si no existe, el servidor usa `10000`.

## Instalacion

```powershell
cd lynkn-server
npm install
```

## Desarrollo

```powershell
npm run start:dev
```

## Build

```powershell
npm run build
```

## Produccion local

```powershell
npm run build
npm run start:prod
```

## CORS y movil

El servidor permite origenes de desarrollo, web desplegada y Capacitor:

- `https://lynkn-app.vercel.app`
- `http://localhost:5173`
- `capacitor://localhost`
- `https://localhost`
- `http://localhost`

Esto es necesario para que Android pueda iniciar sesion y usar sockets desde la WebView de Capacitor.

## Modulos principales

### Auth

Gestiona:

- Registro manual.
- Login manual.
- Google login.
- Login con sesion Supabase.
- Generacion y validacion JWT.

### Posts

Gestiona:

- Crear posts.
- Listar posts.
- Favoritos.
- Solicitudes de union.
- Estados `pending`, `accepted`, `rejected`.
- Activacion de chat cuando el organizador acepta.
- Eliminacion o abandono de participaciones.

### Socket

Gestiona:

- Salas por post.
- Envio y recepcion de mensajes.
- Recepcion de selfies por QR.
- Validacion de acceso al chat para organizador o participante aceptado.

### Notifications

Gestiona:

- Notificaciones de solicitud.
- Aceptacion.
- Rechazo.
- Avisos informativos.
- Conteo de no leidas.

### Admin

Gestiona:

- Dashboard.
- Actividad reciente.
- Usuarios.
- Posts.
- Reportes/verificaciones segun implementacion.

## Despliegue

### Render/Railway/Fly/VPS

Comando de build:

```bash
npm install && npm run build
```

Comando de start:

```bash
npm run start:prod
```

Variables necesarias:

```env
JWT_SECRET=...
SUPABASE_URL=...
SUPABASE_KEY=...
GOOGLE_CLIENT_ID=...
GEMINI_API_KEY=...
```

### Docker

Existe `Dockerfile`:

```powershell
docker build -t lynkn-server .
docker run -p 4000:10000 --env-file .env lynkn-server
```

El contenedor expone `3000`, pero la app escucha en `PORT` o `10000`. Ajusta el mapeo segun tu variable `PORT`.

## Endpoints orientativos

La API se organiza bajo controladores de NestJS:

- `/auth`
- `/posts`
- `/users`
- `/notifications`
- `/admin`
- `/friends`

Consulta los controladores en `src/*/*.controller.ts` para ver rutas exactas.

## Verificacion

```powershell
npm run build
```

Si el build pasa, el backend transpila correctamente.

## Problemas comunes

### Android no conecta

- Asegurate de que el cliente movil apunta a un backend HTTPS publico.
- Revisa CORS en `src/main.ts` y `src/socket/socket.gateway.ts`.
- Revisa que el backend desplegado tenga la version actual.

### Google login falla

- Revisa `GOOGLE_CLIENT_ID`.
- Revisa que el token recibido en cliente pertenezca al mismo proyecto OAuth.

### Supabase falla

- Revisa `SUPABASE_URL`.
- Revisa `SUPABASE_KEY`.
- Verifica tablas, storage y permisos/RLS.
