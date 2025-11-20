<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { Modal as AModal, Pagination as APagination } from 'ant-design-vue'
import { useDialog } from 'use-dialog-vue3'
import { defaultChapterTitleRegExpStr } from '../utils/constants'

const props = defineProps<{
  book: Book
}>()

const { visible, close } = useDialog()

const book = window.ipcRenderer.getBookContent(props.book.path)
const chapterTitleRegExp = new RegExp(props.book.chapterTitleRegExp || defaultChapterTitleRegExpStr, 'g')
const chapterTitles = Array.from(book.matchAll(chapterTitleRegExp))
const bookList = window.ipcRenderer.getBookList()
const bookDetail = bookList.find(b => b.path === props.book.path)

const currentChapter = bookDetail?.lastChapter ?? -1
const currentPage = ref(currentChapter >= 0 ? Math.floor(currentChapter / 100) + 1 : 1)

nextTick(() => {
  if (currentChapter >= 0) {
    const el = document.querySelector('.chapter-title.active')
    el?.scrollIntoView({ block: 'center' })
  }
})

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
    centered
    title="章节目录"
  >
    <div class="chapter-titles">
      <div
        v-for="(title, index) in chapterTitles.slice((currentPage - 1) * 100, (currentPage - 1) * 100 + 100)"
        :key="title[0] + index"
        class="chapter-title"
        :class="{ active: index + (currentPage - 1) * 100 === currentChapter }"
        :title="title[0].trim()"
        @click="selectChapter(index)"
      >
        {{ title[0].trim() }}
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background-color: #f2f2f2;
  }

  &.active {
    background-color: #e6f7ff;
    color: #1890ff;
  }
}

.pager {
  margin-top: 16px;
  width: 100%;
  text-align: center;
}
</style>
