<script setup lang="ts">
import { ref } from 'vue'
import { Modal as AModal, Form as AForm, FormItem as AFormItem, Input as AInput } from 'ant-design-vue'
import { useDialog } from 'use-dialog-vue3'

const props = defineProps<{
  book: Book
}>()

const { visible, close } = useDialog()

const formData = ref({
  chapterTitleRegExp: props.book.chapterTitleRegExp || '(?<=\\n)第[一二三四五六七八九十百千万1234567890]+章\\s*.+'
})

const onOk = () => {
  const bookList = window.ipcRenderer.getBookList()
  const bookDetail = bookList.find(b => b.path === props.book.path)
  if (!bookDetail) return
  bookDetail.chapterTitleRegExp = formData.value.chapterTitleRegExp
  window.ipcRenderer.send('setBookList', bookList)
  close(bookDetail)
}
</script>

<template>
  <a-modal
    v-model:open="visible"
    title="书籍设置"
    ok-text="确定"
    cancel-text="取消"
    @ok="onOk"
  >
    <a-form :model="formData">
      <a-form-item
        name="chapterTitleRegExp"
        label="标题提取正则"
      >
        <a-input v-model:value="formData.chapterTitleRegExp"></a-input>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped>
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
</style>
