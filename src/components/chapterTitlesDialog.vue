<script setup lang="ts">
import { ref } from 'vue'
import { Modal as AModal, Pagination as APagination } from 'ant-design-vue'
import { useDialog } from 'use-dialog-vue3'

const props = defineProps<{
  book: Book
}>()

const { visible, close } = useDialog()

const book = window.ipcRenderer.getBookContent(props.book.path)
const chapterTitleRegExp = new RegExp(props.book.chapterTitleRegExp || '(?<=\\n)第[一二三四五六七八九十百千万1234567890]+章\\s*.+', 'g')
const chapterTitles = Array.from(book.matchAll(chapterTitleRegExp))
const bookList = window.ipcRenderer.getBookList()
const bookDetail = bookList.find(b => b.path === props.book.path)

const currentPage = ref(1)

const selectChapter = (index: number) => {
  const chapterIndex = index + (currentPage.value - 1) * 100
  if (!bookDetail) return
  bookDetail!.lastChapter = chapterIndex
  bookDetail!.lastPage = {
    paragraphIndex: 0,
    characterIndex: 0
  }
  window.ipcRenderer.send('setBookList', bookList)
  close(bookDetail)
}
</script>

<template>
  <a-modal
    v-model:open="visible"
    :footer="null"
    title="章节目录"
  >
    <div class="chapter-titles">
      <div
        v-for="(title, index) in chapterTitles.slice((currentPage - 1) * 100, (currentPage - 1) * 100 + 100)"
        :key="title[0] + index"
        class="chapter-title"
        @click="selectChapter(index)"
      >
        {{ title[0] }}
      </div>
    </div>
    <div class="pager">
      <a-pagination
        v-model:current="currentPage"
        :total="chapterTitles.length"
        :show-size-changer="false"
        :page-size="100"
        show-less-items
      />
    </div>
  </a-modal>
</template>

<style scoped>
.chapter-titles {
  height: 200px;
  overflow-y: auto;
}

.chapter-title {
  padding: 0 12px;
  height: 40px;
  line-height: 40px;
  border-bottom: 1px solid #e5e5e5;
  cursor: pointer;

  &:hover {
    background-color: #f2f2f2;
  }
}

.pager {
  margin-top: 16px;
  width: 100%;
  text-align: center;
}
</style>
