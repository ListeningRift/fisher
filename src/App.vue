<script setup lang="ts">
import { ref } from 'vue'
import { pageMap } from './contants'
import settings from './pages/settings.vue'
import type { Pages } from './contants'

const currentPage = ref<Pages>(window.ipcRenderer.getUserData('lastPage', 'browser'))
const showMoveBar = ref(window.ipcRenderer.getStoreValue('common.showMoveBar', true))

window.ipcRenderer.on('change-page', (_, page) => {
  currentPage.value = page
})
window.ipcRenderer.on('update-settings', () => {
  showMoveBar.value = window.ipcRenderer.getStoreValue('common.showMoveBar', true)
})

const onMouseLeaveWindow = () => {
  if (currentPage.value === 'settings') {
    return
  }
  window.ipcRenderer.send('trigger-mode-leave')
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
      v-if="showMoveBar"
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
