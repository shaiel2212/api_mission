/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WHATSAPP_E164: string;
  readonly VITE_INSTAGRAM_URL?: string;
  /** Google Analytics 4 (G-…); נטען אחרי הסכמה. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_PROXY_TARGET?: string;
  /** כתובת האתר בפרודקשן ללא סלאש בסוף — canonical, OG, sitemap */
  readonly VITE_SITE_URL?: string;
  /** תמונת OG מלאה (אופציונלי); ברירת מחדל /og-default.svg */
  readonly VITE_OG_IMAGE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
