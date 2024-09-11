<script setup lang="ts">
import { ref } from 'vue'
import {
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
    mode: window.ipcRenderer.getStoreValue('common.mode', 'resident') as Mode
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
    chapterTitleRegExp: window.ipcRenderer.getStoreValue('book.chapterTitleRegExp', '(?<=\\n)第[一二三四五六七八九十百千万1234567890]+章\\s*.+'),
    pageUpKey: window.ipcRenderer.getStoreValue('book.pageUpKey', 'W'),
    pageDownKey: window.ipcRenderer.getStoreValue('book.pageDownKey', 'S')
  }
})

function save() {
  window.ipcRenderer.setStoreValue('common.alwaysOnTop', formData.value.common.alwaysOnTop)
  window.ipcRenderer.setStoreValue('common.openAtLogin', formData.value.common.openAtLogin)
  window.ipcRenderer.setStoreValue('common.mode', formData.value.common.mode)

  window.ipcRenderer.setStoreValue('shortcuts.bossKey', formData.value.shortcuts.bossKey)

  window.ipcRenderer.setStoreValue('triggerMode.triggerPosition', formData.value.triggerMode.triggerPosition)

  window.ipcRenderer.setStoreValue('book.fontSize', formData.value.book.fontSize)
  window.ipcRenderer.setStoreValue('book.color', formData.value.book.color)
  window.ipcRenderer.setStoreValue('book.backgroundColor', formData.value.book.backgroundColor)
  window.ipcRenderer.setStoreValue('book.chapterTitleRegExp', formData.value.book.chapterTitleRegExp)
  window.ipcRenderer.setStoreValue('book.pageUpKey', formData.value.book.pageUpKey)
  window.ipcRenderer.setStoreValue('book.pageDownKey', formData.value.book.pageDownKey)

  window.ipcRenderer.send('update-settings')
  window.ipcRenderer.send('change-page', window.ipcRenderer.getUserData('lastPage', 'browser'))
}

function cancel() {
  window.ipcRenderer.send('change-page', window.ipcRenderer.getUserData('lastPage', 'browser'))
}
</script>

<template>
  <div class="settings-page">
    <a-form
      :model="formData"
      :label-col="{ span: 4 }"
    >
      <div class="settings-group">
        <div class="settings-group-title">基础设置</div>
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
      </div>
      <div class="settings-group">
        <div class="settings-group-title">快捷键</div>
        <a-form-item
          name="shortcuts.bossKey"
          label="Boss Key"
        >
          <shortcuts-input v-model:value="formData.shortcuts.bossKey"></shortcuts-input>
        </a-form-item>
      </div>
      <div class="settings-group">
        <div class="settings-group-title">触发模式</div>
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
        <div class="settings-group-title">小说阅读</div>
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
          name="book.chapterTitleRegExp"
          label="标题提取正则"
        >
          <a-input v-model:value="formData.book.chapterTitleRegExp"></a-input>
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
</template>

<style scoped>
.settings-page {
  padding: 64px;
  width: calc(100% - 128px);
  min-width: 600px;
  height: calc(100% - 50px);
  background: #fff;
  overflow: auto;
}

:deep(.ant-form-item-label) {
  display: block !important;
  flex: 0 0 24% !important;
  max-width: 24% !important;
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
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
}

.submit-button {
  background: #3a82fe;
}

.cancel-button {
  margin-left: 24px;
}
</style>
