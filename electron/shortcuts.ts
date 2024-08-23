import { globalShortcut } from 'electron'
import type { BrowserWindow } from 'electron'
import type Store from 'electron-store'

export function registerGlobalShortCuts(win: BrowserWindow | null, store: Store) {
  globalShortcut.unregisterAll()
  globalShortcut.register(store.get('shortcuts.bossKey', 'Alt+CommandOrControl+Z') as string, () => {
    if (win?.isVisible()) {
      win?.hide()
    } else {
      win?.show()
    }
  })
}
