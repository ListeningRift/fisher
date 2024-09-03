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
      } else {
        win?.show()
      }
    } else if (mode === 'trigger') {
      if (win?.isVisible() || iconWin?.isVisible()) {
        win?.hide()
        iconWin?.hide()
      } else {
        win?.hide()
        iconWin?.show()
      }
    }
  })
}
