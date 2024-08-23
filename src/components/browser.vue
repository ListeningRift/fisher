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
</script>

<template>
  <div class="browser">
    <div class="url-bar-trigger" @mouseenter="handleMouseEnter"></div>
    <div :style="{ display: urlShow ? 'flex' : 'none' }" class="url-bar" @mouseleave="urlShow = false">
      <div class="url-bar-button" @click="goBack">
        <i class="arrow go-back"></i>
      </div>
      <div class="url-bar-button" @click="goForward">
        <i class="arrow go-forward"></i>
      </div>
      <a-input v-model:value="url"></a-input>
      <div class="url-bar-button go-to-button" @click="handleUrlChange">
        <i class="go-to"></i>
      </div>
    </div>
    <webview class="webview" src="https://www.bilibili.com/" allowpopups frameborder="0"></webview>
  </div>
</template>

<style scoped>
.browser {
  width: 100%;
  height: 100%;
  position: relative;
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
    margin-right: 8px;
    border-radius: 4px;

    &:hover {
      background: #E5E5E5;
    }

    &.go-to-button {
      margin-right: 0;
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

  .ant-input {
    width: 100%;
    height: 32px;
  }
}

.webview {
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>
