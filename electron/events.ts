import { app, ipcMain } from 'electron'
import { registerGlobalShortCuts } from './shortcuts'
import type { BrowserWindow } from 'electron'
import type Store from 'electron-store'

// 更新配置项
export function updateSettingsEvent(win: BrowserWindow, store: Store) {
  ipcMain.on('update-settings', () => {
    registerGlobalShortCuts(win, store)
    win.setAlwaysOnTop(store.get('common.alwaysOnTop', true) as boolean)
    app.setLoginItemSettings({
      openAtLogin: store.get('common.openAtLogin', false) as boolean,
      openAsHidden: true,
      args: ['--openAsHidden']
    })
  })
}

// 本地配置存储
export function storeEvent(store: Store) {
  ipcMain.on('getStoreValue', (event, key, defaultValue) => {
    event.returnValue = store.get(key, defaultValue)
  })
  ipcMain.on('setStoreValue', (_, key, value) => {
    store.set(key, value)
  })
}

// 页面维护
export function changePageEvent(win: BrowserWindow) {
  ipcMain.on('change-page', (_, page) => {
    win?.webContents.send('change-page', page)
  })
}

// 新页面打开
export function openUrlInCurrentWindow() {
  app.on('web-contents-created', (_, webContents) => {
    if (webContents.getType() === 'webview') {
      webContents.setWindowOpenHandler(({ url }) => {
        webContents.loadURL(url)
        return { action: 'deny' }
      })
    }
  })
}
