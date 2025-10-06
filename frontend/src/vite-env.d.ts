
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_MAPBOX_TOKEN: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_DEFAULT_LAT: string
  readonly VITE_DEFAULT_LNG: string
  readonly VITE_DEFAULT_ZOOM: string
  readonly VITE_ANDROID_APK_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
