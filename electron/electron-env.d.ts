/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer & {
    getStoreValue: (key: string, defaultValue?: any) => any
    setStoreValue: (key: string, value: any) => void
    getUserData: (key: string, defaultValue?: any) => any
    setUserData: (key: string, value: any) => void
    getBookList: () => Book[]
    getBookContent: (book: string) => string
    checkBook: (book: string) => boolean

    log: (...args: Parameters<typeof console.log>) => void
  }
}
