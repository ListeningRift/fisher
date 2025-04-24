import { parse } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'
import { app, dialog, ipcMain } from 'electron'
import { detect } from 'jschardet'
import { decode } from 'iconv-lite'
import * as log4js from 'log4js'
import { registerGlobalShortCuts } from './shortcuts'
import type { BrowserWindow } from 'electron'
import type Store from 'electron-store'

// 调试用 log
export function logEvent() {
  log4js.configure({
    appenders: { trace: { type: 'file', filename: 'trace.log', maxLogSize: 500000 } },
    categories: { default: { appenders: ['trace'], level: 'trace' } }
  })
  const logger = log4js.getLogger()
  logger.level = 'error'
  ipcMain.on('log', (_, ...args) => {
    // eslint-disable-next-line no-console
    console.log(...args)
  })
  ipcMain.on('error', (_, ...args) => {
    // eslint-disable-next-line no-console
    console.error(...args)
    logger.error(args[0].error)
  })
  ipcMain.on('warn', (_, ...args) => {
    // eslint-disable-next-line no-console
    console.warn(...args)
  })
}

export function handleMode(win: BrowserWindow, iconWin: BrowserWindow, userData: Store, store: Store) {
  const logger = log4js.getLogger()
  const mode = store.get('common.mode', 'resident') as Mode
  logger.info(`处理窗口模式: ${mode}`)

  if (mode === 'resident') {
    logger.info('常驻模式: 隐藏图标窗口，显示主窗口')
    iconWin.hide()
    if (!win.isVisible()) {
      win.show()
      win.webContents.send('visible-change', true)
      logger.info('主窗口已显示')
    }
  } else if (mode === 'trigger') {
    logger.info('触发模式: 设置图标窗口位置')
    const position = userData.get('winPosition', undefined) as number[] | undefined
    const size = userData.get('winSize', undefined) as number[] | undefined
    if (position && size) {
      const newPosition = handleTriggerPosition(store.get('triggerMode.triggerPosition', 'left-top') as TriggerPosition, position, size)
      if (newPosition[0] === undefined || newPosition[1] === undefined) {
        logger.error('无法计算图标窗口位置')
        return
      }
      logger.info(`设置图标窗口位置: [${newPosition[0]}, ${newPosition[1]}]`)
      iconWin.setPosition(newPosition[0], newPosition[1])
    }
    win.hide()
    logger.info('主窗口已隐藏')
    if (!iconWin.isVisible()) {
      iconWin.show()
      logger.info('图标窗口已显示')
    }
    win.webContents.send('visible-change', false)
  }
}

// 更新配置项
export function updateSettingsEvent(win: BrowserWindow, iconWin: BrowserWindow, settingsWin: BrowserWindow, userData: Store, store: Store) {
  ipcMain.on('update-settings', () => {
    registerGlobalShortCuts(win, iconWin, store)
    win.setAlwaysOnTop(store.get('common.alwaysOnTop', true) as boolean)
    app.setLoginItemSettings({
      openAtLogin: store.get('common.openAtLogin', false) as boolean
    })
    const mode = store.get('common.mode', 'resident') as Mode
    handleMode(win, iconWin, userData, store)
    win.webContents.send('change-mode', mode)

    win.webContents.send('update-settings')
  })
  ipcMain.on('close-settings', () => {
    settingsWin.hide()
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

// 用户数据存储
export function userDataEvent(store: Store) {
  ipcMain.on('getUserData', (event, key, defaultValue) => {
    event.returnValue = store.get(key, defaultValue)
  })
  ipcMain.on('setUserData', (_, key, value) => {
    store.set(key, value)
  })
}

// 页面维护
export function changePageEvent(win: BrowserWindow, userData: Store) {
  ipcMain.on('change-page', (_, page) => {
    win?.webContents.send('change-page', page)
    if (page !== 'settings') userData.set('lastPage', page)
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
  if (!coordinates || !size) return [undefined, undefined]
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

// 触发模式触发事件
export function onTriggerModeTrigger(win: BrowserWindow, iconWin: BrowserWindow, store: Store, userData: Store) {
  ipcMain.on('trigger-mode-leave', () => {
    if (store.get('common.mode', 'resident') === 'resident') {
      return
    }
    const position = userData.get('winPosition', undefined) as number[] | undefined
    const size = userData.get('winSize', undefined) as number[] | undefined
    if (position && size) {
      const newPosition = handleTriggerPosition(store.get('triggerMode.triggerPosition', 'left-top') as TriggerPosition, position, size)
      if (newPosition[0] === undefined || newPosition[1] === undefined) return
      iconWin.setPosition(newPosition[0], newPosition[1])
    }
    iconWin.show()
    win.hide()

    win.webContents.send('visible-change', false)
  })
  ipcMain.on('trigger-mode-enter', () => {
    iconWin.hide()
    win.show()

    win.webContents.send('visible-change', true)
  })
}

// 书籍维护
export function bookEvent(win: BrowserWindow, userData: Store) {
  ipcMain.on('getBookList', event => {
    event.returnValue = userData.get('bookList', [])
  })
  ipcMain.on('setBookList', (_, value) => {
    userData.set('bookList', value)
    win?.webContents.send('refreshBookList')
  })
  ipcMain.on('getBookContent', (event, book) => {
    if (!existsSync(book)) return ''
    const file = readFileSync(book)
    const encoding = detect(file).encoding
    event.returnValue = decode(file, encoding || 'utf-8')
  })
  ipcMain.on('addBook', () => {
    dialog
      .showOpenDialog(null as unknown as BrowserWindow, {
        filters: [
          {
            name: 'book',
            extensions: ['txt']
          }
        ]
      })
      .then(res => {
        if (res.canceled) return
        const originalBookList = userData.get('bookList', []) as Book[]
        const bookList: Book[] = res.filePaths
          .filter(item => {
            return !originalBookList.some(book => book.path === item)
          })
          .map(item => {
            return {
              name: parse(item).name,
              path: item,
              lastPage: {
                paragraphIndex: 0,
                characterIndex: 0
              },
              chapterTitleRegExp: '(?<=\\n)第[一二三四五六七八九十百千万1234567890]+章\\s*.+'
            }
          })
        userData.set('bookList', originalBookList.concat(bookList))
        win?.webContents.send('refreshBookList')
      })
  })
  ipcMain.on('checkBook', (event, book) => {
    event.returnValue = existsSync(book)
  })
}
