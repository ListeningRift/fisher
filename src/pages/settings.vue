<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  Menu as AMenu,
  Form as AForm,
  FormItem as AFormItem,
  Button as AButton,
  Switch as ASwitch,
  Radio as ARadio,
  RadioGroup as ARadioGroup,
  InputNumber as AInputNumber,
  Input as AInput
} from 'ant-design-vue'
import shortcutsInput from '../components/shortcutsInput.vue'

const formData = ref({
  common: {
    alwaysOnTop: window.ipcRenderer.getStoreValue('common.alwaysOnTop', true),
    openAtLogin: window.ipcRenderer.getStoreValue('common.openAtLogin', false),
    mode: window.ipcRenderer.getStoreValue('common.mode', 'resident') as Mode,
    showMoveBar: window.ipcRenderer.getStoreValue('common.showMoveBar', true)
  },
  shortcuts: {
    bossKey: window.ipcRenderer.getStoreValue('shortcuts.bossKey', 'Alt+CommandOrControl+Z') as string
  },
  triggerMode: {
    triggerPosition: window.ipcRenderer.getStoreValue('triggerMode.triggerPosition', 'left-top') as TriggerPosition
  },
  book: {
    fontSize: window.ipcRenderer.getStoreValue('book.fontSize', 14),
    color: window.ipcRenderer.getStoreValue('book.color', '#ffffff'),
    backgroundColor: window.ipcRenderer.getStoreValue('book.backgroundColor', 'rgba(0, 0, 0, 0)'),
    pageUpKey: window.ipcRenderer.getStoreValue('book.pageUpKey', 'W'),
    pageDownKey: window.ipcRenderer.getStoreValue('book.pageDownKey', 'S')
  }
})

const settingsGroup = [
  {
    label: '基础设置',
    key: 'common'
  },
  {
    label: '快捷键设置',
    key: 'shortcuts'
  },
  {
    label: '触发模式设置',
    key: 'triggerMode'
  },
  {
    label: '小说阅读设置',
    key: 'book'
  }
]

function closeSettings() {
  window.ipcRenderer.send('close-settings')
}

function save() {
  window.ipcRenderer.setStoreValue('common.alwaysOnTop', formData.value.common.alwaysOnTop)
  window.ipcRenderer.setStoreValue('common.openAtLogin', formData.value.common.openAtLogin)
  window.ipcRenderer.setStoreValue('common.mode', formData.value.common.mode)
  window.ipcRenderer.setStoreValue('common.showMoveBar', formData.value.common.showMoveBar)

  window.ipcRenderer.setStoreValue('shortcuts.bossKey', formData.value.shortcuts.bossKey)

  window.ipcRenderer.setStoreValue('triggerMode.triggerPosition', formData.value.triggerMode.triggerPosition)

  window.ipcRenderer.setStoreValue('book.fontSize', formData.value.book.fontSize)
  window.ipcRenderer.setStoreValue('book.color', formData.value.book.color)
  window.ipcRenderer.setStoreValue('book.backgroundColor', formData.value.book.backgroundColor)
  window.ipcRenderer.setStoreValue('book.pageUpKey', formData.value.book.pageUpKey)
  window.ipcRenderer.setStoreValue('book.pageDownKey', formData.value.book.pageDownKey)

  window.ipcRenderer.send('update-settings')
  closeSettings()
}

function cancel() {
  closeSettings()
}

