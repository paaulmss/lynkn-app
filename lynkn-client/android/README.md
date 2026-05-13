# LYNKN Android

Proyecto Android generado por Capacitor para empaquetar `lynkn-client` como aplicacion movil.

## Relacion con el cliente web

Android no contiene una app independiente escrita desde cero. Capacitor copia el build web de `lynkn-client/dist` dentro de:

```txt
android/app/src/main/assets/public
```

Por eso, cada cambio en React/CSS/TypeScript necesita:

```powershell
cd .. 
npm run cap:sync
```

desde `lynkn-client`.

## Requisitos

Para compilar sin Android Studio necesitas:

- Java JDK compatible con Gradle/Android.
- Android SDK.
- Android Platform Tools (`adb`).
- Variable `ANDROID_HOME` o `ANDROID_SDK_ROOT` configurada.
- Un movil con depuracion USB o un emulador.

Con Android Studio es mas comodo, pero no obligatorio.

## Configuracion Capacitor

El archivo principal esta en:

```txt
lynkn-client/capacitor.config.ts
```

Configuracion actual:

```ts
appId: 'com.lynkn.app'
appName: 'LYNKN'
webDir: 'dist'
androidScheme: 'https'
```

## Preparar build Android

Desde `lynkn-client`:

```powershell
npm run cap:sync
```

Ese comando hace:

1. `npm run build`
2. Copia `dist/` al proyecto Android.
3. Sincroniza configuracion y plugins de Capacitor.

## Compilar APK debug

Desde `lynkn-client/android`:

```powershell
.\gradlew assembleDebug
```

APK generado normalmente en:

```txt
android/app/build/outputs/apk/debug/app-debug.apk
```

## Instalar en un movil

Conecta el movil por USB, activa depuracion USB y comprueba:

```powershell
adb devices
```

Instala:

```powershell
.\gradlew installDebug
```

O instala el APK manualmente desde:

```txt
app/build/outputs/apk/debug/app-debug.apk
```

## Ejecutar con Capacitor

Desde `lynkn-client`:

```powershell
npm run cap:run:android
```

## Abrir en Android Studio

Desde `lynkn-client`:

```powershell
npm run cap:android
```

## Backend en Android

En Android no sirve apuntar a `localhost` si el backend esta en tu PC. `localhost` dentro del movil significa el propio movil.

Para una demo estable usa:

```env
VITE_MOBILE_API_URL=https://tu-backend-publico.com
```

Luego:

```powershell
cd lynkn-client
npm run cap:sync
cd android
.\gradlew installDebug
```

Si usas emulador Android contra backend local:

```env
VITE_MOBILE_API_URL=http://10.0.2.2:4000
```

Si usas movil fisico contra backend local:

```env
VITE_MOBILE_API_URL=http://IP_DE_TU_PC:4000
```

Pero para presentar en otro sitio se recomienda backend publico HTTPS.

## Logs

Ver logs generales:

```powershell
adb logcat
```

Filtrar errores:

```powershell
adb logcat *:E
```

## Problemas comunes

### La app abre pero no hace login

- Revisa `VITE_MOBILE_API_URL`.
- Revisa que el backend desplegado este online.
- Revisa CORS del backend para `capacitor://localhost` y `https://localhost`.
- Ejecuta `npm run cap:sync` despues de cambiar `.env`.

### Veo cambios en web pero no en Android

Falta sincronizar:

```powershell
cd lynkn-client
npm run cap:sync
```

Despues reinstala la app.

### `adb` no se reconoce

Instala Android Platform Tools y agrega su carpeta al `PATH`.

### `gradlew` falla por SDK

Revisa:

- `ANDROID_HOME`
- `ANDROID_SDK_ROOT`
- `android/local.properties`
- Version de JDK

## Checklist antes de presentar

1. Backend desplegado y funcionando.
2. `VITE_MOBILE_API_URL` apunta al backend publico.
3. `npm run cap:sync` ejecutado.
4. App reinstalada en el movil.
5. Prueba login con datos moviles.
6. Prueba Explorer, solicitud de unirse, aceptacion y chat.
