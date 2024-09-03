import { app, ipcMain } from 'electron'
import { registerGlobalShortCuts } from './shortcuts'
import type { BrowserWindow } from 'electron'
import type Store from 'electron-store'

// 调试用 log
export function logEvent() {
  ipcMain.on('log', (_, ...args) => {
    // eslint-disable-next-line no-console
    console.log(...args)
  })
}

export function handleMode(mode: Mode, win: BrowserWindow, iconWin: BrowserWindow) {
  if (mode === 'resident') {
    iconWin.hide()
    win.show()
  } else if (mode === 'trigger') {
    win.hide()
    iconWin.show()
  }
}

// 更新配置项
export function updateSettingsEvent(win: BrowserWindow, iconWin: BrowserWindow, store: Store) {
  ipcMain.on('update-settings', () => {
    registerGlobalShortCuts(win, iconWin, store)
    win.setAlwaysOnTop(store.get('common.alwaysOnTop', true) as boolean)
    app.setLoginItemSettings({
      openAtLogin: store.get('common.openAtLogin', false) as boolean,
      openAsHidden: true,
      args: ['--openAsHidden']
    })
    const mode = store.get('common.mode', 'resident') as Mode
    handleMode(mode, win, iconWin)
    win.webContents.send('change-mode', mode)
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

// 计算触发模式下触发图标在四个角时 分别根据窗口位置算出的图标位置
export function handleTriggerPosition(position: TriggerPosition, coordinates: number[], size: number[]) {
  if (position === 'left-top') {
    return [coordinates[0], coordinates[1]]
  } else if (position === 'left-bottom') {
    return [coordinates[0], coordinates[1] + size[1] - 24]
  } else if (position === 'right-top') {
    return [coordinates[0] + size[0] - 24, coordinates[1]]
  } else {
    return [coordinates[0] + size[0] - 24, coordinates[1] + size[1] - 24]
  }
}

export function onTriggerModeTrigger(win: BrowserWindow, iconWin: BrowserWindow, store: Store, userData: Store) {
  ipcMain.on('trigger-mode-leave', () => {
    if (store.get('common.mode', 'resident') === 'resident') {
      return
    }
    const position = userData.get('winPosition', undefined) as number[] | undefined
    const size = userData.get('winSize', undefined) as number[] | undefined
    if (position && size) {
      const newPosition = handleTriggerPosition(store.get('triggerMode.triggerPosition', 'left-top') as TriggerPosition, position, size)
      iconWin.setPosition(newPosition[0], newPosition[1])
    }
    iconWin.show()
    win.hide()
  })
  ipcMain.on('trigger-mode-enter', () => {
    iconWin.hide()
    win.show()
  })
}
