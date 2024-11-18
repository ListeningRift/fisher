<script setup lang="ts">
import { onBeforeMount, onMounted, ref } from 'vue'
import { Input as AInput } from 'ant-design-vue'
import chevronLeftIcon from 'vue-material-design-icons/ChevronLeft.vue'
import chevronRightIcon from 'vue-material-design-icons/ChevronRight.vue'
import arrowRightIcon from 'vue-material-design-icons/ArrowRight.vue'
import reloadIcon from 'vue-material-design-icons/Reload.vue'

let webviewRef: any = null

const urlShow = ref(false)
const handleMouseEnter = () => {
  urlShow.value = true
}

const scripts = ref<UserScript[]>(JSON.parse(window.ipcRenderer.getStoreValue('scripts.scriptList')))

const url = ref('https://www.bilibili.com/')

const handleUrlChange = () => {
  webviewRef.loadURL(url.value)
}

const onVisibleChange = (_: any, visible: boolean) => {
  if (visible) {
    webviewRef.focus()
  }
}
onMounted(() => {
  webviewRef = document.querySelector('.webview')
  webviewRef.addEventListener('did-start-navigation', (event: any) => {
    if (event.url.startsWith('http') && event.isMainFrame) {
      url.value = event.url
      scripts.value.forEach(item => {
        if (new RegExp(item.scope).test(url.value)) webviewRef.executeJavaScript(item.scriptContent)
      })
    }
  })

  window.ipcRenderer.on('visible-change', onVisibleChange)
})
onBeforeMount(() => {
  window.ipcRenderer.off('visible-change', onVisibleChange)
})

const goBack = () => {
  if (webviewRef.canGoBack()) {
    webviewRef.goBack()
  }
}
const goForward = () => {
  if (webviewRef.canGoForward()) {
    webviewRef.goForward()
  }
}
const reload = () => {
  webviewRef.reload()
}
</script>

<template>
  <div class="browser-page">
    <div
      class="url-bar-trigger"
      @mouseenter="handleMouseEnter"
    ></div>
    <div
      :style="{ display: urlShow ? 'flex' : 'none' }"
      class="url-bar"
      @mouseleave="urlShow = false"
    >
      <div
        class="url-bar-button left-button"
        @click="goBack"
      >
        <chevron-left-icon fill-color="#666666"></chevron-left-icon>
      </div>
      <div
        class="url-bar-button left-button"
        @click="goForward"
      >
        <chevron-right-icon fill-color="#666666"></chevron-right-icon>
      </div>
      <a-input v-model:value="url"></a-input>
      <div
        class="url-bar-button right-button"
        @click="handleUrlChange"
      >
        <arrow-right-icon fill-color="#666666"></arrow-right-icon>
      </div>
      <div
        class="url-bar-button right-button"
        @click="reload"
      >
        <reload-icon fill-color="#666666"></reload-icon>
      </div>
    </div>
    <div class="webview-wrapper">
      <webview
        class="webview"
        src="https://www.bilibili.com/"
        allowpopups
        frameborder="0"
      ></webview>
    </div>
  </div>
</template>

<style scoped>
.browser-page {
  width: 100%;
  height: 100%;
  position: relative;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}

.url-bar-trigger {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 16px;
  background: transparent;
  z-index: 9999;
}

.url-bar {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  width: calc(100% - 10px);
  padding: 8px;
  margin-left: 5px;
  background: #fff;
  z-index: 10000;

  .url-bar-button {
    cursor: pointer;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 4px;

    &:hover {
      background: #e5e5e5;
    }

    &.left-button {
      margin-right: 8px;
    }
    &.right-button {
      margin-left: 8px;
    }
  }

  .ant-input {
    width: 100%;
    height: 32px;
  }
}

.webview-wrapper {
  width: 100%;
  height: 100%;
  padding: 0 5px 4px;
}

.webview {
  width: 100%;
  height: 100%;
  z-index: 1;
  background-color: #fff;
}
</style>
