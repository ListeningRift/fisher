import { BrowserWindow, ipcMain, screen } from 'electron'
import type Store from 'electron-store'

export function dragWindow(win: BrowserWindow | null, userData: Store) {
  const XY = {
    x: 0,
    y: 0
  }
  let IntervalId: ReturnType<typeof setInterval>

  // 移动窗口----start
  ipcMain.on('window-move-start', () => {
    const winPosition = win?.getPosition()
    if (!winPosition) return
    const cursorPosition = screen.getCursorScreenPoint() //开始时鼠标位置
    XY.x = cursorPosition.x - winPosition[0]
    XY.y = cursorPosition.y - winPosition[1]
    clearInterval(IntervalId)
    IntervalId = setInterval(() => {
      refreshWinPosition()
    })
  })

  // 移动窗口----end
  ipcMain.on('window-move-end', () => {
    clearInterval(IntervalId)
  })

  function refreshWinPosition() {
    const cursorPosition = screen.getCursorScreenPoint() //移动后鼠标位置
    win?.setPosition(cursorPosition.x - XY.x, cursorPosition.y - XY.y, true) //设置窗口位置
    userData.set('winPosition', [cursorPosition.x - XY.x, cursorPosition.y - XY.y])
  }
}

export function resizeEvent(win: BrowserWindow | null, userData: Store) {
  if (!win) return
  const { width, height } = win.getBounds()
  userData.set('winSize', [width, height])

  win?.on('resize', () => {
    if (!win) return
    const { width, height, x, y } = win.getBounds()
    userData.set('winSize', [width, height])
    userData.set('winPosition', [x, y])
  })
}
