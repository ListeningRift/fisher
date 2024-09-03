<script setup lang="ts">
import { ref } from 'vue'
import { pageMap } from './contants'
import type { Pages } from './contants'

const currentPage = ref<Pages>('browser')

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
</script>

<template>
  <div
    class="main-window"
    @mouseleave="onMouseLeaveWindow"
  >
    <div
      v-dragWindow
      class="move-bar"
    >
      <div class="move-bar-line"></div>
    </div>
    <component
      :is="pageMap[page as keyof typeof pageMap]"
      v-for="page in Object.keys(pageMap)"
      v-show="page === currentPage"
      :key="page"
    ></component>
  </div>
</template>

<style scoped>
.main-window {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #333333;
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
