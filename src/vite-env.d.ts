/// <reference types="vite/client" />

interface Window {
  ipcRenderer: Electron.IpcRenderer & {
    getStoreValue: (key: string, defaultValue?: any) => any
    setStoreValue: (key: string, value: any) => void
  }
}
