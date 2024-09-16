<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Input as AInput } from 'ant-design-vue'

let webviewRef: any = null

const urlShow = ref(false)
const handleMouseEnter = () => {
  urlShow.value = true
}

const url = ref('https://www.bilibili.com/')

const handleUrlChange = () => {
  webviewRef.loadURL(url.value)
}
onMounted(() => {
  webviewRef = document.querySelector('.webview')
})

const goBack = () => {
  webviewRef.goBack()
  url.value = webviewRef.getURL()
}
const goForward = () => {
  webviewRef.goForward()
  url.value = webviewRef.getURL()
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
        <i class="arrow go-back"></i>
      </div>
      <div
        class="url-bar-button left-button"
        @click="goForward"
      >
        <i class="arrow go-forward"></i>
      </div>
      <a-input v-model:value="url"></a-input>
      <div
        class="url-bar-button right-button"
        @click="handleUrlChange"
      >
        <i class="go-to"></i>
      </div>
      <div
        class="url-bar-button right-button"
        @click="reload"
      >
        <i class="reload"></i>
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
  width: calc(100% - 16px);
  padding: 8px;
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

  .arrow {
    display: block;
    width: 24px;
    height: 24px;
    background: url(../assets/arrow.svg) no-repeat center center / 100%;
  }

  .go-back {
    transform: rotate(90deg);
  }
  .go-forward {
    transform: rotate(-90deg);
  }

  .go-to {
    display: block;
    width: 24px;
    height: 24px;
    background: url(../assets/go.svg) no-repeat center center / 18px;
  }
  .reload {
    display: block;
    width: 24px;
    height: 24px;
    background: url(../assets/reload.svg) no-repeat center center / 18px;
  }

  .ant-input {
    width: 100%;
    height: 32px;
  }
}

.webview-wrapper {
  width: calc(100% - 10px);
  height: calc(100% - 4px);
  padding: 0 5px 4px;
}

.webview {
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>
