<script setup lang="ts">
import { onBeforeMount, onMounted, ref, computed } from 'vue'
import { Input as AInput, Dropdown as ADropdown, Menu as AMenu, MenuItem as AMenuItem } from 'ant-design-vue'
import chevronLeftIcon from 'vue-material-design-icons/ChevronLeft.vue'
import chevronRightIcon from 'vue-material-design-icons/ChevronRight.vue'
import arrowRightIcon from 'vue-material-design-icons/ArrowRight.vue'
import reloadIcon from 'vue-material-design-icons/Reload.vue'
import heartIcon from 'vue-material-design-icons/Heart.vue'
import heartOutlineIcon from 'vue-material-design-icons/HeartOutline.vue'
import deleteIcon from 'vue-material-design-icons/Delete.vue'

let webviewRef: any = null

const urlShow = ref(false)
const isInputFocused = ref(false)
const isMouseInUrlBar = ref(false)

// 收藏夹相关状态
const bookmarks = ref<Bookmark[]>([])
const isDropdownOpen = ref(false)

const handleMouseEnter = () => {
  urlShow.value = true
  isMouseInUrlBar.value = true
}

const handleMouseLeave = () => {
  isMouseInUrlBar.value = false
  if (!isInputFocused.value && !isDropdownOpen.value) {
    urlShow.value = false
  }
}

const handleInputFocus = () => {
  isInputFocused.value = true
}

const handleInputBlur = () => {
  isInputFocused.value = false
  if (!isMouseInUrlBar.value && !isDropdownOpen.value) {
    urlShow.value = false
  }
}

// 收藏夹功能
const loadBookmarks = () => {
  const saved = window.ipcRenderer.getStoreValue('browser.bookmarks', '[]')
  bookmarks.value = JSON.parse(saved)
}

const saveBookmarks = () => {
  window.ipcRenderer.setStoreValue('browser.bookmarks', JSON.stringify(bookmarks.value))
}

const isBookmarked = computed(() => {
  return bookmarks.value.some(bookmark => bookmark.url === url.value)
})

const addBookmark = () => {
  if (isBookmarked.value) return

  const newBookmark: Bookmark = {
    id: Date.now().toString(),
    url: url.value,
    title: webviewRef?.getTitle() || url.value,
    createTime: Date.now()
  }

  bookmarks.value.unshift(newBookmark)
  saveBookmarks()
}

const removeBookmark = (bookmarkId: string) => {
  bookmarks.value = bookmarks.value.filter(bookmark => bookmark.id !== bookmarkId)
  saveBookmarks()
}

const navigateToBookmark = (bookmark: Bookmark) => {
  url.value = bookmark.url
  webviewRef.loadURL(bookmark.url)
  isDropdownOpen.value = false
  urlShow.value = false
}

const handleDropdownVisibleChange = (visible: boolean) => {
  isDropdownOpen.value = visible
  if (!visible && !isInputFocused.value && !isMouseInUrlBar.value) {
    urlShow.value = false
  }
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

  // 加载收藏夹数据
  loadBookmarks()
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
      @mouseleave="handleMouseLeave"
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
      <a-input
        v-model:value="url"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
        @keyup.enter="handleUrlChange"
      ></a-input>
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
      <div
        class="url-bar-button right-button bookmark-button"
        @click="addBookmark"
      >
        <heart-icon
          v-if="isBookmarked"
          fill-color="#ff4757"
        ></heart-icon>
        <heart-outline-icon
          v-else
          fill-color="#666666"
        ></heart-outline-icon>
      </div>
      <a-dropdown
        :trigger="['click']"
        placement="topRight"
        @visible-change="handleDropdownVisibleChange"
      >
        <div class="url-bar-button right-button bookmarks-list-button">
          <div class="bookmarks-icon">☰</div>
        </div>
        <template #overlay>
          <div class="bookmarks-dropdown">
            <div class="bookmarks-header">收藏夹</div>
            <div
              v-if="bookmarks.length === 0"
              class="bookmarks-empty"
            >
              暂无收藏
            </div>
            <div
              v-for="bookmark in bookmarks"
              :key="bookmark.id"
              class="bookmark-item"
            >
              <div
                class="bookmark-content"
                @click="navigateToBookmark(bookmark)"
              >
                <div class="bookmark-title">{{ bookmark.title }}</div>
                <div class="bookmark-url">{{ bookmark.url }}</div>
              </div>
              <div
                class="bookmark-delete"
                @click="removeBookmark(bookmark.id)"
              >
                <delete-icon
                  :size="16"
                  fill-color="#999"
                ></delete-icon>
              </div>
            </div>
          </div>
        </template>
      </a-dropdown>
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
  background: #333333;
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
    background: #333333;
    color: #fff;
    border-color: #e5e5e5;
  }

  .bookmark-button {
    &:hover {
      background: #e5e5e5;
    }
  }

  .bookmarks-list-button {
    &:hover {
      background: #e5e5e5;
    }

    .bookmarks-icon {
      font-size: 16px;
      color: #666666;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
  }
}

.bookmarks-dropdown {
  width: 300px;
  max-height: 400px;
  background: #333333;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow-y: auto;

  .bookmarks-header {
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    border-bottom: 1px solid #555;
  }

  .bookmarks-empty {
    padding: 20px;
    text-align: center;
    color: #999;
    font-size: 14px;
  }

  .bookmark-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    border-bottom: 1px solid #555;

    &:hover {
      background: #404040;
    }

    &:last-child {
      border-bottom: none;
    }

    .bookmark-content {
      flex: 1;
      cursor: pointer;
      min-width: 0;
    }

    .bookmark-title {
      font-size: 14px;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }

    .bookmark-url {
      font-size: 12px;
      color: #999;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bookmark-delete {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 4px;
      margin-left: 8px;

      &:hover {
        background: #555;
      }
    }
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
