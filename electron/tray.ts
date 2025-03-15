import path from 'node:path'
import { app, Menu, nativeImage, Tray } from 'electron'
import type { BrowserWindow, MenuItemConstructorOptions } from 'electron'
import type Store from 'electron-store'

let tray: Tray

function openPage(win: BrowserWindow, page: string, userData: Store) {
  win.webContents.send('change-page', page)
  if (page !== 'settings') userData.set('lastPage', page)
  win.show()
}

function openSettings(settingsWin: BrowserWindow) {
  settingsWin.show()
}

function reload(win: BrowserWindow, settingsWin: BrowserWindow) {
  win.webContents.reload()
  settingsWin.webContents.reload()
}

function resetWindowPosition(win: BrowserWindow, settingsWin: BrowserWindow) {
  // 打断可能正在进行的拖动操作
  // 通过先隐藏窗口再显示窗口来打断拖动
  const isMainVisible = win.isVisible()
  const isSettingsVisible = settingsWin.isVisible()

  if (isMainVisible) {
    win.hide()
    setTimeout(() => {
      // 重置主窗口位置到屏幕中央
      win.center()
      win.show()
    }, 10)
  } else {
    // 即使窗口不可见也重置位置
    win.center()
  }

  if (isSettingsVisible) {
    settingsWin.hide()
    setTimeout(() => {
      // 重置设置窗口位置到屏幕中央
      settingsWin.center()
      settingsWin.show()
    }, 10)
  } else {
    // 即使窗口不可见也重置位置
    settingsWin.center()
  }
}

export default function createTray(win: BrowserWindow | null, settingsWin: BrowserWindow | null, userData: Store) {
  tray = new Tray(nativeImage.createFromPath(path.join(process.env.VITE_PUBLIC, 'logo.png')))
  tray.setToolTip('Fisher')

  const menuList: MenuItemConstructorOptions[] = [
    { label: '浏览网页', click: () => openPage(win!, 'browser', userData) },
    { label: '小说书架', click: () => openPage(win!, 'bookShelf', userData) },
    { type: 'separator' },
    { label: '设置', click: () => openSettings(settingsWin!) },
    { label: '刷新', click: () => reload(win!, settingsWin!) },
    { label: '重置窗口位置', click: () => resetWindowPosition(win!, settingsWin!) },
    { type: 'separator' },
    { label: '显示', click: () => win?.show() },
    { label: '退出', role: 'quit', click: () => app.quit() }
  ]

  const contextMenu = Menu.buildFromTemplate(menuList)
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    win?.show()
  })
  tray.on('right-click', () => {
    tray?.popUpContextMenu(contextMenu)
  })
}
