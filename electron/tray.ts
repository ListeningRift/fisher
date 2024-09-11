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

export default function createTray(win: BrowserWindow | null, userData: Store) {
  tray = new Tray(nativeImage.createFromPath(path.join(process.env.VITE_PUBLIC, 'logo.png')))
  tray.setToolTip('Fisher')

  const menuList: MenuItemConstructorOptions[] = [
    { label: '浏览网页', click: () => openPage(win!, 'browser', userData) },
    { label: '小说书架', click: () => openPage(win!, 'bookShelf', userData) },
    { type: 'separator' },
    { label: '设置', click: () => openPage(win!, 'settings', userData) },
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
