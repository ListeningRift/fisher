import path from 'node:path'
import { app, Menu, nativeImage, Tray } from 'electron'
import type { BrowserWindow, MenuItemConstructorOptions } from 'electron'

let tray: Tray

function setAlwaysOnTop(win: BrowserWindow) {
  const newStatus = !win.isAlwaysOnTop()
  win.setAlwaysOnTop(newStatus)
}

function openSettings(win: BrowserWindow) {
  win.webContents.send('change-page', 'settings')
  win.show()
}

export default function createTray(win: BrowserWindow | null) {
  tray = new Tray(nativeImage.createFromPath(path.join(process.env.VITE_PUBLIC, 'logo.png')))
  tray.setToolTip('Fisher')

  const menuList: MenuItemConstructorOptions[] = [
    { label: '设置', click: () => openSettings(win!) },
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
