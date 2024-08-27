import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { app, BrowserWindow, Menu } from 'electron'
import Store from 'electron-store'
import dragWindow from './dragWindow'
import createTray from './tray'
import { registerGlobalShortCuts } from './shortcuts'
import { storeEvent, changePageEvent, updateSettingsEvent, openUrlInCurrentWindow } from './events'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

const store = new Store()

let win: BrowserWindow | null

function createWindow() {
  Menu.setApplicationMenu(null)
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
    frame: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webviewTag: true
    },
    alwaysOnTop: store.get('common.alwaysOnTop', true) as boolean
  })

  dragWindow(win)
  storeEvent(store)
  changePageEvent(win)
  updateSettingsEvent(win, store)
  openUrlInCurrentWindow()

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
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

app.whenReady().then(() => {
  createWindow()
  registerGlobalShortCuts(win, store)
  createTray(win)
})
