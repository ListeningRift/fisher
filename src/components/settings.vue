<script setup lang="ts">
import { ref } from 'vue'
import { Form as AForm, FormItem as AFormItem, Input as AInput, Button as AButton } from 'ant-design-vue'

const formData = ref({
  shortcuts: {
    bossKey: window.ipcRenderer.getStoreValue('shortcuts.bossKey', 'Alt+CommandOrControl+Z')
  }
})

function save() {
  window.ipcRenderer.setStoreValue('shortcuts.bossKey', formData.value.shortcuts.bossKey)
  window.ipcRenderer.send('change-page', 'browser')
}

function cancel() {
  window.ipcRenderer.send('change-page', 'browser')
}
</script>

<template>
  <div class="settings">
    <a-form
      :model="formData"
      :label-col="{ span: 4 }"
    >
      <a-form-item
        name="shortcuts.bossKey"
        label="Boss Key"
      >
        <a-input v-model:value="formData.shortcuts.bossKey"></a-input>
      </a-form-item>
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
.settings {
  padding: 64px;
  width: calc(100% - 128px);
  height: 100%;
  background: #fff;
}

:deep(.ant-form-item-label) {
  display: block !important;
  flex: 0 0 16.666666666666664% !important;
  max-width: 16.666666666666664% !important;
  margin-right: 8px !important;
  text-align: end !important;
}

:deep(.ant-form-item-control) {
  flex-basis: 0 !important;
  flex-grow: 1 !important;
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
