import browser from './pages/browser.vue'
import settings from './pages/settings.vue'

export const pageMap = {
  browser,
  settings
} as const

export type Pages = keyof typeof pageMap
