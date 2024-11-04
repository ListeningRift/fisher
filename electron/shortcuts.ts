import { globalShortcut } from 'electron'
import type { BrowserWindow } from 'electron'
import type Store from 'electron-store'

export function registerGlobalShortCuts(win: BrowserWindow | null, iconWin: BrowserWindow | null, store: Store) {
  globalShortcut.unregisterAll()
  globalShortcut.register(store.get('shortcuts.bossKey', 'Alt+CommandOrControl+Z') as string, () => {
    const mode = store.get('common.mode', 'resident') as Mode

    if (mode === 'resident') {
      if (win?.isVisible()) {
        win?.hide()
        win?.webContents.send('visible-change', false)
      } else {
        win?.show()
        win?.webContents.send('visible-change', true)
      }
    } else if (mode === 'trigger') {
      if (win?.isVisible() || iconWin?.isVisible()) {
        win?.hide()
        iconWin?.hide()
        win?.webContents.send('visible-change', false)
      } else {
        win?.hide()
        iconWin?.show()
        win?.webContents.send('visible-change', false)
      }
    }
  })
}
