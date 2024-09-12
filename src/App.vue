<script setup lang="ts">
import { ref } from 'vue'
import { pageMap } from './contants'
import settings from './pages/settings.vue'
import type { Pages } from './contants'

const currentPage = ref<Pages>(window.ipcRenderer.getUserData('lastPage', 'browser'))

const showMainWindow = ref(false)

window.ipcRenderer.on('change-page', (_, page) => {
  currentPage.value = page
})

const onMouseLeaveWindow = () => {
  if (currentPage.value === 'settings') {
    return
  }
  window.ipcRenderer.send('trigger-mode-leave')
  showMainWindow.value = false
}

window.addEventListener(
  'error',
  function (event) {
    // console.log('error', `${event.error.stack}`)
    window.ipcRenderer.log('error', {
      msg: event.message,
      url: event.filename,
      error: {
        message: event.error.message,
        stack: event.error.stack
      },
      // source: 'window.addEventListener error',
      time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }).toString()
    })
  },
  true
)
</script>

<template>
  <div
    class="main-window"
    :style="{ background: currentPage === 'browser' ? '#333333' : 'transparent' }"
    @mouseleave="onMouseLeaveWindow"
  >
    <div
      v-dragWindow
      class="move-bar"
    >
      <div class="move-bar-line"></div>
    </div>
    <component
      :is="pageMap[currentPage as keyof typeof pageMap]"
      v-show="currentPage !== 'settings'"
    ></component>
    <settings v-show="currentPage === 'settings'"></settings>
  </div>
</template>

<style scoped>
.main-window {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.move-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 100%;
  height: 16px;
  background: #333333;
  cursor: move;
  /* -webkit-app-region: drag; */

  .move-bar-line {
    width: 60%;
    height: 4px;
    background: #999999;
    border-radius: 4px;
  }

  &:hover {
    .move-bar-line {
      background: #3a82fe;
    }
  }
}
</style>