const activeKey = ref<string[]>(['common'])
const settingsRef = ref<HTMLDivElement>()
onMounted(() => {
  const titlesEl = settingsGroup.map(group => {
    return settingsRef.value!.querySelector('#' + group.key)?.parentElement
  })
  settingsRef.value?.addEventListener('scroll', () => {
    for (let index = 0; index < titlesEl.length; index++) {
      const element = titlesEl[index]
      if (!element) continue
      const distance = element.offsetTop - settingsRef.value!.scrollTop
      if (distance >= 0 && distance < 60) {
        activeKey.value = [settingsGroup[index].key]
        break
      }
    }
  })
})
const handleItemClick = (menuInfo: any) => {
  settingsRef.value?.querySelector('#' + menuInfo.key)?.scrollIntoView({ behavior: 'smooth' })
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
  <div class="main-window">
    <div
      v-dragWindow.settings
      class="move-bar"
    >
      <div class="move-bar-line"></div>
    </div>
    <div
      ref="settingsRef"
      class="settings-page"
    >
      <div class="settings-menu">
        <a-menu
          v-model:selected-keys="activeKey"
          :items="settingsGroup"
          style="width: 180px"
          mode="vertical"
          @click="handleItemClick"
        ></a-menu>
      </div>
      <div class="settings-form">
        <a-form
          :model="formData"
          :label-col="{ span: 4 }"
        >
          <div class="settings-group">
            <div
              id="common"
              class="settings-group-title"
            >
              基础设置
            </div>
            <a-form-item
              name="common.alwaysOnTop"
              label="窗口置顶"
            >
              <a-switch v-model:checked="formData.common.alwaysOnTop"></a-switch>
            </a-form-item>
            <a-form-item
              name="common.openAtLogin"
              label="开机自启动"
            >
              <a-switch v-model:checked="formData.common.openAtLogin"></a-switch>
            </a-form-item>
            <a-form-item
              name="common.mode"
              label="模式"
            >
              <a-radio-group v-model:value="formData.common.mode">
                <a-radio value="resident">常驻模式</a-radio>
                <a-radio value="trigger">触发模式</a-radio>
              </a-radio-group>
            </a-form-item>
            <a-form-item
              name="common.showMoveBar"
              label="展示拖动条"
            >
              <a-switch v-model:checked="formData.common.showMoveBar"></a-switch>
            </a-form-item>
          </div>
          <div class="settings-group">
            <div
              id="shortcuts"
              class="settings-group-title"
            >
              快捷键设置
            </div>
            <a-form-item
              name="shortcuts.bossKey"
              label="Boss Key"
            >
              <shortcuts-input v-model:value="formData.shortcuts.bossKey"></shortcuts-input>
            </a-form-item>
          </div>
          <div class="settings-group">
            <div
              id="triggerMode"
              class="settings-group-title"
            >
              触发模式设置
            </div>
            <a-form-item
              name="triggerMode.triggerPosition"
              label="触发图标位置"
            >
              <a-radio-group v-model:value="formData.triggerMode.triggerPosition">
                <a-radio value="left-top">左上角</a-radio>
                <a-radio value="left-bottom">左下角</a-radio>
                <a-radio value="right-top">右上角</a-radio>
                <a-radio value="right-bottom">右下角</a-radio>
              </a-radio-group>
            </a-form-item>
          </div>
          <div class="settings-group">
            <div
              id="book"
              class="settings-group-title"
            >
              小说阅读设置
            </div>
            <a-form-item
              name="book.fontSize"
              label="字号"
            >
              <a-input-number
                v-model:value="formData.book.fontSize"
                :min="10"
              ></a-input-number>
            </a-form-item>
            <a-form-item
              name="book.color"
              label="字体颜色"
            >
              <a-input v-model:value="formData.book.color"></a-input>
            </a-form-item>
            <a-form-item
              name="book.backgroundColor"
              label="背景颜色"
            >
              <a-input v-model:value="formData.book.backgroundColor"></a-input>
            </a-form-item>
            <a-form-item
              name="book.pageUpKey"
              label="向上翻页快捷键"
            >
              <shortcuts-input v-model:value="formData.book.pageUpKey"></shortcuts-input>
            </a-form-item>
            <a-form-item
              name="book.pageDownKey"
              label="向下翻页快捷键"
            >
              <shortcuts-input v-model:value="formData.book.pageDownKey"></shortcuts-input>
            </a-form-item>
          </div>
        </a-form>
        <div class="button-container">
          <a-button
            class="submit-button"
            type="primary"
            @click="save"
            >确认</a-button
          >
          <a-button
            class="cancel-button"
            @click="cancel"
            >取消</a-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  width: 100%;
  min-width: 600px;
  background: #fff;
  overflow: auto;
}

.settings-menu {
  padding: 16px 0;
}

.settings-form {
  margin-left: 180px;
  padding: 16px;
  padding-left: 0;
  width: calc(100% - 180px);
}

.ant-menu {
  position: fixed;
  border-inline-end: none !important;
}

:deep(.ant-form-item-label) {
  display: block !important;
  flex: 0 0 20% !important;
  max-width: 20% !important;
  margin-right: 8px !important;
  text-align: end !important;
}

:deep(.ant-form-item-control) {
  flex-basis: 0 !important;
  flex-grow: 1 !important;
}

.settings-group {
  &:not(:last-child) {
    margin-bottom: 16px;
  }

  .settings-group-title {
    position: relative;
    margin-bottom: 16px;
    padding-left: 10px;
    height: 40px;
    font-size: 16px;
    line-height: 40px;
    background: #f6f6f6;
    border-radius: 4px;

    &::before {
      content: '';
      position: absolute;
      top: 12px;
      left: 0;
      width: 2px;
      height: 16px;
      background: #3a82fe;
      border-radius: 2px;
    }
  }
}

.button-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 32px;
  padding-bottom: 32px;
}

.submit-button {
  background: #3a82fe;
}

.cancel-button {
  margin-left: 24px;
}
</style>
