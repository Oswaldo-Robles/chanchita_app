# Chanchita 🐷

App móvil para dividir los gastos de una salida entre amigos y **cobrar por WhatsApp con un toque**.

Cuando un grupo sale, varios pagan cosas distintas y no todos participan en todo. Chanchita registra quién pagó qué y entre quiénes se divide, calcula los pagos mínimos para cuadrar las cuentas y abre el chat de cada deudor con el mensaje listo:

> Hola Juan, de la salida 'Pizza viernes' te toca yapearle S/12.50 a María al 987654321 🐷

Solo el organizador necesita la app; los amigos reciben todo por WhatsApp. Pensada para Perú: montos en soles (S/) y pagos por Yape o Plin.

<!-- Capturas: agregar las imágenes en docs/capturas/ y enlazarlas aquí. -->

## Qué hace

- **Perfil rápido:** nombre y número de Yape la primera vez; sin login ni cuenta.
- **Salidas e historial:** crea salidas con participantes de tus contactos o a mano, y consulta las anteriores.
- **Gastos con subgrupo:** cada gasto se divide solo entre quienes participaron (por ejemplo 3 de 5). Se pueden editar y eliminar.
- **Cuadrar cuentas:** balance de cada persona y la lista reducida de pagos (como máximo N−1).
- **Cobrar por WhatsApp:** un botón "Cobrar" por deuda y un botón "Compartir resumen" para pegar en el grupo.

Todo se guarda en el teléfono y funciona sin conexión; WhatsApp solo se usa al cobrar.

## Instalar el APK (Android)

1. Abre la página de [Releases](https://github.com/Oswaldo-Robles/chanchita_app/releases) desde el celular y descarga el `.apk` de la versión más reciente.
2. Ábrelo. Si Android lo pide, permite instalar apps de este origen (Ajustes → Seguridad → "Instalar apps desconocidas").
3. Abre **Chanchita**, escribe tu nombre y tu número de Yape, y crea tu primera salida.

Para cobrar necesitas WhatsApp instalado. Para agregar participantes desde tus contactos, acepta el permiso de contactos (si lo niegas, puedes agregarlos a mano).

## Correr el proyecto

Requisitos: Node.js 20.19 o superior (o 22.13+) y la app [Expo Go](https://expo.dev/go) en el celular (o un emulador de Android).

```bash
npm install
npx expo start      # escanea el QR con Expo Go, o pulsa "a" para el emulador
npm test            # pruebas unitarias (Jest)
npm run typecheck   # TypeScript estricto
```

Sin wifi, con el celular por cable USB (depuración USB activada): `adb reverse tcp:8081 tcp:8081` y abre `exp://localhost:8081` en Expo Go.

### Generar el APK

```bash
npx eas-cli build -p android --profile preview
```

Requiere una cuenta de Expo (`npx eas-cli login`). La configuración está en `eas.json`.

## Estructura

```
src/
  domain/     reglas puras con tests: balances, transferencias, montos, mensajes
  services/   almacenamiento (AsyncStorage), contactos y WhatsApp, detrás de interfaces
  screens/    pantallas, sin cálculos de dinero
  app/        navegación y composición de dependencias (Context)
```

Los cálculos de dinero están en `src/domain` y se prueban sin interfaz: montos en céntimos enteros (sin errores de coma flotante), con el céntimo sobrante repartido de forma determinista. Más detalle en `docs/PRD.md` y `docs/TDD.md`.

## Tecnología

React Native · Expo · TypeScript · React Navigation · AsyncStorage · expo-contacts · Jest. Sin backend.
