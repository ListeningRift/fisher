<script setup lang="ts">
import { ref } from 'vue'
import { Modal as AModal, Checkbox as ACheckbox } from 'ant-design-vue'
import { useDialog } from 'use-dialog-vue3'

const { visible, close } = useDialog()

const isClearAll = ref(true)

const handleOk = () => {
  close(isClearAll.value)
}
</script>

<template>
  <a-modal
    v-model:open="visible"
    title="检查书籍路径"
    centered
    ok-text="确定"
    cancel-text="取消"
    @ok="handleOk"
  >
    <div class="check-book-tip">该书籍路径无效，是否删除该书籍（阅读历史将一起清除）？</div>
    <a-checkbox v-model:checked="isClearAll">清除所有失效书籍</a-checkbox>
  </a-modal>
</template>

<style scope>
.check-book-tip {
  margin-bottom: 8px;
}
</style>
