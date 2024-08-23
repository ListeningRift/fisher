<script setup lang="ts">
import { ref } from 'vue';
import browser from './components/browser.vue'
import settings from './components/settings.vue'

const currentPage = ref('browser')

const pageMap: Record<string, any> = {
  browser,
  settings
}

window.ipcRenderer.on('change-page', (_, page) => {
  currentPage.value = page
})
</script>

<template>
  <div class="move-bar" v-dragWindow>
    <div class="move-bar-line"></div>
  </div>
  <component :is="pageMap[currentPage]"></component>
</template>

<style scoped>

.move-bar {
  display: flex;
  align-items: center;
  justify-content: center;
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
      background: #3A82FE;
    }
  }
}
</style>
