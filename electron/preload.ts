import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  getStoreValue(key: string, defaultValue?: any) {
    const resp = ipcRenderer.sendSync('getStoreValue', key, defaultValue)
    return resp
  },
  setStoreValue: (key: string, value: any) => {
    ipcRenderer.send('setStoreValue', key, value)
  },

  getUserData(key: string, defaultValue?: any) {
    const resp = ipcRenderer.sendSync('getUserData', key, defaultValue)
    return resp
  },
  setUserData: (key: string, value: any) => {
    ipcRenderer.send('setUserData', key, value)
  },

  getBookList() {
    const resp = ipcRenderer.sendSync('getBookList')
    return resp
  },
  getBookContent(book: string) {
    const resp = ipcRenderer.sendSync('getBookContent', book)
    return resp
  },

  log(...args: Parameters<typeof console.log>) {
    ipcRenderer.send('log', ...args)
  }
})
