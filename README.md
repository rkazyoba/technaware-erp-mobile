# ERP Mobile (Expo)

React Native mobile client for the ERP backend in `../danen-erp`.

## Folder layout

- `danen-erp` (Laravel backend)
- `erp-mobile` (Expo React Native app)

Both must stay at the same directory level under `D:/development`.

## API integration

This app is wired to:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`

Base URL is configured in `app.json`:

`expo.extra.apiBaseUrl`

Current value:

`http://127.0.0.1:8000/api/v1`

## Running locally

1. Start Laravel API from `danen-erp`.
2. Start Expo app from `erp-mobile`.
3. Login in the app with ERP credentials.

## Device networking notes

- Android Emulator: use `http://10.0.2.2:8000/api/v1`
- iOS Simulator: use `http://127.0.0.1:8000/api/v1`
- Physical phone: use your PC LAN IP, e.g. `http://192.168.x.x:8000/api/v1`

Update `expo.extra.apiBaseUrl` to match the device target.
