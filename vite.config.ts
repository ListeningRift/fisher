import path from 'node:path'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        settings: path.resolve(__dirname, 'settings.html')
      },
      output: {
        manualChunks: {
          // 将 Vue 核心库单独打包
          'vue-vendor': ['vue'],
          // 将 ant-design-vue 单独打包
          'antd-vendor': ['ant-design-vue']
          // monaco-editor 会通过动态导入自动分包，无需手动配置
        }
      }
    }
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag === 'webview'
        }
      }
    }),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main.ts'
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: path.join(__dirname, 'electron/preload.ts')
      },
      // Ployfill the Electron and Node.js API for Renderer process.
      // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer:
        process.env.NODE_ENV === 'test'
          ? // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
            undefined
          : {}
    })
  ]
})
