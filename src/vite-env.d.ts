/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATAPRISM_CDN_URL: string
  readonly VITE_DATAPRISM_VERSION: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_DEBUG_MODE: string
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}