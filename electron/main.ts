import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { app, BrowserWindow, Menu } from 'electron'
import Store from 'electron-store'
import * as log4js from 'log4js'
import { dragWindow, dragSettingsWindow, resizeEvent } from './window'
import createTray from './tray'
import { registerGlobalShortCuts } from './shortcuts'
import {
  storeEvent,
  changePageEvent,
  updateSettingsEvent,
  openUrlInCurrentWindow,
  onTriggerModeTrigger,
  logEvent,
  handleMode,
  handleTriggerPosition,
  userDataEvent,
  bookEvent
} from './events'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 配置日志
log4js.configure({
  appenders: { trace: { type: 'file', filename: 'trace.log', maxLogSize: 500000 } },
  categories: { default: { appenders: ['trace'], level: 'trace' } }
})
const logger = log4js.getLogger()
logger.level = 'info'

process.env.APP_ROOT = join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? join(process.env.APP_ROOT, 'public') : RENDERER_DIST

const store = new Store()
const userData = new Store({
  name: 'userData'
})

let win: BrowserWindow | null
let iconWin: BrowserWindow | null
let settingsWin: BrowserWindow | null

function createWindow() {
  Menu.setApplicationMenu(null)
  win = new BrowserWindow({
    icon: join(process.env.VITE_PUBLIC, 'logo.png'),
    frame: false,
    skipTaskbar: true,
    transparent: true,
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      webviewTag: true
    },
    alwaysOnTop: store.get('common.alwaysOnTop', true) as boolean,
    x: (userData.get('winPosition', [undefined, undefined]) as number[])[0],
    y: (userData.get('winPosition', [undefined, undefined]) as number[])[1],
    width: (userData.get('winSize', [undefined, undefined]) as number[])[0],
    height: (userData.get('winSize', [undefined, undefined]) as number[])[1],
    show: false
  })

  const position = userData.get('winPosition', undefined) as number[]
  const size = userData.get('winSize', undefined) as number[]
  const iconPosition = handleTriggerPosition(store.get('triggerMode.triggerPosition', 'left-top') as TriggerPosition, position, size)
  iconWin = new BrowserWindow({
    icon: join(process.env.VITE_PUBLIC, 'logo.png'),
    frame: false,
    skipTaskbar: true,
    transparent: true,
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      webviewTag: true
    },
    alwaysOnTop: true,
    x: iconPosition[0],
    y: iconPosition[1],
    width: 50,
    height: 50,
    resizable: false,
    show: false
  })
  iconWin.loadFile(join(process.env.VITE_PUBLIC, 'icon.html'))

  settingsWin = new BrowserWindow({
    icon: join(process.env.VITE_PUBLIC, 'logo.png'),
    frame: false,
    transparent: true,
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      webviewTag: true
    },
    width: 900,
    minWidth: 800,
    height: 600,
    show: false
  })

  resizeEvent(win, userData)
  dragWindow(win, userData)
  dragSettingsWindow(settingsWin)
  storeEvent(store)
  changePageEvent(win, userData)
  updateSettingsEvent(win, iconWin, settingsWin, userData, store)
  openUrlInCurrentWindow()
  onTriggerModeTrigger(win, iconWin, store, userData)
  userDataEvent(userData)
  bookEvent(win, userData)

  logEvent()

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
    settingsWin.loadURL(VITE_DEV_SERVER_URL + '/settings')
    settingsWin.webContents.openDevTools()
  } else {
    win.loadFile(join(RENDERER_DIST, 'index.html'))
    settingsWin.loadFile(join(RENDERER_DIST, 'settings.html'))
  }

  win.webContents.on('did-finish-load', () => {
    logger.info('主窗口内容加载完成，准备显示')
    setTimeout(() => {
      if (win && iconWin) {
        logger.info('应用模式：' + store.get('common.mode', 'resident'))
        handleMode(win, iconWin, userData, store)
      }
    }, 500)
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win && iconWin) {
      handleMode(win, iconWin, userData, store)
    }
  })
  app.whenReady().then(() => {
    createWindow()
    registerGlobalShortCuts(win, iconWin, store)
    createTray(win, settingsWin, userData)

    // 设置自启动选项
    app.setLoginItemSettings({
      openAtLogin: store.get('common.openAtLogin', false) as boolean,
      openAsHidden: false // 确保启动时不隐藏
    })
  })
}
