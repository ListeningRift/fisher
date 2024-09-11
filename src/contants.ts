import { defineAsyncComponent } from 'vue'

export const pageMap = {
  browser: defineAsyncComponent(() => import('./pages/browser.vue')),
  book: defineAsyncComponent(() => import('./pages/book.vue')),
  bookShelf: defineAsyncComponent(() => import('./pages/bookShelf.vue'))
} as const

export type Pages = keyof typeof pageMap | 'settings'
