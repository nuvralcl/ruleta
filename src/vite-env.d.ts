/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del servicio de estadísticas de uso (opcional). Sin esto, no se manda nada. */
  readonly VITE_URL_ESTADISTICAS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
